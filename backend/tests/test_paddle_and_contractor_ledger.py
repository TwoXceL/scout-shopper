"""
Test suite for Paddle Merchant of Record & B2B Contractor Pre-funded Ledger.
Verifies atomic double-entry deductions, webhook synchronization, and tier management.
"""

import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from fastapi.testclient import TestClient
from main import app
import db

client = TestClient(app)


def test_contractor_tiers_endpoint():
    res = client.get("/api/contractors/tiers")
    assert res.status_code == 200
    tiers = res.json()["tiers"]
    assert "TIER_149" in tiers
    assert "TIER_249" in tiers
    assert "TIER_349" in tiers
    assert tiers["TIER_149"]["price_dollars"] == 149.00
    assert tiers["TIER_249"]["price_dollars"] == 249.00
    assert tiers["TIER_349"]["price_dollars"] == 349.00


def test_seeded_contractor_me_and_ledger():
    res = client.get("/api/contractors/me?contractor_id=cont_apex_red_deer")
    assert res.status_code == 200
    data = res.json()
    assert data["contractor"]["company_name"] == "Apex Plumbing & Heating Ltd."
    assert data["contractor"]["service_metro"] == "Red Deer, AB"
    assert data["contractor"]["tier"] == "TIER_249"
    assert data["balance_dollars"] >= 350.00

    # Verify ledger history
    ledg_res = client.get("/api/contractors/ledger?contractor_id=cont_apex_red_deer")
    assert ledg_res.status_code == 200
    ldata = ledg_res.json()
    assert len(ldata["ledger"]) >= 4
    # Top entries should contain initial deposit and monthly subscription fee
    entries = ldata["ledger"]
    types = [e["entry_type"] for e in entries]
    assert "DEPOSIT" in types
    assert "SUBSCRIPTION_FEE" in types
    assert "LEAD_DEDUCTION" in types


def test_atomic_deposit_and_lead_deductions():
    # 1. Create a new test contractor
    c = db.create_or_update_contractor(
        company_name="Mountain View Electric",
        contact_name="Sarah Connor",
        email="sarah@mvelectric.com",
        phone="(403) 555-9000",
        trade_category="Electrical",
        service_metro="Calgary, AB",
        tier="TIER_149",
        prefunded_deposit_cents=10000  # $100.00
    )
    cid = c["id"]
    assert c["prefunded_balance_cents"] == 10000

    # 2. Deposit an extra $150.00 via API
    dep_res = client.post("/api/contractors/deposit", json={
        "contractor_id": cid,
        "amount_dollars": 150.00,
        "description": "Wise Business Wire Settlement"
    })
    assert dep_res.status_code == 200
    assert dep_res.json()["new_balance_dollars"] == 250.00

    # 3. Deduct a dynamic lead fee of $35.00
    ded_res = client.post("/api/contractors/deduct-lead", json={
        "contractor_id": cid,
        "amount_dollars": 35.00,
        "lead_id": "lead_subpanel_upgrade_cg",
        "description": "200A Electrical Subpanel Upgrade Lead"
    })
    assert ded_res.status_code == 200
    assert ded_res.json()["new_balance_dollars"] == 215.00
    assert ded_res.json()["new_balance_cents"] == 21500

    # 4. Verify insufficient balance raises error and prevents negative balance
    insuf_res = client.post("/api/contractors/deduct-lead", json={
        "contractor_id": cid,
        "amount_dollars": 300.00,
        "lead_id": "lead_overdraft_test"
    })
    assert insuf_res.status_code == 400
    assert "Insufficient contractor wallet balance" in insuf_res.json()["detail"]

    # Verify balance remains unchanged at $215.00
    c_after = db.get_contractor(cid)
    assert c_after["prefunded_balance_cents"] == 21500


def test_paddle_webhook_subscription_lifecycle():
    # 1. Subscription created event
    sub_payload = {
        "event_type": "subscription.created",
        "data": {
            "id": "sub_test_paddle_991",
            "customer_id": "ctm_test_991",
            "status": "active",
            "custom_data": {
                "email": "bill@prairiehvac.com",
                "company_name": "Prairie Peak HVAC Systems",
                "contact_name": "Bill Wilson",
                "phone": "(403) 555-4321",
                "trade_category": "HVAC",
                "service_metro": "Red Deer, AB",
                "tier": "TIER_349"
            }
        }
    }
    sub_res = client.post("/api/webhooks/paddle", json=sub_payload)
    assert sub_res.status_code == 200
    res_data = sub_res.json()
    assert res_data["status"] == "success"
    c_created = res_data["result"]["contractor"]
    assert c_created["company_name"] == "Prairie Peak HVAC Systems"
    assert c_created["tier"] == "TIER_349"
    assert c_created["paddle_subscription_id"] == "sub_test_paddle_991"

    # 2. Wallet Topup transaction.completed event
    txn_payload = {
        "event_type": "transaction.completed",
        "data": {
            "id": "txn_test_topup_500",
            "custom_data": {
                "contractor_id": c_created["id"],
                "purpose": "wallet_topup",
                "amount_cents": 50000  # $500.00
            }
        }
    }
    txn_res = client.post("/api/webhooks/paddle", json=txn_payload)
    assert txn_res.status_code == 200
    t_result = txn_res.json()["result"]
    assert t_result["action"] == "WALLET_CREDITED"
    assert t_result["deposit"]["new_balance_dollars"] == 500.00

    # 3. Subscription canceled event
    cancel_payload = {
        "event_type": "subscription.canceled",
        "data": {
            "id": "sub_test_paddle_991"
        }
    }
    cancel_res = client.post("/api/webhooks/paddle", json=cancel_payload)
    assert cancel_res.status_code == 200
    assert cancel_res.json()["result"]["action"] == "SUBSCRIPTION_CANCELED"

    c_final = db.get_contractor(c_created["id"])
    assert c_final["status"] == "CANCELED"
    # Wallet balance must remain preserved even after subscription cancellation
    assert c_final["prefunded_balance_cents"] == 50000


