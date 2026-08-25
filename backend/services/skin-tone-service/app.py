"""
Skin Tone Microservice — Flask REST API
Endpoint: POST /analyze
"""

import logging
from flask import Flask, request, jsonify
from flask_cors import CORS

from skin_tone_analyzer import analyze_skin_tone
from color_rules import get_color_recommendations

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "skin-tone-service"})


@app.route("/analyze", methods=["POST"])
def analyze():
    """
    Analyze skin tone from a base64-encoded face image.
    
    Request body:
      { "image": "<base64 encoded image>" }
    
    Response:
      {
        "success": true,
        "skinTone": {
          "detectedHex": "#9D7A54",
          "mappedHex": "#9D7A54",
          "name": "Light Tan",
          "group": "medium",
          "confidence": 0.87,
          "faceDetected": true
        },
        "recommendations": {
          "label": "Light Tan Skin Tone",
          "group": "medium",
          "recommendedColors": [...],
          "shirtColors": [...],
          "pantColors": [...],
          "shoeColors": [...]
        }
      }
    """
    try:
        data = request.get_json()
        
        if not data or "image" not in data:
            return jsonify({"success": False, "error": "Missing 'image' field in request body"}), 400
        
        base64_image = data["image"]
        
        if not base64_image:
            return jsonify({"success": False, "error": "Empty image data"}), 400
        
        # Analyze skin tone
        result = analyze_skin_tone(base64_image)
        
        if not result["success"]:
            return jsonify({
                "success": False,
                "error": result.get("error", "Analysis failed"),
                "faceDetected": result.get("face_detected", False),
            }), 422
        
        # Get color recommendations
        recommendations = get_color_recommendations(result["mapped_hex"])
        
        return jsonify({
            "success": True,
            "skinTone": {
                "detectedHex": result["detected_hex"],
                "mappedHex": result["mapped_hex"],
                "name": result["skin_tone_name"],
                "group": recommendations.get("group", "medium"),
                "confidence": result["confidence"],
                "faceDetected": result["face_detected"],
            },
            "recommendations": {
                "label": recommendations["label"],
                "group": recommendations["group"],
                "recommendedColors": recommendations["recommended_colors"],
                "shirtColors": recommendations["shirt_colors"],
                "pantColors": recommendations["pant_colors"],
                "shoeColors": recommendations["shoe_colors"],
            }
        })
    
    except Exception as e:
        logger.error(f"Error in /analyze: {e}")
        return jsonify({"success": False, "error": "Internal server error"}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=False)
