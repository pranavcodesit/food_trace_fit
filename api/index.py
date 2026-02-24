from flask import Flask, render_template, request, jsonify, abort, send_from_directory, url_for
import requests
import json
import os
import re
import math
import secrets
import time
import base64
import uuid
from functools import wraps
from dotenv import load_dotenv
from groq import Groq
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_cors import CORS
from flask_talisman import Talisman
from werkzeug.utils import secure_filename
import traceback

# Import Indian Food Composition Database
try:
    import indb
    IFCT_AVAILABLE = True
except ImportError:
    try:
        from . import indb
        IFCT_AVAILABLE = True
    except ImportError:
        IFCT_AVAILABLE = False
        print("Warning: indb module not found.")

# Load environment variables from .env file if it exists
load_dotenv()

# Initialize Flask app
app = Flask(__name__, static_url_path='/static')

# Security configurations
is_production = os.environ.get('PRODUCTION') == 'true'
if is_production:
    print("Running in production mode")
    CORS(app, resources={r"/*": {"origins": os.environ.get('ALLOWED_ORIGINS', '*')}})
    csp = {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'unsafe-inline'"],
        'style-src': ["'self'", "'unsafe-inline'"],
        'img-src': ["'self'", "data:"],
        'connect-src': ["'self'", "*"],
    }
    Talisman(app, content_security_policy=csp, force_https=True)
else:
    print("Running in development mode")
    CORS(app, resources={r"/*": {"origins": "*"}})

@app.errorhandler(401)
def unauthorized(error):
    return jsonify({'error': 'Unauthorized: Invalid or missing API key'}), 401

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found: The requested resource does not exist'}), 404

@app.errorhandler(429)
def ratelimit_handler(error):
    return jsonify({'error': 'Too many requests: Rate limit exceeded'}), 429

@app.errorhandler(500)
def server_error(error):
    return jsonify({'error': 'Internal server error: Something went wrong'}), 500

limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://",
)

API_KEY = os.environ.get('API_KEY', secrets.token_urlsafe(32))

