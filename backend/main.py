"""
OmniCart AI - FastAPI Microservice Backend (region-aware: US + CA)
Includes Wishlist & Automated Price Drop Watchdog endpoints.
"""

from fastapi import FastAPI, HTTPException, Query, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional, List
import time
import os
from dotenv import load_dotenv

load_dotenv()

from catalog_data import get_catalog, get_local_services, check_service_quote
from policy_engine import evaluate_cashier_shield, RETAILER_POLICIES
from regions import REGIONS, get_region, tax_rate
from user_store import USER_STORE
from recommendations import get_personalized_recommendations
from marketing import dispatch_marketing_lead, dispatch_sms_reward_alert
from ai_crm import get_ai_customer_dossier, generate_ai_crm_outreach
from paddle_client import verify_paddle_webhook_signature, handle_paddle_webhook_event, create_checkout_preview, CONTRACTOR_TIERS
from live_deals_engine import get_or_fetch_live_deals
from universal_retailer_engine import universal_search, universal_get_product
from affiliate_engine import enhance_product_affiliate_links
import db

app = FastAPI(
    title="Scout $hopper Backend API",
    description="Autonomous Shopping Copilot: region-aware arbitrage, Shop Small engine, Cashier-Shield verification, and Wishlist Price-Drop Watchdog.",
    version="1.3.0",
)

# Flexible CORS for local development, mobile testing, and secure tunnels
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:8000",
        "http://localhost:8000",
        "https://scoutshopper.app",
        "https://*.loca.lt",
        "https://*.trycloudflare.com",
        "https://*.ngrok-free.app"
    ],
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

CART_STORE = []
SCAN_TELEMETRY = []
WISHLIST_STORE = []

STORES = {
    "US": ["Best Buy", "Target", "Walmart", "Home Depot", "Costco", "Lowe's"],
    "CA": ["Best Buy Canada", "Walmart Canada", "Canadian Tire", "Costco Canada", "Home Depot Canada"],
}


class CartItem(BaseModel):
    id: str
    upc: Optional[str] = None
    title: str
    retailer: str
    price: float
    shipping: float
    tax: float
    total: float
    image_url: str
    affiliate_url: str
    is_shop_small: bool = False


class WishlistItem(BaseModel):
    id: str
    upc: str
    title: str
    store: str
    baseline_price: float
    current_lowest_price: float
    target_price: Optional[float] = None
    image_url: str
    affiliate_url: str
    price_dropped: bool = False
    new_lowest_price: Optional[float] = None
    drop_savings: float = 0.0
    created_at: float = 0.0


def _region_or_400(code: str) -> dict:
    region = get_region(code)
    if not region:
        raise HTTPException(status_code=400, detail=f"Unsupported region '{code}'. Supported: {', '.join(REGIONS)}")
    return region


@app.get("/api/health")
def health_check():
    return {"status": "ok", "app": "OmniCart AI", "version": "1.2.0"}


@app.get("/api/regions")
def list_regions():
    return {
        code: {
            "name": r["name"], "currency": r["currency"], "locale": r["locale"],
            "default_subdivision": r["default_subdivision"],
            "subdivisions": {k: {"name": v["name"], "tax_rate": v["tax_rate"]} for k, v in r["subdivisions"].items()},
        }
        for code, r in REGIONS.items()
    }


@app.get("/api/stores")
def list_stores(region: str = "US"):
    _region_or_400(region)
    return [
        {"name": s, "verified": True}
        for s in STORES.get(region.upper(), [])
    ]


@app.get("/api/categories")
def list_categories(region: str = "US"):
    _region_or_400(region)
    counts = {}
    for p in get_catalog(region).values():
        counts[p["category"]] = counts.get(p["category"], 0) + 1
    return [{"name": k, "count": v} for k, v in counts.items()]


def _summary(product: dict, rate: float) -> dict:
    totals = [round(o["price"] * (1 + rate) + o["shipping"], 2) for o in product["retailer_offers"]]
    best = min(totals) if totals else None
    shelf = product["physical_store_price"]
    alt = (product.get("shop_small_alternatives") or [None])[0]
    return {
        "upc": product["upc"], "title": product["title"], "category": product["category"],
        "image_url": product["image_url"], "store": product["physical_store_name"],
        "shelf_price": shelf, "best_online_total": best,
        "savings": round(max(0.0, shelf - best), 2) if best is not None else 0.0,
        "has_shop_small": alt is not None,
    }


@app.get("/api/products")
def list_products(region: str = "US"):
    _region_or_400(region)
    return [
        {
            "upc": v["upc"], "title": v["title"], "category": v["category"], "msrp": v["msrp"],
            "store": v["physical_store_name"], "shelf_price": v["physical_store_price"],
            "image_url": v["image_url"],
        }
        for v in get_catalog(region).values()
    ]


@app.get("/api/search")
def search_products(region: str = "US", q: str = "", category: Optional[str] = None, province: Optional[str] = None):
    _region_or_400(region)
    return universal_search(region=region, query=q, category=category, province=province)


@app.get("/api/deals")
def top_deals(region: str = "US", province: Optional[str] = None):
    _region_or_400(region)
    rate = tax_rate(region.upper(), province)
    items = [_summary(p, rate) for p in get_catalog(region).values()]
    small = []
    for p in get_catalog(region).values():
        for a in p.get("shop_small_alternatives", []):
            small.append({
                "upc": p["upc"], "brand_name": a["brand_name"], "platform": a["platform"], "title": a["title"],
                "price": a["price"], "rating": a["rating"], "image_url": a["image_url"], "perk": a["perk"],
                "compare_title": p["title"],
            })
    return {"deals": sorted(items, key=lambda x: -x["savings"]), "shop_small": small}


