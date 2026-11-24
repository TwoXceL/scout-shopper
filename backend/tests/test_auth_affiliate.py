"""
Test suite for User Authentication, Affiliate Referral Tracking, and Personalized Recommendations.
"""

import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from fastapi.testclient import TestClient
from main import app
from user_store import USER_STORE
import db

client = TestClient(app)


def test_auth_login_new_user():
    res = client.post("/api/auth/login", json={"email": "newuser@test.com", "name": "Test User"})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    user = data["user"]
    assert user["email"] == "newuser@test.com"
    assert user["name"] == "Test User"
    assert user["referral_code"].startswith("SCOUT-")
    assert user["earnings_balance"] == 5.00  # Welcome bonus


def test_referral_attribution_and_bounty():
    # User 1 registers
    r1 = client.post("/api/auth/login", json={"email": "referrer@test.com", "name": "Referrer User"})
    user1 = r1.json()["user"]
    code1 = user1["referral_code"]
    initial_balance = user1["earnings_balance"]

    # User 2 registers using User 1's code
    r2 = client.post("/api/auth/login", json={
        "email": "friend@test.com",
        "name": "Friend User",
        "referred_by": code1
    })
    assert r2.status_code == 200
    user2 = r2.json()["user"]
    assert user2["referred_by"] == user1["id"]

    # Verify Referrer received a $5.00 referral bounty
    stats_res = client.get(f"/api/affiliate/stats?user_id={user1['id']}")
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert stats["referral_count"] == 1
    assert stats["earnings_balance"] == initial_balance + 5.00
    assert len(stats["referrals"]) >= 1


