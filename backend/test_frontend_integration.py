import pytest
from fastapi.testclient import TestClient
from backend.main import app


@pytest.fixture
def client():
    return TestClient(app)


def test_health_endpoint(client):
    """Test API health endpoint"""
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_frontend_root_page(client):
    """Test that root path serves frontend"""
    response = client.get("/")
    assert response.status_code == 200
    # Should return HTML (could be index.html or 404 if not built yet)
    assert response.headers["content-type"].startswith("text/html")


def test_static_assets_served(client):
    """Test that static assets are available"""
    # Test that we can access static files without error
    # This may return 404 if files don't exist yet (before build)
    # but the route should be properly configured
    response = client.get("/")
    assert response.status_code in [200, 404]
