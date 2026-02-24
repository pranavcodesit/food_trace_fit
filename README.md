# Food Scanner Application

A web application that scans food barcodes and provides detailed nutritional information using multiple food databases and AI.

## Features

- Barcode scanning using device camera
- Manual barcode entry
- Nutritional information display
- Health score calculation
- Multiple data sources (OpenFoodFacts, USDA, Edamam, Indian Food Composition Database)
- AI-powered data enhancement using Groq API
- Conditional display of 'Public Reviews' section (visible for barcode scans, hidden for nutrition label scans)

## Security Features

- API key authentication for all API endpoints
- Rate limiting to prevent abuse
- CORS protection
- HTTPS enforcement in production
- Secure environment variable handling

## Deployment

### Prerequisites

- Python 3.8 or higher
- API keys for the various services (optional, but recommended for better results)

### Local Development

1. Clone the repository
2. Create a virtual environment: `python -m venv venv`
3. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - macOS/Linux: `source venv/bin/activate`
4. Install dependencies: `pip install -r requirements.txt`
5. Set up environment variables in `.env` file
6. Run the application: `python app.py`
7. Access the application at `http://localhost:5000`

### Production Deployment

#### General Deployment

1. Set `PRODUCTION=true` environment variable
2.- The application will use Waitress as the production server
- Development server startup (`app.run()`) has been removed for production readiness.
3. Set `PORT` environment variable if needed (default: 8080)

#### Render Deployment

1. Push your code to a Git repository
2. Create a new Web Service in Render dashboard
3. Connect your Git repository
4. Set the following configuration:
   - Build Command: `./render-build.sh`
   - Start Command: `waitress-serve --port=$PORT app:app`
   - Environment Variables: Set any required API keys
5. Click 'Create Web Service'

Alternatively, you can use the `render.yaml` configuration file for Blueprint deployments.

##### Troubleshooting Render Deployment

If you encounter build errors related to setuptools or `setuptools.build_meta`:

1. Make sure your repository includes the following files:
   - `pyproject.toml` - Defines build system requirements with exact versions
   - `setup.py` - Alternative setup method
   - `render-build.sh` - Custom build script that installs build dependencies first
   - `.python-version` - Explicitly sets the Python version

2. The build script will install build dependencies (setuptools, wheel, pyproject-hooks) with specific versions before installing the rest of the requirements.

3. If you see an error like `Cannot import 'setuptools.build_meta'`, it's likely due to a compatibility issue between Python and setuptools versions. The configuration in this repository is set up to use compatible versions:
   - Python 3.8.15
   - setuptools 65.5.1
   - wheel 0.38.0
   - pyproject-hooks 1.0.0

4. Check the Render logs for any specific error messages and ensure the build dependencies are being installed correctly.

## API Endpoints

- `/` - Main application page
- `/scan` - Scan barcode and get product information
- `/calculate-nutrition-grade` - Calculate nutrition grade for a product
- `/calculate-health-score` - Calculate health score for a product
- `/api-status` - Check which APIs are configured

## Environment Variables

- `USDA_API_KEY` - USDA FoodData Central API key
- `EDAMAM_APP_ID` - Edamam Food Database API ID
- `EDAMAM_APP_KEY` - Edamam Food Database API key
- `GROQ_API_KEY` - Groq API key for AI-powered data enhancement
- `API_KEY` - API key for securing endpoints
- `PRODUCTION` - Set to `true` for production deployment
- `PORT` - Port for the production server (default: 8080)

## License

MIT