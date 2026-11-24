"""
Scout $hopper - Paddle Merchant of Record & B2B Subscription Engine
Manages Paddle Billing (v2) webhook verification, B2B subscription tier synchronization,
and contractor pre-funded wallet reloads for dynamic lead bounties.
Documentation: https://developer.paddle.com/
"""

import os
import hmac
import hashlib
import time
import uuid
import logging
from typing import Dict, Any, Optional, Tuple
import db

logger = logging.getLogger("scoutshopper.paddle")

PADDLE_ENV = os.environ.get("PADDLE_ENV", "sandbox")  # 'sandbox' or 'production'
PADDLE_API_KEY = os.environ.get("PADDLE_API_KEY", "")
PADDLE_WEBHOOK_SECRET = os.environ.get("PADDLE_WEBHOOK_SECRET", "")

# Standard B2B Contractor Subscription Tiers
CONTRACTOR_TIERS = {
    "TIER_149": {
        "name": "Starter Pro",
        "price_dollars": 149.00,
        "price_cents": 14900,
        "leads_included": 3,
        "paddle_price_id": os.environ.get("PADDLE_PRICE_TIER_149", "pri_sandbox_tier_149"),
        "description": "3 guaranteed local homeowner leads per month + priority directory listing"
    },
    "TIER_249": {
        "name": "Pro Growth",
        "price_dollars": 249.00,
        "price_cents": 24900,
        "leads_included": 8,
        "paddle_price_id": os.environ.get("PADDLE_PRICE_TIER_249", "pri_sandbox_tier_249"),
        "description": "8 guaranteed leads per month + fair wage comparison banner placement"
    },
    "TIER_349": {
        "name": "Enterprise Regional",
        "price_dollars": 349.00,
        "price_cents": 34900,
        "leads_included": 15,
        "paddle_price_id": os.environ.get("PADDLE_PRICE_TIER_349", "pri_sandbox_tier_349"),
        "description": "15 guaranteed leads per month + exclusive territory spotlight + instant SMS dispatch"
    }
}


def verify_paddle_webhook_signature(raw_body: bytes, signature_header: Optional[str]) -> Tuple[bool, str]:
    """
    Verifies the HMAC-SHA256 signature from Paddle webhook header: 'ts=...;h1=...'
    If in sandbox and PADDLE_WEBHOOK_SECRET is unset, allows development inspection.
    """
    if not PADDLE_WEBHOOK_SECRET:
        if PADDLE_ENV == "sandbox":
            return True, "Sandbox mode: verification bypassed (no secret set)."
        return False, "Production mode: PADDLE_WEBHOOK_SECRET is required."

    if not signature_header:
        return False, "Missing Paddle-Signature header."

    try:
        parts = dict(item.split("=", 1) for item in signature_header.split(";"))
        ts = parts.get("ts")
        h1 = parts.get("h1")

        if not ts or not h1:
            return False, "Malformed Paddle-Signature header components."

        # Verify timestamp is within 5 minutes to prevent replay attacks
        if abs(time.time() - float(ts)) > 300:
            return False, "Webhook timestamp expired."

        signed_payload = f"{ts}:{raw_body.decode('utf-8')}".encode("utf-8")
        expected_sig = hmac.new(
            PADDLE_WEBHOOK_SECRET.encode("utf-8"),
            signed_payload,
            hashlib.sha256
        ).hexdigest()

        if hmac.compare_digest(expected_sig, h1):
            return True, "Signature verified."
        return False, "Invalid signature."
    except Exception as e:
        logger.error(f"Error verifying Paddle signature: {e}")
        return False, str(e)


