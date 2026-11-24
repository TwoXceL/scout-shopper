import pytest
from starlette.testclient import TestClient
from main import app
import db

client = TestClient(app)

def test_ad_pricing_tiers_option_3():
    resp = client.get("/api/ads/pricing")
    assert resp.status_code == 200
    data = resp.json()
    assert "tiers" in data
    tiers = {t["days"]: t for t in data["tiers"]}
    
    # 30-day base flight: $149
    assert 30 in tiers
    assert tiers[30]["price_dollars"] == 149.00
    assert tiers[30]["price_cents"] == 14900
    
    # 60-day base flight: $249 (Save $49)
    assert 60 in tiers
    assert tiers[60]["price_dollars"] == 249.00
    assert tiers[60]["savings_pct"] == 16
    
    # 90-day base plan: $349 (Save $98 vs month-to-month)
    assert 90 in tiers
    assert tiers[90]["price_dollars"] == 349.00
    assert tiers[90]["savings_pct"] == 22


def test_create_shopify_and_etsy_campaigns():
    # 1. Create Shopify Campaign
    shopify_payload = {
        "vendor_type": "shopify",
        "vendor_name": "Nordic Hearth Crafts",
        "store_platform": "Shopify",
        "store_url": "https://nordichearth.myshopify.com/products/cast-iron-kettle",
        "title": "Cast Iron Artisan Teapot & Trivet Set",
        "description": "Traditional Japanese-style enamel-lined cast iron teapot with heat-preserving trivet.",
        "category": "Kitchen & Dining",
        "price": 68.00,
        "duration_days": 60,
        "image_url": "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500"
    }
    r_shop = client.post("/api/ads/campaigns", json=shopify_payload)
    assert r_shop.status_code == 200
    c_shop = r_shop.json()["campaign"]
    assert c_shop["vendor_type"] == "shopify"
    assert c_shop["badge_label"] == "Shopify Boutique"
    assert c_shop["duration_days"] == 60
    assert c_shop["cost_cents"] == 24900
    assert c_shop["price_dollars"] == 249.00
    assert c_shop["lead_fee_dollars"] == 0.75

    # 2. Create Etsy Campaign
    etsy_payload = {
        "vendor_type": "etsy",
        "vendor_name": "Prairie Clay Works",
        "store_platform": "Etsy",
        "store_url": "https://etsy.com/shop/prairieclayworks",
        "title": "Handmade Speckled Ceramic Coffee Mug",
        "description": "Wheel-thrown stoneware with raw clay base and food-safe matte white glaze.",
        "category": "Kitchen & Dining",
        "price": 32.00,
        "duration_days": 90,
        "image_url": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500"
    }
    r_etsy = client.post("/api/ads/campaigns", json=etsy_payload)
    assert r_etsy.status_code == 200
    c_etsy = r_etsy.json()["campaign"]
    assert c_etsy["vendor_type"] == "etsy"
    assert c_etsy["badge_label"] == "Etsy Artisan"
    assert c_etsy["duration_days"] == 90
    assert c_etsy["cost_cents"] == 34900
    assert c_etsy["lead_fee_dollars"] == 0.75


def test_active_ads_and_click_tracking():
    # Fetch active ads
    resp = client.get("/api/ads/active?category=Kitchen%20%26%20Dining")
    assert resp.status_code == 200
    ads = resp.json()
    assert len(ads) > 0
    target_ad = ads[0]
    initial_clicks = target_ad["clicks"]

    # Track click
    c_resp = client.post(f"/api/ads/campaigns/{target_ad['id']}/click")
    assert c_resp.status_code == 200
    data = c_resp.json()
    assert data["status"] == "CLICK_RECORDED"
    assert data["clicks"] == initial_clicks + 1
    assert "redirect_url" in data


