"""
OmniCart AI - Catalog Data & Mock Retail Database
Includes UPC barcode mappings, big-box prices, shipping rules, and independent Shopify/Etsy alternatives.
"""
import urllib.request
import json
import re
from affiliate_engine import enhance_product_affiliate_links


PRODUCTS_DATABASE = {
    "885609027814": {
        "upc": "885609027814",
        "title": "Dyson V11 Cordless Stick Vacuum Cleaner (Nickel/Blue)",
        "model_number": "368340-01",
        "category": "Home & Cleaning",
        "gift_recipients": ["for_her", "for_him", "home_chef", "family"],
        "gift_occasions": ["holiday", "anniversary", "black_friday"],
        "msrp": 599.99,
        "physical_store_price": 599.99,
        "physical_store_name": "Best Buy",
        "image_url": "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=500&auto=format&fit=crop&q=60",
        "retailer_offers": [
            {
                "retailer": "Amazon",
                "price": 499.99,
                "shipping": 0.00,
                "estimated_tax": 41.25,
                "in_stock": True,
                "shipped_and_sold_by_retailer": True,
                "seller_name": "Amazon.com",
                "model_number_match": True,
                "affiliate_url": "https://amazon.com/dp/B085F9R3QW?tag=omnicart-20",
                "delivery_days": 1
            },
            {
                "retailer": "Walmart",
                "price": 519.99,
                "shipping": 0.00,
                "estimated_tax": 42.90,
                "in_stock": True,
                "shipped_and_sold_by_retailer": True,
                "seller_name": "Walmart.com",
                "model_number_match": True,
                "affiliate_url": "https://walmart.com/ip/dyson-v11?aff=omnicart",
                "delivery_days": 2
            },
            {
                "retailer": "Target",
                "price": 549.99,
                "shipping": 0.00,
                "estimated_tax": 45.37,
                "in_stock": True,
                "shipped_and_sold_by_retailer": True,
                "seller_name": "Target Stores",
                "model_number_match": True,
                "affiliate_url": "https://target.com/p/dyson-v11?aff=omnicart",
                "delivery_days": 2
            }
        ],
        "shop_small_alternatives": [
            {
                "brand_name": "Veloce Home Goods",
                "platform": "Shopify DTC",
                "title": "The Artisan Cordless Cyclone Pro with HEPA Filter",
                "price": 279.00,
                "shipping": 0.00,
                "rating": 4.8,
                "review_count": 842,
                "savings_vs_store": 320.99,
                "perk": "Handcrafted repairability, modular battery, 5-yr warranty",
                "image_url": "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=500&auto=format&fit=crop&q=60",
                "merchant_url": "https://velocehome.com/products/cyclone-pro?ref=omnicart",
                "affiliate_commission_rate": "15%"
            }
        ]
    },
    "027242919419": {
        "upc": "027242919419",
        "title": "Sony WH-1000XM5 Wireless Noise-Canceling Headphones",
        "model_number": "WH1000XM5/B",
        "category": "Consumer Electronics",
        "gift_recipients": ["for_him", "for_her", "tech_enthusiast", "teens"],
        "gift_occasions": ["holiday", "birthday", "black_friday"],
        "msrp": 399.99,
        "physical_store_price": 399.99,
        "physical_store_name": "Target",
        "image_url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60",
        "retailer_offers": [
            {
                "retailer": "Amazon",
                "price": 328.00,
                "shipping": 0.00,
                "estimated_tax": 27.06,
                "in_stock": True,
                "shipped_and_sold_by_retailer": True,
                "seller_name": "Amazon.com",
                "model_number_match": True,
                "affiliate_url": "https://amazon.com/dp/B09XS7JWHH?tag=omnicart-20",
                "delivery_days": 1
            },
            {
                "retailer": "Best Buy",
                "price": 349.99,
                "shipping": 0.00,
                "estimated_tax": 28.87,
                "in_stock": True,
                "shipped_and_sold_by_retailer": True,
                "seller_name": "Best Buy",
                "model_number_match": True,
                "affiliate_url": "https://bestbuy.com/site/sony-wh1000xm5?aff=omnicart",
                "delivery_days": 1
            },
            {
                "retailer": "B&H Photo",
                "price": 328.00,
                "shipping": 0.00,
                "estimated_tax": 27.06,
                "in_stock": True,
                "shipped_and_sold_by_retailer": True,
                "seller_name": "B&H Photo Video",
                "model_number_match": True,
                "affiliate_url": "https://bhphotovideo.com/c/product/sony-headphones?aff=omnicart",
                "delivery_days": 2
            }
        ],
        "shop_small_alternatives": [
            {
                "brand_name": "Aura Acoustics Studio",
                "platform": "Etsy Artisan",
                "title": "Custom Hand-Carved Walnut ANC Studio Headphones",
                "price": 245.00,
                "shipping": 0.00,
                "rating": 4.9,
                "review_count": 318,
                "savings_vs_store": 154.99,
                "perk": "Solid natural walnut wood earcups, custom calibrated sound profile",
                "image_url": "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=500&auto=format&fit=crop&q=60",
                "merchant_url": "https://etsy.com/listing/aura-acoustics-walnut?ref=omnicart",
                "affiliate_commission_rate": "12%"
            }
        ]
    },
    "611247385203": {
        "upc": "611247385203",
        "title": "Keurig K-Supreme Single Serve Coffee Maker",
        "model_number": "5000350796",
        "category": "Kitchen & Dining",
        "gift_recipients": ["for_her", "for_him", "home_chef", "family"],
        "gift_occasions": ["holiday", "birthday", "secret_santa"],
        "msrp": 169.99,
        "physical_store_price": 169.99,
        "physical_store_name": "Walmart",
        "image_url": "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=500&auto=format&fit=crop&q=60",
        "retailer_offers": [
            {
                "retailer": "Amazon",
                "price": 129.99,
                "shipping": 0.00,
                "estimated_tax": 10.72,
                "in_stock": True,
                "shipped_and_sold_by_retailer": True,
                "seller_name": "Amazon.com",
                "model_number_match": True,
                "affiliate_url": "https://amazon.com/dp/B0892R17F2?tag=omnicart-20",
                "delivery_days": 1
            },
            {
                "retailer": "Target",
                "price": 139.99,
                "shipping": 0.00,
                "estimated_tax": 11.55,
                "in_stock": True,
                "shipped_and_sold_by_retailer": True,
                "seller_name": "Target Stores",
                "model_number_match": True,
                "affiliate_url": "https://target.com/p/keurig-k-supreme?aff=omnicart",
                "delivery_days": 2
            }
        ],
        "shop_small_alternatives": [
            {
                "brand_name": "Timber & Bean Roastery",
                "platform": "Shopify DTC",
                "title": "Manual Precision Pour-Over Brewer & Fresh Roast Trio",
                "price": 89.00,
                "shipping": 0.00,
                "rating": 5.0,
                "review_count": 612,
                "savings_vs_store": 80.99,
                "perk": "Zero plastic waste, includes 3 bags of single-origin beans roasted weekly",
                "image_url": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=60",
                "merchant_url": "https://timberandbean.com/bundle?ref=omnicart",
                "affiliate_commission_rate": "18%"
            }
        ]
    },
    "041908001015": {
        "upc": "041908001015",
        "title": "Stanley Quencher H2.0 FlowState Stainless Tumbler (40 oz)",
        "model_number": "10-10824-001",
        "category": "Drinkware & Outdoor",
        "gift_recipients": ["for_her", "for_him", "teens", "outdoors"],
        "gift_occasions": ["holiday", "birthday", "stocking_stuffer", "secret_santa"],
        "msrp": 45.00,
        "physical_store_price": 45.00,
        "physical_store_name": "Target",
        "image_url": "https://images.unsplash.com/photo-1544816155-12df9643f363?w=500&auto=format&fit=crop&q=60",
        "retailer_offers": [
            {
                "retailer": "Amazon",
                "price": 38.00,
                "shipping": 0.00,
                "estimated_tax": 3.14,
                "in_stock": True,
                "shipped_and_sold_by_retailer": True,
                "seller_name": "Amazon.com",
                "model_number_match": True,
                "affiliate_url": "https://amazon.com/dp/B0BC2M1Y2Z?tag=omnicart-20",
                "delivery_days": 1
            },
            {
                "retailer": "REI",
                "price": 45.00,
                "shipping": 5.99,
                "estimated_tax": 3.71,
                "in_stock": True,
                "shipped_and_sold_by_retailer": True,
                "seller_name": "REI Co-op",
                "model_number_match": True,
                "affiliate_url": "https://rei.com/product/stanley-40oz?aff=omnicart",
                "delivery_days": 3
            }
        ],
        "shop_small_alternatives": [
            {
                "brand_name": "Ridge & Root Workshop",
                "platform": "Etsy Maker",
                "title": "Hand-Engraved Copper Insulated Flask with Leather Sleeve",
                "price": 34.00,
                "shipping": 0.00,
                "rating": 4.9,
                "review_count": 1240,
                "savings_vs_store": 11.00,
                "perk": "Zero leak guarantee, custom laser-etched initials included free",
                "image_url": "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&auto=format&fit=crop&q=60",
                "merchant_url": "https://etsy.com/listing/ridge-root-flask?ref=omnicart",
                "affiliate_commission_rate": "15%"
            }
        ]
    },
    "078945612301": {
        "upc": "078945612301",
        "title": "Anker MagGo Magnetic Qi2 Fast Wireless Power Bank (10,000mAh)",
        "model_number": "A1654",
        "category": "Consumer Electronics",
        "gift_recipients": ["for_him", "for_her", "tech_enthusiast", "teens"],
        "gift_occasions": ["holiday", "birthday", "stocking_stuffer", "secret_santa", "black_friday"],
        "msrp": 49.99,
        "physical_store_price": 49.99,
        "physical_store_name": "Target",
        "image_url": "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=500&auto=format&fit=crop&q=60",
        "retailer_offers": [
            {
                "retailer": "Amazon",
                "price": 34.99,
                "shipping": 0.00,
                "estimated_tax": 2.89,
                "in_stock": True,
                "shipped_and_sold_by_retailer": True,
                "seller_name": "Amazon.com",
                "model_number_match": True,
                "affiliate_url": "https://amazon.com/dp/B0CP9P7T8Q?tag=omnicart-20",
                "delivery_days": 1
            },
            {
                "retailer": "Best Buy",
                "price": 39.99,
                "shipping": 0.00,
                "estimated_tax": 3.30,
                "in_stock": True,
                "shipped_and_sold_by_retailer": True,
                "seller_name": "Best Buy",
                "model_number_match": True,
                "affiliate_url": "https://bestbuy.com/site/anker-maggo?aff=omnicart",
                "delivery_days": 2
            }
        ],
        "shop_small_alternatives": [
            {
                "brand_name": "Timber & Core Craft",
                "platform": "Shopify DTC",
                "title": "Artisan Hand-Turned Walnut Magnetic Wireless Stand",
                "price": 29.00,
                "shipping": 0.00,
                "rating": 4.9,
                "review_count": 482,
                "savings_vs_store": 20.99,
                "perk": "Solid American black walnut, braided Kevlar cable included",
                "image_url": "https://images.unsplash.com/photo-1586105251261-72a756497a11?w=500&auto=format&fit=crop&q=60",
                "merchant_url": "https://timbercore.com/stand?ref=omnicart",
                "affiliate_commission_rate": "15%"
            }
        ]
    },
    "096385274102": {
        "upc": "096385274102",
        "title": "AromaPure Handcrafted Organic Soy Aromatherapy Candle Trio",
        "model_number": "AP-CAN-03",
        "category": "Home & Cleaning",
        "gift_recipients": ["for_her", "family", "secret_santa", "home_chef"],
        "gift_occasions": ["holiday", "stocking_stuffer", "birthday"],
        "msrp": 32.00,
        "physical_store_price": 32.00,
        "physical_store_name": "Bed Bath & Beyond",
        "image_url": "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=500&auto=format&fit=crop&q=60",
        "retailer_offers": [
            {
                "retailer": "Amazon",
                "price": 19.99,
                "shipping": 0.00,
                "estimated_tax": 1.65,
                "in_stock": True,
                "shipped_and_sold_by_retailer": True,
                "seller_name": "Amazon.com",
                "model_number_match": True,
                "affiliate_url": "https://amazon.com/dp/B08XYZ1234?tag=omnicart-20",
                "delivery_days": 1
            }
        ],
        "shop_small_alternatives": [
            {
                "brand_name": "Green Mountain Apiaries",
                "platform": "Etsy Maker",
                "title": "Vermont Wildflower Pure Honeycomb & Beeswax Candle",
                "price": 18.00,
                "shipping": 0.00,
                "rating": 5.0,
                "review_count": 930,
                "savings_vs_store": 14.00,
                "perk": "100% pure raw beeswax, cotton wick, burns 45+ hours",
                "image_url": "https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?w=500&auto=format&fit=crop&q=60",
                "merchant_url": "https://etsy.com/listing/green-mountain-candle?ref=omnicart",
                "affiliate_commission_rate": "20%"
            }
        ]
    }
}