def test_affiliate_payout_claim():
    # Demo user has $35.00 balance
    res = client.post("/api/affiliate/claim", json={
        "user_id": "usr_demo",
        "payout_method": "paypal",
        "destination": "alex@scoutshopper.com"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["new_balance"] == 0.00


def test_personalized_recommendations():
    # 1. Unpersonalized (no user)
    res = client.get("/api/recommendations?region=US&limit=3")
    assert res.status_code == 200
    data = res.json()
    assert len(data["deals"]) <= 3
    assert len(data["shop_small"]) <= 3

    # 2. Record category interaction for a user
    user_id = "usr_demo"
    client.post("/api/interactions", json={
        "user_id": user_id,
        "category": "Consumer Electronics"
    })

    # 3. Personalized call
    res2 = client.get(f"/api/recommendations?user_id={user_id}&region=US&limit=3")
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["is_personalized"] is True
    assert "Consumer Electronics" in data2["preferred_categories"]


def test_telemetry_optin_and_scan_bounties():
    # Test new user registering
    reg = client.post("/api/auth/login", json={"email": "scanner@test.com", "name": "Scan Pro"})
    uid = reg.json()["user"]["id"]
    base_bal = reg.json()["user"]["earnings_balance"]

    # 1. Opt-in bonus
    optin = client.post(f"/api/affiliate/bonus/telemetry-optin?user_id={uid}").json()
    assert optin["success"] is True
    assert optin["bonus"] == 5.00
    assert optin["balance"] == base_bal + 5.00

    # 2. Scanning in-store with telemetry enabled awards $5.00 per scan
    scan_res = client.get(f"/api/scan/885609027814?region=US&province=OR&share_telemetry=true").json()
    assert scan_res["scan_bounty_awarded"] is True
    assert scan_res["tax_rate"] == 0.0  # Oregon has 0% sales tax!

    # 3. Verify user stats show increased balance
    stats = client.get(f"/api/affiliate/stats?user_id=usr_demo").json()
    assert stats["earnings_balance"] >= 5.00


def test_tremendous_universal_payout():
    # 1. Ensure user has at least $10
    with db.get_db() as conn:
        conn.execute("UPDATE users SET earnings_balance = 35.00 WHERE id = 'usr_demo'")
        conn.commit()

    stats = client.get("/api/affiliate/stats?user_id=usr_demo").json()
    bal = stats["earnings_balance"]
    assert bal == 35.00

    # 2. Claim payout via Tremendous universal API
    payout_resp = client.post("/api/affiliate/claim", json={
        "user_id": "usr_demo",
        "payout_method": "tremendous",
        "destination": "alex@scoutshopper.com",
        "recipient_name": "Alex Carter"
    })
    assert payout_resp.status_code == 200
    pdata = payout_resp.json()
    assert pdata["success"] is True
    assert pdata["provider"] == "Tremendous API"
    assert "redemption_link" in pdata
    assert pdata["redemption_link"].startswith("https://testflight.tremendous.com/rewards/payout/")
    assert pdata["new_balance"] == 0.00
    assert len(pdata["available_methods"]) >= 4

    # 3. Verify subsequent stats show zero balance and recent payout record
    stats_after = client.get("/api/affiliate/stats?user_id=usr_demo").json()
    assert stats_after["earnings_balance"] == 0.00
    assert len(stats_after["recent_payouts"]) >= 1
    recent = stats_after["recent_payouts"][0]
    assert recent["method"] == "tremendous"
    assert recent["status"] == "DELIVERED"
    assert recent["redemption_link"].startswith("https://testflight.tremendous.com/")


def test_marketing_lead_capture_and_profile_updates():
    # 1. Register with complete marketing profile (first, last, email, phone, city, birthday)
    reg_payload = {
        "email": "sarah.connor@example.com",
        "password": "Password123!",
        "first_name": "Sarah",
        "last_name": "Connor",
        "phone": "+1-403-555-0199",
        "city": "Red Deer",
        "birthday_month": 10,
        "birthday_day": 26,
        "sms_optin": True,
        "interests": ["Tools & Hardware", "Automotive"]
    }
    res = client.post("/api/auth/register", json=reg_payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    u = data["user"]
    assert u["email"] == "sarah.connor@example.com"
    assert u["first_name"] == "Sarah"
    assert u["last_name"] == "Connor"
    assert u["name"] == "Sarah Connor"
    assert u["phone"] == "+1-403-555-0199"
    assert u["city"] == "Red Deer"
    assert u["birthday_month"] == 10
    assert u["birthday_day"] == 26
    assert u["sms_optin"] == 1

    # Verify marketing webhook payload was built
    m_res = data["marketing_dispatch"]
    assert m_res["dispatched"] is True
    assert m_res["payload"]["first_name"] == "Sarah"
    assert m_res["payload"]["marketing_channels"]["sms_marketing"] is True
    assert m_res["payload"]["marketing_channels"]["email_marketing"] is True

    # 2. Update profile (e.g. changing phone and city)
    token = data["token"]
    update_res = client.post(
        "/api/auth/profile",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "phone": "+1-403-555-9988",
            "city": "Calgary",
            "first_name": "Sarah-Jane"
        }
    )
    assert update_res.status_code == 200
    updated_user = update_res.json()["user"]
    assert updated_user["phone"] == "+1-403-555-9988"
    assert updated_user["city"] == "Calgary"
    assert updated_user["first_name"] == "Sarah-Jane"
    assert updated_user["name"] == "Sarah-Jane Connor"

    # 3. Test SMS dispatcher endpoint
    sms_test = client.post("/api/marketing/test-sms", json={
        "phone": "+1-403-555-9988",
        "message": "Scout $hopper: Happy Birthday! A $5 coffee gift is waiting."
    })
    assert sms_test.status_code == 200
    assert sms_test.json()["dispatched"] is True


def test_ai_crm_savings_and_outreach():
    # 1. Check Alex Carter's seeded lifetime savings
    res_sav = client.get("/api/crm/savings?token=demo_session_token_alex")
    assert res_sav.status_code == 200
    sdata = res_sav.json()
    assert sdata["total_saved"] >= 142.50
    assert sdata["purchases_count"] >= 3
    assert len(sdata["stores_breakdown"]) >= 2
    assert "milestone_level" in sdata

    # 2. Record a newly tracked purchase
    res_purch = client.post(
        "/api/crm/purchases",
        headers={"Authorization": "Bearer demo_session_token_alex"},
        json={
            "item_title": "Milwaukee M18 Fuel Sawzall Reciprocating Saw",
            "store": "Home Depot",
            "price_paid": 169.00,
            "shelf_price": 199.00,
            "category": "Tools & Hardware",
            "savings_type": "PRICE_MATCH"
        }
    )
    assert res_purch.status_code == 200
    pdata = res_purch.json()
    assert pdata["purchase"]["amount_saved"] == 30.00
    assert pdata["lifetime_savings"]["total_saved"] >= 172.50

    # 3. Retrieve autonomous AI Customer Dossier
    res_dossier = client.get("/api/crm/dossier?token=demo_session_token_alex")
    assert res_dossier.status_code == 200
    dossier = res_dossier.json()
    assert dossier["user_id"] == "usr_demo"
    assert "ai_tags" in dossier
    assert "recommended_action" in dossier
    assert "ai_summary" in dossier

    # 4. Generate AI Outreach Message (Birthday & Milestone)
    res_outreach_bday = client.post("/api/crm/outreach", json={
        "user_id": "usr_demo",
        "trigger": "DISPATCH_BIRTHDAY_REWARD"
    })
    assert res_outreach_bday.status_code == 200
    bday_copy = res_outreach_bday.json()
    assert "Happy Birthday" in bday_copy["copy"]["subject"]
    assert "Adonis Apps" in bday_copy["copy"]["sms_text"]
    assert str(round(dossier["savings"]["total_saved"], 2)) in bday_copy["copy"]["sms_text"] or "$172.50" in bday_copy["copy"]["sms_text"] or "$142.50" in bday_copy["copy"]["sms_text"]

    res_outreach_ms = client.post("/api/crm/outreach", json={
        "user_id": "usr_demo",
        "trigger": "CELEBRATE_100_SAVINGS_MILESTONE"
    })
    assert res_outreach_ms.status_code == 200
    ms_copy = res_outreach_ms.json()
    assert "Milestone" in ms_copy["copy"]["subject"]
