from flask import Flask, render_template, request, jsonify, abort, send_from_directory, url_for
import requests
import json
import os
import re
import math
import secrets
import time
from functools import wraps
from dotenv import load_dotenv
from groq import Groq
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_cors import CORS
from flask_talisman import Talisman

# Import Indian Food Composition Database
try:
    import indb
    IFCT_AVAILABLE = True
except ImportError:
    IFCT_AVAILABLE = False

# Load environment variables from .env file if it exists
load_dotenv()

# Initialize Flask app
app = Flask(__name__, static_url_path='/static')

# Security configurations
# Enable CORS with more restrictive settings for production
is_production = os.environ.get('PRODUCTION') == 'true'
if is_production:
    print("Running in production mode")
    # In production, only allow requests from the same origin
    CORS(app, resources={r"/*": {"origins": os.environ.get('ALLOWED_ORIGINS', '*')}})
    # Enable HTTPS enforcement but with a more permissive CSP for static files
    csp = {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'unsafe-inline'"],
        'style-src': ["'self'", "'unsafe-inline'"],
        'img-src': ["'self'", "data:"],
        'connect-src': ["'self'", "*"],
    }
    Talisman(app, content_security_policy=csp, force_https=True)
    
    # Set cache control for static files in production
    @app.after_request
    def add_header(response):
        if 'Cache-Control' not in response.headers and request.path.startswith('/static'):
            response.headers['Cache-Control'] = 'public, max-age=86400'
        return response
else:
    print("Running in development mode")
    # In development, allow all origins
    CORS(app, resources={r"/*": {"origins": "*"}})

# Error handling
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

# PWA routes
@app.route('/manifest.json')
def serve_manifest():
    return send_from_directory('static', 'manifest.json', mimetype='application/json')

@app.route('/service-worker.js')
def serve_service_worker():
    return send_from_directory('static/js', 'service-worker.js', mimetype='application/javascript')

@app.route('/offline.html')
def offline():
    return render_template('offline.html')

# Education content routes
@app.route('/education/nutrition-basics')
def nutrition_basics():
    return render_template('education/nutrition-basics.html')

@app.route('/education/food-labels')
def food_labels():
    return render_template('education/food-labels.html')

@app.route('/education/seasonal-foods')
def seasonal_foods():
    return render_template('education/seasonal-foods.html')

@app.route('/education/healthy-eating-tips')
def healthy_eating_tips():
    return render_template('education/healthy-eating-tips.html')

# Direct route to serve ZXing library
@app.route('/zxing-library.js')
def serve_zxing_library():
    return send_from_directory('static/js', 'zxing-library.min.js', mimetype='application/javascript')

# Configure rate limiting
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://",
)

# API key for securing endpoints
API_KEY = os.environ.get('API_KEY', secrets.token_urlsafe(32))
print(f"API Key: {API_KEY}")