# ---------------------------------------------------------------------------
# Canada demo catalog (ILLUSTRATIVE mock prices in CAD - replace with live feeds).
# Tax is computed per province by main.py, so estimated_tax is a placeholder.
# ---------------------------------------------------------------------------
def _ca_offer(retailer, price, seller, direct=True, days=2, **extra):
    o = {
        "retailer": retailer, "price": price, "shipping": 0.00, "estimated_tax": 0.0,
        "currency": "CAD", "seller_country": "CA", "condition": "new",
        "is_special_sale": False, "is_preorder_or_limited": False,
        "in_stock": True, "shipped_and_sold_by_retailer": direct, "seller_name": seller,
        "model_number_match": True,
        "affiliate_url": f"https://example.invalid/{retailer.lower().replace(' ', '')}?aff=omnicart-ca",
        "delivery_days": days,
    }
    o.update(extra)
    return o


CA_PRODUCTS_DATABASE = {
    "027242919419": {
        "upc": "027242919419",
        "title": "Sony WH-1000XM5 Wireless Noise-Canceling Headphones",
        "model_number": "WH1000XM5/B",
        "category": "Consumer Electronics",
        "gift_recipients": ["for_him", "for_her", "tech_enthusiast", "teens", "family"],
        "gift_occasions": ["holiday", "birthday", "black_friday", "stocking_stuffer", "all"],
        "msrp": 549.99,
        "physical_store_price": 549.99,
        "physical_store_name": "Best Buy Canada",
        "image_url": PRODUCTS_DATABASE["027242919419"]["image_url"],
        "retailer_offers": [
            _ca_offer("Amazon.ca", 449.99, "Amazon.ca", days=1),
            _ca_offer("Walmart Canada", 479.99, "Walmart Canada"),
            _ca_offer("Costco.ca", 469.99, "Costco Wholesale Canada"),
        ],
        "shop_small_alternatives": [
            {
                "brand_name": "Maple Sound Co. (demo)", "platform": "Shopify DTC",
                "title": "Handbuilt Over-Ear ANC Headphones", "price": 319.00, "shipping": 0.00,
                "rating": 4.8, "review_count": 204, "perk": "Canadian-assembled, 3-yr warranty",
                "image_url": PRODUCTS_DATABASE["027242919419"]["shop_small_alternatives"][0]["image_url"],
                "merchant_url": "https://example.invalid/maplesound?ref=omnicart-ca",
                "affiliate_commission_rate": "14%",
            }
        ],
    },
    "885609027814": {
        "upc": "885609027814",
        "title": "Dyson V11 Cordless Stick Vacuum Cleaner (Nickel/Blue)",
        "model_number": "368340-01",
        "category": "Home & Cleaning",
        "gift_recipients": ["for_her", "for_him", "home_chef", "family", "tech_enthusiast"],
        "gift_occasions": ["holiday", "anniversary", "black_friday", "birthday", "all"],
        "msrp": 799.99,
        "physical_store_price": 799.99,
        "physical_store_name": "Best Buy Canada",
        "image_url": PRODUCTS_DATABASE["885609027814"]["image_url"],
        "retailer_offers": [
            # Cheapest is a marketplace seller: Best Buy Canada will NOT match it.
            _ca_offer("Amazon.ca", 649.99, "TechDeals Canada (3rd-party)", direct=False, days=3),
            _ca_offer("Amazon.ca", 699.99, "Amazon.ca", days=1),
            _ca_offer("Walmart Canada", 729.99, "Walmart Canada"),
        ],
        "shop_small_alternatives": [
            {
                "brand_name": "Veloce Home Goods (demo)", "platform": "Shopify DTC",
                "title": "Artisan Cordless Cyclone Pro with HEPA Filter", "price": 379.00, "shipping": 0.00,
                "rating": 4.8, "review_count": 842, "perk": "Modular battery, 5-yr warranty",
                "image_url": PRODUCTS_DATABASE["885609027814"]["shop_small_alternatives"][0]["image_url"],
                "merchant_url": "https://example.invalid/velocehome-ca?ref=omnicart-ca",
                "affiliate_commission_rate": "15%",
            }
        ],
    },
    "611247385203": {
        "upc": "611247385203",
        "title": "Keurig K-Supreme Single Serve Coffee Maker",
        "model_number": "5000350796",
        "category": "Kitchen & Dining",
        "gift_recipients": ["for_her", "for_him", "home_chef", "family", "secret_santa"],
        "gift_occasions": ["holiday", "birthday", "secret_santa", "black_friday", "all"],
        "msrp": 229.99,
        "physical_store_price": 229.99,
        "physical_store_name": "Walmart Canada",  # policy not yet verified -> app says so
        "image_url": PRODUCTS_DATABASE["611247385203"]["image_url"],
        "retailer_offers": [
            _ca_offer("Amazon.ca", 179.99, "Amazon.ca", days=1),
            _ca_offer("Canadian Tire", 199.99, "Canadian Tire"),
        ],
        "shop_small_alternatives": [
            {
                "brand_name": "Timber & Bean (demo)", "platform": "Shopify DTC",
                "title": "Manual Pour-Over Brewer & Fresh Roast Trio", "price": 109.00, "shipping": 0.00,
                "rating": 5.0, "review_count": 612, "perk": "Zero plastic waste, weekly roast",
                "image_url": PRODUCTS_DATABASE["611247385203"]["shop_small_alternatives"][0]["image_url"],
                "merchant_url": "https://example.invalid/timberbean-ca?ref=omnicart-ca",
                "affiliate_commission_rate": "18%",
            }
        ],
    },
    "041908001015": {
        "upc": "041908001015",
        "title": "Stanley Quencher H2.0 FlowState Stainless Tumbler (40 oz)",
        "model_number": "10-10824-001",
        "category": "Drinkware & Outdoor",
        "gift_recipients": ["for_her", "for_him", "teens", "outdoors", "family", "secret_santa"],
        "gift_occasions": ["holiday", "birthday", "stocking_stuffer", "secret_santa", "black_friday", "all"],
        "msrp": 59.99,
        "physical_store_price": 59.99,
        "physical_store_name": "Atmosphere Canada",
        "image_url": PRODUCTS_DATABASE["041908001015"]["image_url"],
        "retailer_offers": [
            _ca_offer("Amazon.ca", 49.99, "Amazon.ca", days=1),
            _ca_offer("Canadian Tire", 54.99, "Canadian Tire"),
            _ca_offer("Sport Chek", 59.99, "Sport Chek"),
        ],
        "shop_small_alternatives": [
            {
                "brand_name": "Ridge & Root (demo)", "platform": "Shopify DTC",
                "title": "Hand-Engraved Copper Insulated Flask", "price": 44.00, "shipping": 0.00,
                "rating": 4.9, "review_count": 1240, "perk": "Canadian crafted, zero leak guarantee",
                "image_url": PRODUCTS_DATABASE["041908001015"]["shop_small_alternatives"][0]["image_url"],
                "merchant_url": "https://example.invalid/ridgeroot-ca?ref=omnicart-ca",
                "affiliate_commission_rate": "15%",
            }
        ],
    },
    "078945612301": {
        "upc": "078945612301",
        "title": "Anker MagGo Magnetic Qi2 Fast Wireless Power Bank (10,000mAh)",
        "model_number": "A1654",
        "category": "Consumer Electronics",
        "gift_recipients": ["for_him", "for_her", "tech_enthusiast", "teens", "secret_santa", "family"],
        "gift_occasions": ["holiday", "birthday", "stocking_stuffer", "secret_santa", "black_friday", "all"],
        "msrp": 69.99,
        "physical_store_price": 69.99,
        "physical_store_name": "Best Buy Canada",
        "image_url": PRODUCTS_DATABASE["078945612301"]["image_url"],
        "retailer_offers": [
            _ca_offer("Amazon.ca", 49.99, "Amazon.ca", days=1),
            _ca_offer("Walmart Canada", 54.99, "Walmart Canada"),
        ],
        "shop_small_alternatives": [
            {
                "brand_name": "Timber & Core Craft (CA)", "platform": "Shopify DTC",
                "title": "Artisan Hand-Turned Walnut Magnetic Wireless Stand", "price": 39.00, "shipping": 0.00,
                "rating": 4.9, "review_count": 482,
                "perk": "Solid Canadian black walnut, braided Kevlar cable included",
                "image_url": PRODUCTS_DATABASE["078945612301"]["shop_small_alternatives"][0]["image_url"],
                "merchant_url": "https://example.invalid/timbercore-ca?ref=omnicart-ca",
                "affiliate_commission_rate": "15%",
            }
        ],
    },
    "096385274102": {
        "upc": "096385274102",
        "title": "AromaPure Handcrafted Organic Soy Aromatherapy Candle Trio",
        "model_number": "AP-CAN-03",
        "category": "Home & Cleaning",
        "gift_recipients": ["for_her", "family", "secret_santa", "home_chef", "for_him", "teens"],
        "gift_occasions": ["holiday", "stocking_stuffer", "birthday", "secret_santa", "black_friday", "all"],
        "msrp": 42.00,
        "physical_store_price": 42.00,
        "physical_store_name": "Indigo Books & Music Canada",
        "image_url": PRODUCTS_DATABASE["096385274102"]["image_url"],
        "retailer_offers": [
            _ca_offer("Amazon.ca", 28.00, "Amazon.ca", days=1),
            _ca_offer("Walmart Canada", 32.00, "Walmart Canada"),
        ],
        "shop_small_alternatives": [
            {
                "brand_name": "Green Mountain Apiaries (CA)", "platform": "Etsy Maker",
                "title": "Quebec Wildflower Pure Honeycomb & Beeswax Candle", "price": 24.00, "shipping": 0.00,
                "rating": 5.0, "review_count": 930,
                "perk": "100% pure raw beeswax, cotton wick, burns 45+ hours",
                "image_url": PRODUCTS_DATABASE["096385274102"]["shop_small_alternatives"][0]["image_url"],
                "merchant_url": "https://example.invalid/greenmountain-ca?ref=omnicart-ca",
                "affiliate_commission_rate": "20%",
            }
        ],
    },
}

