import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_health():
    assert client.get("/api/health").json()["status"] == "ok"


def test_scan_unknown_upc_404():
    assert client.get("/api/scan/000").status_code == 404


def test_scan_sorts_by_total_cost_and_savings():
    d = client.get("/api/scan/885609027814").json()
    totals = [o["total_cost"] for o in d["all_offers"]]
    assert totals == sorted(totals)
    assert d["lowest_online_offer"]["retailer"] == "Amazon"
    assert d["lowest_online_offer"]["total_cost"] == 541.24


def test_best_buy_matches_amazon_direct():
    d = client.get("/api/scan/885609027814").json()
    assert d["cashier_shield"]["eligible"] is True
    assert "Amazon" in d["cashier_shield"]["cashier_script"]


def test_walmart_rejects_amazon():
    d = client.get("/api/scan/611247385203").json()
    assert d["cashier_shield"]["eligible"] is False
    assert d["cashier_shield"]["status"] == "POLICY_EXCLUSION"


def test_shop_small_present():
    d = client.get("/api/scan/027242919419").json()
    assert d["shop_small_alternatives"][0]["platform"] == "Etsy Artisan"


def test_cart_flow():
    client.delete("/api/cart/clear")
    item = {"id": "a", "title": "t", "retailer": "r", "price": 10.0, "shipping": 1.0, "tax": 0.5,
            "total": 11.5, "image_url": "x", "affiliate_url": "y"}
    client.post("/api/cart/add", json=item)
    c = client.get("/api/cart").json()
    assert c["item_count"] == 1 and c["grand_total"] == 11.5
    client.delete("/api/cart/remove/a")
    assert client.get("/api/cart").json()["item_count"] == 0


def test_telemetry_logged():
    client.get("/api/scan/041908001015?share_telemetry=true")
    assert client.get("/api/telemetry").json()["total_scans"] >= 1