def require_api_key(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if app.debug and not is_production: return f(*args, **kwargs)
        api_key = request.headers.get('X-API-Key')
        if not api_key or api_key != API_KEY: abort(401, description="Invalid API Key")
        return f(*args, **kwargs)
    return decorated_function

def calculate_health_score(nutriments):
    score = 50
    try:
        energy = float(nutriments.get('energy', 0)) if nutriments.get('energy') not in ('', None) else 0
        fat = float(nutriments.get('fat', 0)) if nutriments.get('fat') not in ('', None) else 0
        protein = float(nutriments.get('protein', 0)) if nutriments.get('protein') not in ('', None) else 0
        carbs = float(nutriments.get('carbs', 0)) if nutriments.get('carbs') not in ('', None) else 0
        sugar = float(nutriments.get('sugar', 0)) if nutriments.get('sugar') not in ('', None) else 0
        salt = float(nutriments.get('salt', 0)) if nutriments.get('salt') not in ('', None) else 0
        fiber = float(nutriments.get('fiber', 0)) if nutriments.get('fiber') not in ('', None) else 0

        if protein > 0: score += min(protein * 2, 15)
        if fiber > 0: score += min(fiber * 3, 15)

        if energy > 300: score -= min((energy - 300) / 20, 15)
        if fat > 15: score -= min((fat - 15) / 2, 10)
        if sugar > 10: score -= min((sugar - 10) / 2, 15)
        if salt > 1.5: score -= min((salt - 1.5) * 5, 15)

        score = max(0, min(100, score))
        score = round(score)

        if score >= 80: health_rating = 'A'
        elif score >= 60: health_rating = 'B'
        elif score >= 40: health_rating = 'C'
        elif score >= 20: health_rating = 'D'
        else: health_rating = 'E'
        return {'score': score, 'rating': health_rating}
    except Exception as e:
        print(f"Error calculating health score: {str(e)}")
        return {'score': 50, 'rating': 'C'}

OPENFOODFACTS_API_URL = "https://world.openfoodfacts.org/api/v0/product/"
USDA_API_URL = "https://api.nal.usda.gov/fdc/v1/foods/search"
USDA_API_KEY = os.environ.get("USDA_API_KEY", "")
EDAMAM_API_URL = "https://api.edamam.com/api/food-database/v2/parser"
EDAMAM_APP_ID = os.environ.get("EDAMAM_APP_ID", "")
EDAMAM_APP_KEY = os.environ.get("EDAMAM_APP_KEY", "")
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
OCR_API_URL = "https://api.ocr.space/parse/image"
OCR_API_KEY = os.environ.get("OCR_API_KEY")

groq_client = None
if GROQ_API_KEY:
    try:
        groq_client = Groq(api_key=GROQ_API_KEY)
        print("Groq API client initialized successfully")
    except Exception as e:
        print(f"Error initializing Groq API client: {str(e)}")
        groq_client = None

if IFCT_AVAILABLE:
    try:
        indb.load_compositions()
        print("Indian Nutrient Databank (INDB) loaded successfully")
    except Exception as e:
        print(f"Error loading Indian Nutrient Databank (INDB): {str(e)}")
        IFCT_AVAILABLE = False

# Helper functions for external APIs
def get_product_from_openfoodfacts(barcode):
    try:
        response = requests.get(f"{OPENFOODFACTS_API_URL}{barcode}.json?lc=en", timeout=5)
        if response.status_code != 200: return None
        product_data = response.json()
        if product_data.get('status') != 1: return None
        product = product_data.get('product', {})
        nutriments = product.get('nutriments', {})
        nutriments_data = {
            'energy': nutriments.get('energy-kcal_100g', nutriments.get('energy_100g', '')),
            'fat': nutriments.get('fat_100g', ''),
            'protein': nutriments.get('proteins_100g', ''),
            'carbs': nutriments.get('carbohydrates_100g', ''),
            'sugar': nutriments.get('sugars_100g', ''),
            'salt': nutriments.get('salt_100g', ''),
            'fiber': nutriments.get('fiber_100g', '')
        }
        health_score = calculate_health_score(nutriments_data)
        return {
            'code': product.get('code', ''),
            'product_name': product.get('product_name', ''),
            'brand': product.get('brands', ''),
            'categories': product.get('categories', ''),
            'ingredients_text': product.get('ingredients_text', ''),
            'allergens_tags': product.get('allergens_tags', []),
            'serving_size': product.get('serving_size', ''),
            'nutrition_grade_fr': product.get('nutrition_grade_fr', ''),
            'image_url': product.get('image_url', ''),
            'nutriments': nutriments_data,
            'health_score': health_score,
            'source': 'OpenFoodFacts'
        }
    except Exception as e:
        print(f"OpenFoodFacts API error: {str(e)}")
        return None

def get_product_from_usda(barcode):
    if not USDA_API_KEY: return None
    try:
        params = {'api_key': USDA_API_KEY, 'query': barcode, 'dataType': ["Branded"], 'pageSize': 1}
        response = requests.get(USDA_API_URL, params=params, timeout=5)
        if response.status_code != 200: return None
        data = response.json()
        if not data.get('foods') or len(data['foods']) == 0: return None
        food = data['foods'][0]
        nutrients = food.get('foodNutrients', [])
        nutrient_map = {
            'energy': next((n.get('value', '') for n in nutrients if n.get('nutrientName', '').lower() == 'energy'), ''),
            'fat': next((n.get('value', '') for n in nutrients if n.get('nutrientName', '').lower() == 'total lipid (fat)'), ''),
            'protein': next((n.get('value', '') for n in nutrients if n.get('nutrientName', '').lower() == 'protein'), ''),
            'carbs': next((n.get('value', '') for n in nutrients if n.get('nutrientName', '').lower() == 'carbohydrate, by difference'), ''),
            'sugar': next((n.get('value', '') for n in nutrients if n.get('nutrientName', '').lower() == 'sugars, total including nlea'), ''),
            'salt': next((n.get('value', '') for n in nutrients if n.get('nutrientName', '').lower() == 'sodium, na'), ''),
            'fiber': next((n.get('value', '') for n in nutrients if n.get('nutrientName', '').lower() == 'fiber, total dietary'), '')
        }
        health_score = calculate_health_score(nutrient_map)
        return {
            'code': barcode,
            'product_name': food.get('description', ''),
            'brand': food.get('brandOwner', ''),
            'categories': food.get('foodCategory', ''),
            'ingredients_text': food.get('ingredients', ''),
            'allergens_tags': [],
            'serving_size': food.get('servingSize', '') + ' ' + food.get('servingSizeUnit', ''),
            'nutrition_grade_fr': '',
            'image_url': '',
            'nutriments': nutrient_map,
            'health_score': health_score,
            'source': 'USDA FoodData Central'
        }
    except Exception as e:
        print(f"USDA API error: {str(e)}")
        return None

def get_product_from_edamam(barcode):
    if not EDAMAM_APP_ID or not EDAMAM_APP_KEY: return None
    try:
        params = {'app_id': EDAMAM_APP_ID, 'app_key': EDAMAM_APP_KEY, 'upc': barcode}
        response = requests.get(EDAMAM_API_URL, params=params, timeout=5)
        if response.status_code != 200: return None
        data = response.json()
        if not data.get('hints') or len(data['hints']) == 0: return None
        food = data['hints'][0]['food']
        nutrients = food.get('nutrients', {})
        nutriments_data = {
            'energy': nutrients.get('ENERC_KCAL', ''),
            'fat': nutrients.get('FAT', ''),
            'protein': nutrients.get('PROCNT', ''),
            'carbs': nutrients.get('CHOCDF', ''),
            'sugar': nutrients.get('SUGAR', ''),
            'salt': '',
            'fiber': nutrients.get('FIBTG', '')
        }
        health_score = calculate_health_score(nutriments_data)
        return {
            'code': barcode,
            'product_name': food.get('label', ''),
            'brand': food.get('brand', ''),
            'categories': food.get('category', ''),
            'ingredients_text': food.get('foodContentsLabel', ''),
            'allergens_tags': [],
            'serving_size': '',
            'nutrition_grade_fr': '',
            'image_url': food.get('image', ''),
            'nutriments': nutriments_data,
            'health_score': health_score,
            'source': 'Edamam Food Database'
        }
    except Exception as e:
        print(f"Edamam API error: {str(e)}")
        return None

def get_product_from_ifct(barcode):
    if not IFCT_AVAILABLE: return None
    try:
        search_term = re.sub(r'[^a-zA-Z\s]', ' ', barcode).strip()
        if not search_term or len(search_term) < 3: return None
        matches = indb.compositions(search_term)
        if not matches or len(matches) == 0: return None
        food = matches[0]
        nutriments = {
            'energy': food.get('enerc', ''),
            'fat': food.get('fat', ''),
            'protein': food.get('prot', ''),
            'carbs': food.get('carb', ''),
            'sugar': food.get('sugar', ''),
            'salt': food.get('na', ''),
            'fiber': food.get('fibc', '')
        }
        health_score = calculate_health_score(nutriments)
        return {
            'code': barcode,
            'product_name': food.get('name', ''),
            'brand': 'Indian Food',
            'categories': food.get('grup', ''),
            'ingredients_text': '',
            'allergens_tags': [],
            'serving_size': '100g',
            'nutrition_grade_fr': '',
            'image_url': '',
            'nutriments': nutriments,
            'health_score': health_score,
            'source': 'Indian Nutrient Databank (INDB)'
        }
    except Exception as e:
        print(f"INDB database error: {str(e)}")
        return None

def get_product_from_groq(barcode, partial_result=None):
    if not groq_client: return None
    try:
        if partial_result:
            prompt = f"I have partial information about a food product with barcode {barcode}..."
        else:
            prompt = f"I need information about a food product with barcode {barcode}..."

        chat_completion = groq_client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a helpful assistant that specializes in food nutrition data..."},
                {"role": "user", "content": prompt}
            ],
            model="llama3-70b-8192", temperature=0.2, max_tokens=1024, top_p=0.9
        )
        response_text = chat_completion.choices[0].message.content
        try:
            json_match = re.search(r'\{[\s\S]*\}', response_text)
            if json_match: response_text = json_match.group(0)
            product_data = json.loads(response_text)
            if not isinstance(product_data, dict): raise ValueError("Response is not a dictionary")

            if partial_result:
                if 'nutriments' in product_data and 'nutriments' in partial_result:
                    for key, value in product_data['nutriments'].items():
                        if key in partial_result['nutriments'] and partial_result['nutriments'][key] == '':
                            partial_result['nutriments'][key] = value
                for key, value in product_data.items():
                    if key != 'nutriments' and (key not in partial_result or not partial_result[key]):
                        partial_result[key] = value
                result = partial_result
            else:
                result = product_data

            result['health_score'] = calculate_health_score(result.get('nutriments', {}))
            result['source'] = f"{partial_result.get('source', 'Unknown')} + Groq AI" if partial_result else "Groq AI"
            return result
        except Exception as e:
            print(f"Error parsing Groq AI response: {str(e)}")
            return partial_result
    except Exception as e:
        print(f"Groq API error: {str(e)}")
        return partial_result

