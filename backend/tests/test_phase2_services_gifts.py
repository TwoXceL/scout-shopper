"""
Test suite for Phase 2: Local Services Quote Arbitrage and Seasonal Gift Finder.
"""

import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_local_services_directory():
    res = client.get("/api/services")
    assert res.status_code == 200
    data = res.json()
    assert "sectors" in data and len(data["sectors"]) >= 6
    assert "jobs" in data and len(data["jobs"]) >= 10

    # Verify sector structure
    sector_ids = [s["id"] for s in data["sectors"]]
    assert "trades" in sector_ids
    assert "auto" in sector_ids
    assert "health" in sector_ids
    assert "legal" in sector_ids


def test_quote_sanity_checker_fair_quote():
    # Drain clearing fair indie avg is ~$170, max is ~$220
    res = client.post("/api/services/quote-check", json={
        "job_id": "plumb_drain",
        "quote_amount": 165.00
    })
    assert res.status_code == 200
    data = res.json()
    assert data["rating"] == "fair"
    assert data["badge_color"] == "#059669"  # Emerald
    assert "Fair" in data["headline"]
    assert data["potential_savings"] == 0.0


def test_quote_sanity_checker_overpriced_franchise_quote():
    # Drain clearing franchise is $450-$580. User quoted $650
    res = client.post("/api/services/quote-check", json={
        "job_id": "plumb_drain",
        "quote_amount": 650.00
    })
    assert res.status_code == 200
    data = res.json()
    assert data["rating"] == "gouging"
    assert data["badge_color"] == "#DC2626"  # Red
    assert "Overpriced" in data["headline"]
    assert data["potential_savings"] > 400.0
    assert "rip_off_warning" in data
    assert "insider_tip" in data


def test_gift_finder_filtering():
    # Filter for tech enthusiast
    res = client.get("/api/gifts?recipient=tech_enthusiast&on_sale_only=true")
    assert res.status_code == 200
    gifts = res.json()
    assert len(gifts) >= 1
    # Check that all items have savings
    for g in gifts:
        assert g["savings"] > 0
        assert "shop_small_alternative" in g

    # Budget filter under $50
    res_budget = client.get("/api/gifts?budget_max=50&on_sale_only=false")
    assert res_budget.status_code == 200
    budget_gifts = res_budget.json()
    for g in budget_gifts:
        assert g["best_price"] <= 50.0
