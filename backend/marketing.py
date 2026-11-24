"""
Scout $hopper - Marketing & Communications Dispatcher
Integrates marketing contact synchronization (Systeme.io, Zapier, Webhooks)
and SMS notification rails for reward announcements, flash drops, and birthday perks.
"""

import os
import json
import logging
import urllib.request
import urllib.error
from typing import Dict, Any, Optional

logger = logging.getLogger("scoutshopper.marketing")

MARKETING_WEBHOOK_URL = os.environ.get("MARKETING_WEBHOOK_URL", os.environ.get("SYSTEME_IO_WEBHOOK_URL", ""))
SMS_WEBHOOK_URL = os.environ.get("SMS_WEBHOOK_URL", os.environ.get("TWILIO_WEBHOOK_URL", ""))


def format_marketing_payload(user_data: Dict[str, Any], event: str = "user_registered") -> Dict[str, Any]:
    """Formats standardized lead payload for CRM and SMS automations."""
    first_name = (user_data.get("first_name") or "").strip()
    last_name = (user_data.get("last_name") or "").strip()
    full_name = (user_data.get("name") or "").strip()
    
    if not first_name and full_name:
        parts = full_name.split(" ", 1)
        first_name = parts[0]
        last_name = parts[1] if len(parts) > 1 else ""

    phone = (user_data.get("phone") or "").strip()
    email = (user_data.get("email") or "").strip().lower()
    city = (user_data.get("city") or "").strip()
    ref_code = user_data.get("referral_code") or ""
    sms_optin = bool(user_data.get("sms_optin", 1))

    return {
        "event": event,
        "user_id": user_data.get("id"),
        "first_name": first_name,
        "last_name": last_name,
        "full_name": f"{first_name} {last_name}".strip() or full_name or email.split("@")[0].capitalize(),
        "email": email,
        "phone": phone,
        "city": city,
        "country": user_data.get("country", "US"),
        "province": user_data.get("province", "CA"),
        "birthday_month": user_data.get("birthday_month"),
        "birthday_day": user_data.get("birthday_day"),
        "sms_optin": sms_optin,
        "referral_code": ref_code,
        "referral_url": f"https://scoutshopper.app/?ref={ref_code}" if ref_code else "",
        "wallet_balance": user_data.get("earnings_balance", 5.00),
        "interests": user_data.get("interests", []),
        "marketing_channels": {
            "email_marketing": bool(email),
            "sms_marketing": bool(phone and sms_optin)
        }
    }


def dispatch_marketing_lead(user_data: Dict[str, Any], event: str = "user_registered") -> Dict[str, Any]:
    """
    Pushes newly captured lead profile to marketing automation (Systeme.io / Webhook).
    Non-blocking / resilient: does not raise exceptions if remote webhook is unavailable.
    """
    payload = format_marketing_payload(user_data, event=event)
    
    if not MARKETING_WEBHOOK_URL:
        logger.info(f"[Marketing] Simulated lead dispatch for {payload['email']} (phone: {payload['phone'] or 'N/A'}, city: {payload['city'] or 'N/A'})")
        return {
            "dispatched": True,
            "mode": "simulated",
            "message": "Lead captured in SQLite; webhook simulated (MARKETING_WEBHOOK_URL not configured).",
            "payload": payload
        }

    try:
        data_bytes = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            MARKETING_WEBHOOK_URL,
            data=data_bytes,
            headers={
                "Content-Type": "application/json",
                "User-Agent": "ScoutShopper-Marketing/1.0"
            },
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=5.0) as resp:
            status = resp.status
            return {
                "dispatched": True,
                "mode": "live",
                "http_status": status,
                "payload": payload
            }
    except Exception as e:
        logger.warning(f"[Marketing] Failed to dispatch lead webhook to {MARKETING_WEBHOOK_URL}: {e}")
        return {
            "dispatched": False,
            "mode": "live",
            "error": str(e),
            "payload": payload
        }


def dispatch_sms_reward_alert(phone: str, message: str) -> Dict[str, Any]:
    """Dispatches transactional/promotional SMS alert to user."""
    clean_phone = phone.strip()
    if not clean_phone:
        return {"dispatched": False, "reason": "No phone number provided"}

    clean_msg = message.strip()
    if not SMS_WEBHOOK_URL:
        logger.info(f"[SMS Gateway] Simulated SMS to {clean_phone}: {clean_msg}")
        return {
            "dispatched": True,
            "mode": "simulated",
            "phone": clean_phone,
            "message": clean_msg
        }

    try:
        payload = {"to": clean_phone, "body": clean_msg, "from": "ScoutShopper"}
        data_bytes = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            SMS_WEBHOOK_URL,
            data=data_bytes,
            headers={
                "Content-Type": "application/json",
                "User-Agent": "ScoutShopper-SMS/1.0"
            },
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=5.0) as resp:
            return {"dispatched": True, "mode": "live", "http_status": resp.status}
    except Exception as e:
        logger.warning(f"[SMS Gateway] Error sending SMS: {e}")
        return {"dispatched": False, "error": str(e)}