@app.route('/api/scan', methods=['POST'])
@limiter.limit("10 per minute")
@require_api_key
def scan_barcode():
    data = request.get_json()
    barcode = data.get('barcode')
    if not barcode: return jsonify({'error': 'No barcode provided'}), 400

    result = get_product_from_openfoodfacts(barcode)
    if not result and USDA_API_KEY: result = get_product_from_usda(barcode)
    if not result and EDAMAM_APP_ID and EDAMAM_APP_KEY: result = get_product_from_edamam(barcode)
    if not result and IFCT_AVAILABLE: result = get_product_from_ifct(barcode)

    has_missing_data = False
    if result:
        nutriments = result.get('nutriments', {})
        for key in ['energy', 'fat', 'protein', 'carbs', 'sugar', 'salt', 'fiber']:
            if key in nutriments and nutriments[key] == '':
                has_missing_data = True
                break
        if not result.get('ingredients_text') or result.get('ingredients_text') == '': has_missing_data = True
        if not result.get('allergens_tags') or len(result.get('allergens_tags', [])) == 0: has_missing_data = True
        if not result.get('nutrition_grade_fr') or result.get('nutrition_grade_fr') == '': has_missing_data = True
        if not result.get('alternative_products') or not result.get('health_recommendation'): has_missing_data = True

    if result and has_missing_data and groq_client:
        enhanced_result = get_product_from_groq(barcode, result)
        if enhanced_result: result = enhanced_result

    if not result and groq_client:
        result = get_product_from_groq(barcode)

    if not result: return jsonify({'error': 'Product not found in any database'}), 404
    return jsonify(result)

