# Skin Tone to Color Recommendation Rules
# Extracted from the .ipynb notebook's skin_tone_to_color_mapping
# Based on fashion color theory and Fitzpatrick scale

class Colors:
    NAVY_BLUE = "Navy Blue"
    BLACK = "Black"
    CHARCOAL = "Charcoal"
    BURGUNDY = "Burgundy"
    MAROON = "Maroon"
    OLIVE = "Olive"
    RUST = "Rust"
    GOLD = "Gold"
    CREAM = "Cream"
    PEACH = "Peach"
    BROWN = "Brown"
    KHAKI = "Khaki"
    MUSTARD = "Mustard"
    TEAL = "Teal"
    TAN = "Tan"
    BEIGE = "Beige"
    RED = "Red"
    ORANGE = "Orange"
    BRONZE = "Bronze"
    GREEN = "Green"
    LIME_GREEN = "Lime Green"
    SEA_GREEN = "Sea Green"
    OFF_WHITE = "Off White"
    LAVENDER = "Lavender"
    MAUVE = "Mauve"
    YELLOW = "Yellow"
    LIGHT_BLUE = "Light Blue"
    CORAL = "Coral"
    TURQUOISE_BLUE = "Turquoise Blue"
    WHITE = "White"
    ROYAL_BLUE = "Royal Blue"
    FOREST_GREEN = "Forest Green"
    BLUE = "Blue"
    NAVY = "Navy"
    DEEP_BLUE = "Deep Blue"
    DARK_BROWN = "Dark Brown"
    DARK_GREY = "Dark Grey"
    DEEP_TEAL = "Deep Teal"
    PINK = "Pink"
    GREY = "Grey"

