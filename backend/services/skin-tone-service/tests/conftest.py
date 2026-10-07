import io
import os
import sys

import numpy as np
import pytest
from PIL import Image

SERVICE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if SERVICE_DIR not in sys.path:
    sys.path.insert(0, SERVICE_DIR)


def make_image_bytes(rgb=(200, 150, 120), size=(100, 100), fmt="PNG", mode="RGB"):
    arr = np.zeros((size[1], size[0], 3), dtype=np.uint8)
    arr[:, :] = rgb
    img = Image.fromarray(arr, "RGB")
    if mode != "RGB":
        img = img.convert(mode)
    buf = io.BytesIO()
    img.save(buf, format=fmt)
    return buf.getvalue()


@pytest.fixture
def fake_cascade(monkeypatch):
    """Patch the Haar cascade so detectMultiScale returns the given faces."""
    import skin_tone_analyzer

    def _install(faces):
        class FakeCascade:
            def __init__(self, *a, **k):
                pass

            def detectMultiScale(self, *a, **k):
                return faces

        monkeypatch.setattr(skin_tone_analyzer.cv2, "CascadeClassifier", FakeCascade)

    return _install