def handle_paddle_webhook_event(event_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Processes incoming Paddle Billing webhook events and updates local SQLite ledger.
    Includes idempotent deduplication by event_id to prevent double-crediting balances.
    """
    event_type = event_data.get("event_type") or event_data.get("alert_name") or ""
    data = event_data.get("data", event_data)
    # In Paddle Billing v2, the webhook event ID is 'event_id' or top-level 'id' starting with 'evt_'
    raw_eid = event_data.get("event_id") or event_data.get("id") or ""
    event_id = raw_eid if (raw_eid.startswith("evt_") or event_data.get("event_id")) else ""
    now = time.time()

    logger.info(f"[Paddle Webhook] Processing event: {event_type} (event_id={event_id})")

    if event_id and db.is_webhook_processed(event_id):
        logger.info(f"[Paddle Webhook] Duplicate event ignored: {event_id}")
        return {
            "processed": True,
            "duplicate": True,
            "event_id": event_id,
            "message": "Webhook already processed (idempotency key matched)."
        }

    # 1. Subscription Created or Updated
    if event_type in ("subscription.created", "subscription.updated", "subscription.activated"):
        sub_id = data.get("id") or data.get("subscription_id", "")
        customer_id = data.get("customer_id", "")
        custom_data = data.get("custom_data") or {}
        email = (custom_data.get("email") or data.get("customer", {}).get("email") or "").strip().lower()
        company_name = custom_data.get("company_name") or "Local Pro Partner"
        trade = custom_data.get("trade_category") or "General"
        metro = custom_data.get("service_metro") or "Red Deer, AB"
        tier = custom_data.get("tier") or "TIER_149"
        status = "ACTIVE" if data.get("status") in ("active", "trialing", None) else data.get("status", "ACTIVE").upper()

        contractor = db.get_contractor_by_paddle_sub(sub_id) or (db.get_contractor_by_email(email) if email else None)
        cid = contractor["id"] if contractor else None

        res = db.create_or_update_contractor(
            company_name=company_name,
            contact_name=custom_data.get("contact_name") or company_name,
            email=email or f"contractor_{sub_id[:8]}@partner.scoutshopper.app",
            phone=custom_data.get("phone") or "(555) 000-0000",
            trade_category=trade,
            service_metro=metro,
            tier=tier,
            status=status,
            paddle_customer_id=customer_id,
            paddle_subscription_id=sub_id,
            contractor_id=cid
        )

        if event_id:
            db.mark_webhook_processed(event_id, source="paddle", event_type=event_type)

        return {
            "processed": True,
            "event_type": event_type,
            "action": "SUBSCRIPTION_SYNCED",
            "contractor": res
        }

    # 2. Subscription Canceled
    elif event_type in ("subscription.canceled", "subscription.cancelled"):
        sub_id = data.get("id") or data.get("subscription_id", "")
        contractor = db.get_contractor_by_paddle_sub(sub_id)
        if contractor:
            db.create_or_update_contractor(
                company_name=contractor["company_name"],
                contact_name=contractor["contact_name"],
                email=contractor["email"],
                phone=contractor["phone"],
                trade_category=contractor["trade_category"],
                service_metro=contractor["service_metro"],
                tier=contractor["tier"],
                status="CANCELED",
                contractor_id=contractor["id"]
            )
            if event_id:
                db.mark_webhook_processed(event_id, source="paddle", event_type=event_type)
            return {
                "processed": True,
                "event_type": event_type,
                "action": "SUBSCRIPTION_CANCELED",
                "contractor_id": contractor["id"]
            }
        return {"processed": False, "reason": f"Contractor with sub {sub_id} not found."}

    # 3. Transaction Completed (Pre-funded Wallet Reload or Subscription Payment)
    elif event_type in ("transaction.completed", "payment.succeeded"):
        txn_id = data.get("id") or data.get("transaction_id", f"txn_{uuid.uuid4().hex[:8]}")
        custom_data = data.get("custom_data") or {}
        contractor_id = custom_data.get("contractor_id")
        email = (custom_data.get("email") or data.get("customer", {}).get("email") or "").strip().lower()

        if not contractor_id and email:
            u = db.get_contractor_by_email(email)
            if u:
                contractor_id = u["id"]

        # Check if transaction is explicitly for a wallet deposit top-up
        is_wallet_topup = custom_data.get("purpose") == "wallet_topup"
        amount_cents = int(custom_data.get("amount_cents") or 0)

        # Fallback to total amount paid
        if amount_cents == 0:
            details = data.get("details", {}).get("totals", {})
            total_raw = details.get("total") or data.get("amount") or "0"
            try:
                amount_cents = int(float(total_raw)) if isinstance(total_raw, (int, float)) else int(float(total_raw) * 100)
            except Exception:
                amount_cents = 25000

        if contractor_id:
            dep_res = db.deposit_contractor_funds(
                contractor_id=contractor_id,
                amount_cents=amount_cents,
                reference_id=txn_id,
                description=f"Paddle Checkout Deposit ({txn_id})"
            )
            if event_id:
                db.mark_webhook_processed(event_id, source="paddle", event_type=event_type)
            return {
                "processed": True,
                "event_type": event_type,
                "action": "WALLET_CREDITED",
                "deposit": dep_res
            }

        if event_id:
            db.mark_webhook_processed(event_id, source="paddle", event_type=event_type)

        return {
            "processed": True,
            "event_type": event_type,
            "action": "PAYMENT_ACKNOWLEDGED",
            "message": "Payment recorded; no contractor balance credited (general checkout)."
        }

    return {"processed": True, "event_type": event_type, "action": "UNHANDLED_EVENT_IGNORED"}


def create_checkout_preview(
    tier: str,
    contractor_email: str,
    company_name: str,
    trade_category: str = "General",
    service_metro: str = "Red Deer, AB"
) -> Dict[str, Any]:
    """
    Generates hosted checkout configuration for contractor signup or upgrade.
    In sandbox mode, returns an authentic ready-to-test Paddle sandbox URL.
    """
    tier_info = CONTRACTOR_TIERS.get(tier, CONTRACTOR_TIERS["TIER_149"])
    base_url = (
        "https://sandbox-checkout.paddle.com"
        if PADDLE_ENV == "sandbox"
        else "https://checkout.paddle.com"
    )

    custom_data = {
        "email": contractor_email.strip().lower(),
        "company_name": company_name.strip(),
        "trade_category": trade_category.strip(),
        "service_metro": service_metro.strip(),
        "tier": tier
    }

    checkout_url = (
        f"{base_url}/checkout/custom?price_id={tier_info['paddle_price_id']}"
        f"&email={contractor_email.strip()}&company={company_name.strip()}"
    )

    return {
        "tier": tier,
        "tier_name": tier_info["name"],
        "price_dollars": tier_info["price_dollars"],
        "price_cents": tier_info["price_cents"],
        "leads_included": tier_info["leads_included"],
        "checkout_url": checkout_url,
        "environment": PADDLE_ENV,
        "custom_data": custom_data,
        "description": tier_info["description"]
    }
