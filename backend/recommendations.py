"""
Scout $hopper - Personalized Recommendation Engine
Generates tailored deal recommendations and small-maker alternatives based on user category affinity,
scanned history, and maximum savings opportunities.
"""

from typing import List, Dict, Any, Optional
from catalog_data import get_catalog
from user_store import USER_STORE


def get_personalized_recommendations(user_id: Optional[str] = None, region: str = "US", limit: int = 4) -> Dict[str, Any]:
    catalog_dict = get_catalog(region)
    user = USER_STORE.get_user(user_id) if user_id else None
    
    preferred_categories = list(user.get("categories_viewed", [])) if user else []
    if user_id:
        try:
            import db
            db_user = db.get_user_by_id(user_id)
            if db_user and db_user.get("interests"):
                for cat in db_user["interests"]:
                    if cat not in preferred_categories:
                        preferred_categories.append(cat)
        except Exception:
            pass

    scored_deals = []
    maker_recs = []

    for p in catalog_dict.values():
        shelf = p["physical_store_price"]
        offers = p.get("retailer_offers", [])
        best_offer = min(offers, key=lambda o: o["price"]) if offers else None
        best_price = best_offer["price"] if best_offer else shelf
        best_retailer = best_offer["retailer"] if best_offer else "Online"

        diff = max(0.0, shelf - best_price)
        pct = (diff / shelf) * 100 if shelf > 0 else 0
        
        score = pct
        reason = f"Top Value: Save {int(round(pct))}%"
        
        if preferred_categories and p.get("category") in preferred_categories:
            score += 60
            reason = f"Personalized Deal in {p.get('category')}"

        scored_deals.append({
            "product": p,
            "shelf_price": shelf,
            "shelf_store": p.get("physical_store_name", "Shelf Price"),
            "best_price": best_price,
            "best_retailer": best_retailer,
            "savings_dollars": round(diff, 2),
            "savings_pct": int(round(pct)),
            "reason": reason,
            "score": score
        })

        for a in p.get("shop_small_alternatives", []):
            m_score = 10
            m_reason = "Handcrafted artisan alternative"
            if preferred_categories and p.get("category") in preferred_categories:
                m_score += 40
                m_reason = f"Curated artisan pick in {p.get('category')}"
            maker_recs.append({
                "item": {
                    "upc": p["upc"],
                    "brand_name": a["brand_name"],
                    "platform": a["platform"],
                    "title": a["title"],
                    "price": a["price"],
                    "rating": a["rating"],
                    "image_url": a["image_url"],
                    "perk": a["perk"],
                    "compare_title": p["title"],
                    "recommendation_reason": m_reason
                },
                "score": m_score
            })

    # Sort descending by score
    scored_deals.sort(key=lambda x: x["score"], reverse=True)
    top_deals = scored_deals[:limit]

    maker_recs.sort(key=lambda x: x["score"], reverse=True)
    top_makers = [m["item"] for m in maker_recs[:limit]]

    return {
        "user_id": user_id,
        "is_personalized": bool(user and preferred_categories),
        "preferred_categories": preferred_categories,
        "deals": [
            {
                "upc": item["product"]["upc"],
                "title": item["product"]["title"],
                "category": item["product"].get("category", "General"),
                "shelf_price": item["shelf_price"],
                "shelf_store": item["shelf_store"],
                "best_price": item["best_price"],
                "best_retailer": item["best_retailer"],
                "savings_dollars": item["savings_dollars"],
                "savings_pct": item["savings_pct"],
                "image_url": item["product"]["image_url"],
                "recommendation_reason": item["reason"]
            }
            for item in top_deals
        ],
        "shop_small": top_makers
    }
