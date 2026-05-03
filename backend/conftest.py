import pytest
from fastapi.testclient import TestClient

from backend.main import app


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("KANBAN_DB_PATH", str(tmp_path / "test.db"))
    monkeypatch.setenv("AUTH_SECRET", "test-secret")
    with TestClient(app) as c:
        yield c


