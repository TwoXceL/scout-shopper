import os, sys, time
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_receipt_logging_and_return_window():
    # 1. Log a Best Buy purchase
    payload = {
        "store": "Best Buy",
        "item_title": "Dyson V11 Stick Vacuum",
        "item_upc": "885609027814",
        "price_paid": 699.99,
        "purchase_date": time.time(),
        "receipt_number": "BBY-12345-TEST",
        "card_type": "Chase Sapphire Reserve"
    }
    res = client.post("/api/receipts/log", json=payload)
    assert res.status_code == 200
    rcpt = res.json()["receipt"]
    assert rcpt["store"] == "Best Buy"
    assert rcpt["return_window_days"] == 14
    assert rcpt["price_paid"] == 699.99
    assert rcpt["price_dropped"] is False
    assert rcpt["refund_amount"] == 0.0

    # 2. Verify in list
    list_res = client.get("/api/receipts")
    assert list_res.status_code == 200
    data = list_res.json()
    assert data["count"] >= 1
    found = next((r for r in data["receipts"] if r["receipt_number"] == "BBY-12345-TEST"), None)
    assert found is not None
    assert found["days_remaining"] <= 14


def test_receipt_price_drop_simulation_and_alert():
    # Log a Target purchase
    payload = {
        "id": "rcpt_target_drop_test",
        "store": "Target",
        "item_title": "Keurig K-Supreme Coffee Maker",
        "item_upc": "611247385913",
        "price_paid": 189.99,
        "purchase_date": time.time(),
        "receipt_number": "TGT-998877"
    }
    res = client.post("/api/receipts/log", json=payload)
    assert res.status_code == 200

    # Simulate price drop
    drop_res = client.post("/api/receipts/simulate-drop/rcpt_target_drop_test")
    assert drop_res.status_code == 200
    data = drop_res.json()["receipt"]
    assert data["price_dropped"] is True
    assert data["current_market_price"] < 189.99
    assert data["refund_amount"] > 0
    assert data["status"] == "REFUND_READY"

    # Verify list aggregates show drop count and total refund available
    summary = client.get("/api/receipts").json()
    assert summary["dropped_count"] >= 1
    assert summary["total_refund_available"] >= data["refund_amount"]


def test_price_adjustment_claim_script_generation():
    # Request claim script for dropped item
    claim_res = client.get("/api/receipts/rcpt_target_drop_test/claim-script")
    assert claim_res.status_code == 200
    claim = claim_res.json()
    assert claim["store"] == "Target"
    assert claim["refund_amount"] > 0
    assert "TGT-998877" in claim["claim_script"]
    assert "price adjustment refund" in claim["claim_script"].lower()
    assert "target.com" in claim["policy_url"]
    assert "card_benefit_guidance" in claim


def test_receipt_deletion():
    del_res = client.delete("/api/receipts/rcpt_target_drop_test")
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True

    # Verify removed
    summary = client.get("/api/receipts").json()
    assert not any(r["id"] == "rcpt_target_drop_test" for r in summary["receipts"])