for _p in PRODUCTS_DATABASE.values():
    enhance_product_affiliate_links(_p)

for _p in CA_PRODUCTS_DATABASE.values():
    enhance_product_affiliate_links(_p)

CATALOGS = {"US": PRODUCTS_DATABASE, "CA": CA_PRODUCTS_DATABASE}



def get_catalog(region_code: str) -> dict:
    return CATALOGS.get((region_code or "").upper(), {})


# ===========================================================================
# Local Services Arbitrage & Quote Benchmarks Database
# Compares Fair Local Independent Pros vs. Corporate / PE Franchise Markups
# ===========================================================================

LOCAL_SERVICES_DATABASE = {
    "sectors": [
        {"id": "trades", "name": "Home Trades & Repair", "icon": "wrench"},
        {"id": "property", "name": "Property & Exterior", "icon": "home"},
        {"id": "auto", "name": "Automotive & Garage", "icon": "tool"},
        {"id": "health", "name": "Dental & Healthcare", "icon": "shield"},
        {"id": "legal", "name": "Legal & Financial", "icon": "briefcase"},
        {"id": "personal", "name": "Personal & Family Care", "icon": "user"}
    ],
    "jobs": [
        # --- Trades & Emergency Services ---
        {
            "id": "plumb_drain",
            "sector": "trades",
            "service": "Plumbing",
            "title": "Main Drain / Sewer Snaking & Clearing",
            "fair_indie_min": 120.0, "fair_indie_max": 220.0, "fair_indie_avg": 170.0,
            "franchise_min": 320.0, "franchise_max": 580.0, "franchise_avg": 450.0,
            "typical_hourly_indie": "$85 - $130 / hr",
            "typical_hourly_franchise": "$210 - $320 / hr",
            "savings_avg": 280.0, "savings_pct": 62,
            "rip_off_warning": "Corporate chains frequently claim a simple clogged pipe requires a full $8,000 hydro-jetting or trenchless sewer line replacement without showing video proof.",
            "insider_tip": "Always demand to see the camera footage of a claimed pipe break before agreeing to dig up your yard."
        },
        {
            "id": "plumb_heater",
            "sector": "trades",
            "service": "Plumbing",
            "title": "50-Gallon Water Heater Replacement (Supply & Install)",
            "fair_indie_min": 1150.0, "fair_indie_max": 1650.0, "fair_indie_avg": 1400.0,
            "franchise_min": 2400.0, "franchise_max": 3800.0, "franchise_avg": 3100.0,
            "typical_hourly_indie": "$90 - $140 / hr",
            "typical_hourly_franchise": "$220 - $340 / hr",
            "savings_avg": 1700.0, "savings_pct": 55,
            "rip_off_warning": "National franchise plumbers mark up the exact same Rheem or Bradford White unit from Home Depot by 250% and charge $1,500+ for 3 hours of labor.",
            "insider_tip": "Buy the water heater yourself from a supply house or big-box store and hire an independent licensed master plumber for labor only ($400-$650)."
        },
        {
            "id": "hvac_tuneup",
            "sector": "trades",
            "service": "HVAC",
            "title": "Seasonal AC / Furnace 24-Point Tune-Up",
            "fair_indie_min": 75.0, "fair_indie_max": 125.0, "fair_indie_avg": 95.0,
            "franchise_min": 189.0, "franchise_max": 299.0, "franchise_avg": 245.0,
            "typical_hourly_indie": "$85 - $125 / hr",
            "typical_hourly_franchise": "$195 - $280 / hr",
            "savings_avg": 150.0, "savings_pct": 61,
            "rip_off_warning": "Franchise 'tune-up specials' ($29 loss leaders) are designed to get high-pressure commission salespeople into your attic to declare your system 'red-tagged' and condemn it.",
            "insider_tip": "Never buy a replacement furnace or AC unit based on a single diagnosis during a promotional seasonal tune-up."
        },
        {
            "id": "hvac_capacitor",
            "sector": "trades",
            "service": "HVAC",
            "title": "AC Dual Run Capacitor Replacement",
            "fair_indie_min": 130.0, "fair_indie_max": 220.0, "fair_indie_avg": 175.0,
            "franchise_min": 420.0, "franchise_max": 680.0, "franchise_avg": 550.0,
            "typical_hourly_indie": "$90 - $140 / hr",
            "typical_hourly_franchise": "$210 - $290 / hr",
            "savings_avg": 375.0, "savings_pct": 68,
            "rip_off_warning": "The capacitor part costs $18 retail; corporate chains charge $450 to $650 for a 15-minute fix or use it to push a $12,000 whole-home HVAC replacement.",
            "insider_tip": "Ask the technician for the exact microfarad (µF) reading before and after replacement."
        },
        {
            "id": "elec_panel",
            "sector": "trades",
            "service": "Electrical",
            "title": "200-Amp Main Electrical Panel Upgrade",
            "fair_indie_min": 1750.0, "fair_indie_max": 2700.0, "fair_indie_avg": 2200.0,
            "franchise_min": 3800.0, "franchise_max": 5900.0, "franchise_avg": 4850.0,
            "typical_hourly_indie": "$95 - $150 / hr",
            "typical_hourly_franchise": "$220 - $310 / hr",
            "savings_avg": 2650.0, "savings_pct": 55,
            "rip_off_warning": "Large electrical contractors bundle unnecessary whole-house surge devices and premium breaker brand-ups at 400% markup.",
            "insider_tip": "Make sure your quote explicitly includes pulling city/county permits and the electric utility coordination fee."
        },
        {
            "id": "elec_ev",
            "sector": "trades",
            "service": "Electrical",
            "title": "EV Level 2 Charger Dedicated 50A Circuit Install",
            "fair_indie_min": 450.0, "fair_indie_max": 850.0, "fair_indie_avg": 650.0,
            "franchise_min": 1250.0, "franchise_max": 2200.0, "franchise_avg": 1725.0,
            "typical_hourly_indie": "$90 - $145 / hr",
            "typical_hourly_franchise": "$200 - $290 / hr",
            "savings_avg": 1075.0, "savings_pct": 62,
            "rip_off_warning": "Mentioning Tesla or Rivian often doubles contractor quotes. It is identical to a standard 240V NEMA 14-50 clothes dryer outlet.",
            "insider_tip": "Ask for a quote to install a '240V 50-amp garage outlet for high-power tools' rather than saying 'EV charger'."
        },
        {
            "id": "roof_repair",
            "sector": "trades",
            "service": "Roofing",
            "title": "Asphalt Shingle Roof Leak Repair & Pipe Boot Seal",
            "fair_indie_min": 250.0, "fair_indie_max": 550.0, "fair_indie_avg": 400.0,
            "franchise_min": 850.0, "franchise_max": 1600.0, "franchise_avg": 1225.0,
            "typical_hourly_indie": "$80 - $130 / hr",
            "typical_hourly_franchise": "$190 - $280 / hr",
            "savings_avg": 825.0, "savings_pct": 67,
            "rip_off_warning": "Storm-chaser roofing franchises will push to file an insurance claim for a $18,000 roof replacement over a simple cracked $15 rubber pipe boot.",
            "insider_tip": "Most minor ceiling leaks are failed neoprene pipe flashing collars that take 45 minutes to replace."
        },

        # --- Property & Exterior Services ---
        {
            "id": "prop_tree",
            "sector": "property",
            "service": "Tree Care",
            "title": "Mature Tree Trimming & Deadwood Canopy Pruning",
            "fair_indie_min": 350.0, "fair_indie_max": 750.0, "fair_indie_avg": 550.0,
            "franchise_min": 950.0, "franchise_max": 1850.0, "franchise_avg": 1400.0,
            "typical_hourly_indie": "$85 - $135 / hr",
            "typical_hourly_franchise": "$200 - $310 / hr",
            "savings_avg": 850.0, "savings_pct": 61,
            "rip_off_warning": "Unlicensed door-to-door crews offer cheap cash bids but carry no worker's comp, leaving you legally liable for climber injuries on your property.",
            "insider_tip": "Always request a Certificate of Insurance (COI) sent directly from the tree company's insurance broker before work begins."
        },
        {
            "id": "prop_pest",
            "sector": "property",
            "service": "Pest Control",
            "title": "Quarterly Perimeter Barrier Treatment (Standard Home)",
            "fair_indie_min": 79.0, "fair_indie_max": 129.0, "fair_indie_avg": 105.0,
            "franchise_min": 175.0, "franchise_max": 275.0, "franchise_avg": 225.0,
            "typical_hourly_indie": "$70 - $110 / hr",
            "typical_hourly_franchise": "$160 - $240 / hr",
            "savings_avg": 120.0, "savings_pct": 53,
            "rip_off_warning": "National pest chains lock homeowners into 24-month autorenewal contracts with $300 early termination penalties.",
            "insider_tip": "Independent pest operators use the exact same bifenthrin/fipronil chemistry without requiring long-term lock-in contracts."
        },
        {
            "id": "prop_clean",
            "sector": "property",
            "service": "House Cleaning",
            "title": "Move-Out / Deep Clean (3 Bed, 2 Bath Home)",
            "fair_indie_min": 180.0, "fair_indie_max": 290.0, "fair_indie_avg": 235.0,
            "franchise_min": 380.0, "franchise_max": 620.0, "franchise_avg": 500.0,
            "typical_hourly_indie": "$35 - $55 / hr",
            "typical_hourly_franchise": "$75 - $120 / hr",
            "savings_avg": 265.0, "savings_pct": 53,
            "rip_off_warning": "National maid franchises take 50-60% of the customer bill as franchise royalty and overhead, paying the actual cleaners minimum wage.",
            "insider_tip": "Hiring independent residential housecleaners directly pays the cleaners 40% more while saving you over 45%."
        },

        # --- Automotive & Garage ---
        {
            "id": "auto_brakes",
            "sector": "auto",
            "service": "Auto Repair",
            "title": "Front Brake Pads & Rotors Replacement (Ceramic)",
            "fair_indie_min": 240.0, "fair_indie_max": 390.0, "fair_indie_avg": 315.0,
            "franchise_min": 580.0, "franchise_max": 890.0, "franchise_avg": 735.0,
            "typical_hourly_indie": "$90 - $130 / hr",
            "typical_hourly_franchise": "$195 - $275 / hr",
            "savings_avg": 420.0, "savings_pct": 57,
            "rip_off_warning": "Dealership service advisors work on commission and routinely recommend brake rotor replacement at 50% pad wear.",
            "insider_tip": "Ask for the millimeter pad thickness measurement (anything above 4mm still has thousands of safe driving miles remaining)."
        },
        {
            "id": "auto_alt",
            "sector": "auto",
            "service": "Auto Repair",
            "title": "Alternator or Starter Motor Replacement",
            "fair_indie_min": 350.0, "fair_indie_max": 580.0, "fair_indie_avg": 465.0,
            "franchise_min": 850.0, "franchise_max": 1350.0, "franchise_avg": 1100.0,
            "typical_hourly_indie": "$95 - $135 / hr",
            "typical_hourly_franchise": "$190 - $280 / hr",
            "savings_avg": 635.0, "savings_pct": 58,
            "rip_off_warning": "Dealers mark up OEM remanufactured alternators from $180 wholesale to $650 retail plus diagnostic charges.",
            "insider_tip": "Independent ASE-certified garages install genuine Denso or Bosch parts with identical 2-year/24,000-mile warranties."
        },

        # --- Healthcare & Dental ---
        {
            "id": "dent_clean",
            "sector": "health",
            "service": "Dental",
            "title": "Comprehensive Dental Exam, Bitewing X-Rays & Prophy Cleaning",
            "fair_indie_min": 110.0, "fair_indie_max": 185.0, "fair_indie_avg": 145.0,
            "franchise_min": 260.0, "franchise_max": 420.0, "franchise_avg": 340.0,
            "typical_hourly_indie": "Independent Family Practice",
            "typical_hourly_franchise": "Private Equity DSO Corporate Chain",
            "savings_avg": 195.0, "savings_pct": 57,
            "rip_off_warning": "Corporate DSO dental chains pressure hygienists to diagnose 'stage 2 gum disease' to bill $800+ for deep scaling / root planing on patients with normal teeth.",
            "insider_tip": "Always ask for a cash-pay / self-pay upfront discount: independent dentists typically offer 20-25% off ADA schedule fees."
        },
        {
            "id": "dent_crown",
            "sector": "health",
            "service": "Dental",
            "title": "Single Zirconia / Porcelain Dental Crown (Molar)",
            "fair_indie_min": 850.0, "fair_indie_max": 1250.0, "fair_indie_avg": 1050.0,
            "franchise_min": 1650.0, "franchise_max": 2450.0, "franchise_avg": 2050.0,
            "typical_hourly_indie": "Independent Family Practice",
            "typical_hourly_franchise": "Private Equity DSO Corporate Chain",
            "savings_avg": 1000.0, "savings_pct": 49,
            "rip_off_warning": "Corporate dental clinics add separate billing codes for core buildup, gingival retraction, and temporary crowns to inflate bills past insurance limits.",
            "insider_tip": "Ask for the all-inclusive 'out-the-door' fee including the tooth buildup and lab fabrication."
        },

        # --- Legal & Financial ---
        {
            "id": "leg_will",
            "sector": "legal",
            "service": "Legal & Estate",
            "title": "Estate Planning Package (Will, Power of Attorney & Healthcare Directive)",
            "fair_indie_min": 650.0, "fair_indie_max": 1250.0, "fair_indie_avg": 950.0,
            "franchise_min": 2400.0, "franchise_max": 4500.0, "franchise_avg": 3450.0,
            "typical_hourly_indie": "$175 - $275 / hr (or flat fee)",
            "typical_hourly_franchise": "$450 - $750 / hr (Big downtown firm)",
            "savings_avg": 2500.0, "savings_pct": 72,
            "rip_off_warning": "Large corporate law firms charge steep hourly rates for junior associates to fill out standard statutory estate templates.",
            "insider_tip": "Solo practitioner estate lawyers offer fixed flat-fee packages that include direct attorney consultation at a fraction of firm overhead."
        },
        {
            "id": "leg_llc",
            "sector": "legal",
            "service": "Legal & Business",
            "title": "Single-Member LLC Formation & Operating Agreement",
            "fair_indie_min": 350.0, "fair_indie_max": 650.0, "fair_indie_avg": 500.0,
            "franchise_min": 1200.0, "franchise_max": 2400.0, "franchise_avg": 1800.0,
            "typical_hourly_indie": "$150 - $250 / hr (flat fee)",
            "typical_hourly_franchise": "$400 - $650 / hr",
            "savings_avg": 1300.0, "savings_pct": 72,
            "rip_off_warning": "Online legal sites bait customers with '$0 LLC setup' then charge $299/yr for mandatory registered agent fees and $99 for an EIN you can get free in 5 minutes from the IRS.",
            "insider_tip": "Get your EIN directly at IRS.gov for free, and use a local flat-fee business attorney to customize your operating agreement."
        }
    ]
}


