import numpy as np

import skin_tone_analyzer as sta
from tests.conftest import make_image_bytes


def test_hex_rgb_roundtrip():
    assert sta.hex_to_rgb("#BEA07E") == (190, 160, 126)
    assert sta.hex_to_rgb("0a0b0c") == (10, 11, 12)
    assert sta.rgb_to_hex(190, 160, 126) == "#BEA07E"
    assert sta.rgb_to_hex(1.9, 2, 3) == "#010203"


def test_color_distance():
    assert sta.color_distance((0, 0, 0), (3, 4, 0)) == 5.0
    assert sta.color_distance((1, 1, 1), (1, 1, 1)) == 0.0


def test_find_nearest_skin_tone():
    for hex_code, name in sta.SKIN_TONES:
        assert sta.find_nearest_skin_tone(sta.hex_to_rgb(hex_code)) == (hex_code, name)
    assert sta.find_nearest_skin_tone((0, 0, 0)) == ("#422811", "Very Deep")


def test_is_skin_pixel():
    assert sta.is_skin_pixel(200, 150, 120)
    assert not sta.is_skin_pixel(50, 50, 50)      # too dark
    assert not sta.is_skin_pixel(200, 195, 190)   # low spread
    assert not sta.is_skin_pixel(100, 200, 50)    # r not max
    assert sta.is_skin_pixel(np.uint8(200), np.uint8(150), np.uint8(120))


def test_face_detected_skin_pixels(fake_cascade):
    fake_cascade([(50, 50, 100, 100), (100, 100, 200, 200)])
    res = sta.analyze_skin_tone_from_bytes(make_image_bytes((190, 160, 126)))
    assert res["success"] is True
    assert res["face_detected"] is True
    assert res["mapped_hex"] == "#BEA07E"
    assert res["skin_tone_name"] == "Medium Fair"
    assert res["detected_hex"] == "#BEA07E"
    assert res["confidence"] == 0.99


def test_no_face_non_skin_falls_back(fake_cascade):
    fake_cascade(())
    res = sta.analyze_skin_tone_from_bytes(make_image_bytes((40, 40, 40), fmt="JPEG"))
    assert res["success"] is True
    assert res["face_detected"] is False
    assert res["confidence"] == 0.4
    assert res["mapped_hex"] == "#373028"


def test_non_rgb_mode_converted(fake_cascade):
    fake_cascade(())
    res = sta.analyze_skin_tone_from_bytes(make_image_bytes((200, 200, 200), mode="L"))
    assert res["success"] is True
    assert res["mapped_hex"] == "#E7C1B8"


def test_real_cascade_on_blank_image():
    res = sta.analyze_skin_tone_from_bytes(make_image_bytes((128, 128, 128)))
    assert res["success"] is True
    assert res["face_detected"] is False


def test_invalid_bytes_returns_error():
    res = sta.analyze_skin_tone_from_bytes(b"not an image")
    assert res["success"] is False
    assert res["face_detected"] is False
    assert res["error"]