# API key middleware
def require_api_key(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Skip API key check in development mode or if using the hardcoded key
        if app.debug and not is_production:
            return f(*args, **kwargs)
            
        # Get API key from request
        api_key = request.headers.get('X-API-Key')
        
        # Accept the hardcoded key from the client
        if api_key == 'foodscanner_api_key_secure_123':
            return f(*args, **kwargs)
            
        # Otherwise check against the server's API key
        if not api_key or api_key != API_KEY:
            abort(401, description="Invalid API Key")
            
        return f(*args, **kwargs)
    return decorated_function

def calculate_health_score(nutriments):
    """Calculate a health score based on nutritional values
    
    The score ranges from 0-100, where higher is healthier.
    Based on a simplified version of various nutritional scoring systems.
    """
    # Default score starts at 50 (neutral)
    score = 50
    
    try:
        # Convert nutriment values to float, handling empty strings and non-numeric values
        energy = float(nutriments.get('energy', 0)) if nutriments.get('energy') not in ('', None) else 0
        fat = float(nutriments.get('fat', 0)) if nutriments.get('fat') not in ('', None) else 0
        protein = float(nutriments.get('protein', 0)) if nutriments.get('protein') not in ('', None) else 0
        carbs = float(nutriments.get('carbs', 0)) if nutriments.get('carbs') not in ('', None) else 0
        sugar = float(nutriments.get('sugar', 0)) if nutriments.get('sugar') not in ('', None) else 0
        salt = float(nutriments.get('salt', 0)) if nutriments.get('salt') not in ('', None) else 0
        fiber = float(nutriments.get('fiber', 0)) if nutriments.get('fiber') not in ('', None) else 0
        
        # Positive factors (increase score)
        # Protein is good (up to a point)
        if protein > 0:
            score += min(protein * 2, 15)  # Max +15 points for protein
            
        # Fiber is good
        if fiber > 0:
            score += min(fiber * 3, 15)  # Max +15 points for fiber
        
        # Negative factors (decrease score)
        # High energy content
        if energy > 300:  # More than 300 kcal per 100g is considered high
            score -= min((energy - 300) / 20, 15)  # Max -15 points for high energy
            
        # High fat content
        if fat > 15:  # More than 15g fat per 100g is considered high
            score -= min((fat - 15) / 2, 10)  # Max -10 points for high fat
            
        # High sugar content
        if sugar > 10:  # More than 10g sugar per 100g is considered high
            score -= min((sugar - 10) / 2, 15)  # Max -15 points for high sugar
            
        # High salt/sodium content
        if salt > 1.5:  # More than 1.5g salt per 100g is considered high
            score -= min((salt - 1.5) * 5, 15)  # Max -15 points for high salt
        
        # Ensure score is between 0 and 100
        score = max(0, min(100, score))
        
        # Round to nearest integer
        score = round(score)
        
        # Calculate health rating (A-E) based on score
        if score >= 80:
            health_rating = 'A'
        elif score >= 60:
            health_rating = 'B'
        elif score >= 40:
            health_rating = 'C'
        elif score >= 20:
            health_rating = 'D'
        else:
            health_rating = 'E'
            
        return {
            'score': score,
            'rating': health_rating
        }
    except Exception as e:
        print(f"Error calculating health score: {str(e)}")
        return {
            'score': 50,  # Default neutral score
            'rating': 'C'
        }

# API URLs and keys
OPENFOODFACTS_API_URL = "https://world.openfoodfacts.org/api/v0/product/"

# USDA FoodData Central API
USDA_API_URL = "https://api.nal.usda.gov/fdc/v1/foods/search"
USDA_API_KEY = os.environ.get("USDA_API_KEY", "")

# Edamam Food Database API
EDAMAM_API_URL = "https://api.edamam.com/api/food-database/v2/parser"
EDAMAM_APP_ID = os.environ.get("EDAMAM_APP_ID", "")
EDAMAM_APP_KEY = os.environ.get("EDAMAM_APP_KEY", "")

# Groq API
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
# Initialize Groq client if API key is available
groq_client = None
if GROQ_API_KEY:
    try:
        # Initialize with only the required parameters for newer versions
        groq_client = Groq(api_key=GROQ_API_KEY)
        print("Groq API client initialized successfully")
    except Exception as e:
        print(f"Error initializing Groq API client: {str(e)}")
        groq_client = None

# Initialize INDB database if available
if IFCT_AVAILABLE:
    try:
        indb.load_compositions()
        print("Indian Nutrient Databank (INDB) loaded successfully")
    except Exception as e:
        print(f"Error loading Indian Nutrient Databank (INDB): {str(e)}")
        IFCT_AVAILABLE = False

# Add this near the top of your app.py file
from flask import send_from_directory

# Add this route to properly serve static files with correct MIME types
@app.route('/static/<path:path>')
def serve_static(path):
    mime_types = {
        'js': 'application/javascript',
        'css': 'text/css',
        'svg': 'image/svg+xml'
    }
    file_ext = path.split('.')[-1]
    mime_type = mime_types.get(file_ext, 'text/plain')
    return send_from_directory('static', path, mimetype=mime_type)

@app.route('/')
@limiter.limit("60 per minute")
def index():
    return render_template('index.html')

@app.route('/zxing-test')
def zxing_test():
    return send_from_directory('static', 'zxing-test.html')

@app.route('/health')
@limiter.limit("60 per minute")
def health_check():
    """Health check endpoint for monitoring"""
    return jsonify({
        'status': 'ok',
        'timestamp': time.time()
    })

def get_product_from_openfoodfacts(barcode):
    """Try to get product information from OpenFoodFacts API"""
    try:
        # Request data in English by adding the 'lc=en' parameter
        response = requests.get(f"{OPENFOODFACTS_API_URL}{barcode}.json?lc=en", timeout=5)
        
        if response.status_code != 200:
            return None
        
        product_data = response.json()
        
        # Check if product was found
        if product_data.get('status') != 1:
            return None
        
        # Extract the relevant product information
        product = product_data.get('product', {})
        
        # Extract nutriments
        nutriments = product.get('nutriments', {})
        
        # Prepare nutriments data
        nutriments_data = {
            'energy': nutriments.get('energy-kcal_100g', nutriments.get('energy_100g', '')),
            'fat': nutriments.get('fat_100g', ''),
            'protein': nutriments.get('proteins_100g', ''),
            'carbs': nutriments.get('carbohydrates_100g', ''),
            'sugar': nutriments.get('sugars_100g', ''),
            'salt': nutriments.get('salt_100g', ''),
            'fiber': nutriments.get('fiber_100g', '')
        }
        
        # Calculate health score
        health_score = calculate_health_score(nutriments_data)
        
        # Prepare the response data
        result = {
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
        
        return result
    except Exception as e:
        print(f"OpenFoodFacts API error: {str(e)}")
        return None

def get_product_from_usda(barcode):
    """Try to get product information from USDA FoodData Central API"""
    if not USDA_API_KEY:
        return None
        
    try:
        params = {
            'api_key': USDA_API_KEY,
            'query': barcode,
            'dataType': ["Branded"],
            'pageSize': 1
        }
        
        response = requests.get(USDA_API_URL, params=params, timeout=5)
        
        if response.status_code != 200:
            return None
            
        data = response.json()
        
        if not data.get('foods') or len(data['foods']) == 0:
            return None
            
        food = data['foods'][0]
        nutrients = food.get('foodNutrients', [])
        
        # Map USDA nutrient IDs to our format
        nutrient_map = {
            'energy': next((n.get('value', '') for n in nutrients if n.get('nutrientName', '').lower() == 'energy'), ''),
            'fat': next((n.get('value', '') for n in nutrients if n.get('nutrientName', '').lower() == 'total lipid (fat)'), ''),
            'protein': next((n.get('value', '') for n in nutrients if n.get('nutrientName', '').lower() == 'protein'), ''),
            'carbs': next((n.get('value', '') for n in nutrients if n.get('nutrientName', '').lower() == 'carbohydrate, by difference'), ''),
            'sugar': next((n.get('value', '') for n in nutrients if n.get('nutrientName', '').lower() == 'sugars, total including nlea'), ''),
            'salt': next((n.get('value', '') for n in nutrients if n.get('nutrientName', '').lower() == 'sodium, na'), ''),
            'fiber': next((n.get('value', '') for n in nutrients if n.get('nutrientName', '').lower() == 'fiber, total dietary'), '')
        }
        
        # Calculate health score
        health_score = calculate_health_score(nutrient_map)
        
        result = {
            'code': barcode,
            'product_name': food.get('description', ''),
            'brand': food.get('brandOwner', ''),
            'categories': food.get('foodCategory', ''),
            'ingredients_text': food.get('ingredients', ''),
            'allergens_tags': [],  # USDA doesn't provide allergens in the same format
            'serving_size': food.get('servingSize', '') + ' ' + food.get('servingSizeUnit', ''),
            'nutrition_grade_fr': '',  # USDA doesn't provide nutrition grades
            'image_url': '',  # USDA doesn't provide images
            'nutriments': nutrient_map,
            'health_score': health_score,
            'source': 'USDA FoodData Central'
        }
        
        return result
    except Exception as e:
        print(f"USDA API error: {str(e)}")
        return None

def get_product_from_edamam(barcode):
    """Try to get product information from Edamam Food Database API"""
    if not EDAMAM_APP_ID or not EDAMAM_APP_KEY:
        return None
        
    try:
        params = {
            'app_id': EDAMAM_APP_ID,
            'app_key': EDAMAM_APP_KEY,
            'upc': barcode
        }
        
        response = requests.get(EDAMAM_API_URL, params=params, timeout=5)
        
        if response.status_code != 200:
            return None
            
        data = response.json()
        
        if not data.get('hints') or len(data['hints']) == 0:
            return None
            
        food = data['hints'][0]['food']
        nutrients = food.get('nutrients', {})
        
        # Prepare nutriments data
        nutriments_data = {
            'energy': nutrients.get('ENERC_KCAL', ''),
            'fat': nutrients.get('FAT', ''),
            'protein': nutrients.get('PROCNT', ''),
            'carbs': nutrients.get('CHOCDF', ''),
            'sugar': nutrients.get('SUGAR', ''),
            'salt': '',  # Edamam uses sodium, not salt
            'fiber': nutrients.get('FIBTG', '')
        }
        
        # Calculate health score
        health_score = calculate_health_score(nutriments_data)
        
        result = {
            'code': barcode,
            'product_name': food.get('label', ''),
            'brand': food.get('brand', ''),
            'categories': food.get('category', ''),
            'ingredients_text': food.get('foodContentsLabel', ''),
            'allergens_tags': [],  # Edamam doesn't provide allergens in the same format
            'serving_size': '',  # Edamam doesn't provide serving size in the same format
            'nutrition_grade_fr': '',  # Edamam doesn't provide nutrition grades
            'image_url': food.get('image', ''),
            'nutriments': nutriments_data,
            'health_score': health_score,
            'source': 'Edamam Food Database'
        }
        
        return result
    except Exception as e:
        print(f"Edamam API error: {str(e)}")
        return None

def get_product_from_ifct(barcode):
    """Try to get product information from Indian Nutrient Databank (INDB)"""
    if not IFCT_AVAILABLE:
        return None
        
    try:
        # Since INDB doesn't have barcode lookup, we'll try to match by name
        # First, clean the barcode to see if it contains any text that might match food names
        search_term = re.sub(r'[^a-zA-Z\s]', ' ', barcode).strip()
        
        if not search_term or len(search_term) < 3:
            return None
            
        # Search for the food in INDB database
        matches = indb.compositions(search_term)
        
        if not matches or len(matches) == 0:
            return None
            
        # Use the first match
        food = matches[0]
        
        # Extract nutrient values
        nutriments = {
            'energy': food.get('enerc', ''),
            'fat': food.get('fat', ''),
            'protein': food.get('prot', ''),
            'carbs': food.get('carb', ''),
            'sugar': food.get('sugar', ''),
            'salt': food.get('na', ''),  # Sodium content
            'fiber': food.get('fibc', '')  # Fiber content
        }
        
        # Calculate health score
        health_score = calculate_health_score(nutriments)
        
        # Extract nutrient values
        result = {
            'code': barcode,
            'product_name': food.get('name', ''),
            'brand': 'Indian Food',  # INDB doesn't have brand information
            'categories': food.get('grup', ''),
            'ingredients_text': '',  # INDB doesn't provide ingredients
            'allergens_tags': [],  # INDB doesn't provide allergens
            'serving_size': '100g',  # INDB values are per 100g
            'nutrition_grade_fr': '',  # INDB doesn't provide nutrition grades
            'image_url': '',  # INDB doesn't provide images
            'nutriments': nutriments,
            'health_score': health_score,
            'source': 'Indian Nutrient Databank (INDB)'
        }
        
        return result
    except Exception as e:
        print(f"INDB database error: {str(e)}")
        return None

def get_product_from_groq(barcode, partial_result=None):
    """Use Groq AI to generate or complete missing product information"""
    if not groq_client:
        return None
        
    try:
        # Prepare the prompt based on whether we have partial data or not
        if partial_result:
            # We have some data but need to fill in missing fields
            prompt = f"""I have partial information about a food product with barcode {barcode}. 
            Here's what I know: {json.dumps(partial_result, indent=2)}
            
            Please fill in any missing information, with special focus on:
            1. Ingredients list (ingredients_text field) - provide a detailed list of likely ingredients
            2. Allergens (allergens_tags array) - list all potential allergens based on the ingredients
            3. Missing nutritional information (empty fields in the nutriments section)
            4. Nutrition grade (nutrition_grade_fr field) - provide a grade from A to E based on nutritional quality, or 'NOT-APPLICABLE' if it doesn't apply
            
            If you don't know the exact values, provide reasonable estimates based on similar products.
            
            Also, provide the following additional fields:
            1. 'health_recommendation' - a brief suggestion about how this product fits into a healthy diet
            2. 'alternative_products' - an array of 2-3 healthier alternative products with the following structure for each:
               {{
                 "name": "Alternative Product Name",
                 "description": "Brief description of why this is a healthier alternative"
               }}
            
            IMPORTANT: Provide ALL responses in English only, regardless of the product's origin.
            
            Return ONLY a JSON object with the complete product information, including all the original fields plus your additions.
            For the nutriments, focus on providing values for: energy (kcal), fat (g), protein (g), carbs (g), sugar (g), salt (g), and fiber (g).
            """
        else:
            # We have no data, need to generate everything from scratch
            prompt = f"""I need information about a food product with barcode {barcode}.
            I don't have any data about this product from standard food databases.
            
            Please provide the most likely nutritional information for this product based on the barcode.
            If you can identify the product from the barcode, provide accurate information.
            If not, provide a reasonable guess based on typical products.
            
            IMPORTANT: Provide ALL responses in English only, regardless of the product's origin.
            
            Return ONLY a JSON object with the following structure:
            {{
              "code": "{barcode}",
              "product_name": "Product Name",
              "brand": "Brand Name",
              "categories": "Product Categories",
              "ingredients_text": "Detailed ingredients list",
              "allergens_tags": ["allergen1", "allergen2"],
              "serving_size": "Serving size",
              "nutrition_grade_fr": "A",  // Provide a grade from A to E based on nutritional quality, or 'NOT-APPLICABLE'
              "health_recommendation": "A brief health recommendation for this product",
              "alternative_products": [  // 2-3 healthier alternative products
                {{
                  "name": "Alternative Product Name",
                  "description": "Brief description of why this is a healthier alternative"
                }}
              ],
              "nutriments": {{
                "energy": 0,  // in kcal per 100g
                "fat": 0,     // in g per 100g
                "protein": 0,  // in g per 100g
                "carbs": 0,    // in g per 100g
                "sugar": 0,    // in g per 100g
                "salt": 0,     // in g per 100g
                "fiber": 0     // in g per 100g
              }}
            }}
            
            Replace the placeholder values with realistic estimates. If you're unsure about any value, provide a reasonable guess.
            Be especially detailed with the ingredients_text and allergens_tags fields.
            """
        
        # Call Groq API
        chat_completion = groq_client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful assistant that specializes in food nutrition data. You provide accurate nutritional information about food products based on barcodes or partial information. ALWAYS respond in English only, regardless of the product's origin or any language in the barcode."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            model="llama3-70b-8192",  # Using Llama 3 70B model for high-quality responses
            temperature=0.2,  # Low temperature for more factual responses
            max_tokens=1024,
            top_p=0.9
        )
        
        # Extract the response
        response_text = chat_completion.choices[0].message.content
        
        # Try to parse the JSON response
        try:
            # Find JSON in the response (in case the model added extra text)
            json_match = re.search(r'\{[\s\S]*\}', response_text)
            if json_match:
                response_text = json_match.group(0)
                
            product_data = json.loads(response_text)
            
            # Ensure the response has the expected structure
            if not isinstance(product_data, dict):
                raise ValueError("Response is not a dictionary")
                
            # If we had partial data, merge it with the AI-generated data
            if partial_result:
                # For nutriments, only use AI values for missing fields
                if 'nutriments' in product_data and 'nutriments' in partial_result:
                    for key, value in product_data['nutriments'].items():
                        if key in partial_result['nutriments'] and partial_result['nutriments'][key] == '':
                            partial_result['nutriments'][key] = value
                            
                # For other fields, only use AI values for missing fields
                for key, value in product_data.items():
                    if key != 'nutriments' and (key not in partial_result or not partial_result[key]):
                        partial_result[key] = value
                        
                result = partial_result
            else:
                result = product_data
            
            # Calculate health score based on the nutriments
            result['health_score'] = calculate_health_score(result.get('nutriments', {}))
            
            # Set the source to indicate Groq AI was used
            if partial_result:
                result['source'] = f"{partial_result.get('source', 'Unknown')} + Groq AI"
            else:
                result['source'] = "Groq AI"
                
            return result
        except Exception as e:
            print(f"Error parsing Groq AI response: {str(e)}")
            print(f"Raw response: {response_text}")
            return partial_result  # Return the partial result if we can't parse the AI response
    except Exception as e:
        print(f"Groq API error: {str(e)}")
        return partial_result  # Return the partial result if there's an API error

@app.route('/scan', methods=['POST'])
@limiter.limit("10 per minute")
@require_api_key
def scan_barcode():
    data = request.get_json()
    barcode = data.get('barcode')
    
    if not barcode:
        return jsonify({'error': 'No barcode provided'}), 400
    
    # Try OpenFoodFacts first
    result = get_product_from_openfoodfacts(barcode)
    
    # If not found, try USDA
    if not result and USDA_API_KEY:
        result = get_product_from_usda(barcode)
    
    # If still not found, try Edamam
    if not result and EDAMAM_APP_ID and EDAMAM_APP_KEY:
        result = get_product_from_edamam(barcode)
    
    # If still not found, try Indian Food Composition Database
    if not result and IFCT_AVAILABLE:
        result = get_product_from_ifct(barcode)
    
    # Check if we have a result but with missing data (nutriments, ingredients, allergens, or nutrition grade)
    has_missing_data = False
    if result:
        # Check for missing nutriment values
        nutriments = result.get('nutriments', {})
        for key in ['energy', 'fat', 'protein', 'carbs', 'sugar', 'salt', 'fiber']:
            if key in nutriments and nutriments[key] == '':
                has_missing_data = True
                break
                
        # Check for missing ingredients
        if not result.get('ingredients_text') or result.get('ingredients_text') == '':
            has_missing_data = True
            
        # Check for missing allergens
        if not result.get('allergens_tags') or len(result.get('allergens_tags', [])) == 0:
            has_missing_data = True
            
        # Check for missing nutrition grade
        if not result.get('nutrition_grade_fr') or result.get('nutrition_grade_fr') == '':
            has_missing_data = True
            
        # We always want to add alternative products and health recommendation
        if not result.get('alternative_products') or not result.get('health_recommendation'):
            has_missing_data = True
    
    # If we have a result with missing data, try to fill it with Groq AI
    if result and has_missing_data and groq_client:
        print(f"Product found but missing some data. Using Groq AI to fill in missing information.")
        enhanced_result = get_product_from_groq(barcode, result)
        if enhanced_result:
            result = enhanced_result
    
    # If product not found in any database, try Groq AI as a last resort
    if not result and groq_client:
        print(f"Product not found in any database. Using Groq AI to generate product data.")
        result = get_product_from_groq(barcode)
    
    # If product still not found
    if not result:
        return jsonify({'error': 'Product not found in any database'}), 404
    
    return jsonify(result)

@app.route('/calculate-nutrition-grade', methods=['POST'])
@limiter.limit("10 per minute")
@require_api_key
def calculate_nutrition_grade():
    """Calculate nutrition grade using Groq AI based on product information"""
    if not groq_client:
        return jsonify({'error': 'Groq AI is not configured'}), 400
        
    data = request.get_json()
    ingredients = data.get('ingredients', '')
    nutriments = data.get('nutriments', {})
    product_name = data.get('product_name', '')
    
    try:
        # Prepare the prompt for Groq AI
        prompt = f"""Based on the following product information, determine the most appropriate nutrition grade (A to E):
        
        Product Name: {product_name}
        Ingredients: {ingredients}
        Nutritional Information (per 100g/ml):
        - Energy: {nutriments.get('energy', 'Unknown')} kcal
        - Fat: {nutriments.get('fat', 'Unknown')} g
        - Protein: {nutriments.get('protein', 'Unknown')} g
        - Carbohydrates: {nutriments.get('carbs', 'Unknown')} g
        - Sugar: {nutriments.get('sugar', 'Unknown')} g
        - Salt: {nutriments.get('salt', 'Unknown')} g
        - Fiber: {nutriments.get('fiber', 'Unknown')} g
        
        Assign a nutrition grade from A to E where:
        - A: Excellent nutritional quality
        - B: Good nutritional quality
        - C: Average nutritional quality
        - D: D - Poor
        - E: Very poor nutritional quality
        
        Consider factors like sugar content, fat content, salt content, fiber content, and overall nutritional balance.
        
        Return ONLY a JSON object with the following structure:
        {{
          "grade": "A",  // The grade (A, B, C, D, or E)
          "explanation": "Brief explanation of why this grade was assigned"
        }}
        """
        
        # Call Groq API
        chat_completion = groq_client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are a nutrition expert that specializes in evaluating food products. You provide accurate nutrition grades based on product information. Always respond in English only."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            model="llama3-70b-8192",
            temperature=0.2,
            max_tokens=256,
            top_p=0.9
        )
        
        # Extract the response
        response_text = chat_completion.choices[0].message.content
        
        # Try to parse the JSON response
        json_match = re.search(r'\{[\s\S]*\}', response_text)
        if json_match:
            response_text = json_match.group(0)
            
        result = json.loads(response_text)
        
        # Ensure the response has the expected structure
        if not isinstance(result, dict) or 'grade' not in result:
            raise ValueError("Response does not contain a grade")
            
        return jsonify(result)
    except Exception as e:
        print(f"Error calculating nutrition grade: {str(e)}")
        return jsonify({'error': f'Failed to calculate nutrition grade: {str(e)}'}), 500

