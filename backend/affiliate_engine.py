"""
Phase 1 Affiliate Link Routing Engine for Scout $hopper.

Implements the Phase 1 Stacking Strategy:
1. Amazon Associates (Direct):
   - Amazon US (amazon.com) with tag={AMAZON_ASSOCIATES_TAG} & ascsubtag={user_id}
   - Amazon Canada (amazon.ca) with tag={AMAZON_CA_ASSOCIATES_TAG} & ascsubtag={user_id}
2. Skimlinks (Aggregator):
   - Covers major Big-Box retailers (Walmart, Target, Best Buy, Home Depot, Lowe's,
     Canadian Tire, Wayfair, B&H Photo, REI, Costco, etc.) without requiring
     individual Impact approvals.
   - Format: https://go.skimresources.com/?id={SKIMLINKS_PUB_ID}&url={URL}&xcust={USER_ID}
3. ShareASale (Artisans & Makers):
   - Covers Etsy Makers (Etsy Merchant ID: 5093).
   - Format: https://www.shareasale.com/r.cfm?b=161204&u={SHAREASALE_AFFILIATE_ID}&m=5093&urllink={URL}&afftrack={USER_ID}
4. Direct Shopify DTC / Refersion (10% to 20%):
   - Independent boutique makers (Timber & Bean, Timber & Core Craft, Veloce Home Goods,
     Maple Sound, Pad & Quill, etc.) with custom ref tracking and coupon incentives.
"""

import os
import re
from urllib.parse import urlencode, quote_plus, urlparse, parse_qs, urlunparse
from typing import Optional, Dict, Any, List
from dotenv import load_dotenv

load_dotenv()

# Environment Configurations with sensible defaults
PAYPAL_MERCHANT_EMAIL = os.getenv("PAYPAL_MERCHANT_EMAIL", "2xcelmedia@gmail.com")
PAYPAL_PAYOUT_DESTINATION = os.getenv("PAYPAL_PAYOUT_DESTINATION", "2xcelmedia@gmail.com")
DEFAULT_REF_CODE = os.getenv("DEFAULT_REF_CODE", "2xcel")
AMAZON_ASSOCIATES_TAG = os.getenv("AMAZON_ASSOCIATES_TAG", "scoutshopper-20")
AMAZON_CA_ASSOCIATES_TAG = os.getenv("AMAZON_CA_ASSOCIATES_TAG", "scoutshopper-ca-20")
SKIMLINKS_PUB_ID = os.getenv("SKIMLINKS_PUB_ID", "")
SHAREASALE_AFFILIATE_ID = os.getenv("SHAREASALE_AFFILIATE_ID", "")
SHAREASALE_ETSY_MERCHANT_ID = os.getenv("SHAREASALE_ETSY_MERCHANT_ID", "5093")


STORE_SEARCH_TEMPLATES = {
    "amazon": "https://www.amazon.com/s?k={query}",
    "amazon.com": "https://www.amazon.com/s?k={query}",
    "amazon.ca": "https://www.amazon.ca/s?k={query}",
    "walmart": "https://www.walmart.com/search?q={query}",
    "walmart canada": "https://www.walmart.ca/en/search?q={query}",
    "target": "https://www.target.com/s?searchTerm={query}",
    "best buy": "https://www.bestbuy.com/site/searchpage.jsp?st={query}",
    "best buy canada": "https://www.bestbuy.ca/en-ca/search?search={query}",
    "home depot": "https://www.homedepot.com/s/{query}",
    "the home depot": "https://www.homedepot.com/s/{query}",
    "home depot canada": "https://www.homedepot.ca/en/home/search.html?q={query}",
    "lowe's": "https://www.lowes.com/search?searchTerm={query}",
    "lowes": "https://www.lowes.com/search?searchTerm={query}",
    "rona": "https://www.rona.ca/en/search?text={query}",
    "canadian tire": "https://www.canadiantire.ca/en/search-results.html?q={query}",
    "costco.ca": "https://www.costco.ca/CatalogSearch?dept=All&keyword={query}",
    "costco": "https://www.costco.com/CatalogSearch?dept=All&keyword={query}",
    "wayfair": "https://www.wayfair.com/keyword.php?keyword={query}",
    "b&h photo": "https://www.bhphotovideo.com/c/search?Ntt={query}",
    "rei": "https://www.rei.com/search?q={query}",
    "sport chek": "https://www.sportchek.ca/en/search.html?q={query}",
    "acme tools": "https://www.acmetools.com/search?q={query}",
    "indigo canada": "https://www.indigo.ca/en-ca/search?q={query}",
    "etsy": "https://www.etsy.com/search?q={query}",
}


