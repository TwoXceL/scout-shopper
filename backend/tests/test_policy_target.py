import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_target_does_not_match_competitors():
    # Sony headphones are shelved at Target in the demo catalog; lowest offer is Amazon.
    d = client.get("/api/scan/027242919419").json()
    cs = d["cashier_shield"]
    assert cs["store_name"] == "Target"
    assert cs["eligible"] is False
    assert cs["status"] == "COMPETITOR_NOT_MATCHED"
    assert cs["policy_link"].startswith("https://www.target.com/help/")