METRO_COST_INDEX = {
    "red_deer": {
        "id": "red_deer",
        "city": "Red Deer",
        "region_code": "AB",
        "country": "CA",
        "name": "Red Deer, AB (Baseline)",
        "label": "Central Alberta Baseline (1.00x)",
        "multiplier": 1.00,
        "hourly_plumber": "$95 - $125 / hr",
        "notes": "Regional benchmark rate"
    },
    "calgary": {
        "id": "calgary",
        "city": "Calgary",
        "region_code": "AB",
        "country": "CA",
        "name": "Calgary, AB",
        "label": "Calgary Metro (1.08x)",
        "multiplier": 1.08,
        "hourly_plumber": "$105 - $135 / hr",
        "notes": "+8% vs Central Alberta"
    },
    "edmonton": {
        "id": "edmonton",
        "city": "Edmonton",
        "region_code": "AB",
        "country": "CA",
        "name": "Edmonton, AB",
        "label": "Edmonton Metro (1.06x)",
        "multiplier": 1.06,
        "hourly_plumber": "$100 - $130 / hr",
        "notes": "+6% vs Central Alberta"
    },
    "toronto": {
        "id": "toronto",
        "city": "Toronto",
        "region_code": "ON",
        "country": "CA",
        "name": "Toronto, ON (GTA)",
        "label": "Greater Toronto Area (1.42x)",
        "multiplier": 1.42,
        "hourly_plumber": "$145 - $190 / hr",
        "notes": "+42% high-cost metro"
    },
    "vancouver": {
        "id": "vancouver",
        "city": "Vancouver",
        "region_code": "BC",
        "country": "CA",
        "name": "Vancouver, BC",
        "label": "Metro Vancouver (1.38x)",
        "multiplier": 1.38,
        "hourly_plumber": "$140 - $185 / hr",
        "notes": "+38% high-cost metro"
    },
    "montreal": {
        "id": "montreal",
        "city": "Montreal",
        "region_code": "QC",
        "country": "CA",
        "name": "Montreal, QC",
        "label": "Greater Montreal (1.15x)",
        "multiplier": 1.15,
        "hourly_plumber": "$110 - $145 / hr",
        "notes": "+15% metro labor"
    },
    "new_york": {
        "id": "new_york",
        "city": "New York City",
        "region_code": "NY",
        "country": "US",
        "name": "New York City, NY",
        "label": "NYC Metro Area (1.68x)",
        "multiplier": 1.68,
        "hourly_plumber": "$175 - $240 / hr",
        "notes": "+68% Tier-1 US Mega-Metro"
    },
    "chicago": {
        "id": "chicago",
        "city": "Chicago",
        "region_code": "IL",
        "country": "US",
        "name": "Chicago, IL",
        "label": "Chicago Metro (1.32x)",
        "multiplier": 1.32,
        "hourly_plumber": "$135 - $180 / hr",
        "notes": "+32% major Midwest metro"
    },
    "los_angeles": {
        "id": "los_angeles",
        "city": "Los Angeles",
        "region_code": "CA",
        "country": "US",
        "name": "Los Angeles, CA",
        "label": "Greater Los Angeles (1.55x)",
        "multiplier": 1.55,
        "hourly_plumber": "$160 - $215 / hr",
        "notes": "+55% high-cost California metro"
    },
    "dallas": {
        "id": "dallas",
        "city": "Dallas",
        "region_code": "TX",
        "country": "US",
        "name": "Dallas-Fort Worth, TX",
        "label": "DFW Metroplex (1.10x)",
        "multiplier": 1.10,
        "hourly_plumber": "$105 - $140 / hr",
        "notes": "+10% Sunbelt metro"
    },
    "rural": {
        "id": "rural",
        "city": "Small Town / Rural",
        "region_code": "",
        "country": "NA",
        "name": "Small Town / Rural Regional",
        "label": "Rural / Small Community (0.90x)",
        "multiplier": 0.90,
        "hourly_plumber": "$80 - $105 / hr",
        "notes": "-10% lower overhead"
    }
}