SKIN_TONE_MAP = {
    "#373028": {
        "name": "Deepest",
        "label": "Deep Skin Tone",
        "group": "deep",
        "recommended_colors": [Colors.NAVY_BLUE, Colors.BLACK, Colors.CHARCOAL, Colors.BURGUNDY, Colors.MAROON, Colors.OLIVE, Colors.RUST, Colors.GOLD, Colors.CREAM, Colors.PEACH],
        "shirt_colors": [Colors.WHITE, Colors.CREAM, Colors.GOLD, Colors.PEACH, Colors.NAVY_BLUE, Colors.BURGUNDY],
        "pant_colors": [Colors.BLACK, Colors.NAVY_BLUE, Colors.CHARCOAL, Colors.GREY, Colors.MAROON],
        "shoe_colors": [Colors.BLACK, Colors.BURGUNDY, Colors.BROWN, Colors.TAN],
    },
    "#422811": {
        "name": "Very Deep",
        "label": "Rich Dark Skin Tone",
        "group": "deep",
        "recommended_colors": [Colors.NAVY_BLUE, Colors.BROWN, Colors.KHAKI, Colors.OLIVE, Colors.MAROON, Colors.MUSTARD, Colors.TEAL, Colors.TAN, Colors.RUST, Colors.BURGUNDY],
        "shirt_colors": [Colors.WHITE, Colors.MUSTARD, Colors.TEAL, Colors.BURGUNDY, Colors.OLIVE, Colors.RUST],
        "pant_colors": [Colors.BLACK, Colors.NAVY_BLUE, Colors.KHAKI, Colors.CHARCOAL, Colors.BROWN],
        "shoe_colors": [Colors.BLACK, Colors.BROWN, Colors.TAN, Colors.BURGUNDY],
    },
    "#513B2E": {
        "name": "Deep Brown",
        "label": "Deep Brown Skin Tone",
        "group": "medium_dark",
        "recommended_colors": [Colors.CREAM, Colors.BEIGE, Colors.OLIVE, Colors.BURGUNDY, Colors.RED, Colors.ORANGE, Colors.MUSTARD, Colors.BRONZE, Colors.TEAL, Colors.PEACH],
        "shirt_colors": [Colors.WHITE, Colors.CREAM, Colors.PEACH, Colors.TEAL, Colors.MUSTARD, Colors.OLIVE],
        "pant_colors": [Colors.BLACK, Colors.BROWN, Colors.KHAKI, Colors.OLIVE, Colors.NAVY_BLUE],
        "shoe_colors": [Colors.BLACK, Colors.BROWN, Colors.BURGUNDY, Colors.TAN],
    },
    "#6F503C": {
        "name": "Medium Brown",
        "label": "Medium Brown Skin Tone",
        "group": "medium_dark",
        "recommended_colors": [Colors.BEIGE, Colors.BROWN, Colors.GREEN, Colors.KHAKI, Colors.CREAM, Colors.PEACH, Colors.LIME_GREEN, Colors.OLIVE, Colors.MAROON, Colors.RUST, Colors.MUSTARD],
        "shirt_colors": [Colors.WHITE, Colors.BEIGE, Colors.CREAM, Colors.PEACH, Colors.SEA_GREEN, Colors.OLIVE],
        "pant_colors": [Colors.BLACK, Colors.NAVY_BLUE, Colors.BROWN, Colors.KHAKI, Colors.CHARCOAL],
        "shoe_colors": [Colors.BLACK, Colors.BROWN, Colors.TAN, Colors.BURGUNDY],
    },
    "#81654F": {
        "name": "Tan",
        "label": "Warm Tan Skin Tone",
        "group": "medium",
        "recommended_colors": [Colors.BEIGE, Colors.OFF_WHITE, Colors.SEA_GREEN, Colors.CREAM, Colors.LAVENDER, Colors.MAUVE, Colors.BURGUNDY, Colors.YELLOW, Colors.LIME_GREEN],
        "shirt_colors": [Colors.WHITE, Colors.LIGHT_BLUE, Colors.LAVENDER, Colors.SEA_GREEN, Colors.CREAM, Colors.PINK],
        "pant_colors": [Colors.NAVY_BLUE, Colors.GREY, Colors.CHARCOAL, Colors.BLACK, Colors.BEIGE],
        "shoe_colors": [Colors.BLACK, Colors.BROWN, Colors.TAN, Colors.BURGUNDY],
    },
    "#9D7A54": {
        "name": "Light Tan",
        "label": "Light Tan Skin Tone",
        "group": "medium",
        "recommended_colors": [Colors.OLIVE, Colors.KHAKI, Colors.YELLOW, Colors.SEA_GREEN, Colors.TURQUOISE_BLUE, Colors.CORAL, Colors.WHITE, Colors.GOLD, Colors.PEACH],
        "shirt_colors": [Colors.WHITE, Colors.LIGHT_BLUE, Colors.CORAL, Colors.SEA_GREEN, Colors.PINK, Colors.LAVENDER],
        "pant_colors": [Colors.NAVY_BLUE, Colors.BLACK, Colors.GREY, Colors.CHARCOAL, Colors.KHAKI],
        "shoe_colors": [Colors.BLACK, Colors.BROWN, Colors.TAN, Colors.BURGUNDY],
    },
    "#BEA07E": {
        "name": "Medium Fair",
        "label": "Medium Fair Skin Tone",
        "group": "fair",
        "recommended_colors": [Colors.CORAL, Colors.SEA_GREEN, Colors.TURQUOISE_BLUE, Colors.BURGUNDY, Colors.RED, Colors.ROYAL_BLUE, Colors.YELLOW, Colors.PEACH],
        "shirt_colors": [Colors.NAVY_BLUE, Colors.BURGUNDY, Colors.ROYAL_BLUE, Colors.CHARCOAL, Colors.WHITE, Colors.CORAL],
        "pant_colors": [Colors.BLACK, Colors.NAVY_BLUE, Colors.CHARCOAL, Colors.GREY, Colors.BROWN],
        "shoe_colors": [Colors.BLACK, Colors.BROWN, Colors.BURGUNDY, Colors.TAN],
    },
    "#E5C8A6": {
        "name": "Light Fair",
        "label": "Light Fair Skin Tone",
        "group": "fair",
        "recommended_colors": [Colors.NAVY_BLUE, Colors.OLIVE, Colors.BURGUNDY, Colors.BROWN, Colors.FOREST_GREEN, Colors.TEAL, Colors.CHARCOAL, Colors.RUST],
        "shirt_colors": [Colors.NAVY_BLUE, Colors.BURGUNDY, Colors.CHARCOAL, Colors.OLIVE, Colors.WHITE, Colors.LIGHT_BLUE],
        "pant_colors": [Colors.BLACK, Colors.NAVY_BLUE, Colors.GREY, Colors.CHARCOAL, Colors.BROWN],
        "shoe_colors": [Colors.BLACK, Colors.BROWN, Colors.BURGUNDY, Colors.TAN],
    },
    "#E7C1B8": {
        "name": "Warm Fair",
        "label": "Warm Fair Skin Tone",
        "group": "fair",
        "recommended_colors": [Colors.BLUE, Colors.NAVY, Colors.BROWN, Colors.OLIVE, Colors.BURGUNDY, Colors.TEAL, Colors.CHARCOAL, Colors.MUSTARD],
        "shirt_colors": [Colors.NAVY_BLUE, Colors.BLUE, Colors.CHARCOAL, Colors.BURGUNDY, Colors.WHITE, Colors.TEAL],
        "pant_colors": [Colors.BLACK, Colors.NAVY_BLUE, Colors.CHARCOAL, Colors.GREY, Colors.BROWN],
        "shoe_colors": [Colors.BLACK, Colors.BROWN, Colors.TAN, Colors.BURGUNDY],
    },
    "#F3DAD6": {
        "name": "Very Fair",
        "label": "Very Fair Skin Tone",
        "group": "very_fair",
        "recommended_colors": [Colors.NAVY_BLUE, Colors.BLACK, Colors.BURGUNDY, Colors.CHARCOAL, Colors.FOREST_GREEN, Colors.DEEP_BLUE, Colors.MAROON],
        "shirt_colors": [Colors.NAVY_BLUE, Colors.BLACK, Colors.BURGUNDY, Colors.CHARCOAL, Colors.DEEP_BLUE, Colors.WHITE],
        "pant_colors": [Colors.BLACK, Colors.NAVY_BLUE, Colors.CHARCOAL, Colors.GREY, Colors.DARK_BROWN],
        "shoe_colors": [Colors.BLACK, Colors.DARK_BROWN, Colors.BURGUNDY],
    },
    "#FBF2F3": {
        "name": "Pale",
        "label": "Pale Skin Tone",
        "group": "very_fair",
        "recommended_colors": [Colors.NAVY_BLUE, Colors.BLACK, Colors.CHARCOAL, Colors.BURGUNDY, Colors.DEEP_TEAL, Colors.FOREST_GREEN],
        "shirt_colors": [Colors.NAVY_BLUE, Colors.BLACK, Colors.CHARCOAL, Colors.BURGUNDY, Colors.WHITE, Colors.TEAL],
        "pant_colors": [Colors.BLACK, Colors.NAVY_BLUE, Colors.CHARCOAL, Colors.DARK_GREY],
        "shoe_colors": [Colors.BLACK, Colors.DARK_BROWN, Colors.BURGUNDY],
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
