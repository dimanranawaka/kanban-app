import pytest
from fastapi.testclient import TestClient
from backend.main import app


@pytest.fixture
def client():
    return TestClient(app)


def test_root_returns_html(client):
    response = client.get("/")
    assert response.status_code == 200
    assert "Hello from FastAPI" in response.text
    assert "<!DOCTYPE html>" in response.text
    assert response.headers["content-type"] == "text/html; charset=utf-8"


def test_health_endpoint(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
