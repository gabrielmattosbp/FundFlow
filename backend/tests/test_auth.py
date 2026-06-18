from unittest.mock import MagicMock, patch


def test_register_success(client):
    mock_supabase = MagicMock()
    mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = []
    mock_supabase.table.return_value.insert.return_value.execute.return_value.data = [
        {
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "email": "test@example.com",
            "name": "Test User",
            "password": "$2b$12$hashed",
            "created_at": "2025-01-01T00:00:00Z",
        }
    ]

    with patch("app.routes.auth.supabase", mock_supabase):
        resp = client.post("/auth/register", json={
            "email": "test@example.com",
            "password": "Str0ng!Pass",
            "name": "Test User",
        })

    assert resp.status_code == 201
    data = resp.json()
    assert data["user"]["email"] == "test@example.com"
    assert data["user"]["name"] == "Test User"
    assert "access_token" in data


def test_register_email_taken(client):
    mock_supabase = MagicMock()
    mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [
        {"id": "550e8400-e29b-41d4-a716-446655440000"}
    ]

    with patch("app.routes.auth.supabase", mock_supabase):
        resp = client.post("/auth/register", json={
            "email": "taken@example.com",
            "password": "Str0ng!Pass",
            "name": "Existing",
        })

    assert resp.status_code == 409
    assert resp.json()["detail"] == "Email already registered"


def test_login_success(client):
    mock_supabase = MagicMock()
    mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "email": "test@example.com",
        "name": "Test User",
        "password": "$2b$12$hashedpasswordhash",
        "created_at": "2025-01-01T00:00:00Z",
    }

    with patch("app.routes.auth.supabase", mock_supabase):
        resp = client.post("/auth/login", json={
            "email": "test@example.com",
            "password": "Str0ng!Pass",
        })

    assert resp.status_code == 200
    data = resp.json()
    assert data["user"]["email"] == "test@example.com"
    assert "access_token" in data


def test_login_invalid_credentials(client):
    mock_supabase = MagicMock()
    mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = None

    with patch("app.routes.auth.supabase", mock_supabase):
        resp = client.post("/auth/login", json={
            "email": "wrong@example.com",
            "password": "wrongpass",
        })

    assert resp.status_code == 401
    assert resp.json()["detail"] == "Invalid email or password"