@app.route('/api/calculate-nutrition-grade', methods=['POST'])
@limiter.limit("10 per minute")
@require_api_key
def calculate_nutrition_grade():
    if not groq_client: return jsonify({'error': 'Groq AI is not configured'}), 400
    data = request.get_json()
    ingredients = data.get('ingredients', '')
    nutriments = data.get('nutriments', {})
    product_name = data.get('product_name', '')

    try:
        prompt = f"Based on the following product information..."
        chat_completion = groq_client.chat.completions.create(
            messages=[{"role": "system", "content": "You are a nutrition expert..."}, {"role": "user", "content": prompt}],
            model="llama3-70b-8192", temperature=0.2, max_tokens=256, top_p=0.9
        )
        response_text = chat_completion.choices[0].message.content
        json_match = re.search(r'\{[\s\S]*\}', response_text)
        if json_match: response_text = json_match.group(0)
        result = json.loads(response_text)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': f'Failed to calculate nutrition grade: {str(e)}'}), 500

@app.route('/api/calculate-health-score', methods=['POST'])
@limiter.limit("10 per minute")
@require_api_key
def calculate_health_score_route():
    if not groq_client: return jsonify({'error': 'Groq AI is not configured'}), 400
    data = request.get_json()
    ingredients = data.get('ingredients', '')
    nutriments = data.get('nutriments', {})
    product_name = data.get('product_name', '')

    try:
        prompt = f"Based on the following product information..."
        chat_completion = groq_client.chat.completions.create(
            messages=[{"role": "system", "content": "You are a nutrition expert..."}, {"role": "user", "content": prompt}],
            model="llama3-70b-8192", temperature=0.2, max_tokens=256, top_p=0.9
        )
        response_text = chat_completion.choices[0].message.content
        json_match = re.search(r'\{[\s\S]*\}', response_text)
        if json_match: response_text = json_match.group(0)
        result = json.loads(response_text)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': f'Failed to calculate health score: {str(e)}'}), 500

