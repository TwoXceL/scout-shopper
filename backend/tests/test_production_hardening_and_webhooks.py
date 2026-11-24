"""
Production 10/10 Hardening Tests:
1. SQLite WAL Zero-Lock Concurrency Under Multi-Threaded Load
2. Live Inbound E-Receipt Webhook (Cloudflare Workers & SendGrid MIME)
3. Stripe Ad Flight Checkout Sessions & Automated Contractor Lead Charges
"""

import concurrent.futures
import pytest
from starlette.testclient import TestClient
from main import app
import db
import inbound_email_parser
import stripe_client

client = TestClient(app)


def test_sqlite_wal_zero_lock_concurrency():
    """
    Simulates high-usage concurrent burst:
    Fires 25 concurrent threads writing and reading simultaneously
    to verify that SQLite WAL mode, 30s busy timeout, and connection pooling
    eliminate 'database is locked' errors.
    """
    # Seed 5 load users first to satisfy foreign key referential integrity
    with db.get_db() as conn:
        for u in range(5):
            conn.execute(
                "INSERT OR IGNORE INTO users (id, email, password_hash, salt, name, referral_code, created_at) "
                "VALUES (?, ?, 'hash', 'salt', ?, ?, ?)",
                (f"usr_load_{u}", f"load_{u}@scoutshopper.app", f"Load User {u}", f"REF_LOAD_{u}", 1000.0)
            )
        conn.commit()

    def worker_action(idx: int):
        uid = f"usr_load_{idx % 5}"
        # Write action
        with db.get_db() as conn:
            conn.execute(
                "INSERT OR REPLACE INTO wishlist (id, user_id, upc, target_price, shelf_price, best_price, created_at) "
                "VALUES (?, ?, ?, ?, ?, ?, ?)",
                (f"wish_load_{idx}", uid, f"0123456789{idx:02d}", 99.0 + idx, 120.0, 95.0, 1000.0)
            )
            conn.commit()
        # Read action
        items = db.get_user_wishlist(uid)
        return len(items)

    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        futures = [executor.submit(worker_action, i) for i in range(25)]
        results = [f.result() for f in concurrent.futures.as_completed(futures)]

    assert len(results) == 25
    assert all(r > 0 for r in results)


def test_inbound_email_webhook_cloudflare_format():
    """
    Tests POST /api/webhooks/inbound-email handling a Cloudflare Email Worker receipt payload
    forwarded to receipts+usr_wh_demo@scoutshopper.app.
    """
    with db.get_db() as conn:
        conn.execute(
            "INSERT OR IGNORE INTO users (id, email, password_hash, salt, name, referral_code, created_at) "
            "VALUES ('usr_wh_demo', 'wh_demo@scoutshopper.app', 'hash', 'salt', 'Webhook User', 'REF_WH_1', 1000.0)"
        )
        conn.commit()

    payload = {
        "recipient": "receipts+usr_wh_demo@scoutshopper.app",
        "sender": "order-confirm@homedepot.ca",
        "subject": "Home Depot Order #HD-892101 Confirmed",
        "body_text": "Thank you for shopping at The Home Depot. Order total: $189.00. Item: Dewalt 20V Cordless Hammer Drill Kit. Order # HD-892101."
    }
    res = client.post("/api/webhooks/inbound-email", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "INGESTED"
    assert data["user_id"] == "usr_wh_demo"
    assert data["receipt"]["store"] == "Home Depot"
    assert data["receipt"]["price_paid"] == 189.00
    assert "watchdog_sync" in data


def test_inbound_email_webhook_bestbuy_price_drop():
    """
    Tests an e-receipt from Best Buy for Sony headphones that automatically
    detects a price drop when ingested via webhook.
    """
    payload = {
        "recipient": "receipts+usr_wh_demo@scoutshopper.app",
        "sender": "receipts@bestbuy.com",
        "subject": "Best Buy E-Receipt - Order #BBY-44102",
        "body_text": "Your order is ready. Item: Sony WH-1000XM5 Wireless Noise-Canceling Headphones. Total amount charged: $399.99. Order # BBY-44102."
    }
    res = client.post("/api/webhooks/inbound-email", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["receipt"]["store"] == "Best Buy"
    assert data["receipt"]["price_paid"] == 399.99
    # The watchdog sync automatically processes the price difference against the $328 catalog benchmark
    assert data["watchdog_sync"]["success"] is True


def test_stripe_checkout_session_creation():
    """
    Tests creating a Stripe Checkout session for Option 3 Choice B ad flights:
    - 30 Days: $149
    - 60 Days: $249
    - 90 Days: $349
    """
    # Create an ad campaign first
    camp_payload = {
        "vendor_type": "local_service",
        "vendor_name": "Precision Air Conditioning & Heating",
        "store_url": "https://precisionair.ca",
        "title": "Heat Pump Installation & Repair",
        "category": "HVAC",
        "duration_days": 90,
        "city": "Red Deer, AB"
    }
    camp_res = client.post("/api/ads/campaigns", json=camp_payload)
    assert camp_res.status_code == 200
    camp_id = camp_res.json()["campaign"]["id"]

    # Request Stripe Checkout Session for 90-day flight
    checkout_res = client.post("/api/ads/checkout-session", json={
        "campaign_id": camp_id,
        "flight_tier": "90_days"
    })
    assert checkout_res.status_code == 200
    checkout_data = checkout_res.json()
    assert checkout_data["amount_dollars"] == 349.00
    assert checkout_data["campaign_id"] == camp_id
    assert "checkout_url" in checkout_data


def test_stripe_contractor_lead_charge():
    """
    Tests charging a contractor the $25.00 lead dispatch fee.
    """
    res = client.post("/api/ads/leads/charge", json={
        "campaign_id": "camp_test_hvac",
        "lead_id": "lead_9921",
        "amount_dollars": 25.00
    })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "CHARGED"
    assert data["lead_fee_billed"] == 25.00