def get_local_services(metro_id: str = "red_deer") -> dict:
    try:
        from regional_labor_api import RegionalLaborClient
        metro = RegionalLaborClient.get_metro_index(metro_id)
        available_metros = RegionalLaborClient.get_all_metros()
    except Exception:
        metro = METRO_COST_INDEX.get(metro_id, METRO_COST_INDEX["red_deer"])
        available_metros = list(METRO_COST_INDEX.values())
    
    m = metro["multiplier"]
    
    scaled_jobs = []
    for j in LOCAL_SERVICES_DATABASE["jobs"]:
        job_copy = dict(j)
        job_copy["fair_indie_min"] = round(j["fair_indie_min"] * m, 0)
        job_copy["fair_indie_max"] = round(j["fair_indie_max"] * m, 0)
        job_copy["fair_indie_avg"] = round(j["fair_indie_avg"] * m, 0)
        job_copy["franchise_min"] = round(j["franchise_min"] * m, 0)
        job_copy["franchise_max"] = round(j["franchise_max"] * m, 0)
        job_copy["franchise_avg"] = round(j["franchise_avg"] * m, 0)
        job_copy["savings_avg"] = round(job_copy["franchise_avg"] - job_copy["fair_indie_avg"], 0)
        scaled_jobs.append(job_copy)

    return {
        "sectors": LOCAL_SERVICES_DATABASE["sectors"],
        "jobs": scaled_jobs,
        "current_metro": metro,
        "available_metros": available_metros
    }