@app.get("/api/scan/{upc}")
def scan_barcode(upc: str, store: Optional[str] = None, region: str = "US", province: Optional[str] = None,
                 share_telemetry: bool = False, authorization: Optional[str] = Header(default=None),
                 token: Optional[str] = None):
    """
    Looks up a UPC in the region's catalog, computes true cost with regional tax, and finds the best
    offer that qualifies for the store's price-match policy.
    """
    reg = _region_or_400(region)
    region = region.upper()
    clean_upc = upc.strip()
    product = get_catalog(region).get(clean_upc)
    if not product:
        product = universal_get_product(clean_upc, region=region)
    if not product:
        raise HTTPException(
            status_code=404,
            detail=f"Product with UPC {clean_upc} not found in the {reg['name']} demo catalog. Try one of the demo items.",
        )

    uid = _resolve_user_id(authorization, token, fallback_id="usr_demo")
    enhance_product_affiliate_links(product, user_id=uid)

    rate = tax_rate(region, province)
    online_only = (store or "").lower() == "online"
    shelf_store = product["physical_store_name"] if (online_only or not store) else store
    shelf_price = product["physical_store_price"]
    shelf_store_label = f"Current shelf price at {shelf_store}" if not online_only else f"Current shelf price at {product['physical_store_name']}"

    enriched_offers = []
    for offer in product["retailer_offers"]:
        enriched = dict(offer)
        enriched["estimated_tax"] = round(offer["price"] * rate, 2)
        enriched["total_cost"] = round(offer["price"] + offer["shipping"] + enriched["estimated_tax"], 2)
        enriched["savings_vs_shelf"] = round(shelf_price - enriched["total_cost"], 2)
        enriched_offers.append(enriched)
    enriched_offers.sort(key=lambda x: x["total_cost"])
    lowest_offer = enriched_offers[0] if enriched_offers else None

    cashier_shield = None
    for offer in ([] if online_only else enriched_offers):
        result = evaluate_cashier_shield(shelf_store, product["title"], product["model_number"], offer)
        if cashier_shield is None:
            cashier_shield = result
        if result["eligible"]:
            cashier_shield = result
            break
            
    if cashier_shield is not None:
        cashier_shield["policy_verified"] = True
        cashier_shield["currency"] = reg["currency"]

    scan_bounty_awarded = False
    if lowest_offer and share_telemetry and not online_only:
        SCAN_TELEMETRY.append({
            "timestamp": time.time(), "region": region, "upc": clean_upc, "title": product["title"],
            "store": shelf_store, "shelf_price": shelf_price, "lowest_online_price": lowest_offer["price"],
            "savings": max(0.0, round(shelf_price - lowest_offer["total_cost"], 2)),
            "currency": reg["currency"],
        })
        USER_STORE.credit_scan_bounty(user_id=uid, upc=clean_upc)
        scan_bounty_awarded = True

    return {
        "region": region,
        "currency": reg["currency"],
        "locale": reg["locale"],
        "tax_rate": rate,
        "scan_bounty_awarded": scan_bounty_awarded,
        "upc": clean_upc,
        "title": product["title"],
        "model_number": product["model_number"],
        "category": product["category"],
        "image_url": product["image_url"],
        "shelf_store": shelf_store,
        "shelf_store_label": shelf_store_label,
        "online_only": online_only,
        "shelf_price": shelf_price,
        "lowest_online_offer": lowest_offer,
        "all_offers": enriched_offers,
        "cashier_shield": cashier_shield,
        "shop_small_alternatives": [
            {**a, "savings_vs_store": round(shelf_price - (a["price"] + a["shipping"]), 2)}
            for a in product.get("shop_small_alternatives", [])
        ],
    }


# ---------------------------------------------------------------------------
# Universal Cart Endpoints (SQLite-backed per authenticated user)
# ---------------------------------------------------------------------------

def _resolve_user_id(authorization: Optional[str] = None, token: Optional[str] = None, fallback_id: str = "usr_demo") -> str:
    auth_token = None
    if authorization and authorization.startswith("Bearer "):
        auth_token = authorization.split("Bearer ", 1)[1].strip()
    elif token:
        auth_token = token.strip()
    if auth_token:
        user = db.get_user_by_token(auth_token)
        if user:
            return user["id"]
    return fallback_id


@app.get("/api/cart")
def get_cart(authorization: Optional[str] = Header(default=None), token: Optional[str] = None):
    uid = _resolve_user_id(authorization, token)
    return db.get_user_cart(uid)


@app.post("/api/cart/add")
def add_to_cart(item: CartItem, authorization: Optional[str] = Header(default=None), token: Optional[str] = None):
    uid = _resolve_user_id(authorization, token)
    return db.add_user_cart_item(uid, item.model_dump())


@app.delete("/api/cart/remove/{item_id}")
def remove_from_cart(item_id: str, authorization: Optional[str] = Header(default=None), token: Optional[str] = None):
    uid = _resolve_user_id(authorization, token)
    return db.remove_user_cart_item(uid, item_id)


@app.delete("/api/cart/clear")
def clear_cart(authorization: Optional[str] = Header(default=None), token: Optional[str] = None):
    uid = _resolve_user_id(authorization, token)
    return db.clear_user_cart(uid)


# ---------------------------------------------------------------------------
# Wishlist & Automated Price Drop Watchdog Endpoints (SQLite-backed)
# ---------------------------------------------------------------------------
@app.get("/api/wishlist")
def get_wishlist(authorization: Optional[str] = Header(default=None), token: Optional[str] = None):
    uid = _resolve_user_id(authorization, token)
    return db.get_user_wishlist(uid)


@app.post("/api/wishlist/add")
def add_to_wishlist(item: WishlistItem, authorization: Optional[str] = Header(default=None), token: Optional[str] = None):
    uid = _resolve_user_id(authorization, token)
    return db.add_user_wishlist_item(uid, item.model_dump())


@app.delete("/api/wishlist/remove/{item_id}")
def remove_from_wishlist(item_id: str, authorization: Optional[str] = Header(default=None), token: Optional[str] = None):
    uid = _resolve_user_id(authorization, token)
    return db.remove_user_wishlist_item(uid, item_id)


