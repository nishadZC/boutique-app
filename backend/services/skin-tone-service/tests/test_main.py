import pytest
from fastapi.testclient import TestClient

import main
from tests.conftest import make_image_bytes


@pytest.fixture
def client():
    return TestClient(main.app)


def post(client, data, ctype="image/png", name="f.png"):
    return client.post("/detect-skin-tone", files={"image": (name, data, ctype)})


def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok", "service": "skin-tone-fastapi"}


def test_metrics_endpoint_and_instrumentation(client):
    client.get("/does-not-exist")
    r = client.get("/metrics")
    assert r.status_code == 200
    assert r.headers["content-type"].startswith("text/plain")
    body = r.text
    assert 'service_info{service_name="skin-tone-service",version="1.0.0"} 1.0' in body
    assert 'route="unmatched"' in body
    assert 'route="/health"' not in body
    assert 'route="/metrics"' not in body


def test_detect_face_found(client, fake_cascade):
    fake_cascade([(100, 100, 200, 200)])
    r = post(client, make_image_bytes((229, 200, 166)))
    assert r.status_code == 200
    j = r.json()
    assert j["skinTone"]["hex"] == "#E5C8A6"
    assert j["skinTone"]["name"] == "Light Fair"
    assert j["skinTone"]["group"] == "fair"
    assert j["skinTone"]["face_detected"] is True
    assert 0 < j["skinTone"]["confidence"] <= 0.99
    for k in ("recommendedColors", "shirtColors", "pantColors", "shoeColors"):
        assert j[k]
    m = client.get("/metrics").text
    assert 'route="/detect-skin-tone"' in m and 'status_code="200"' in m


def test_detect_no_face_still_succeeds(client, fake_cascade):
    # Current behaviour: no face -> analyzer uses centre region, still 200.
    fake_cascade(())
    r = post(client, make_image_bytes((200, 150, 120)))
    assert r.status_code == 200
    assert r.json()["skinTone"]["face_detected"] is False


def test_detect_no_face_422(client, monkeypatch):
    monkeypatch.setattr(main, "analyze_skin_tone_from_bytes",
                        lambda b: {"success": False, "face_detected": False, "error": "x"})
    r = post(client, make_image_bytes())
    assert r.status_code == 422
    assert "No face detected" in r.json()["detail"]


def test_corrupt_image_reported_as_no_face(client):
    # Current behaviour: undecodable bytes with image/* type -> 422 "No face detected".
    r = post(client, b"garbage-bytes", ctype="image/jpeg", name="x.jpg")
    assert r.status_code == 422


def test_analysis_error_500(client, monkeypatch):
    monkeypatch.setattr(main, "analyze_skin_tone_from_bytes",
                        lambda b: {"success": False, "face_detected": True, "error": "boom"})
    r = post(client, make_image_bytes())
    assert r.status_code == 500
    assert r.json()["detail"] == "boom"


def test_analysis_error_500_default_message(client, monkeypatch):
    monkeypatch.setattr(main, "analyze_skin_tone_from_bytes", lambda b: {"success": False})
    r = post(client, make_image_bytes())
    assert r.status_code == 500
    assert r.json()["detail"] == "Analysis failed"


def test_empty_file_400(client):
    r = post(client, b"")
    assert r.status_code == 400
    assert "Empty" in r.json()["detail"]


@pytest.mark.parametrize("ctype", ["text/plain", "application/pdf"])
def test_wrong_type_400(client, ctype):
    r = post(client, b"hello", ctype=ctype, name="a.txt")
    assert r.status_code == 400
    assert "Invalid file type" in r.json()["detail"]


def test_too_large_400(client):
    r = post(client, b"\0" * (20 * 1024 * 1024 + 1))
    assert r.status_code == 400
    assert "too large" in r.json()["detail"]


def test_missing_field_422(client):
    r = client.post("/detect-skin-tone")
    assert r.status_code == 422


def test_middleware_records_500_on_exception(monkeypatch):
    def boom(b):
        raise RuntimeError("kaboom")
    monkeypatch.setattr(main, "analyze_skin_tone_from_bytes", boom)
    c = TestClient(main.app, raise_server_exceptions=False)
    r = post(c, make_image_bytes())
    assert r.status_code == 500
    m = c.get("/metrics").text
    assert 'status_code="500"' in m
