# Skin Tone to Color Recommendation Rules
# Extracted from the .ipynb notebook's skin_tone_to_color_mapping
# Based on fashion color theory and Fitzpatrick scale

SKIN_TONE_MAP = {
    "#373028": {
        "name": "Deepest",
        "label": "Deep Skin Tone",
        "group": "deep",
        "recommended_colors": ["Navy Blue", "Black", "Charcoal", "Burgundy", "Maroon", "Olive", "Rust", "Gold", "Cream", "Peach"],
        "shirt_colors": ["White", "Cream", "Gold", "Peach", "Navy Blue", "Burgundy"],
        "pant_colors": ["Black", "Navy Blue", "Charcoal", "Grey", "Maroon"],
        "shoe_colors": ["Black", "Burgundy", "Brown", "Tan"],
    },
    "#422811": {
        "name": "Very Deep",
        "label": "Rich Dark Skin Tone",
        "group": "deep",
        "recommended_colors": ["Navy Blue", "Brown", "Khaki", "Olive", "Maroon", "Mustard", "Teal", "Tan", "Rust", "Burgundy"],
        "shirt_colors": ["White", "Mustard", "Teal", "Burgundy", "Olive", "Rust"],
        "pant_colors": ["Black", "Navy Blue", "Khaki", "Charcoal", "Brown"],
        "shoe_colors": ["Black", "Brown", "Tan", "Burgundy"],
    },
    "#513B2E": {
        "name": "Deep Brown",
        "label": "Deep Brown Skin Tone",
        "group": "medium_dark",
        "recommended_colors": ["Cream", "Beige", "Olive", "Burgundy", "Red", "Orange", "Mustard", "Bronze", "Teal", "Peach"],
        "shirt_colors": ["White", "Cream", "Peach", "Teal", "Mustard", "Olive"],
        "pant_colors": ["Black", "Brown", "Khaki", "Olive", "Navy Blue"],
        "shoe_colors": ["Black", "Brown", "Burgundy", "Tan"],
    },
    "#6F503C": {
        "name": "Medium Brown",
        "label": "Medium Brown Skin Tone",
        "group": "medium_dark",
        "recommended_colors": ["Beige", "Brown", "Green", "Khaki", "Cream", "Peach", "Lime Green", "Olive", "Maroon", "Rust", "Mustard"],
        "shirt_colors": ["White", "Beige", "Cream", "Peach", "Sea Green", "Olive"],
        "pant_colors": ["Black", "Navy Blue", "Brown", "Khaki", "Charcoal"],
        "shoe_colors": ["Black", "Brown", "Tan", "Burgundy"],
    },
    "#81654F": {
        "name": "Tan",
        "label": "Warm Tan Skin Tone",
        "group": "medium",
        "recommended_colors": ["Beige", "Off White", "Sea Green", "Cream", "Lavender", "Mauve", "Burgundy", "Yellow", "Lime Green"],
        "shirt_colors": ["White", "Light Blue", "Lavender", "Sea Green", "Cream", "Pink"],
        "pant_colors": ["Navy Blue", "Grey", "Charcoal", "Black", "Beige"],
        "shoe_colors": ["Black", "Brown", "Tan", "Burgundy"],
    },
    "#9D7A54": {
        "name": "Light Tan",
        "label": "Light Tan Skin Tone",
        "group": "medium",
        "recommended_colors": ["Olive", "Khaki", "Yellow", "Sea Green", "Turquoise Blue", "Coral", "White", "Gold", "Peach"],
        "shirt_colors": ["White", "Light Blue", "Coral", "Sea Green", "Pink", "Lavender"],
        "pant_colors": ["Navy Blue", "Black", "Grey", "Charcoal", "Khaki"],
        "shoe_colors": ["Black", "Brown", "Tan", "Burgundy"],
    },
    "#BEA07E": {
        "name": "Medium Fair",
        "label": "Medium Fair Skin Tone",
        "group": "fair",
        "recommended_colors": ["Coral", "Sea Green", "Turquoise Blue", "Burgundy", "Red", "Royal Blue", "Yellow", "Peach"],
        "shirt_colors": ["Navy Blue", "Burgundy", "Royal Blue", "Charcoal", "White", "Coral"],
        "pant_colors": ["Black", "Navy Blue", "Charcoal", "Grey", "Brown"],
        "shoe_colors": ["Black", "Brown", "Burgundy", "Tan"],
    },
    "#E5C8A6": {
        "name": "Light Fair",
        "label": "Light Fair Skin Tone",
        "group": "fair",
        "recommended_colors": ["Navy Blue", "Olive", "Burgundy", "Brown", "Forest Green", "Teal", "Charcoal", "Rust"],
        "shirt_colors": ["Navy Blue", "Burgundy", "Charcoal", "Olive", "White", "Light Blue"],
        "pant_colors": ["Black", "Navy Blue", "Grey", "Charcoal", "Brown"],
        "shoe_colors": ["Black", "Brown", "Burgundy", "Tan"],
    },
    "#E7C1B8": {
        "name": "Warm Fair",
        "label": "Warm Fair Skin Tone",
        "group": "fair",
        "recommended_colors": ["Blue", "Navy", "Brown", "Olive", "Burgundy", "Teal", "Charcoal", "Mustard"],
        "shirt_colors": ["Navy Blue", "Blue", "Charcoal", "Burgundy", "White", "Teal"],
        "pant_colors": ["Black", "Navy Blue", "Charcoal", "Grey", "Brown"],
        "shoe_colors": ["Black", "Brown", "Tan", "Burgundy"],
    },
    "#F3DAD6": {
        "name": "Very Fair",
        "label": "Very Fair Skin Tone",
        "group": "very_fair",
        "recommended_colors": ["Navy Blue", "Black", "Burgundy", "Charcoal", "Forest Green", "Deep Blue", "Maroon"],
        "shirt_colors": ["Navy Blue", "Black", "Burgundy", "Charcoal", "Deep Blue", "White"],
        "pant_colors": ["Black", "Navy Blue", "Charcoal", "Grey", "Dark Brown"],
        "shoe_colors": ["Black", "Dark Brown", "Burgundy"],
    },
    "#FBF2F3": {
        "name": "Pale",
        "label": "Pale Skin Tone",
        "group": "very_fair",
        "recommended_colors": ["Navy Blue", "Black", "Charcoal", "Burgundy", "Deep Teal", "Forest Green"],
        "shirt_colors": ["Navy Blue", "Black", "Charcoal", "Burgundy", "White", "Teal"],
        "pant_colors": ["Black", "Navy Blue", "Charcoal", "Dark Grey"],
        "shoe_colors": ["Black", "Dark Brown", "Burgundy"],
    },
}

def get_color_recommendations(skin_tone_hex):
    """Get color recommendations for a detected skin tone hex."""
    # Exact match first
    if skin_tone_hex in SKIN_TONE_MAP:
        return SKIN_TONE_MAP[skin_tone_hex]
    
    # Find nearest skin tone by color distance
    from PIL import ImageColor
    import math
    
    def hex_to_rgb(h):
        h = h.lstrip('#')
        return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))
    
    def color_distance(h1, h2):
        r1, g1, b1 = hex_to_rgb(h1)
        r2, g2, b2 = hex_to_rgb(h2)
        return math.sqrt((r1-r2)**2 + (g1-g2)**2 + (b1-b2)**2)
    
    closest = min(SKIN_TONE_MAP.keys(), key=lambda k: color_distance(k, skin_tone_hex))
    return SKIN_TONE_MAP[closest]
