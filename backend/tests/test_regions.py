import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_regions_listed():
    r = client.get("/api/regions").json()
    assert r["US"]["currency"] == "USD" and r["CA"]["currency"] == "CAD"
    assert "ON" in r["CA"]["subdivisions"]


def test_unsupported_region():
    assert client.get("/api/products?region=ZZ").status_code == 400


def test_ca_products_and_currency():
    assert len(client.get("/api/products?region=CA").json()) >= 3
    d = client.get("/api/scan/027242919419?region=CA&province=ON").json()
    assert d["currency"] == "CAD" and d["tax_rate"] == 0.13
    amazon = next(o for o in d["all_offers"] if o["retailer"] == "Amazon.ca")
    assert amazon["estimated_tax"] == round(449.99 * 0.13, 2)


def test_province_changes_tax():
    ab = client.get("/api/scan/027242919419?region=CA&province=AB").json()
    qc = client.get("/api/scan/027242919419?region=CA&province=QC").json()
    assert ab["tax_rate"] == 0.05 and qc["tax_rate"] == 0.14975
    assert ab["lowest_online_offer"]["total_cost"] < qc["lowest_online_offer"]["total_cost"]


def test_ca_skips_marketplace_offer_for_match():
    # Cheapest Dyson offer is a 3rd-party marketplace seller; the match should use Amazon.ca direct.
    d = client.get("/api/scan/885609027814?region=CA").json()
    assert d["lowest_online_offer"]["seller_name"].startswith("TechDeals")
    cs = d["cashier_shield"]
    assert cs["eligible"] and cs["store_name"] == "Best Buy Canada"
    assert cs["matched_price"] == 699.99 and cs["policy_verified"] is True


def test_unverified_store_is_flagged():
    d = client.get("/api/scan/611247385203?region=CA").json()
    cs = d["cashier_shield"]
    assert cs["eligible"] is False and cs["policy_verified"] is True


def test_us_default_unchanged():
    d = client.get("/api/scan/885609027814").json()
    assert d["region"] == "US" and d["currency"] == "USD"
    assert d["lowest_online_offer"]["total_cost"] == 541.24
