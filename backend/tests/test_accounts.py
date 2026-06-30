from unittest.mock import MagicMock, patch


def test_list_accounts_empty(client):
    resp = client.get("/accounts/")

    assert resp.status_code == 200
    data = resp.json()
    assert data["accounts"] == []
    assert data["total"] == 0


def test_list_accounts_with_data(client):
    mock_supabase = MagicMock()
    mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.execute.return_value.data = [
        {
            "id": "550e8400-e29b-41d4-a716-446655440001",
            "user_id": "550e8400-e29b-41d4-a716-446655440000",
            "institution": "Test Bank",
            "account_type": "checking",
            "currency": "EUR",
            "balance": 1000.00,
            "created_at": "2025-01-01T00:00:00Z",
            "updated_at": "2025-01-01T00:00:00Z",
        }
    ]

    with patch("app.routes.accounts.supabase", mock_supabase):
        resp = client.get("/accounts/")

    assert resp.status_code == 200
    data = resp.json()
    assert len(data["accounts"]) == 1
    assert data["accounts"][0]["institution"] == "Test Bank"


def test_create_account(client):
    mock_supabase = MagicMock()
    mock_supabase.table.return_value.insert.return_value.execute.return_value.data = [
        {
            "id": "550e8400-e29b-41d4-a716-446655440002",
            "user_id": "550e8400-e29b-41d4-a716-446655440000",
            "institution": "New Bank",
            "account_type": "savings",
            "currency": "USD",
            "balance": 500.00,
            "created_at": "2025-01-01T00:00:00Z",
            "updated_at": "2025-01-01T00:00:00Z",
        }
    ]

    with patch("app.routes.accounts.supabase", mock_supabase):
        resp = client.post("/accounts/", json={
            "institution": "New Bank",
            "account_type": "savings",
            "currency": "USD",
            "balance": 500.00,
        })

    assert resp.status_code == 201
    data = resp.json()
    assert data["institution"] == "New Bank"
    assert data["currency"] == "USD"
