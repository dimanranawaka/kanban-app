import os

import pytest


def test_health_endpoint(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@pytest.mark.skipif(
    not os.path.isdir(
        os.path.join(os.path.dirname(__file__), "..", "frontend", "out")
    ),
    reason="frontend/out not built",
)
def test_root_serves_frontend(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/html")