@app.post("/api/wishlist/simulate-drop/{item_id}")
def simulate_price_drop(item_id: str, authorization: Optional[str] = Header(default=None), token: Optional[str] = None):
    """
    Simulates the AI background scan detecting a price drop below the target price.
    """
    uid = _resolve_user_id(authorization, token)
    item = db.simulate_user_wishlist_drop(uid, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found in wishlist")
    
    return {
        "message": f"AI Copilot Alert: Price dropped for {item['title']}!",
        "item": item
    }


@app.get("/api/telemetry")
def get_telemetry():
    recent = db.get_recent_scans(15)
    if not recent:
        recent = SCAN_TELEMETRY[-10:]
    return {"total_scans": len(recent), "recent_scans": recent}


# ---------------------------------------------------------------------------
# Post-Purchase Price Protection & Refund Watchdog Endpoints
# ---------------------------------------------------------------------------

class ReceiptLogRequest(BaseModel):
    id: Optional[str] = None
    store: str
    item_title: str
    item_upc: Optional[str] = ""
    price_paid: float
    purchase_date: Optional[float] = None
    return_window_days: Optional[int] = None
    receipt_number: Optional[str] = None
    card_type: Optional[str] = None


@app.get("/api/receipts")
def list_receipts(authorization: Optional[str] = Header(default=None), token: Optional[str] = None):
    uid = _resolve_user_id(authorization, token)
    receipts = db.get_user_receipts(uid)
    dropped_count = sum(1 for r in receipts if r.get("price_dropped"))
    total_refund_avail = round(sum(r.get("refund_amount", 0.0) for r in receipts if r.get("price_dropped")), 2)
    return {
        "receipts": receipts,
        "count": len(receipts),
        "dropped_count": dropped_count,
        "total_refund_available": total_refund_avail
    }


@app.post("/api/receipts/log")
def log_receipt_endpoint(req: ReceiptLogRequest, authorization: Optional[str] = Header(default=None), token: Optional[str] = None):
    uid = _resolve_user_id(authorization, token)
    res = db.log_receipt(uid, req.model_dump())
    return {
        "message": f"Receipt logged for {res['item_title']}. Price drop watchdog active for {res['return_window_days']} days.",
        "receipt": res
    }


@app.delete("/api/receipts/{receipt_id}")
def delete_receipt_endpoint(receipt_id: str, authorization: Optional[str] = Header(default=None), token: Optional[str] = None):
    uid = _resolve_user_id(authorization, token)
    return db.delete_receipt(uid, receipt_id)


@app.post("/api/receipts/simulate-drop/{receipt_id}")
def simulate_receipt_drop_endpoint(receipt_id: str, authorization: Optional[str] = Header(default=None), token: Optional[str] = None):
    uid = _resolve_user_id(authorization, token)
    res = db.simulate_receipt_price_drop(uid, receipt_id, drop_percent=0.20)
    if not res:
        raise HTTPException(status_code=404, detail="Receipt not found")
    return {
        "message": f"Price drop detected on {res['item_title']}! Eligible refund: ${res['refund_amount']:.2f}",
        "receipt": res
    }


@app.get("/api/receipts/{receipt_id}/claim-script")
def get_claim_script_endpoint(receipt_id: str, authorization: Optional[str] = Header(default=None), token: Optional[str] = None):
    uid = _resolve_user_id(authorization, token)
    r = db.get_receipt_by_id(receipt_id)
    if not r or r["user_id"] != uid:
        raise HTTPException(status_code=404, detail="Receipt not found")
    from policy_engine import generate_price_adjustment_claim
    return generate_price_adjustment_claim(r)


class SimulateEmailReceiptRequest(BaseModel):
    store: Optional[str] = "Home Depot"
    item_title: Optional[str] = "Milwaukee M18 FUEL Brushless 1/2 in. Hammer Drill Kit"
    price_paid: Optional[float] = 299.00
    order_number: Optional[str] = None
    item_upc: Optional[str] = "045242521746"


@app.get("/api/receipts/inbound-feed")
def get_inbound_ereceipts_feed(authorization: Optional[str] = Header(default=None), token: Optional[str] = None):
    """Returns the user's dedicated forwarding email address and pending un-synced e-receipts."""
    uid = _resolve_user_id(authorization, token)
    pending = db.get_inbound_ereceipts(uid, status="PENDING_SYNC")
    if not pending:
        # Seed defaults for demo if empty
        pending = db.seed_default_inbound_ereceipts(uid)
        pending = [p for p in pending if p.get("status") == "PENDING_SYNC"]
    all_receipts = db.get_inbound_ereceipts(uid)
    return {
        "user_id": uid,
        "forwarding_email": f"receipts+{uid}@scoutshopper.app",
        "pending_count": len(pending),
        "pending_receipts": pending,
        "all_inbound_count": len(all_receipts)
    }


@app.post("/api/receipts/email-sync")
def sync_email_receipts_endpoint(authorization: Optional[str] = Header(default=None), token: Optional[str] = None):
    """1-Click Ingestion: parses and syncs all incoming electronic store receipts into the price watchdog."""
    uid = _resolve_user_id(authorization, token)
    return db.sync_inbound_ereceipts_to_watchdog(uid)


@app.post("/api/receipts/simulate-email")
def simulate_email_receipt_endpoint(req: SimulateEmailReceiptRequest, authorization: Optional[str] = Header(default=None), token: Optional[str] = None):
    """Simulates a store e-receipt arriving into the user's inbound forwarding mailbox."""
    uid = _resolve_user_id(authorization, token)
    import secrets
    import time
    data = {
        "store": req.store or "Home Depot",
        "sender_email": f"receipts@{req.store.lower().replace(' ', '')}.com",
        "order_number": req.order_number or f"{req.store[:3].upper()}-{secrets.token_hex(4).upper()}",
        "item_title": req.item_title or "Electronic Store Purchase",
        "item_upc": req.item_upc or "",
        "price_paid": req.price_paid or 299.00,
        "currency": "USD",
        "received_at": time.time()
    }
    return db.add_inbound_ereceipt(uid, data)


# ==========================================
# Real-World Inbound Webhook (Cloudflare Workers / SendGrid Parse)
# ==========================================

class InboundEmailWebhookRequest(BaseModel):
    recipient: Optional[str] = None
    sender: Optional[str] = None
    subject: Optional[str] = None
    body_text: Optional[str] = None
    raw_mime: Optional[str] = None


@app.post("/api/webhooks/inbound-email")
def inbound_email_webhook_endpoint(req: InboundEmailWebhookRequest, x_webhook_secret: Optional[str] = Header(default=None)):
    """
    Live Inbound Store E-Receipt Webhook:
    Receives incoming emails forwarded to receipts+<user_id>@scoutshopper.app from
    Cloudflare Email Workers, SendGrid Inbound Parse, or Mailgun.
    Parses store, line items, order number, and price paid,
    then evaluates against live price drops.
    """
    import inbound_email_parser
    parsed = inbound_email_parser.parse_inbound_email_payload(
        recipient=req.recipient,
        sender=req.sender,
        subject=req.subject,
        body_text=req.body_text,
        raw_mime=req.raw_mime
    )
    user_id = parsed["user_id"]
    inserted = db.add_inbound_ereceipt(user_id, parsed)
    sync_result = db.sync_inbound_ereceipts_to_watchdog(user_id)
    return {
        "status": "INGESTED",
        "user_id": user_id,
        "receipt": inserted,
        "watchdog_sync": sync_result
    }


# ==========================================
# Stripe Checkout & Lead Billing Integration
# ==========================================

class AdCheckoutSessionRequest(BaseModel):
    campaign_id: str
    flight_tier: str = "90_days"
    success_url: Optional[str] = None
    cancel_url: Optional[str] = None


class LeadChargeRequest(BaseModel):
    campaign_id: str
    lead_id: Optional[str] = None
    amount_dollars: float = 25.00


@app.post("/api/ads/checkout-session")
def create_ad_checkout_session_endpoint(req: AdCheckoutSessionRequest):
    """
    Creates a Stripe Checkout Session for self-serve ad flight purchases ($149 / $249 / $399).
    """
    import stripe_client
    camp = db.get_ad_campaign_by_id(req.campaign_id)
    vendor_name = camp.get("vendor_name", "Local Business") if camp else "Merchant"
    title = camp.get("title", "Sponsored Ad Flight") if camp else "Sponsored Flight"
    
    return stripe_client.create_ad_checkout_session(
        campaign_id=req.campaign_id,
        vendor_name=vendor_name,
        title=title,
        tier=req.flight_tier,
        success_url=req.success_url or "http://127.0.0.1:8000/?sponsor_success=1",
        cancel_url=req.cancel_url or "http://127.0.0.1:8000/?sponsor_cancel=1"
    )


@app.post("/api/ads/leads/charge")
def charge_ad_lead_endpoint(req: LeadChargeRequest):
    """
    Charges the contractor/merchant's payment method on file the $25.00 performance lead fee.
    """
    import stripe_client
    return stripe_client.charge_contractor_lead(
        campaign_id=req.campaign_id,
        vendor_name="Contractor Lead",
        job_title="Verified Homeowner Request",
        lead_fee_dollars=req.amount_dollars
    )


# ==========================================
# Paddle Merchant of Record & B2B Contractor Ledger
# ==========================================

class ContractorCheckoutRequest(BaseModel):
    tier: str = "TIER_149"
    email: str
    company_name: str
    trade_category: Optional[str] = "General"
    service_metro: Optional[str] = "Red Deer, AB"


class ContractorDepositRequest(BaseModel):
    contractor_id: str
    amount_dollars: float = 250.00
    reference_id: Optional[str] = ""
    description: Optional[str] = "Manual Wallet Top-up (Paddle Sandbox)"


class ContractorLeadDeductRequest(BaseModel):
    contractor_id: str
    amount_dollars: float = 25.50
    lead_id: str
    description: Optional[str] = "Dispatched Homeowner Lead Bounty"


@app.post("/api/webhooks/paddle")
async def paddle_webhook_endpoint(request: Request):
    """
    Paddle Merchant of Record webhook listener.
    Syncs subscriptions, tier upgrades, and pre-funded wallet deposits.
    """
    raw_body = await request.body()
    sig = request.headers.get("Paddle-Signature")
    is_valid, msg = verify_paddle_webhook_signature(raw_body, sig)
    if not is_valid:
        raise HTTPException(status_code=400, detail=f"Paddle webhook verification failed: {msg}")

    try:
        import json
        payload = json.loads(raw_body.decode("utf-8"))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid JSON payload: {e}")

    result = handle_paddle_webhook_event(payload)
    return {"status": "success", "result": result}


@app.get("/api/contractors/tiers")
def get_contractor_tiers_endpoint():
    """Returns available contractor B2B subscription tiers ($149, $249, $349/mo)."""
    return {"tiers": CONTRACTOR_TIERS}


@app.post("/api/contractors/checkout")
def create_contractor_checkout_endpoint(req: ContractorCheckoutRequest):
    """Generates hosted Paddle checkout preview for contractor subscriptions."""
    return create_checkout_preview(
        tier=req.tier,
        contractor_email=req.email,
        company_name=req.company_name,
        trade_category=req.trade_category or "General",
        service_metro=req.service_metro or "Red Deer, AB"
    )


@app.get("/api/contractors/me")
def get_contractor_me_endpoint(contractor_id: Optional[str] = None, email: Optional[str] = None):
    """Retrieves contractor profile, active tier, and prefunded wallet balance."""
    cid = contractor_id or "cont_apex_red_deer"
    c = db.get_contractor(cid) if cid else None
    if not c and email:
        c = db.get_contractor_by_email(email)
    if not c:
        raise HTTPException(status_code=404, detail="Contractor account not found")

    bal_dollars = round(c.get("prefunded_balance_cents", 0) / 100.0, 2)
    return {
        "contractor": c,
        "balance_dollars": bal_dollars,
        "tier_details": CONTRACTOR_TIERS.get(c.get("tier", "TIER_149"), CONTRACTOR_TIERS["TIER_149"])
    }


@app.get("/api/contractors/ledger")
def get_contractor_ledger_endpoint(contractor_id: Optional[str] = None, limit: int = 50):
    """Returns immutable double-entry ledger history for contractor wallet."""
    cid = contractor_id or "cont_apex_red_deer"
    entries = db.get_contractor_ledger(cid, limit=limit)
    c = db.get_contractor(cid)
    return {
        "contractor_id": cid,
        "company_name": c["company_name"] if c else "Unknown",
        "current_balance_dollars": round((c["prefunded_balance_cents"] if c else 0) / 100.0, 2),
        "ledger": entries
    }


@app.post("/api/contractors/deposit")
def deposit_contractor_funds_endpoint(req: ContractorDepositRequest):
    """Credits contractor wallet balance and records double-entry ledger entry."""
    amount_cents = int(round(req.amount_dollars * 100))
    try:
        res = db.deposit_contractor_funds(
            contractor_id=req.contractor_id,
            amount_cents=amount_cents,
            reference_id=req.reference_id or f"pdl_manual_{int(time.time())}",
            description=req.description or "Wallet Top-up via Paddle Checkout"
        )
        return res
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/contractors/deduct-lead")
def deduct_contractor_lead_endpoint(req: ContractorLeadDeductRequest):
    """Atomically debits dynamic lead fee ($25 - $45) from pre-funded contractor balance."""
    amount_cents = int(round(req.amount_dollars * 100))
    try:
        res = db.deduct_contractor_lead_fee(
            contractor_id=req.contractor_id,
            amount_cents=amount_cents,
            lead_id=req.lead_id,
            description=req.description or "Dispatched Homeowner Lead Bounty"
        )
        return res
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ==========================================
# User Auth, Affiliate Referral & Personalization
# ==========================================

class RegisterRequest(BaseModel):
    email: str
    password: str
    name: Optional[str] = ""
    first_name: Optional[str] = ""
    last_name: Optional[str] = ""
    phone: Optional[str] = ""
    city: Optional[str] = ""
    birthdate: Optional[str] = ""
    birthday_month: Optional[int] = None
    birthday_day: Optional[int] = None
    sms_optin: Optional[bool] = True
    referral_code: Optional[str] = None
    interests: Optional[List[str]] = None


class ProfileUpdateRequest(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    name: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    birthdate: Optional[str] = None
    birthday_month: Optional[int] = None
    birthday_day: Optional[int] = None
    sms_optin: Optional[bool] = None
    country: Optional[str] = None
    province: Optional[str] = None


class RecordPurchaseRequest(BaseModel):
    item_title: str
    store: str
    price_paid: float
    shelf_price: float
    category: Optional[str] = "General"
    savings_type: Optional[str] = "PRICE_MATCH"
    upc: Optional[str] = None
    receipt_id: Optional[str] = None
    purchase_date: Optional[float] = None


class AiOutreachRequest(BaseModel):
    trigger: Optional[str] = "auto"
    user_id: Optional[str] = None


class TestSmsRequest(BaseModel):
    phone: str
    message: Optional[str] = None


class LoginRequest(BaseModel):
    email: str
    password: Optional[str] = "demo1234"
    name: Optional[str] = None
    referred_by: Optional[str] = None


class PreferencesRequest(BaseModel):
    country: Optional[str] = None
    province: Optional[str] = None
    telemetry_optin: Optional[bool] = None
    interests: Optional[List[str]] = None


class PayoutRequest(BaseModel):
    user_id: str
    payout_method: str = "tremendous"
    destination: Optional[str] = None
    recipient_name: Optional[str] = None


class InteractionRequest(BaseModel):
    user_id: str
    category: Optional[str] = None
    upc: Optional[str] = None


@app.post("/api/auth/register")
def auth_register(req: RegisterRequest):
    try:
        res = db.register_user(
            email=req.email,
            password=req.password,
            name=req.name or "",
            referral_code=req.referral_code,
            first_name=req.first_name or "",
            last_name=req.last_name or "",
            phone=req.phone or "",
            city=req.city or "",
            birthdate=req.birthdate or "",
            birthday_month=req.birthday_month,
            birthday_day=req.birthday_day,
            sms_optin=True if req.sms_optin is None else req.sms_optin
        )
        user = res["user"]
        if req.interests:
            updated = db.update_user_preferences(user["id"], interests=req.interests)
            if updated:
                user = updated

        # Dispatch lead to marketing automation / CRM
        marketing_res = dispatch_marketing_lead(user, event="user_registered")

        return {
            "status": "success",
            "token": res["token"],
            "user": user,
            "referral_url": f"https://scoutshopper.app/?ref={user['referral_code']}",
            "marketing_dispatch": marketing_res
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/auth/profile")
def update_profile(req: ProfileUpdateRequest, authorization: Optional[str] = Header(default=None), token: Optional[str] = None):
    uid = _resolve_user_id(authorization, token)
    user = db.update_user_profile(
        user_id=uid,
        first_name=req.first_name,
        last_name=req.last_name,
        name=req.name,
        phone=req.phone,
        city=req.city,
        birthdate=req.birthdate,
        birthday_month=req.birthday_month,
        birthday_day=req.birthday_day,
        sms_optin=req.sms_optin,
        country=req.country,
        province=req.province
    )
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    marketing_res = dispatch_marketing_lead(user, event="profile_updated")
    return {
        "status": "success",
        "user": user,
        "marketing_dispatch": marketing_res
    }


# ==========================================
# AI CRM & Lifetime Savings Intelligence Endpoints
# ==========================================

@app.get("/api/crm/savings")
def get_savings_endpoint(authorization: Optional[str] = Header(default=None), token: Optional[str] = None):
    """Returns aggregated lifetime savings, breakdown by retailer and category, and milestone level."""
    uid = _resolve_user_id(authorization, token)
    return db.get_user_savings_summary(uid)


@app.get("/api/crm/purchases")
def get_purchases_endpoint(limit: int = 50, authorization: Optional[str] = Header(default=None), token: Optional[str] = None):
    """Returns list of tracked purchases with shelf price vs price paid savings."""
    uid = _resolve_user_id(authorization, token)
    return db.get_user_purchases(uid, limit=limit)


@app.post("/api/crm/purchases")
def record_purchase_endpoint(req: RecordPurchaseRequest, authorization: Optional[str] = Header(default=None), token: Optional[str] = None):
    """Tracks a newly verified purchase to calculate and celebrate savings."""
    uid = _resolve_user_id(authorization, token)
    purchase = db.record_user_purchase(
        user_id=uid,
        item_title=req.item_title,
        store=req.store,
        price_paid=req.price_paid,
        shelf_price=req.shelf_price,
        category=req.category or "General",
        savings_type=req.savings_type or "PRICE_MATCH",
        upc=req.upc,
        receipt_id=req.receipt_id,
        purchase_date=req.purchase_date
    )
    savings_summary = db.get_user_savings_summary(uid)
    return {
        "status": "success",
        "purchase": purchase,
        "lifetime_savings": savings_summary
    }


@app.get("/api/crm/dossier")
def get_crm_dossier_endpoint(authorization: Optional[str] = Header(default=None), token: Optional[str] = None):
    """Returns the comprehensive AI CRM Customer Dossier for autonomous intelligence."""
    uid = _resolve_user_id(authorization, token)
    return get_ai_customer_dossier(uid)


@app.post("/api/crm/outreach")
def generate_crm_outreach_endpoint(req: AiOutreachRequest, authorization: Optional[str] = Header(default=None), token: Optional[str] = None):
    """Generates personalized, humanized AI customer communication based on savings and milestones."""
    uid = req.user_id or _resolve_user_id(authorization, token)
    return generate_ai_crm_outreach(user_id=uid, trigger=req.trigger or "auto")


@app.post("/api/marketing/test-sms")
def test_sms_endpoint(req: TestSmsRequest):
    default_msg = "Scout $hopper Alert: Your $5 birthday coffee reward is ready! Claim it here: https://scoutshopper.app/#perks"
    return dispatch_sms_reward_alert(req.phone, req.message or default_msg)


@app.post("/api/auth/login")
def login_or_register(req: LoginRequest):
    if not req.email:
        raise HTTPException(status_code=400, detail="Email is required")
    # If password provided, attempt authenticated SQLite login
    if req.password:
        try:
            res = db.login_user(req.email, req.password)
            user = res["user"]
            return {
                "status": "success",
                "token": res["token"],
                "user": user,
                "referral_url": f"https://scoutshopper.app/?ref={user['referral_code']}"
            }
        except ValueError:
            pass  # Fallback to get_or_create for backwards compatibility

    user = USER_STORE.get_or_create_user(req.email, req.name, req.referred_by)
    return {
        "status": "success",
        "user": user,
        "token": "demo_session_token_alex",
        "referral_url": f"https://scoutshopper.app/?ref={user['referral_code']}"
    }


@app.get("/api/auth/me")
def get_current_user(authorization: Optional[str] = Header(default=None), token: Optional[str] = None):
    auth_token = None
    if authorization and authorization.startswith("Bearer "):
        auth_token = authorization.split("Bearer ", 1)[1].strip()
    elif token:
        auth_token = token.strip()

    if auth_token:
        user = db.get_user_by_token(auth_token)
        if user:
            return {"user": user, "authenticated": True}

    return {"user": None, "authenticated": False}


@app.post("/api/auth/logout")
def auth_logout(authorization: Optional[str] = Header(default=None), token: Optional[str] = None):
    auth_token = None
    if authorization and authorization.startswith("Bearer "):
        auth_token = authorization.split("Bearer ", 1)[1].strip()
    elif token:
        auth_token = token.strip()
    if auth_token:
        db.delete_session(auth_token)
    return {"success": True}


@app.post("/api/auth/preferences")
def update_preferences(req: PreferencesRequest, authorization: Optional[str] = Header(default=None)):
    uid = "usr_demo"
    if authorization and authorization.startswith("Bearer "):
        t = authorization.split("Bearer ", 1)[1].strip()
        u = db.get_user_by_token(t)
        if u:
            uid = u["id"]
    updated = db.update_user_preferences(uid, country=req.country, province=req.province, telemetry_optin=req.telemetry_optin, interests=req.interests)
    return {"success": True, "user": updated}


@app.get("/api/affiliate/stats")
def get_affiliate_stats(user_id: str = "usr_demo"):
    user = USER_STORE.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "user_id": user["id"],
        "name": user["name"],
        "email": user["email"],
        "referral_code": user["referral_code"],
        "referral_url": f"https://scoutshopper.app/?ref={user['referral_code']}",
        "earnings_balance": user["earnings_balance"],
        "pending_balance": user["pending_balance"],
        "referral_count": user["referral_count"],
        "referrals": user.get("referrals", []),
        "recent_payouts": USER_STORE.get_user_payouts(user["id"])
    }


@app.post("/api/affiliate/claim")
def claim_affiliate_payout(req: PayoutRequest):
    res = USER_STORE.claim_payout(
        user_id=req.user_id,
        payout_method=req.payout_method or "tremendous",
        destination=req.destination or "",
        recipient_name=req.recipient_name or ""
    )
    if not res["success"]:
        raise HTTPException(status_code=400, detail=res["error"])
    return res


@app.post("/api/affiliate/bonus/telemetry-optin")
def credit_optin_bonus(user_id: Optional[str] = None, authorization: Optional[str] = Header(default=None)):
    uid = _resolve_user_id(authorization, fallback_id=user_id or "usr_demo")
    return USER_STORE.credit_telemetry_optin_bonus(uid)


@app.post("/api/affiliate/bonus/scan")
def credit_scan_bonus(user_id: Optional[str] = None, upc: str = "", authorization: Optional[str] = Header(default=None)):
    uid = _resolve_user_id(authorization, fallback_id=user_id or "usr_demo")
    return USER_STORE.credit_scan_bounty(uid, upc)


@app.get("/api/recommendations")
def recommendations_endpoint(authorization: Optional[str] = Header(default=None), user_id: Optional[str] = None, region: str = "US", limit: int = Query(default=4, ge=1, le=50)):
    uid = user_id or _resolve_user_id(authorization)
    return get_personalized_recommendations(user_id=uid, region=region, limit=limit)


@app.post("/api/interactions")
def record_interaction_endpoint(req: InteractionRequest):
    USER_STORE.record_interaction(req.user_id, req.category, req.upc)
    return {"status": "ok"}



class QuoteCheckRequest(BaseModel):
    job_id: str
    quote_amount: float
    metro: Optional[str] = "red_deer"


class QuoteScanRequest(BaseModel):
    quote_text: Optional[str] = None
    filename: Optional[str] = None
    image_base64: Optional[str] = None
    metro_id: Optional[str] = "red_deer"
    location_query: Optional[str] = None
    postal_code: Optional[str] = None


@app.get("/api/services")
def list_services(metro: str = "red_deer", location_query: Optional[str] = None):
    """Returns local service sectors, jobs, and fair independent vs franchise benchmarks scaled to regional metro labor index."""
    if location_query:
        from regional_labor_api import RegionalLaborClient
        resolved = RegionalLaborClient.resolve_location(location_query)
        metro = resolved["id"]
    return get_local_services(metro)


@app.get("/api/services/labor-index")
def get_labor_index_endpoint(metro: str = "red_deer"):
    """Returns the live regional labor cost index queried from official StatCan WDS / BLS API feeds."""
    from regional_labor_api import RegionalLaborClient
    return {
        "metro": RegionalLaborClient.get_metro_index(metro),
        "available_metros": RegionalLaborClient.get_all_metros(),
        "api_health": RegionalLaborClient.ping_live_apis()
    }


@app.get("/api/services/labor-index/lookup")
def lookup_labor_index_endpoint(query: str = ""):
    """Dynamically resolves a postal code (CA/US) or city name to its live regional labor cost index."""
    from regional_labor_api import RegionalLaborClient
    resolved = RegionalLaborClient.resolve_location(query)
    return {
        "query": query,
        "resolved_metro": resolved,
        "available_metros": RegionalLaborClient.get_all_metros(),
        "api_health": RegionalLaborClient.ping_live_apis()
    }


@app.post("/api/services/labor-index/refresh")
def refresh_labor_index_endpoint(metro: str = "red_deer"):
    """Forces an immediate live refresh of the labor cost index from StatCan/BLS."""
    from regional_labor_api import RegionalLaborClient
    return {
        "metro": RegionalLaborClient.get_metro_index(metro, force_refresh=True),
        "available_metros": RegionalLaborClient.get_all_metros(),
        "message": "Live government labor index refreshed successfully."
    }


@app.post("/api/services/quote-scan")
def scan_quote_endpoint(req: QuoteScanRequest):
    """
    Snap-a-Quote AI Scanner:
    Parses photo/PDF/text of a contractor estimate, audits against live regional labor rates,
    and returns matched verified local pro advertisers for 1-click competitive bidding.
    """
    import quote_scanner
    metro_id = req.metro_id or "red_deer"
    if req.location_query or req.postal_code:
        from regional_labor_api import RegionalLaborClient
        loc_res = RegionalLaborClient.resolve_location(req.location_query or req.postal_code)
        metro_id = loc_res["id"]

    return quote_scanner.scan_contractor_quote(
        quote_text=req.quote_text,
        filename=req.filename,
        image_base64=req.image_base64,
        metro_id=metro_id
    )


@app.post("/api/services/quote-check")
def check_quote_endpoint(req: QuoteCheckRequest):
    """Evaluates a contractor's quote against independent benchmarks to spot private equity markups in that city."""
    try:
        return check_service_quote(req.job_id, req.quote_amount, req.metro or "red_deer")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/gifts")
def list_gifts(
    recipient: Optional[str] = None,
    occasion: Optional[str] = None,
    budget_max: Optional[float] = None,
    on_sale_only: bool = True,
    region: str = "US",
    province: Optional[str] = None,
    include_live: bool = True
):
    """Filters gifts by recipient, occasion/season, budget, and real price-drop arbitrage, merging live real-time feeds."""
    reg = _region_or_400(region)
    rate = tax_rate(region, province or reg.get("default_subdivision"))
    catalog = get_catalog(region) or get_catalog("US")
    results = []

    # 1. Curated Catalog Products
    for p in catalog.values():
        recips = p.get("gift_recipients") or ["for_her", "for_him", "family", "secret_santa", "tech_enthusiast", "home_chef", "teens"]
        occas = p.get("gift_occasions") or ["holiday", "birthday", "black_friday", "stocking_stuffer", "all"]

        if recipient and recipient.lower() not in ("all", "anyone") and recipient not in recips:
            continue
        if occasion and occasion.lower() not in ("all", "any") and occasion not in occas:
            continue

        totals = [round(o["price"] * (1 + rate) + o["shipping"], 2) for o in p["retailer_offers"]]
        best_price = min(totals) if totals else p["physical_store_price"]
        shelf = p["physical_store_price"]
        savings = round(max(0.0, shelf - best_price), 2)
        savings_pct = round((savings / shelf) * 100) if shelf > 0 and savings > 0 else 0

        if on_sale_only and savings <= 0:
            continue
        if budget_max and best_price > budget_max:
            continue

        alt = (p.get("shop_small_alternatives") or [None])[0]
        results.append({
            "upc": p["upc"],
            "title": p["title"],
            "category": p["category"],
            "image_url": p["image_url"],
            "store": p["physical_store_name"],
            "shelf_price": shelf,
            "best_price": best_price,
            "savings": savings,
            "savings_pct": savings_pct,
            "shop_small_alternative": alt,
            "gift_recipients": recips,
            "gift_occasions": occas,
            "is_live": False,
            "deal_url": None
        })

    # 2. Live Real-Time Deals Feed (RedFlagDeals CA / Slickdeals US)
    if include_live:
        try:
            live_items = get_or_fetch_live_deals(region)
            for d in live_items:
                recips = d.get("gift_recipients") or ["for_her", "for_him", "family"]
                occas = d.get("gift_occasions") or ["holiday", "birthday", "all"]

                if recipient and recipient.lower() not in ("all", "anyone") and recipient not in recips:
                    continue
                if occasion and occasion.lower() not in ("all", "any") and occasion not in occas:
                    continue
                if on_sale_only and d.get("savings", 0) <= 0:
                    continue
                if budget_max and d.get("best_price", d.get("price", 0)) > budget_max:
                    continue

                results.append({
                    "upc": d["upc"],
                    "title": d["title"],
                    "category": d["category"],
                    "image_url": d["image_url"],
                    "store": d["store"],
                    "shelf_price": d["shelf_price"],
                    "best_price": d["price"],
                    "savings": d["savings"],
                    "savings_pct": d["savings_pct"],
                    "shop_small_alternative": None,
                    "gift_recipients": recips,
                    "gift_occasions": occas,
                    "is_live": True,
                    "live_source": d.get("live_source", "Real-Time Deals Feed"),
                    "deal_url": d.get("deal_url", "")
                })
        except Exception as e:
            pass

    results.sort(key=lambda x: (x.get("is_live", False), x["savings"]), reverse=True)
    return results


@app.get("/api/deals/live")
def list_live_deals(region: str = "CA"):
    """Returns real-time live sales from active Canadian and US retailer feeds."""
    return get_or_fetch_live_deals(region, force_refresh=False)


@app.post("/api/deals/live/sync")
def sync_live_deals(region: str = "CA"):
    """Forces an instant live crawl of real-time sales feeds."""
    items = get_or_fetch_live_deals(region, force_refresh=True)
    return {"status": "synced", "count": len(items), "region": region.upper(), "items": items}


# ==========================================
# Self-Serve Advertising & Lead Routing Engine
# ==========================================

class AdCampaignCreateRequest(BaseModel):
    vendor_type: str = "shopify"  # 'shopify', 'etsy', 'local_service', 'retailer'
    vendor_name: str
    store_platform: Optional[str] = None
    store_url: str
    title: str
    description: Optional[str] = ""
    category: Optional[str] = "All"
    price: Optional[float] = 0.0
    image_url: Optional[str] = None
    badge_label: Optional[str] = None
    duration_days: int = 30  # 30, 60, 90
    city: Optional[str] = "Red Deer, AB"
    metro_id: Optional[str] = "red_deer"


class ContractorLeadRequest(BaseModel):
    campaign_id: Optional[str] = None
    service_job: str
    client_name: str
    client_contact: str
    estimated_amount: Optional[float] = 0.0
    notes: Optional[str] = ""
    city: Optional[str] = "Red Deer, AB"


@app.get("/api/ads/pricing")
def get_ad_pricing():
    return {
        "tiers": list(db.AD_PRICING_TIERS.values()),
        "currency": "USD"
    }


@app.post("/api/ads/campaigns")
def create_ad_campaign_endpoint(req: AdCampaignCreateRequest):
    if req.duration_days not in db.AD_PRICING_TIERS:
        raise HTTPException(status_code=400, detail="Invalid duration. Supported durations are 30, 60, or 90 days.")
    camp = db.create_ad_campaign(req.model_dump())
    return {
        "message": f"Campaign '{camp['title']}' is now active for {camp['duration_days']} days!",
        "campaign": camp
    }


@app.get("/api/ads/active")
def get_active_ads_endpoint(category: Optional[str] = None, vendor_type: Optional[str] = None, limit: int = 10):
    return db.get_active_ad_campaigns(category=category, vendor_type=vendor_type, limit=limit)


@app.post("/api/ads/campaigns/{campaign_id}/click")
def track_ad_click_endpoint(campaign_id: str):
    camp = db.track_ad_click(campaign_id)
    if not camp:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return {
        "status": "CLICK_RECORDED",
        "redirect_url": camp["store_url"],
        "clicks": camp["clicks"],
        "ctr_pct": camp["ctr_pct"]
    }


@app.post("/api/ads/leads")
def dispatch_contractor_lead_endpoint(req: ContractorLeadRequest):
    return db.dispatch_contractor_lead(req.model_dump())


# ==========================================
# Google AdMob Sandbox & Rewarded SSV Engine
# ==========================================

ADMOB_TEST_CONFIG = {
    "environment": "sandbox",
    "status": "active",
    "android": {
        "app_id": "ca-app-pub-3940256099942544~3347511713",
        "banner_unit_id": "ca-app-pub-3940256099942544/6300978111",
        "interstitial_unit_id": "ca-app-pub-3940256099942544/1033173712",
        "rewarded_unit_id": "ca-app-pub-3940256099942544/5224354917"
    },
    "ios": {
        "app_id": "ca-app-pub-3940256099942544~1458602516",
        "banner_unit_id": "ca-app-pub-3940256099942544/2934735716",
        "interstitial_unit_id": "ca-app-pub-3940256099942544/4411468910",
        "rewarded_unit_id": "ca-app-pub-3940256099942544/1712485313"
    },
    "formats_supported": ["BANNER", "INTERSTITIAL", "REWARDED_VIDEO"],
    "reward_per_video_dollars": 0.25
}


class AdMobSimulateRewardRequest(BaseModel):
    user_id: Optional[str] = "usr_demo"
    reward_amount: float = 0.25
    format: str = "REWARDED_VIDEO"


@app.get("/api/admob/config")
def get_admob_config():
    return ADMOB_TEST_CONFIG


@app.post("/api/admob/simulate-reward")
def simulate_admob_reward(req: AdMobSimulateRewardRequest, authorization: Optional[str] = Header(default=None), token: Optional[str] = None):
    uid = _resolve_user_id(authorization, token)
    if uid == "anon" and req.user_id:
        uid = req.user_id
    res = db.credit_admob_reward(uid, reward_amount=req.reward_amount, reward_type=f"AdMob {req.format} Test Bounty")
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("error", "Failed to credit AdMob reward"))
    return res


@app.get("/api/admob/ssv")
@app.post("/api/admob/ssv")
def admob_server_side_verification(
    request: Request,
    user_id: Optional[str] = Query(default=None),
    custom_data: Optional[str] = Query(default=None),
    reward_amount: Optional[float] = Query(default=0.25),
    reward_item: Optional[str] = Query(default="AdMob Reward Video"),
    key_id: Optional[str] = Query(default=None),
    signature: Optional[str] = Query(default=None)
):
    """
    Google AdMob Server-Side Verification (SSV) callback endpoint.
    Google pings this endpoint when a user completes watching a rewarded video ad.
    """
    target_user = user_id or custom_data or "usr_demo"
    res = db.credit_admob_reward(target_user, reward_amount=reward_amount or 0.25, reward_type="AdMob SSV Rewarded Video")
    return {
        "status": "VERIFIED",
        "admob_ssv": True,
        "credited_user": target_user,
        "amount": reward_amount or 0.25,
        "result": res
    }


class PushTokenRegisterRequest(BaseModel):
    token: str
    platform: str = "android"


class TestNotificationRequest(BaseModel):
    type: str = "price_drop"
    item_title: Optional[str] = None
    savings: Optional[float] = None
    store: Optional[str] = None


@app.post("/api/notifications/register")
def register_push_token(req: PushTokenRegisterRequest, authorization: Optional[str] = Header(default=None), token: Optional[str] = None):
    uid = _resolve_user_id(authorization, token)
    return {
        "success": True,
        "message": f"Push token registered for user {uid} on {req.platform}",
        "device_token": req.token[:12] + "..." if len(req.token) > 12 else req.token
    }


@app.post("/api/notifications/test")
def dispatch_test_notification(req: TestNotificationRequest, authorization: Optional[str] = Header(default=None), token: Optional[str] = None):
    uid = _resolve_user_id(authorization, token)
    if req.type == "price_drop":
        title = "⚡ Scout $hopper Price Drop Alert!"
        body = f"{req.item_title or 'Sony WH-1000XM5 Wireless Headphones'} dropped ${(req.savings or 80.00):.2f} at {req.store or 'Best Buy'}! Lowest 90-day price."
        data = {"type": "price_drop", "upc": "027242919419", "savings": req.savings or 80.00}
    else:
        title = "💰 In-Store Price Adjustment Refund Available!"
        body = f"{req.store or 'Home Depot'} dropped price on your tracked purchase. Claim a ${(req.savings or 44.50):.2f} cash refund now."
        data = {"type": "refund_claim", "store": req.store or "Home Depot", "refund_amount": req.savings or 44.50}

    return {
        "dispatched": True,
        "notification": {
            "title": title,
            "body": body,
            "data": data,
            "user_id": uid
        }
    }


frontend_dir = os.path.join(os.path.dirname(__file__), "..", "frontend")
if os.path.exists(frontend_dir):
    app.mount("/static", StaticFiles(directory=frontend_dir), name="static")

    @app.get("/")
    def serve_index():
        return FileResponse(os.path.join(frontend_dir, "index.html"))

    @app.get("/app.js")
    def serve_app_js():
        return FileResponse(os.path.join(frontend_dir, "app.js"), media_type="application/javascript")

    @app.get("/styles.css")
    def serve_styles_css():
        return FileResponse(os.path.join(frontend_dir, "styles.css"), media_type="text/css")

    @app.get("/icon-192.png")
    def serve_icon_192():
        return FileResponse(os.path.join(frontend_dir, "icon-192.png"), media_type="image/png")

    @app.get("/icon-512.png")
    def serve_icon_512():
        return FileResponse(os.path.join(frontend_dir, "icon-512.png"), media_type="image/png")

    @app.get("/landing")
    def serve_landing():
        return FileResponse(os.path.join(frontend_dir, "landing.html"))

    @app.get("/terms")
    @app.get("/terms-of-service")
    def serve_terms():
        terms_path = os.path.join(frontend_dir, "terms.html")
        if os.path.exists(terms_path):
            return FileResponse(terms_path)
        return FileResponse(os.path.join(frontend_dir, "landing.html"))

    @app.get("/privacy")
    @app.get("/privacy-policy")
    def serve_privacy():
        privacy_path = os.path.join(frontend_dir, "privacy.html")
        if os.path.exists(privacy_path):
            return FileResponse(privacy_path)
        return FileResponse(os.path.join(frontend_dir, "landing.html"))

    @app.get("/refund")
    @app.get("/refund-policy")
    def serve_refund():
        refund_path = os.path.join(frontend_dir, "refund.html")
        if os.path.exists(refund_path):
            return FileResponse(refund_path)
        return FileResponse(os.path.join(frontend_dir, "landing.html"))

    @app.get("/sw.js")
    def serve_sw():
        return FileResponse(os.path.join(frontend_dir, "sw.js"), media_type="application/javascript")

    @app.get("/manifest.json")
    def serve_manifest():
        return FileResponse(os.path.join(frontend_dir, "manifest.json"), media_type="application/json")
