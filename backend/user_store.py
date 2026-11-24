"""
Scout $hopper - User Accounts & Affiliate Referral Store (SQLite-backed)
Routes all user profiles, referral attribution, affiliate commissions,
and telemetry tracking through the persistent SQLite database engine.
"""

from typing import Dict, Any, Optional, List
import db


class UserStore:
    """Wrapper proxy that stores everything persistently in SQLite."""

    def __init__(self):
        self._interactions: Dict[str, Dict[str, List[str]]] = {}

    def get_user(self, user_id: str) -> Optional[Dict[str, Any]]:
        u = db.get_user_by_id(user_id)
        if not u:
            return None
        inter = self._interactions.get(user_id, {"categories": [], "upcs": []})
        u["categories_viewed"] = inter["categories"]
        u["scanned_history"] = inter["upcs"]
        return u

    def get_user_by_token(self, token: str) -> Optional[Dict[str, Any]]:
        u = db.get_user_by_token(token)
        if not u:
            return None
        inter = self._interactions.get(u["id"], {"categories": [], "upcs": []})
        u["categories_viewed"] = inter["categories"]
        u["scanned_history"] = inter["upcs"]
        return u

    def get_user_by_code(self, code: str) -> Optional[Dict[str, Any]]:
        clean_code = (code or "").strip().upper()
        with db.get_db() as conn:
            cur = conn.execute("SELECT id FROM users WHERE referral_code = ?", (clean_code,))
            row = cur.fetchone()
            if row:
                return self.get_user(row["id"])
            return None

    def get_or_create_user(self, email: str, name: Optional[str] = None, referred_by: Optional[str] = None) -> Dict[str, Any]:
        clean_email = email.lower().strip()
        with db.get_db() as conn:
            cur = conn.execute("SELECT id FROM users WHERE email = ?", (clean_email,))
            row = cur.fetchone()
            if row:
                return self.get_user(row["id"])
        # Register if not present
        res = db.register_user(clean_email, "temporary_pass123", name or clean_email.split("@")[0].capitalize(), referred_by)
        return res["user"]

    def record_interaction(self, user_id: str, category: Optional[str] = None, upc: Optional[str] = None):
        if user_id not in self._interactions:
            self._interactions[user_id] = {"categories": [], "upcs": []}
        if category and category not in self._interactions[user_id]["categories"]:
            self._interactions[user_id]["categories"].append(category)
        if upc and upc not in self._interactions[user_id]["upcs"]:
            self._interactions[user_id]["upcs"].append(upc)

    def credit_bounty(self, user_id: str, amount: float, memo: str = "Bounty") -> Optional[float]:
        with db.get_db() as conn:
            conn.execute("UPDATE users SET earnings_balance = earnings_balance + ? WHERE id = ?", (amount, user_id))
            cur = conn.execute("SELECT earnings_balance FROM users WHERE id = ?", (user_id,))
            row = cur.fetchone()
            return row["earnings_balance"] if row else None

    def credit_telemetry_optin_bonus(self, user_id: str = "usr_demo") -> Dict[str, Any]:
        return db.credit_telemetry_bonus(user_id)

    def credit_scan_bounty(self, user_id: str = "usr_demo", upc: str = "") -> Dict[str, Any]:
        return db.credit_scan_bounty(user_id, upc)

    def claim_payout(self, user_id: str, payout_method: str = "tremendous", destination: str = "", recipient_name: str = "") -> Dict[str, Any]:
        return db.claim_payout(user_id, payout_method, destination, recipient_name)

    def get_user_payouts(self, user_id: str) -> List[Dict[str, Any]]:
        return db.get_user_payouts(user_id)


# Global singleton instance
USER_STORE = UserStore()
