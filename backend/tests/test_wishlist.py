import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_wishlist_lifecycle_and_simulation():
    # 1. Add item to wishlist
    item = {
        "id": "wish-dyson-1",
        "upc": "885609027814",
        "title": "Dyson V11 Vacuum",
        "store": "Best Buy",
        "baseline_price": 599.99,
        "current_lowest_price": 499.99,
        "target_price": 450.00,
        "image_url": "https://example.com/dyson.jpg",
        "affiliate_url": "https://example.com/buy"
    }
    res = client.post("/api/wishlist/add", json=item)
    assert res.status_code == 200
    
    # 2. Get wishlist
    w = client.get("/api/wishlist").json()
    assert w["item_count"] >= 1
    assert w["dropped_count"] == 0
    
    # 3. Simulate price drop
    drop_res = client.post("/api/wishlist/simulate-drop/wish-dyson-1")
    assert drop_res.status_code == 200
    dropped = drop_res.json()["item"]
    assert dropped["price_dropped"] is True
    assert dropped["new_lowest_price"] < 499.99
    assert dropped["drop_savings"] > 0
    
    # Check dropped count
    w2 = client.get("/api/wishlist").json()
    assert w2["dropped_count"] >= 1
    
    # 4. Remove item
    del_res = client.delete("/api/wishlist/remove/wish-dyson-1")
    assert del_res.status_code == 200
