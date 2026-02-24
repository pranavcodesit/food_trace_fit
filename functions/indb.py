import pandas as pd
import os
import re

# Global variables to store the loaded data
_compositions = None
_loaded = False

def load_compositions():
    """Load the INDB dataset from the Excel file"""
    global _compositions, _loaded
    
    try:
        # Path to the INDB Excel file
        file_path = os.path.join(os.path.dirname(__file__), 'ANUVAAD_INDB_2024.xlsx')
        
        # Load the Excel file
        # Assuming the data is in the first sheet
        df = pd.read_excel(file_path, engine='openpyxl')
        
        # Clean column names (remove spaces, lowercase)
        df.columns = [col.strip().lower().replace(' ', '_') for col in df.columns]
        
        # Convert DataFrame to list of dictionaries for easier access
        _compositions = df.to_dict('records')
        _loaded = True
        
        # Map common nutrient names to their column names in the dataset
        # This will need to be adjusted based on the actual column names in the INDB dataset
        global _nutrient_map
        _nutrient_map = {
            'name': 'recipe_name',  # Food name
            'grup': 'category',     # Food group/category
            'enerc': 'energy_kcal', # Energy in kcal
            'fat': 'fat_g',         # Total fat in g
            'prot': 'protein_g',    # Protein in g
            'carb': 'carbohydrate_g', # Carbohydrates in g
            'sugar': 'sugar_g',     # Sugar in g
            'na': 'sodium_mg',      # Sodium in mg
            'fibc': 'fibre_g'       # Fiber in g
        }
        
        return True
    except Exception as e:
        print(f"Error loading INDB dataset: {str(e)}")
        _loaded = False
        return False

def compositions(search_term):
    """Search for foods in the INDB dataset that match the search term"""
    global _compositions, _loaded
    
    if not _loaded or not _compositions:
        if not load_compositions():
            return []
    
    # Convert search term to lowercase for case-insensitive matching
    search_term = search_term.lower()
    
    # Find matches based on food name
    matches = []
    for food in _compositions:
        food_name = str(food.get(_nutrient_map['name'], '')).lower()
        
        # Check if search term is in the food name
        if search_term in food_name:
            # Create a new dictionary with the mapped keys for compatibility
            mapped_food = {}
            for key, col in _nutrient_map.items():
                mapped_food[key] = food.get(col, '')
            
            matches.append(mapped_food)
    
    return matches

def columns():
    """Return the list of available nutrient columns"""
    global _compositions, _loaded, _nutrient_map
    
    if not _loaded or not _compositions:
        if not load_compositions():
            return []
    
    return list(_nutrient_map.keys())