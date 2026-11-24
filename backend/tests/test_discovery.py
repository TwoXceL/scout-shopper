import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_stores_flag_verification():
    us = {s["name"]: s for s in client.get("/api/stores?region=US").json()}
    assert us["Target"]["verified"] is True and us["Best Buy"]["verified"] is True
    ca = {s["name"]: s for s in client.get("/api/stores?region=CA").json()}
    assert ca["Best Buy Canada"]["verified"] is True


def test_search_and_category():
    r = client.get("/api/search?region=US&q=sony").json()
    assert len(r) == 1 and r[0]["title"].startswith("Sony")
    assert client.get("/api/search?region=US&q=zzzz").json() == []
    cat = client.get("/api/search?region=US&category=Kitchen%20%26%20Dining").json()
    assert cat and all(c["category"] == "Kitchen & Dining" for c in cat)


def test_deals_sorted_by_savings():
    d = client.get("/api/deals?region=CA").json()
    s = [x["savings"] for x in d["deals"]]
    assert s == sorted(s, reverse=True) and d["shop_small"]


def test_telemetry_requires_consent():
    before = client.get("/api/telemetry").json()["total_scans"]
    client.get("/api/scan/027242919419")  # no opt-in
    assert client.get("/api/telemetry").json()["total_scans"] == before
    client.get("/api/scan/027242919419?share_telemetry=true")
    assert client.get("/api/telemetry").json()["total_scans"] == before + 1


def test_online_mode_skips_cashier_shield():
    d = client.get("/api/scan/027242919419?store=online").json()
    assert d["online_only"] is True and d["cashier_shield"] is None


def test_store_selection_changes_policy():
    d = client.get("/api/scan/027242919419?store=Best%20Buy").json()
    assert d["cashier_shield"]["store_name"] == "Best Buy" and d["cashier_shield"]["eligible"] is True
