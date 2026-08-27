"""
FastAPI Skin Tone Detection Service
Internal service — called by the Express backend only.

Endpoint: POST /detect-skin-tone
  - Accepts: multipart/form-data with field `image` (file upload)
  - Returns: { skinTone: { hex, name }, recommendedColors: [...] }
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator
from pydantic import BaseModel
from typing import List
import io

from skin_tone_analyzer import analyze_skin_tone_from_bytes
from color_rules import get_color_recommendations

app = FastAPI(
    title="Skin Tone Detection Service",
    description="Internal FastAPI service for face detection and skin tone analysis",
    version="1.0.0"
)

Instrumentator().instrument(app).expose(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Response Models ──────────────────────────────────────────
class SkinToneInfo(BaseModel):
    hex: str
    name: str
    group: str
    confidence: float
    face_detected: bool


class DetectSkinToneResponse(BaseModel):
    skinTone: SkinToneInfo
    recommendedColors: List[str]
    shirtColors: List[str]
    pantColors: List[str]
    shoeColors: List[str]


# ── Health Check ─────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok", "service": "skin-tone-fastapi"}


# ── Main Endpoint ─────────────────────────────────────────────
@app.post("/detect-skin-tone", response_model=DetectSkinToneResponse)
async def detect_skin_tone(image: UploadFile = File(...)):
    """
    Accept a face image, detect skin tone, return colors.
    Called internally by the Express backend.
    """

    # Validate file type
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Please upload a JPG or PNG image."
        )

    # Read image bytes
    contents = await image.read()

    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Empty image file received.")

    # Max 10MB
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image too large. Maximum size is 10MB.")

    # Analyze skin tone
    result = analyze_skin_tone_from_bytes(contents)

    if not result["success"]:
        if not result.get("face_detected", True):
            raise HTTPException(
                status_code=422,
                detail="No face detected. Please upload a clear front-facing photo."
            )
        raise HTTPException(status_code=500, detail=result.get("error", "Analysis failed"))

    # Get color recommendations
    colors = get_color_recommendations(result["mapped_hex"])

    return DetectSkinToneResponse(
        skinTone=SkinToneInfo(
            hex=result["mapped_hex"],
            name=result["skin_tone_name"],
            group=colors["group"],
            confidence=result["confidence"],
            face_detected=result["face_detected"],
        ),
        recommendedColors=colors["recommended_colors"],
        shirtColors=colors["shirt_colors"],
        pantColors=colors["pant_colors"],
        shoeColors=colors["shoe_colors"],
    )