@app.route('/api/chat-assistant', methods=['POST'])
@limiter.limit("20 per minute")
@require_api_key
def chat_assistant():
    if not groq_client: return jsonify({'error': 'Groq AI is not configured'}), 503
    data = request.get_json()
    query = data.get('query', '')
    product_data = data.get('product_data', None)
    if not query: return jsonify({'error': 'No query provided'}), 400

    try:
        system_message = f"You are a helpful nutrition assistant..."
        chat_completion = groq_client.chat.completions.create(
            messages=[{"role": "system", "content": system_message}, {"role": "user", "content": query}],
            model="llama3-70b-8192", temperature=0.7, max_tokens=1024, top_p=0.9
        )
        return jsonify({'response': chat_completion.choices[0].message.content})
    except Exception as e:
        return jsonify({'error': 'Failed to get response from chat assistant'}), 500

@app.route('/api/api-status', methods=['GET'])
@limiter.limit("30 per minute")
@require_api_key
def api_status():
    status = {
        'openfoodfacts': True,
        'usda': bool(USDA_API_KEY),
        'edamam': bool(EDAMAM_APP_ID and EDAMAM_APP_KEY),
        'indb': IFCT_AVAILABLE,
        'groq': bool(groq_client),
        'ocr': bool(OCR_API_KEY)
    }
    return jsonify(status)

@app.route('/api/health')
@limiter.limit("60 per minute")
def health_check():
    """Health check endpoint for monitoring"""
    return jsonify({
        'status': 'ok',
        'timestamp': time.time()
    })