@app.route('/calculate-health-score', methods=['POST'])
@limiter.limit("10 per minute")
@require_api_key
def calculate_health_score_route():
    """Calculate health score using Groq AI based on product information"""
    if not groq_client:
        return jsonify({'error': 'Groq AI is not configured'}), 400
        
    data = request.get_json()
    ingredients = data.get('ingredients', '')
    nutriments = data.get('nutriments', {})
    product_name = data.get('product_name', '')
    
    try:
        # Prepare the prompt for Groq AI
        prompt = f"""Based on the following product information, determine a health score (0-100):
        
        Product Name: {product_name}
        Ingredients: {ingredients}
        Nutritional Information (per 100g/ml):
        - Energy: {nutriments.get('energy', 'Unknown')} kcal
        - Fat: {nutriments.get('fat', 'Unknown')} g
        - Protein: {nutriments.get('protein', 'Unknown')} g
        - Carbohydrates: {nutriments.get('carbs', 'Unknown')} g
        - Sugar: {nutriments.get('sugar', 'Unknown')} g
        - Salt: {nutriments.get('salt', 'Unknown')} g
        - Fiber: {nutriments.get('fiber', 'Unknown')} g
        
        Assign a health score from 0 to 100 where:
        - 80-100: Excellent (very healthy)
        - 60-79: Very Good (healthy)
        - 40-59: Good (moderately healthy)
        - 20-39: Fair (somewhat unhealthy)
        - 0-19: Poor (unhealthy)
        
        Consider factors like sugar content, fat content, salt content, fiber content, protein quality, and overall nutritional balance.
        
        Return ONLY a JSON object with the following structure:
        {{
          "score": 85,  // The numerical score (0-100)
          "rating": "A",  // The corresponding rating (A, B, C, D, or E)
          "explanation": "Brief explanation of why this score was assigned"
        }}
        """
        
        # Call Groq API
        chat_completion = groq_client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are a nutrition expert that specializes in evaluating food products. You provide accurate health scores based on product information. Always respond in English only."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            model="llama3-70b-8192",
            temperature=0.2,
            max_tokens=256,
            top_p=0.9
        )
        
        # Extract the response
        response_text = chat_completion.choices[0].message.content
        
        # Try to parse the JSON response
        json_match = re.search(r'\{[\s\S]*\}', response_text)
        if json_match:
            response_text = json_match.group(0)
            
        result = json.loads(response_text)
        
        # Ensure the response has the expected structure
        if not isinstance(result, dict) or 'score' not in result:
            raise ValueError("Response does not contain a score")
            
        return jsonify(result)
    except Exception as e:
        print(f"Error calculating health score: {str(e)}")
        return jsonify({'error': f'Failed to calculate health score: {str(e)}'}), 500

