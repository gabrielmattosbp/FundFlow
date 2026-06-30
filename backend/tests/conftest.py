import os

os.environ.setdefault("SUPABASE_URL", "https://test.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSJ9.abc")
os.environ.setdefault("JWT_SECRET", "test-jwt-secret")
os.environ.setdefault("JWT_ALGORITHM", "HS256")
os.environ.setdefault("ACCESS_TOKEN_EXPIRE_MINUTES", "1440")

import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture(autouse=True)
def _mock_deps():
    """Mock external dependencies for all tests."""
    mock_client = MagicMock()
    mock_client.table.return_value.select.return_value.eq.return_value.execute.return_value.data = []
    mock_client.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = None
    mock_client.table.return_value.insert.return_value.execute.return_value.data = [{"id": "mock-id"}]

    from app.routes import deps
    app.dependency_overrides[deps.get_current_user] = lambda: "550e8400-e29b-41d4-a716-446655440000"

    with patch("app.database.create_client", return_value=mock_client), \
         patch("app.database.SupabaseClient._get", return_value=mock_client), \
         patch("app.routes.auth.hash_password", return_value="$2b$12$hashedpasswordhash"), \
         patch("app.routes.auth.verify_password", return_value=True):
        yield mock_client

    app.dependency_overrides.clear()