def test_dispatch_contractor_lead_with_fee_and_city():
    # 1. First create a contractor campaign in Red Deer
    camp_payload = {
        "vendor_type": "local_service",
        "vendor_name": "Red Deer Peak Plumbing",
        "store_platform": "Local Pro",
        "store_url": "https://reddeerplumbing.ca",
        "title": "Licensed Red Deer Master Plumbers",
        "description": "24/7 Red Deer emergency repairs and water heaters.",
        "category": "Local Services",
        "price": 180.00,
        "duration_days": 90,
        "city": "Red Deer, AB"
    }
    r_camp = client.post("/api/ads/campaigns", json=camp_payload)
    assert r_camp.status_code == 200
    cid = r_camp.json()["campaign"]["id"]
    assert r_camp.json()["campaign"]["cost_cents"] == 34900
    assert r_camp.json()["campaign"]["lead_fee_dollars"] == 25.00
    assert r_camp.json()["campaign"]["city"] == "Red Deer, AB"

    # 2. Dispatch a homeowner estimate lead
    payload = {
        "campaign_id": cid,
        "service_job": "Tankless Water Heater Installation",
        "client_name": "Sarah Jenkins",
        "client_contact": "sarah.j@example.com",
        "estimated_amount": 1850.00,
        "notes": "Looking for quote on 199k BTU natural gas system replacement in Red Deer.",
        "city": "Red Deer, AB"
    }
    resp = client.post("/api/ads/leads", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "DISPATCHED"
    assert "lead_id" in data
    assert data["lead_fee_dollars"] == 25.00
    assert data["city"] == "Red Deer, AB"
    assert "SMS/Webhook dispatch" in data["message"]

    # 3. Verify campaign updated with attributed lead
    updated_camp = db.get_ad_campaign_by_id(cid)
    assert updated_camp["leads_count"] == 1
    assert updated_camp["total_billed_dollars"] == 349.00 + 25.00  # $374.00 total


def test_metro_cost_index_scaling():
    # Compare Red Deer (1.00x) vs Toronto (1.42x) vs NYC (1.68x)
    r_rd = client.get("/api/services?metro=red_deer")
    assert r_rd.status_code == 200
    d_rd = r_rd.json()
    job_rd = next(j for j in d_rd["jobs"] if j["id"] == "plumb_drain")
    
    r_to = client.get("/api/services?metro=toronto")
    assert r_to.status_code == 200
    d_to = r_to.json()
    job_to = next(j for j in d_to["jobs"] if j["id"] == "plumb_drain")

    r_ny = client.get("/api/services?metro=new_york")
    assert r_ny.status_code == 200
    d_ny = r_ny.json()
    job_ny = next(j for j in d_ny["jobs"] if j["id"] == "plumb_drain")

    # Toronto should be ~1.42x of Red Deer
    assert job_to["fair_indie_avg"] > job_rd["fair_indie_avg"]
    assert round(job_to["fair_indie_avg"]) == round(job_rd["fair_indie_avg"] * 1.42)

    # NYC should be ~1.68x of Red Deer
    assert job_ny["fair_indie_avg"] > job_to["fair_indie_avg"]
    assert round(job_ny["fair_indie_avg"]) == round(job_rd["fair_indie_avg"] * 1.68)


def test_admob_config_and_reward_simulation():
    # 1. Test AdMob test config
    cfg_res = client.get("/api/admob/config")
    assert cfg_res.status_code == 200
    cfg = cfg_res.json()
    assert cfg["environment"] == "sandbox"
    assert "android" in cfg
    assert "ios" in cfg
    assert "ca-app-pub-3940256099942544" in cfg["android"]["app_id"]
    assert cfg["reward_per_video_dollars"] == 0.25

    # 2. Test simulating watching a rewarded video ad
    sim_res = client.post("/api/admob/simulate-reward", json={
        "user_id": "usr_demo",
        "reward_amount": 0.25,
        "format": "REWARDED_VIDEO"
    })
    assert sim_res.status_code == 200
    data = sim_res.json()
    assert data["success"] is True
    assert data["reward_amount"] == 0.25
    assert data["new_balance"] >= 0.25


def test_admob_ssv_verification():
    # Test AdMob Server-Side Verification (SSV) callback
    ssv_res = client.get("/api/admob/ssv?user_id=usr_demo&reward_amount=0.25&key_id=12345&signature=test_sig")
    assert ssv_res.status_code == 200
    data = ssv_res.json()
    assert data["status"] == "VERIFIED"
    assert data["admob_ssv"] is True
    assert data["result"]["success"] is True