def check_service_quote(job_id: str, quote_amount: float, metro_id: str = "red_deer") -> dict:
    job = next((j for j in LOCAL_SERVICES_DATABASE["jobs"] if j["id"] == job_id), None)
    if not job:
        raise ValueError(f"Unknown service job id: {job_id}")

    try:
        from regional_labor_api import RegionalLaborClient
        metro = RegionalLaborClient.get_metro_index(metro_id)
    except Exception:
        metro = METRO_COST_INDEX.get(metro_id, METRO_COST_INDEX["red_deer"])

    m = metro["multiplier"]

    fair_min = round(job["fair_indie_min"] * m, 0)
    fair_max = round(job["fair_indie_max"] * m, 0)
    fair_avg = round(job["fair_indie_avg"] * m, 0)
    franchise_avg = round(job["franchise_avg"] * m, 0)

    amount = float(quote_amount)

    if amount <= fair_max * 1.05:
        rating = "fair"
        headline = f"Fair & Competitive Quote in {metro['city']}"
        badge_color = "#059669"  # Emerald green
        verdict = f"Your quoted price of ${amount:.2f} is within fair independent market range (${fair_min:.0f} - ${fair_max:.0f}) in {metro['name']} (labor index: {m:.2f}x). You are getting good value!"
        savings = 0.0
    elif amount <= fair_max * 1.30:
        rating = "elevated"
        headline = f"Slightly Elevated Estimate for {metro['city']} (+15% to +30%)"
        badge_color = "#F59E0B"  # Gold
        savings = round(amount - fair_avg, 2)
        verdict = f"Your quoted price of ${amount:.2f} is slightly above the {metro['city']} independent benchmark (${fair_avg:.0f}). Ask if premium materials or rush labor are included."
    else:
        rating = "gouging"
        headline = f"Overpriced Franchise / Corporate Markup Alert in {metro['city']}!"
        badge_color = "#DC2626"  # Red alert
        savings = round(amount - fair_avg, 2)
        verdict = f"Your quoted price of ${amount:.2f} is {round((amount / fair_avg - 1) * 100)}% higher than fair local rates in {metro['name']}. This is typical of private equity franchise commission sales."

    return {
        "job": job,
        "quoted_amount": amount,
        "rating": rating,
        "badge_color": badge_color,
        "headline": headline,
        "verdict": verdict,
        "fair_range": [fair_min, fair_max],
        "fair_avg": fair_avg,
        "franchise_avg": franchise_avg,
        "potential_savings": savings,
        "savings_pct": round((savings / amount) * 100) if savings > 0 else 0,
        "rip_off_warning": job["rip_off_warning"],
        "insider_tip": job["insider_tip"],
        "metro": metro
    }

