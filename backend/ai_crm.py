"""
Scout $hopper - Autonomous AI CRM & Customer Intelligence Engine
Manages autonomous customer intelligence, lifetime savings tracking,
purchase telemetry, and personalized AI-generated communication (SMS, Email, In-App).
Controlled entirely in-house with zero external CRM subscription dependencies.
"""

import os
import json
import time
import logging
from typing import Dict, Any, Optional, List
import db

logger = logging.getLogger("scoutshopper.aicrm")

# Optional Gemini API integration for generative copywriting
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")


def get_ai_customer_dossier(user_id: str) -> Dict[str, Any]:
    """
    Constructs a complete AI CRM dossier for a user combining identity,
    demographics, lifetime purchases, and savings telemetry.
    """
    user = db.get_user_by_id(user_id)
    if not user:
        return {"error": "User not found", "user_id": user_id}

    savings = db.get_user_savings_summary(user_id)
    receipts = db.get_user_receipts(user_id)

    # Calculate birthday proximity
    now_struct = time.localtime()
    curr_month = now_struct.tm_mon
    curr_day = now_struct.tm_mday

    b_month = user.get("birthday_month")
    b_day = user.get("birthday_day")
    is_birthday_today = (b_month == curr_month and b_day == curr_day) if (b_month and b_day) else False
    is_birthday_this_month = (b_month == curr_month) if b_month else False

    # AI Behavioral Tags
    tags = []
    total_saved = savings.get("total_saved", 0.0)
    if total_saved >= 100.0:
        tags.append("high_saver")
    if total_saved >= 250.0:
        tags.append("power_saver")
    if is_birthday_today:
        tags.append("birthday_today")
    elif is_birthday_this_month:
        tags.append("birthday_upcoming")
    if user.get("phone") and user.get("sms_optin"):
        tags.append("sms_reachable")
    if len(receipts) > 0:
        tags.append("receipt_tracker")

    # Determine recommended AI action
    if is_birthday_today:
        recommended_action = "DISPATCH_BIRTHDAY_REWARD"
    elif total_saved >= 100.0 and total_saved < 110.0:
        recommended_action = "CELEBRATE_100_SAVINGS_MILESTONE"
    elif len(savings.get("recent_purchases", [])) == 1:
        recommended_action = "SEND_FIRST_PURCHASE_CONGRATS"
    else:
        recommended_action = "ENGAGED_MONITORING"

    return {
        "user_id": user_id,
        "name": user.get("name") or "Valued Shopper",
        "first_name": user.get("first_name") or (user.get("name", "").split(" ")[0]),
        "last_name": user.get("last_name") or "",
        "email": user.get("email"),
        "phone": user.get("phone") or "",
        "city": user.get("city") or "Local Area",
        "birthdate": user.get("birthdate") or "",
        "birthday_month": b_month,
        "birthday_day": b_day,
        "is_birthday_today": is_birthday_today,
        "is_birthday_this_month": is_birthday_this_month,
        "sms_optin": bool(user.get("sms_optin", 1)),
        "referral_code": user.get("referral_code"),
        "earnings_balance": user.get("earnings_balance", 0.0),
        "savings": savings,
        "receipts_tracked_count": len(receipts),
        "ai_tags": tags,
        "recommended_action": recommended_action,
        "ai_summary": (
            f"{user.get('name')} in {user.get('city') or 'their region'} has tracked "
            f"{savings.get('purchases_count', 0)} purchases and saved a total of ${savings.get('total_saved', 0.0):.2f} "
            f"({savings.get('savings_percentage', 0.0)}% savings rate)."
        )
    }


def generate_ai_crm_outreach(user_id: str, trigger: str = "auto") -> Dict[str, Any]:
    """
    Generates intelligent, personalized, humanized outreach copy (SMS / Email / Push).
    Complies with anti-robot and humanizer standards: concise, grounded, zero emoji icons.
    """
    dossier = get_ai_customer_dossier(user_id)
    if "error" in dossier:
        return dossier

    first_name = dossier["first_name"]
    city = dossier["city"]
    total_saved = dossier["savings"]["total_saved"]
    ref_code = dossier["referral_code"]
    wallet = dossier["earnings_balance"]

    action = trigger if trigger != "auto" else dossier["recommended_action"]

    if action == "DISPATCH_BIRTHDAY_REWARD":
        subject = f"Happy Birthday, {first_name}! Your reward is waiting."
        sms = f"Happy Birthday from Adonis Apps! You've saved ${total_saved:.2f} with Scout $hopper. We added a $5 treat to your account. Claim: https://scoutshopper.app/#perks"
        email_body = (
            f"Hi {first_name},\n\n"
            f"The team at Adonis Apps and Scout $hopper wants to wish you a very happy birthday.\n\n"
            f"Over your time using the app in {city}, you have saved a verified ${total_saved:.2f} on your purchases. "
            f"To celebrate, we loaded a $5 gift voucher directly into your app wallet. You can redeem it for coffee, retail, or a digital card anytime today.\n\n"
            f"Open Scout $hopper to claim your reward: https://scoutshopper.app/#perks\n\n"
            f"Warmly,\nThe Scout $hopper Team"
        )
    elif action == "CELEBRATE_100_SAVINGS_MILESTONE":
        subject = f"Milestone reached: You just crossed $100 saved on Scout $hopper."
        sms = f"Congrats {first_name}! You've saved ${total_saved:.2f} using Scout $hopper in {city}. View your breakdown: https://scoutshopper.app/#settings"
        email_body = (
            f"Hi {first_name},\n\n"
            f"You just crossed the $100 savings mark using Scout $hopper. Your current verified lifetime savings sit at ${total_saved:.2f}.\n\n"
            f"Every price match and tracked receipt adds up. Head over to your account settings to view your full breakdown by store and category.\n\n"
            f"Thanks for shopping smart,\nThe Scout $hopper Team"
        )
    else:
        subject = f"Your Scout $hopper Savings Update: ${total_saved:.2f} saved so far."
        sms = f"Hi {first_name}, you have saved ${total_saved:.2f} on Scout $hopper so far. Check current deals in {city}: https://scoutshopper.app"
        email_body = (
            f"Hi {first_name},\n\n"
            f"Here is your quick shopping digest: you have saved a total of ${total_saved:.2f} across your tracked purchases in {city}.\n\n"
            f"Your referral code {ref_code} is active. Share it with neighbors to earn an extra $5 every time a friend signs up.\n\n"
            f"Best regards,\nThe Scout $hopper Team"
        )

    return {
        "user_id": user_id,
        "trigger": action,
        "first_name": first_name,
        "recipient_email": dossier["email"],
        "recipient_phone": dossier["phone"],
        "sms_optin": dossier["sms_optin"],
        "channels": {
            "sms": bool(dossier["phone"] and dossier["sms_optin"]),
            "email": bool(dossier["email"]),
            "in_app": True
        },
        "copy": {
            "subject": subject,
            "sms_text": sms,
            "email_body": email_body
        },
        "generated_at": time.time()
    }
