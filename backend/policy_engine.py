"""
OmniCart AI - Retailer Price-Match Policy Rules Engine
Evaluates retailer price-match eligibility and builds Cashier-Shield proof cards.
"""

RETAILER_POLICIES = {
    "Best Buy": {
        "matched_competitors": ["Amazon.com", "Walmart.com", "Target.com", "B&H Photo Video", "HP.com", "Dell.com", "Apple.com"],
        "disallow_third_party_sellers": True,
        "require_identical_model": True,
        "require_in_stock": True,
        "policy_url": "https://www.bestbuy.com/site/help-topics/price-match-guarantee/pcmcat290300050002.c",
        "guidelines": "Matches online pricing at time of purchase. Must be identical model, brand new, shipped and sold by qualifying retailer."
    },
    "Target": {
        # Verified from Target's Price Match Guarantee help page (user-supplied screenshots):
        # the lower price must be found at Target.com or a local Target store (own prices only).
        "matches_competitors": False,
        "policy_url": "https://www.target.com/help/articles/policies-guidelines/price-match-guarantee",
        "guidelines": (
            "Target price matches its OWN prices (Target.com or a local Target store); the visible policy does not "
            "list outside competitors. Item must be identical in brand, size, weight, color, quantity and model #. "
            "Eligible if purchased today or within the last 14 days (holiday window: price drop between "
            "Nov 1 and Dec 24, 2026). Bring proof of the Target price (screenshots/pictures not accepted) and the "
            "receipt if already purchased. Not matched: different Target store price, promotional GiftCard offers, "
            "Registry/other Target coupons, clearance, closeout, liquidation, refurbished, typographical errors."
        ),
        "source": "Target help page screenshots (user-supplied); comparison-shopping-site FAQ not yet read",
    },
    "Walmart": {
        "matched_competitors": ["Walmart.com (Base items)"],
        "disallow_third_party_sellers": True,
        "require_identical_model": True,
        "require_in_stock": True,
        "policy_url": "https://corporate.walmart.com/policies#price-match-policy",
        "guidelines": "Walmart stores match Walmart.com prices on identical items in stock. Stores do NOT match Amazon or other physical competitor ads in-store since 2017."
    }
}

RETAILER_POLICIES["Best Buy Canada"] = {
    "policy_url": "https://www.bestbuy.ca/en-ca/help/paying-and-purchasing/low-price-guarantee",
    "guidelines": (
        "Year-round Low Price Guarantee: matches a lower price from a Canadian retailer AND authorized dealer "
        "(online, in-store or in print) before purchase or within 30 days after. Exact same brand and model #, "
        "priced in CAD including environmental fees and shipping, in stock, available in your province. "
        "Excludes marketplace sellers (e.g. on Amazon.ca, eBay.ca), refurbished/liquidated sellers, pre-orders, "
        "limited-time or limited-quantity offers, pricing errors and special sale prices (Black Friday, open box, "
        "clearance, rebates, coupons, bundles, trade-in and financing offers, etc.). "
        "If Best Buy's own price drops within 30 days, show the original receipt for the difference."
    ),
    "source": "Best Buy Canada help page (user-supplied screenshot, verified by user)",
}


def _evaluate_best_buy_canada(model_number: str, offer: dict) -> dict:
    policy = RETAILER_POLICIES["Best Buy Canada"]
    link = policy["policy_url"]
    checks = [
        (offer.get("currency", "CAD") == "CAD", "NOT_CAD", "Price must be in Canadian dollars including environmental fees and shipping."),
        (offer.get("seller_country", "CA") == "CA", "NOT_CANADIAN_SELLER", "Seller must be a retailer and authorized dealer located in Canada."),
        (offer.get("shipped_and_sold_by_retailer", False), "MARKETPLACE_SELLER", "Marketplace sellers (including on Amazon.ca or eBay.ca) do not qualify."),
        (offer.get("condition", "new") == "new", "NOT_NEW", "Refurbished, liquidated or open-box items do not qualify."),
        (not offer.get("is_special_sale", False), "SPECIAL_SALE", "Special sale prices (Black Friday, clearance, rebates, coupons, bundles, trade-ins) do not qualify."),
        (not offer.get("is_preorder_or_limited", False), "LIMITED_OFFER", "Pre-orders and limited-time or limited-quantity offers do not qualify."),
        (offer.get("model_number_match", False), "MODEL_MISMATCH", "Brand and model number must match exactly."),
        (offer.get("in_stock", False), "OUT_OF_STOCK", "Product must be in stock and available in your province."),
    ]
    for ok, status, why in checks:
        if not ok:
            return {
                "eligible": False, "store_name": "Best Buy Canada", "status": status,
                "verdict": f"{why} Recommendation: buy online instead.",
                "cashier_script": None, "policy_link": link,
            }
    price = offer["price"]
    return {
        "eligible": True, "store_name": "Best Buy Canada", "status": "VERIFIED_MATCH",
        "verdict": f"Meets Best Buy Canada Low Price Guarantee: in stock at {offer['retailer']}, sold and shipped directly in Canada, exact model {model_number}.",
        "matched_retailer": offer["retailer"], "matched_price": price, "model_number": model_number,
        "cashier_script": (
            f"I'd like a Low Price Guarantee match at ${price:.2f} CAD (all-in, including fees and shipping). "
            f"{offer['retailer']} sells and ships it directly in Canada, in stock, exact same model #{model_number}, not a special sale price."
        ),
        "policy_link": link, "policy_summary": policy["guidelines"],
    }


