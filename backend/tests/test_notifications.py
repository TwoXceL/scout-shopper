import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_push_notifications_register():
    response = client.post(
        "/api/notifications/register",
        json={"token": "fcm_test_token_abcdef123456", "platform": "android"},
        headers={"Authorization": "Bearer demo_session_token_alex"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "android" in data["message"]
    assert "fcm_test_tok" in data["device_token"]

def test_push_notifications_test_price_drop():
    response = client.post(
        "/api/notifications/test",
        json={
            "type": "price_drop",
            "item_title": "Sony WH-1000XM5 Noise Canceling Headphones",
            "savings": 80.0,
            "store": "Best Buy"
        },
        headers={"Authorization": "Bearer demo_session_token_alex"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["dispatched"] is True
    assert "Sony WH-1000XM5" in data["notification"]["body"]
    assert "$80.00" in data["notification"]["body"]
    assert data["notification"]["data"]["type"] == "price_drop"

def test_push_notifications_test_refund_match():
    response = client.post(
        "/api/notifications/test",
        json={
            "type": "refund_match",
            "item_title": "Dewalt 20V Max Cordless Drill",
            "savings": 44.5,
            "store": "Home Depot"
        },
        headers={"Authorization": "Bearer demo_session_token_alex"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["dispatched"] is True
    assert "Home Depot" in data["notification"]["body"]
    assert "$44.50" in data["notification"]["body"]
    assert data["notification"]["data"]["type"] == "refund_claim"