def _clean_destination_url(store: str, raw_url: str, product_title: str = "") -> str:
    """If url is a placeholder (example.invalid or missing), return a legitimate store search URL."""
    if not raw_url or "example.invalid" in raw_url:
        st_norm = store.lower().strip()
        template = STORE_SEARCH_TEMPLATES.get(st_norm)
        if template:
            q = quote_plus(product_title or store)
            return template.format(query=q)
        q = quote_plus(product_title or store)
        return f"https://www.google.com/search?q={quote_plus(store + ' ' + product_title)}"
    return raw_url


def build_amazon_link(raw_url: str, is_ca: bool = False, user_id: Optional[str] = None, product_title: str = "") -> str:
    """Build direct Amazon Associates link with tag and ascsubtag attribution."""
    store_name = "amazon.ca" if is_ca else "amazon.com"
    dest = _clean_destination_url(store_name, raw_url, product_title)
    
    tag = AMAZON_CA_ASSOCIATES_TAG if is_ca else AMAZON_ASSOCIATES_TAG
    
    parsed = urlparse(dest)
    params = parse_qs(parsed.query)
    params["tag"] = [tag]
    if user_id:
        params["ascsubtag"] = [user_id]
        
    query_str = urlencode(params, doseq=True)
    return urlunparse((parsed.scheme or "https", parsed.netloc or ("www.amazon.ca" if is_ca else "www.amazon.com"),
                       parsed.path, parsed.params, query_str, parsed.fragment))


def build_skimlinks_link(store: str, raw_url: str, user_id: Optional[str] = None, product_title: str = "") -> str:
    """
    Wrap Big-Box store destination URL with Skimlinks aggregator format.
    If SKIMLINKS_PUB_ID is not configured, returns direct destination with fallback ref tags.
    """
    dest = _clean_destination_url(store, raw_url, product_title)
    
    if SKIMLINKS_PUB_ID:
        params = {
            "id": SKIMLINKS_PUB_ID,
            "url": dest
        }
        if user_id:
            params["xcust"] = user_id
        return f"https://go.skimresources.com/?{urlencode(params)}"
    
    # Fallback when Skimlinks publisher ID is not yet entered in dev
    parsed = urlparse(dest)
    params = parse_qs(parsed.query)
    params["ref"] = [DEFAULT_REF_CODE]
    if user_id:
        params["subid"] = [user_id]
    query_str = urlencode(params, doseq=True)
    return urlunparse((parsed.scheme, parsed.netloc, parsed.path, parsed.params, query_str, parsed.fragment))


def build_shareasale_link(raw_url: str, merchant_id: str = SHAREASALE_ETSY_MERCHANT_ID,
                          user_id: Optional[str] = None, product_title: str = "") -> str:
    """
    Wrap Etsy / Maker URL with ShareASale affiliate tracking link.
    If SHAREASALE_AFFILIATE_ID is not configured, returns direct URL with ref parameters.
    """
    dest = _clean_destination_url("etsy", raw_url, product_title)
    
    if SHAREASALE_AFFILIATE_ID:
        params = {
            "b": "161204",
            "u": SHAREASALE_AFFILIATE_ID,
            "m": merchant_id,
            "urllink": dest
        }
        if user_id:
            params["afftrack"] = user_id
        return f"https://www.shareasale.com/r.cfm?{urlencode(params)}"
        
    # Local fallback
    parsed = urlparse(dest)
    params = parse_qs(parsed.query)
    params["ref"] = [DEFAULT_REF_CODE]
    if user_id:
        params["subid"] = [user_id]
    query_str = urlencode(params, doseq=True)
    return urlunparse((parsed.scheme, parsed.netloc, parsed.path, parsed.params, query_str, parsed.fragment))


