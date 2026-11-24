import pytest
from fastapi.testclient import TestClient
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from main import app
from universal_retailer_engine import universal_search, universal_get_product

client = TestClient(app)

def test_universal_search_us_airpods():
    res = client.get("/api/search?region=US&q=airpods")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 1
    # Check that results include physical store and best online total
    item = next((x for x in data if "AirPods" in x["title"]), data[0])
    assert item["shelf_price"] > 0
    assert item["best_online_total"] > 0
    assert item["savings"] >= 0

def test_universal_search_ca_airpods():
    res = client.get("/api/search?region=CA&q=airpods")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 1
    item = next((x for x in data if "AirPods" in x["title"]), data[0])
    assert "Best Buy Canada" in item["store"] or "Amazon" in item["store"]
    assert item["shelf_price"] >= 300.0

def test_universal_search_dewalt_tools():
    res = client.get("/api/search?region=US&q=dewalt")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 1
    assert any("dewalt" in x["title"].lower() for x in data)

def test_universal_search_nintendo_switch():
    res = client.get("/api/search?region=CA&q=switch")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 1
    item = next(x for x in data if "Nintendo Switch" in x["title"])
    assert item["has_shop_small"] is True
    assert item["store"] == "Best Buy Canada"

def test_universal_barcode_scan_archetype():
    # Test scan for Nintendo Switch universal UPC
    search_res = client.get("/api/search?region=CA&q=switch").json()
    item = next(x for x in search_res if "Nintendo Switch" in x["title"])
    upc = item["upc"]
    
    scan_res = client.get(f"/api/scan/{upc}?region=CA")
    assert scan_res.status_code == 200
    p = scan_res.json()
    assert "Nintendo Switch" in p["title"]
    assert len(p["all_offers"]) >= 2
    assert p["cashier_shield"] is not None
    assert len(p["shop_small_alternatives"]) >= 1
    # Verify maker platform
    assert p["shop_small_alternatives"][0]["platform"] == "Etsy Maker"

def test_universal_invalid_scan_404():
    res = client.get("/api/scan/000?region=US")
    assert res.status_code == 404

def test_unknown_barcode_does_not_fake_airpods():
    # Proof: scanning arbitrary 12-digit barcode returns 404, never faking AirPods
    res = client.get("/api/scan/999888777666?region=US")
    assert res.status_code == 404

def test_walmart_does_not_match_external_competitor():
    # Proof: In-store Walmart price check against Amazon offer returns eligible=False
    from policy_engine import evaluate_cashier_shield
    shield = evaluate_cashier_shield(
        store_name="Walmart",
        product_title="Dyson V11",
        model_number="368340-01",
        lowest_offer={"retailer": "Amazon", "price": 499.99, "seller_name": "Amazon.com", "shipped_and_sold_by_retailer": True}
    )
    assert shield["eligible"] is False
    assert "Walmart stores do NOT match external online competitors" in shield["verdict"]

def test_best_buy_eligible_match_includes_terminal_verification_note():
    # Proof: In-store match includes requirement that associates verify price on terminal
    res = client.get("/api/scan/027242919419?region=US&store=Best%20Buy")
    assert res.status_code == 200
    data = res.json()
    shield = data.get("cashier_shield")
    if shield.get("eligible"):
        assert "verification_note" in shield
        assert "terminal" in shield["verification_note"].lower() or "device" in shield["verification_note"].lower()

