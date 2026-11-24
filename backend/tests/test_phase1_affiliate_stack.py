"""
Test suite for Phase 1 Affiliate Stacking Engine:
- Amazon Associates (Direct for US & CA)
- Skimlinks (Big-Box aggregator for Walmart, Target, Best Buy, Home Depot, etc.)
- ShareASale (Etsy Artisans & Makers)
- Direct Shopify DTC / Refersion (Timber & Bean, Timber & Core Craft, etc.)
"""

import os
import sys
from urllib.parse import urlparse, parse_qs, unquote
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import affiliate_engine
from main import app

client = TestClient(app)


def test_amazon_us_and_ca_attribution():
    # US Amazon
    us_link = affiliate_engine.resolve_affiliate_url(
        store_or_platform="Amazon",
        product_title="AirPods Pro 2",
        user_id="usr_buyer_1"
    )
    assert "amazon.com" in us_link
    assert "tag=scoutshopper-20" in us_link
    assert "ascsubtag=usr_buyer_1" in us_link

    # CA Amazon
    ca_link = affiliate_engine.resolve_affiliate_url(
        store_or_platform="Amazon.ca",
        product_title="AirPods Pro 2",
        user_id="usr_buyer_2"
    )
    assert "amazon.ca" in ca_link
    assert "tag=scoutshopper-ca-20" in ca_link
    assert "ascsubtag=usr_buyer_2" in ca_link


def test_skimlinks_aggregator_routing():
    # Save original
    orig_pub = affiliate_engine.SKIMLINKS_PUB_ID
    try:
        affiliate_engine.SKIMLINKS_PUB_ID = "998877X1"
        
        # Target
        target_link = affiliate_engine.resolve_affiliate_url(
            store_or_platform="Target",
            product_title="Dyson V11",
            user_id="usr_shopper"
        )
        assert target_link.startswith("https://go.skimresources.com/?")
        parsed = urlparse(target_link)
        params = parse_qs(parsed.query)
        assert params["id"] == ["998877X1"]
        assert params["xcust"] == ["usr_shopper"]
        assert "target.com" in unquote(params["url"][0])

        # Walmart
        walmart_link = affiliate_engine.resolve_affiliate_url(
            store_or_platform="Walmart",
            product_title="Keurig K-Supreme",
            user_id="usr_shopper"
        )
        assert "walmart.com" in unquote(walmart_link)
        assert "xcust=usr_shopper" in walmart_link

        # Best Buy Canada
        bb_ca_link = affiliate_engine.resolve_affiliate_url(
            store_or_platform="Best Buy Canada",
            product_title="Sony WH-1000XM5",
            user_id="usr_shopper"
        )
        assert "bestbuy.ca" in unquote(bb_ca_link)
    finally:
        affiliate_engine.SKIMLINKS_PUB_ID = orig_pub


def test_shareasale_etsy_artisan_routing():
    orig_id = affiliate_engine.SHAREASALE_AFFILIATE_ID
    try:
        affiliate_engine.SHAREASALE_AFFILIATE_ID = "554433"
        
        etsy_link = affiliate_engine.resolve_affiliate_url(
            store_or_platform="Etsy Maker",
            product_title="Handcrafted Leather Watch Strap",
            user_id="usr_artisan_fan",
            is_shop_small=True
        )
        assert etsy_link.startswith("https://www.shareasale.com/r.cfm?")
        parsed = urlparse(etsy_link)
        params = parse_qs(parsed.query)
        assert params["u"] == ["554433"]
        assert params["m"] == ["5093"]  # Etsy merchant ID on ShareASale
        assert params["afftrack"] == ["usr_artisan_fan"]
        assert "etsy.com" in unquote(params["urllink"][0])
    finally:
        affiliate_engine.SHAREASALE_AFFILIATE_ID = orig_id


def test_shopify_dtc_direct_refersion_routing():
    dtc_link = affiliate_engine.resolve_affiliate_url(
        store_or_platform="Shopify DTC",
        brand_name="Timber & Bean Roastery",
        raw_url="https://timberandbean.com/products/roast",
        user_id="usr_coffee",
        is_shop_small=True
    )
    assert "timberandbean.com" in dtc_link
    assert f"ref={affiliate_engine.DEFAULT_REF_CODE}" in dtc_link
    assert "discount=SCOUTSHOPPER" in dtc_link
    assert "subid=usr_coffee" in dtc_link


def test_enhance_product_affiliate_links_in_place():
    prod = {
        "title": "Smart Wi-Fi Thermostat",
        "retailer_offers": [
            {"retailer": "Amazon", "price": 129.99, "affiliate_url": ""},
            {"retailer": "Home Depot", "price": 139.99, "affiliate_url": ""}
        ],
        "shop_small_alternatives": [
            {"brand_name": "EcoSmart Woodworks", "platform": "Shopify DTC", "merchant_url": ""}
        ]
    }
    affiliate_engine.enhance_product_affiliate_links(prod, user_id="usr_home")
    
    assert "tag=scoutshopper-20" in prod["retailer_offers"][0]["affiliate_url"]
    assert "ascsubtag=usr_home" in prod["retailer_offers"][0]["affiliate_url"]
    assert "homedepot.com" in prod["retailer_offers"][1]["affiliate_url"]
    assert "subid=usr_home" in prod["retailer_offers"][1]["affiliate_url"]
    assert "discount=SCOUTSHOPPER" in prod["shop_small_alternatives"][0]["merchant_url"]


def test_api_scan_returns_phase1_affiliate_links():
    # Test scan for Dyson V11 (885609027814)
    res = client.get("/api/scan/885609027814?region=US")
    assert res.status_code == 200
    data = res.json()
    
    # Check offers contain Phase 1 compliant affiliate links
    offers = data["all_offers"]
    amazon_offer = next((o for o in offers if "Amazon" in o["retailer"]), None)
    assert amazon_offer is not None
    assert "tag=" in amazon_offer["affiliate_url"]
    assert "scoutshopper" in amazon_offer["affiliate_url"] or "omnicart" in amazon_offer["affiliate_url"]

    # Check Shop Small alternative has valid direct maker link
    assert len(data["shop_small_alternatives"]) > 0
    maker = data["shop_small_alternatives"][0]
    assert "merchant_url" in maker
    assert "discount=" in maker["merchant_url"] or "ref=" in maker["merchant_url"]