@app.route('/chat-assistant', methods=['POST'])
@limiter.limit("20 per minute")
@require_api_key
def chat_assistant():
    if not groq_client:
        return jsonify({'error': 'Groq AI is not configured'}), 503
        
    data = request.get_json()
    query = data.get('query', '')
    product_data = data.get('product_data', None)
    
    if not query:
        return jsonify({'error': 'No query provided'}), 400
    
    try:
        # Prepare the system message based on whether we have product data
        if product_data:
            system_message = f"""You are a helpful nutrition assistant that provides information about food products. 
            You have access to the following product data: {json.dumps(product_data, indent=2)}
            
            When answering questions about this product:
            1. Use the product data to provide accurate information
            2. For nutritional advice, consider the nutriments and health score
            3. If asked about alternatives, refer to the alternative_products field if available
            4. If asked about ingredients or allergens, use the relevant fields from the data
            5. If the user asks something not related to the product, you can answer general nutrition questions
            
            Always be helpful, accurate, and concise in your responses.
            """
        else:
            system_message = """You are a helpful nutrition assistant that provides information about food, nutrition, and healthy eating habits. 
            You can answer questions about ingredients, nutritional values, dietary recommendations, and general food knowledge.
            
            Always be helpful, accurate, and concise in your responses.
            """
        
        # Call Groq API
        chat_completion = groq_client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": system_message
                },
                {
                    "role": "user",
                    "content": query
                }
            ],
            model="llama3-70b-8192",  # Using Llama 3 70B model for high-quality responses
            temperature=0.7,  # Slightly higher temperature for more conversational responses
            max_tokens=1024,
            top_p=0.9
        )
        
        # Extract the response
        response_text = chat_completion.choices[0].message.content
        
        return jsonify({
            'response': response_text
        })
    except Exception as e:
        print(f"Chat assistant error: {str(e)}")
        return jsonify({'error': 'Failed to get response from chat assistant'}), 500

@app.route('/api-status', methods=['GET'])
@limiter.limit("30 per minute")
@require_api_key
def api_status():
    """Check which APIs are configured"""
    status = {
        'openfoodfacts': True,  # Always available
        'usda': bool(USDA_API_KEY),
        'edamam': bool(EDAMAM_APP_ID and EDAMAM_APP_KEY),
        'indb': IFCT_AVAILABLE,  # We're still using IFCT_AVAILABLE flag for compatibility
        'groq': bool(groq_client)  # Check if Groq client is initialized
    }
    return jsonify(status)

if __name__ == '__main__':
    # Use production server when deployed
    if os.environ.get('PRODUCTION') == 'true':
        # For production environments
        from waitress import serve
        serve(app, host='0.0.0.0', port=int(os.environ.get('PORT', 8080)))
    else:
        # Development mode
        app.run(debug=True)