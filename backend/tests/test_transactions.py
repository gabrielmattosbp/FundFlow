from unittest.mock import MagicMock, patch


def test_list_transactions_empty(client):
    resp = client.get("/transactions/")

    assert resp.status_code == 200
    data = resp.json()
    assert data["transactions"] == []
    assert data["total"] == 0


def test_list_transactions_with_month_filter(client):
    mock_supabase = MagicMock()
    mock_query = mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value
    mock_query.gte.return_value.lte.return_value.range.return_value.execute.return_value.data = [
        {
            "id": "550e8400-e29b-41d4-a716-446655440010",
            "user_id": "550e8400-e29b-41d4-a716-446655440000",
            "account_id": "550e8400-e29b-41d4-a716-446655440001",
            "description": "Test",
            "amount": 100.00,
            "type": "expense",
            "category": "Alimentação",
            "date": "2026-06-15",
            "currency": "EUR",
            "is_subscription": False,
            "bank_reference": None,
            "created_at": "2026-06-15T00:00:00Z",
        }
    ]

    with patch("app.routes.transactions.supabase", mock_supabase):
        resp = client.get("/transactions/?month=2026-06")

    assert resp.status_code == 200
    data = resp.json()
    assert len(data["transactions"]) == 1
    assert data["transactions"][0]["description"] == "Test"
    assert float(data["transactions"][0]["amount"]) == 100.00


def test_create_transaction_success(client):
    mock_supabase = MagicMock()
    mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.single.return_value.execute.return_value.data = {
        "id": "550e8400-e29b-41d4-a716-446655440001"
    }
    mock_supabase.table.return_value.insert.return_value.execute.return_value.data = [
        {
            "id": "550e8400-e29b-41d4-a716-446655440010",
            "user_id": "550e8400-e29b-41d4-a716-446655440000",
            "account_id": "550e8400-e29b-41d4-a716-446655440001",
            "description": "New Transaction",
            "amount": 50.00,
            "type": "expense",
            "category": "Transporte",
            "date": "2026-06-20",
            "currency": "EUR",
            "is_subscription": False,
            "bank_reference": None,
            "created_at": "2026-06-20T00:00:00Z",
        }
    ]

    with patch("app.routes.transactions.supabase", mock_supabase):
        resp = client.post("/transactions/", json={
            "account_id": "550e8400-e29b-41d4-a716-446655440001",
            "description": "New Transaction",
            "amount": 50.00,
            "type": "expense",
            "category": "Transporte",
            "date": "2026-06-20",
            "is_subscription": False,
        })

    assert resp.status_code == 201
    data = resp.json()
    assert data["description"] == "New Transaction"


def test_create_transaction_account_not_found(client):
    mock_supabase = MagicMock()
    mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.single.return_value.execute.return_value.data = None

    with patch("app.routes.transactions.supabase", mock_supabase):
        resp = client.post("/transactions/", json={
            "account_id": "550e8400-e29b-41d4-a716-446655449999",
            "description": "Orphan",
            "amount": 10.00,
            "type": "expense",
            "category": "Outros",
            "date": "2026-06-20",
        })

    assert resp.status_code == 404
    assert resp.json()["detail"] == "Account not found or does not belong to user"


def test_delete_all_transactions(client):
    mock_supabase = MagicMock()
    mock_supabase.table.return_value.delete.return_value.eq.return_value.execute.return_value.data = [
        {"id": "tx-1"}, {"id": "tx-2"}
    ]

    with patch("app.routes.transactions.supabase", mock_supabase):
        resp = client.delete("/transactions/all")

    assert resp.status_code == 200
    assert resp.json()["deleted"] == 2


def test_delete_transaction_success(client):
    mock_supabase = MagicMock()
    mock_supabase.table.return_value.delete.return_value.eq.return_value.eq.return_value.execute.return_value.data = [
        {"id": "550e8400-e29b-41d4-a716-446655440010"}
    ]

    with patch("app.routes.transactions.supabase", mock_supabase):
        resp = client.delete("/transactions/550e8400-e29b-41d4-a716-446655440010")

    assert resp.status_code == 204


def test_delete_transaction_not_found(client):
    mock_supabase = MagicMock()
    mock_supabase.table.return_value.delete.return_value.eq.return_value.eq.return_value.execute.return_value.data = []

    with patch("app.routes.transactions.supabase", mock_supabase):
        resp = client.delete("/transactions/550e8400-e29b-41d4-a716-446655449999")

    assert resp.status_code == 404


def test_bulk_import_success(client):
    mock_supabase = MagicMock()
    mock_supabase.table.return_value.select.return_value.eq.return_value.limit.return_value.execute.return_value.data = [
        {"id": "550e8400-e29b-41d4-a716-446655440001"}
    ]
    mock_supabase.table.return_value.insert.return_value.execute.return_value.data = [{"id": "new-tx"}]

    with patch("app.routes.transactions.supabase", mock_supabase):
        resp = client.post("/transactions/bulk", json={
            "transactions": [
                {
                    "account_id": "550e8400-e29b-41d4-a716-446655440001",
                    "description": "Bulk 1",
                    "amount": 10.00,
                    "type": "expense",
                    "category": "Outros",
                    "date": "2026-06-01",
                },
                {
                    "account_id": "550e8400-e29b-41d4-a716-446655440001",
                    "description": "Bulk 2",
                    "amount": 20.00,
                    "type": "income",
                    "category": "Salário",
                    "date": "2026-06-02",
                },
            ]
        })

    assert resp.status_code == 200
    assert resp.json()["imported"] == 2