def build_shopify_dtc_link(raw_url: str, brand_name: str = "", user_id: Optional[str] = None, product_title: str = "") -> str:
    """
    Build direct Shopify DTC / Refersion partner affiliate link with discount/ref tagging.
    """
    dest = raw_url
    if not dest or "example.invalid" in dest:
        slug = re.sub(r"[^a-z0-9]", "", brand_name.lower()) or "maker"
        dest = f"https://{slug}.com"

    parsed = urlparse(dest)
    params = parse_qs(parsed.query)
    params["ref"] = [DEFAULT_REF_CODE]
    params["discount"] = ["SCOUTSHOPPER"]
    if user_id:
        params["subid"] = [user_id]
        
    query_str = urlencode(params, doseq=True)
    return urlunparse((parsed.scheme or "https", parsed.netloc, parsed.path, parsed.params, query_str, parsed.fragment))


def resolve_affiliate_url(
    store_or_platform: str,
    raw_url: str = "",
    user_id: Optional[str] = None,
    is_shop_small: bool = False,
    product_title: str = "",
    brand_name: str = ""
) -> str:
    """
    Master Phase 1 resolver:
    Directs to Amazon Associates, Skimlinks, ShareASale, or Shopify DTC based on store name/type.
    """
    st_lower = store_or_platform.lower().strip()
    url_lower = (raw_url or "").lower()

    # 1. Amazon (Direct Associates)
    if "amazon.ca" in st_lower or "amazon.ca" in url_lower:
        return build_amazon_link(raw_url, is_ca=True, user_id=user_id, product_title=product_title)
    if "amazon" in st_lower or "amazon.com" in url_lower:
        return build_amazon_link(raw_url, is_ca=False, user_id=user_id, product_title=product_title)

    # 2. Etsy / Handcrafted Artisans (ShareASale)
    if "etsy" in st_lower or "etsy.com" in url_lower:
        return build_shareasale_link(raw_url, merchant_id=SHAREASALE_ETSY_MERCHANT_ID, user_id=user_id, product_title=product_title)

    # 3. Shopify DTC / Direct Maker
    if is_shop_small or "shopify" in st_lower or "maker" in st_lower:
        return build_shopify_dtc_link(raw_url, brand_name=brand_name or store_or_platform, user_id=user_id, product_title=product_title)

    # 4. Big-Box / Regional Retailers -> Skimlinks Aggregator
    return build_skimlinks_link(store=store_or_platform, raw_url=raw_url, user_id=user_id, product_title=product_title)


def enhance_product_affiliate_links(product: Dict[str, Any], user_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Mutates/updates a product dictionary in-place so all retailer offers and shop small
    alternatives use the Phase 1 affiliate stacking resolver.
    """
    if not product or not isinstance(product, dict):
        return product

    title = product.get("title", "")

    # Retailer Offers (Big-box + Amazon)
    for offer in product.get("retailer_offers", []):
        ret = offer.get("retailer", "")
        curr_url = offer.get("affiliate_url", "")
        offer["affiliate_url"] = resolve_affiliate_url(
            store_or_platform=ret,
            raw_url=curr_url,
            user_id=user_id,
            is_shop_small=False,
            product_title=title
        )

    # Shop Small Alternatives (Etsy + Shopify DTC)
    for alt in product.get("shop_small_alternatives", []):
        platform = alt.get("platform", "Shopify DTC")
        brand = alt.get("brand_name", "")
        curr_url = alt.get("merchant_url", "")
        alt["merchant_url"] = resolve_affiliate_url(
            store_or_platform=platform,
            raw_url=curr_url,
            user_id=user_id,
            is_shop_small=True,
            product_title=alt.get("title") or title,
            brand_name=brand
        )

    return product
