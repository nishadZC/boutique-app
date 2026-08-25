"""
Skin Tone Analyzer — OpenCV + K-Means (accepts raw bytes directly)
"""

import cv2
import numpy as np
import logging
from sklearn.cluster import KMeans
from PIL import Image
import io

logger = logging.getLogger(__name__)

SKIN_TONES = [
    ("#373028", "Deepest"),
    ("#422811", "Very Deep"),
    ("#513B2E", "Deep Brown"),
    ("#6F503C", "Medium Brown"),
    ("#81654F", "Tan"),
    ("#9D7A54", "Light Tan"),
    ("#BEA07E", "Medium Fair"),
    ("#E5C8A6", "Light Fair"),
    ("#E7C1B8", "Warm Fair"),
    ("#F3DAD6", "Very Fair"),
    ("#FBF2F3", "Pale"),
]


def hex_to_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))


def rgb_to_hex(r, g, b):
    return "#{:02X}{:02X}{:02X}".format(int(r), int(g), int(b))


def color_distance(rgb1, rgb2):
    return float(np.sqrt(sum((a - b) ** 2 for a, b in zip(rgb1, rgb2))))


def find_nearest_skin_tone(rgb):
    min_dist = float("inf")
    nearest_hex = SKIN_TONES[0][0]
    nearest_name = SKIN_TONES[0][1]
    for hex_code, name in SKIN_TONES:
        dist = color_distance(rgb, hex_to_rgb(hex_code))
        if dist < min_dist:
            min_dist = dist
            nearest_hex = hex_code
            nearest_name = name
    return nearest_hex, nearest_name


def is_skin_pixel(r, g, b):
    return (
        r > 95 and g > 40 and b > 20 and
        max(r, g, b) - min(r, g, b) > 15 and
        abs(int(r) - int(g)) > 15 and
        r > g and r > b
    )


def analyze_skin_tone_from_bytes(image_bytes: bytes) -> dict:
    """
    Analyze skin tone from raw image bytes (JPEG/PNG).
    Called by FastAPI after reading the uploaded file.
    """
    try:
        pil_img = Image.open(io.BytesIO(image_bytes))
        if pil_img.mode != "RGB":
            pil_img = pil_img.convert("RGB")

        img_array = np.array(pil_img)
        img_bgr = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
        img_bgr = cv2.resize(img_bgr, (400, 400))
        img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)

        # ── Face Detection ───────────────────────────────────
        face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        )
        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(
            gray, scaleFactor=1.1, minNeighbors=5, minSize=(60, 60)
        )

        face_detected = len(faces) > 0

        if face_detected:
            # Use largest face, crop to cheek/forehead area
            faces = sorted(faces, key=lambda f: f[2] * f[3], reverse=True)
            x, y, w, h = faces[0]
            face_region = img_rgb[
                y + int(h * 0.15): y + int(h * 0.75),
                x + int(w * 0.15): x + int(w * 0.85)
            ]
        else:
            # No face — use center region
            hh, ww = img_rgb.shape[:2]
            face_region = img_rgb[hh//4: 3*hh//4, ww//4: 3*ww//4]

        # ── Skin Pixel Extraction ────────────────────────────
        pixels = face_region.reshape(-1, 3)
        skin_pixels = np.array([p for p in pixels if is_skin_pixel(p[0], p[1], p[2])])

        if len(skin_pixels) < 50:
            skin_pixels = pixels
            confidence = 0.4
        else:
            confidence = min(0.95, len(skin_pixels) / len(pixels) + 0.5)

        # ── K-Means Clustering ───────────────────────────────
        n_clusters = min(3, len(skin_pixels))
        kmeans = KMeans(n_clusters=n_clusters, n_init=10, random_state=42)
        kmeans.fit(skin_pixels)

        counts = np.bincount(kmeans.labels_)
        dominant = kmeans.cluster_centers_[np.argmax(counts)]
        r, g, b = int(dominant[0]), int(dominant[1]), int(dominant[2])

        detected_hex = rgb_to_hex(r, g, b)
        mapped_hex, tone_name = find_nearest_skin_tone((r, g, b))

        return {
            "success": True,
            "detected_hex": detected_hex,
            "mapped_hex": mapped_hex,
            "skin_tone_name": tone_name,
            "confidence": round(confidence, 2),
            "face_detected": face_detected,
        }

    except Exception as e:
        logger.error(f"Skin tone analysis error: {e}")
        return {"success": False, "error": str(e), "face_detected": False}