def evaluate_cashier_shield(store_name: str, product_title: str, model_number: str, lowest_offer: dict) -> dict:
    """
    Evaluates whether the lowest online offer qualifies for an in-store price match.
    Returns a Cashier-Shield validation payload.
    """
    if store_name == "Best Buy Canada":
        return _evaluate_best_buy_canada(model_number, lowest_offer)

    if store_name == "Target":
        t = RETAILER_POLICIES["Target"]
        return {
            "eligible": False,
            "store_name": "Target",
            "status": "COMPETITOR_NOT_MATCHED",
            "verdict": (
                f"Target's price match applies to Target's own prices (Target.com or a local Target store), "
                f"not {lowest_offer.get('retailer', 'other retailers')}. Recommendation: buy online instead."
            ),
            "cashier_script": None,
            "policy_link": t["policy_url"],
            "policy_summary": t["guidelines"],
        }

    policy = RETAILER_POLICIES.get(store_name)
    
    if not policy:
        return {
            "eligible": False,
            "store_name": store_name,
            "status": "UNVERIFIED_STORE",
            "verdict": "Store policy not in database. Advise buying online for guaranteed savings.",
            "cashier_script": None,
            "policy_link": None
        }

    competitor_seller = lowest_offer.get("seller_name", "")
    is_shipped_sold_by_retailer = lowest_offer.get("shipped_and_sold_by_retailer", False)
    is_in_stock = lowest_offer.get("in_stock", False)
    is_model_match = lowest_offer.get("model_number_match", False)

    # Check store rules
    if store_name == "Walmart":
        # Walmart in-store only matches Walmart.com
        if lowest_offer.get("retailer") == "Walmart" and is_shipped_sold_by_retailer:
            eligible = True
            reason = "Qualifies under Walmart.com in-store price match rule."
        else:
            return {
                "eligible": False,
                "store_name": store_name,
                "status": "POLICY_EXCLUSION",
                "verdict": "Walmart stores do NOT match external online competitors (like Amazon). Recommendation: Buy online now to save money.",
                "cashier_script": None,
                "policy_link": policy["policy_url"]
            }
    else:
        # Best Buy / Target checks
        is_competitor_accepted = any(comp.lower() in competitor_seller.lower() for comp in policy["matched_competitors"])
        
        if not is_competitor_accepted or not is_shipped_sold_by_retailer:
            return {
                "eligible": False,
                "store_name": store_name,
                "status": "THIRD_PARTY_SELLER_EXCLUSION",
                "verdict": f"{store_name} price-match excludes 3rd-party marketplace sellers. Recommendation: Order online directly to secure the deal.",
                "cashier_script": None,
                "policy_link": policy["policy_url"]
            }

        if not is_model_match:
            return {
                "eligible": False,
                "store_name": store_name,
                "status": "MODEL_MISMATCH",
                "verdict": "Model numbers do not match down to the suffix. Store will decline. Order online instead.",
                "cashier_script": None,
                "policy_link": policy["policy_url"]
            }

        if not is_in_stock:
            return {
                "eligible": False,
                "store_name": store_name,
                "status": "OUT_OF_STOCK_ONLINE",
                "verdict": "Competitor item is currently backordered or out of stock.",
                "cashier_script": None,
                "policy_link": policy["policy_url"]
            }

        eligible = True
        reason = f"Verified: In-stock at {lowest_offer['retailer']}, shipped & sold directly, identical model {model_number}."

    return {
        "eligible": True,
        "store_name": store_name,
        "status": "VERIFIED_MATCH",
        "verdict": reason,
        "matched_retailer": lowest_offer["retailer"],
        "matched_price": lowest_offer["price"],
        "model_number": model_number,
        "cashier_script": f"Hi, I would like to request an in-store price match for ${lowest_offer['price']:.2f}. It is in-stock online, shipped and sold directly by {lowest_offer['retailer']} with matching model #{model_number}.",
        "verification_note": "Store policy requires the associate to verify the live competitor price on their store device. Final decision subject to store manager discretion.",
        "policy_link": policy["policy_url"],
        "policy_summary": policy["guidelines"]
    }


def generate_price_adjustment_claim(receipt: dict) -> dict:
    import time
    store = receipt["store"]
    paid = float(receipt["price_paid"])
    current = float(receipt["current_market_price"])
    diff = float(receipt["refund_amount"])
    rcpt_no = receipt.get("receipt_number", "UNKNOWN")
    item = receipt["item_title"]
    days_left = receipt.get("days_remaining", 0)
    p_time = receipt.get("purchase_date", time.time())
    p_date_str = time.strftime('%b %d, %Y', time.localtime(p_time))

    policy = RETAILER_POLICIES.get(store, {})
    policy_url = policy.get("policy_url", "https://corporate.walmart.com/policies#price-match-policy")

    email_subject = f"Price Adjustment Request: {store} Order #{rcpt_no} ({item})"
    
    script_chat = (
        f"Hello, I purchased '{item}' from {store} on {p_date_str} for ${paid:.2f} (Receipt/Order #{rcpt_no}). "
        f"The price has dropped to ${current:.2f}, saving ${diff:.2f}. "
        f"Because this purchase is within the {receipt.get('return_window_days', 30)}-day adjustment window ({days_left} days remaining), "
        f"I would like to request an immediate price adjustment refund of ${diff:.2f} credited back to my original payment method. Thank you!"
    )

    card_benefit_guidance = (
        f"If {store} denies your request or the return window has expired, your card benefits "
        f"({receipt.get('card_type', 'Credit Card Purchase Protection')}) cover price drops "
        f"for up to 60-90 days from the purchase date ($250 to $500 per claim)."
    )

    return {
        "store": store,
        "item_title": item,
        "receipt_number": rcpt_no,
        "purchase_price": paid,
        "current_market_price": current,
        "refund_amount": diff,
        "days_remaining": days_left,
        "email_subject": email_subject,
        "claim_script": script_chat,
        "card_benefit_guidance": card_benefit_guidance,
        "policy_url": policy_url
    }