# OCR helper function
def allowed_file(filename):
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/api/process-nutrition-image', methods=['POST'])
@limiter.limit("10 per minute")
@require_api_key
def process_nutrition_image():
    """Process uploaded product and nutrition label images (In-memory)"""
    if 'nutrition_image' not in request.files or 'product_image' not in request.files:
        return jsonify({'error': 'Both product and nutrition label images are required'}), 400

    nutrition_file = request.files['nutrition_image']
    product_file = request.files['product_image']
    ingredient_file = request.files.get('ingredient_image')

    if nutrition_file.filename == '' or product_file.filename == '':
        return jsonify({'error': 'Both nutrition and product images must be selected'}), 400

    if not allowed_file(nutrition_file.filename) or not allowed_file(product_file.filename):
        return jsonify({'error': 'File type not allowed. Please upload JPG or PNG images'}), 400

    try:
        # Read product image to base64 for later use (state passing)
        product_image_bytes = product_file.read()
        product_base64 = base64.b64encode(product_image_bytes).decode('utf-8')

        # Process nutrition image with OCR
        nutrition_image_bytes = nutrition_file.read()
        nutrition_base64 = base64.b64encode(nutrition_image_bytes).decode('utf-8')

        payload = {
            'apikey': OCR_API_KEY,
            'base64Image': f"data:image/jpeg;base64,{nutrition_base64}",
            'language': 'eng', 'scale': 'true', 'isTable': 'true', 'OCREngine': '2'
        }

        response = requests.post(OCR_API_URL, data=payload)
        if response.status_code != 200:
            return jsonify({'error': f"OCR API error: {response.status_code}"}), 500

        ocr_result = response.json()
        if ocr_result.get('OCRExitCode') != 1:
            error_message = ocr_result.get('ErrorMessage', ['Unknown error'])[0]
            return jsonify({'error': f"OCR processing error: {error_message}"}), 500

        parsed_text = ''
        for page_result in ocr_result.get('ParsedResults', []):
            parsed_text += page_result.get('ParsedText', '')

        # Process ingredient image if provided
        ingredient_ocr_text = ""
        if ingredient_file and ingredient_file.filename != '':
            if allowed_file(ingredient_file.filename):
                ingredient_bytes = ingredient_file.read()
                ingredient_base64 = base64.b64encode(ingredient_bytes).decode('utf-8')

                payload_ing = {'apikey': OCR_API_KEY, 'base64Image': f"data:image/jpeg;base64,{ingredient_base64}", 'language': 'eng', 'scale': 'true', 'isTable': 'true', 'OCREngine': '2'}
                response_ing = requests.post(OCR_API_URL, data=payload_ing)
                if response_ing.status_code == 200:
                    ocr_res_ing = response_ing.json()
                    if ocr_res_ing.get('OCRExitCode') == 1:
                        for page in ocr_res_ing.get('ParsedResults', []):
                            ingredient_ocr_text += page.get('ParsedText', '')

        # Return results with base64 product image instead of file path
        return jsonify({
            'text': parsed_text,
            'ingredient_text': ingredient_ocr_text,
            'success': True,
            'product_image': {
                'filename': product_file.filename,
                'base64': product_base64  # Changed from path to base64
            }
        })

    except Exception as e:
        print(f"Error processing image: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': f"Error processing image: {str(e)}"}), 500

@app.route('/api/analyze-nutrition-data', methods=['POST'])
@limiter.limit("10 per minute")
@require_api_key
def analyze_nutrition_data():
    """Analyze nutrition data from OCR text and product image (using base64)"""
    if not groq_client: return jsonify({'error': 'Groq AI is not configured'}), 400

    data = request.get_json()
    ocr_text = data.get('text', '')
    ingredient_ocr_text = data.get('ingredient_text', '')
    product_image = data.get('product_image', None)

    if not ocr_text: return jsonify({'error': 'No text provided for analysis'}), 400

    product_context = ""
    product_ocr_text = ""

    # Process product image with OCR if available (expecting base64)
    if product_image and 'base64' in product_image:
        try:
            payload = {
                'apikey': OCR_API_KEY,
                'base64Image': f"data:image/jpeg;base64,{product_image['base64']}",
                'language': 'eng', 'scale': 'true', 'OCREngine': '2'
            }

            response = requests.post(OCR_API_URL, data=payload)
            if response.status_code == 200:
                ocr_result = response.json()
                if ocr_result.get('OCRExitCode') == 1:
                    for page_result in ocr_result.get('ParsedResults', []):
                        product_ocr_text += page_result.get('ParsedText', '')

            if product_ocr_text:
                product_context = f"\n\nAdditional context: The following text was extracted from the product image:\n{product_ocr_text}\n\nUse this information to help identify the product, its brand, and any other relevant details."
            else:
                product_context = f"\n\nAdditional context: This nutrition information is from a product image. Use this information to help identify the product if possible."

        except Exception as e:
            print(f"Error processing product image with OCR: {str(e)}")
            product_context = f"\n\nAdditional context: This nutrition information is from a product image. Use this information to help identify the product if possible."

    try:
        prompt = f"Extract nutrition information from the following OCR text... {ocr_text} ... {product_context} ..."
        chat_completion = groq_client.chat.completions.create(
            messages=[{"role": "system", "content": "You are a nutrition expert..."}, {"role": "user", "content": prompt}],
            model="llama3-70b-8192", temperature=0.2, max_tokens=1024, top_p=0.9
        )
        response_text = chat_completion.choices[0].message.content
        json_match = re.search(r'\{[\s\S]*\}', response_text)
        if json_match:
            try:
                nutrition_data = json.loads(json_match.group(0))
                if 'nutrition_grade' in nutrition_data and 'nutrition_grade_fr' not in nutrition_data:
                    nutrition_data['nutrition_grade_fr'] = nutrition_data['nutrition_grade']
                if 'nutriments' in nutrition_data:
                    nutrition_data['health_score'] = calculate_health_score(nutrition_data['nutriments'])
                nutrition_data['source'] = "Groq AI Analysis"

                # Ensure fields exist
                for field in ['product_name', 'brand', 'categories', 'ingredients_text', 'allergens_tags', 'serving_size', 'nutrition_grade_fr', 'health_recommendation', 'alternative_products', 'nutriments']:
                    if field not in nutrition_data:
                        if field in ['allergens_tags', 'alternative_products']: nutrition_data[field] = []
                        elif field == 'nutriments': nutrition_data[field] = {}
                        else: nutrition_data[field] = ''

                return jsonify(nutrition_data)
            except json.JSONDecodeError:
                return jsonify({'error': 'Failed to parse nutrition data'}), 500
        else:
            return jsonify({'error': 'No valid nutrition data found in the response'}), 500

    except Exception as e:
        print(f"Error analyzing nutrition data: {str(e)}")
        return jsonify({'error': f"Error analyzing nutrition data: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True)