def test_webhook_idempotency_duplicate_prevention():
    event_id = "evt_idemp_test_999888"
    payload = {
        "event_id": event_id,
        "event_type": "transaction.completed",
        "data": {
            "id": "txn_idemp_001",
            "custom_data": {
                "contractor_id": "cont_apex_red_deer",
                "purpose": "wallet_topup",
                "amount_cents": 5000
            }
        }
    }

    # First delivery: should process and credit $50
    bal_before = db.get_contractor("cont_apex_red_deer")["prefunded_balance_cents"]
    res1 = client.post("/api/webhooks/paddle", json=payload)
    assert res1.status_code == 200
    assert res1.json()["result"]["action"] == "WALLET_CREDITED"

    bal_after = db.get_contractor("cont_apex_red_deer")["prefunded_balance_cents"]
    assert bal_after == bal_before + 5000

    # Second delivery: should detect duplicate and NOT credit again
    res2 = client.post("/api/webhooks/paddle", json=payload)
    assert res2.status_code == 200
    assert res2.json()["result"]["duplicate"] is True
    assert "already processed" in res2.json()["result"]["message"]

    bal_duplicate = db.get_contractor("cont_apex_red_deer")["prefunded_balance_cents"]
    assert bal_duplicate == bal_after


def test_contractor_checkout_preview():
    res = client.post("/api/contractors/checkout", json={
        "tier": "TIER_249",
        "email": "dave@apexplumbing.com",
        "company_name": "Apex Plumbing",
        "trade_category": "Plumbing",
        "service_metro": "Red Deer, AB"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["price_dollars"] == 249.00
    assert "checkout_url" in data
    assert "price_id" in data["checkout_url"]


def test_landing_and_compliance_pages():
    # 1. Test landing page
    res_landing = client.get("/landing")
    assert res_landing.status_code == 200
    assert "text/html" in res_landing.headers["content-type"]
    assert "Scout $hopper" in res_landing.text
    assert "Paddle.com Market Ltd" in res_landing.text
    assert "Adonis Apps &amp; Studios Inc." in res_landing.text
    assert "Starter Pro" in res_landing.text
    assert "Pro Growth" in res_landing.text
    assert "Enterprise Regional" in res_landing.text

    # 2. Test dedicated Terms of Service route
    res_terms = client.get("/terms")
    assert res_terms.status_code == 200
    assert "Terms of Service" in res_terms.text
    assert "Adonis Apps &amp; Studios Inc." in res_terms.text
    assert "Paddle.com Market Ltd" in res_terms.text
    assert "Red Deer, Alberta, Canada" in res_terms.text
    assert "Spectre Hold Inc." in res_terms.text

    res_terms_alias = client.get("/terms-of-service")
    assert res_terms_alias.status_code == 200

    # 3. Test dedicated Privacy Policy route
    res_privacy = client.get("/privacy")
    assert res_privacy.status_code == 200
    assert "Privacy Policy" in res_privacy.text
    assert "PIPEDA" in res_privacy.text
    assert "Alberta’s Personal Information Protection Act" in res_privacy.text or "PIPA" in res_privacy.text
    assert "privacy@scoutshopper.app" in res_privacy.text

    res_privacy_alias = client.get("/privacy-policy")
    assert res_privacy_alias.status_code == 200

    # 4. Test dedicated Refund & Cancellation Policy route
    res_refund = client.get("/refund")
    assert res_refund.status_code == 200
    assert "Refund &amp; Cancellation Policy" in res_refund.text or "Refund" in res_refund.text
    assert "Paddle.com Market Ltd" in res_refund.text
    assert "14 days" in res_refund.text
    assert "help@paddle.com" in res_refund.text

    res_refund_alias = client.get("/refund-policy")
    assert res_refund_alias.status_code == 200
