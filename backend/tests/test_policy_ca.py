import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from policy_engine import evaluate_cashier_shield

BASE = {"retailer": "Costco.ca", "price": 299.99, "currency": "CAD", "seller_country": "CA",
        "shipped_and_sold_by_retailer": True, "condition": "new", "is_special_sale": False,
        "is_preorder_or_limited": False, "model_number_match": True, "in_stock": True}


def run(**over):
    return evaluate_cashier_shield("Best Buy Canada", "x", "WH1000XM5/B", {**BASE, **over})


def test_valid_match():
    r = run()
    assert r["eligible"] and "CAD" in r["cashier_script"]


def test_rejections():
    cases = {
        "currency": ("USD", "NOT_CAD"), "seller_country": ("US", "NOT_CANADIAN_SELLER"),
        "shipped_and_sold_by_retailer": (False, "MARKETPLACE_SELLER"), "condition": ("open_box", "NOT_NEW"),
        "is_special_sale": (True, "SPECIAL_SALE"), "is_preorder_or_limited": (True, "LIMITED_OFFER"),
        "model_number_match": (False, "MODEL_MISMATCH"), "in_stock": (False, "OUT_OF_STOCK"),
    }
    for field, (val, status) in cases.items():
        r = run(**{field: val})
        assert not r["eligible"] and r["status"] == status, field
