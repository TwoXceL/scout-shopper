"""
Tests for Snap-a-Quote AI, Live Regional Labor Cost API, and E-Receipt 1-Click Sync.
"""

import pytest
from starlette.testclient import TestClient
from main import app
import db
from regional_labor_api import RegionalLaborClient
import quote_scanner

client = TestClient(app)


def test_live_regional_labor_api_endpoints():
    """Verify live regional labor index queries and StatCan/BLS data feeds."""
    res = client.get("/api/services/labor-index?metro=red_deer")
    assert res.status_code == 200
    data = res.json()
    assert data["metro"]["city"] == "Red Deer"
    assert data["metro"]["multiplier"] == 1.00
    assert "Statistics Canada" in data["metro"]["api_source"]
    assert "median_journeyman_wage" in data["metro"]
    assert len(data["available_metros"]) >= 10

    # Test Toronto high-cost metro
    res_tor = client.get("/api/services/labor-index?metro=toronto")
    assert res_tor.status_code == 200
    tor_data = res_tor.json()
    assert tor_data["metro"]["multiplier"] == 1.42
    assert tor_data["metro"]["city"] == "Toronto"

    # Test New York US metro
    res_ny = client.get("/api/services/labor-index?metro=new_york")
    assert res_ny.status_code == 200
    ny_data = res_ny.json()
    assert ny_data["metro"]["multiplier"] == 1.68
    assert "Bureau of Labor Statistics" in ny_data["metro"]["api_source"]


def test_snap_a_quote_ai_extraction_and_audit():
    """Verify AI extraction from quote text and audit against Red Deer fair rates."""
    payload = {
        "quote_text": "Apex Plumbing estimate for 50-gallon water heater replacement total $1,850.00 including labor and parts.",
        "filename": "water_heater_quote.pdf",
        "metro_id": "red_deer"
    }
    res = client.post("/api/services/quote-scan", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["extracted_amount"] == 1850.00
    assert data["extracted_job"]["id"] == "plumb_heater"
    assert data["audit"]["rating"] in ["elevated", "gouging"]
    assert data["audit"]["potential_savings"] > 0
    assert data["recommended_pro"]["vendor_name"] == "Cascade Pro Plumbing & Heating"
    assert data["lead_dispatch"]["eligible"] is True
    assert data["lead_dispatch"]["lead_fee_usd"] == 25.00


def test_contractor_lead_dispatch_attributes_25_fee():
    """Verify dispatching a quote lead bills the $25.00 contractor lead fee."""
    # Create or ensure an active local pro campaign exists
    camp_payload = {
        "vendor_type": "local_service",
        "vendor_name": "Cascade Pro Plumbing & Heating",
        "store_url": "https://cascadeproplumbing.ca",
        "title": "Master Plumber Service - Red Deer",
        "category": "Plumbing",
        "duration_days": 30,
        "city": "Red Deer, AB",
        "metro_id": "red_deer"
    }
    camp_res = client.post("/api/ads/campaigns", json=camp_payload)
    assert camp_res.status_code == 200
    camp_id = camp_res.json()["campaign"]["id"]

    # Dispatch homeowner lead
    lead_payload = {
        "campaign_id": camp_id,
        "service_job": "50-Gal Hot Water Tank Replacement",
        "client_name": "Jordan Smith",
        "client_contact": "jordan@example.com",
        "estimated_amount": 1850.00,
        "city": "Red Deer, AB",
        "notes": "Homeowner uploaded competitor quote of $1,850 looking for competitive bid."
    }
    lead_res = client.post("/api/ads/leads", json=lead_payload)
    assert lead_res.status_code == 200
    lead_data = lead_res.json()
    assert lead_data["status"] == "DISPATCHED"
    assert lead_data["lead_fee_billed"] == 25.00
    assert lead_data["campaign"]["leads_count"] >= 1
    assert lead_data["campaign"]["total_billed_dollars"] >= 149.00 + 25.00


def test_inbound_ereceipt_mailbox_and_1click_sync():
    """Verify inbound e-receipt ingestion from box stores and 1-click price watchdog sync."""
    user_id = "usr_demo"

    # Check inbound feed has dedicated address
    feed_res = client.get(f"/api/receipts/inbound-feed?user_id={user_id}")
    assert feed_res.status_code == 200
    feed_data = feed_res.json()
    assert feed_data["forwarding_email"] == f"receipts+{user_id}@scoutshopper.app"
    assert feed_data["pending_count"] >= 1

    # Simulate an incoming e-receipt from Best Buy for Sony headphones
    sim_res = client.post("/api/receipts/simulate-email", json={
        "store": "Best Buy",
        "item_title": "Sony WH-1000XM5 Wireless Noise-Canceling Headphones",
        "price_paid": 399.99,
        "item_upc": "027242919419",
        "order_number": "BBY-992104"
    })
    assert sim_res.status_code == 200
    sim_data = sim_res.json()
    assert sim_data["store"] == "Best Buy"
    assert sim_data["status"] == "PENDING_SYNC"

    # Execute 1-Click Sync
    sync_res = client.post("/api/receipts/email-sync")
    assert sync_res.status_code == 200
    sync_data = sync_res.json()
    assert sync_data["success"] is True
    assert sync_data["synced_count"] >= 1
    # Sony WH-1000XM5 baseline is $328 vs $399.99 paid -> should trigger immediate price drop refund
    assert sync_data["immediate_drops_count"] >= 1
    assert sync_data["total_refund_unlocked"] > 0

    # Verify receipts now show up in active watchdog list
    rcpt_list_res = client.get("/api/receipts")
    assert rcpt_list_res.status_code == 200
    rcpts = rcpt_list_res.json()["receipts"]
    assert any(r["store"] == "Best Buy" for r in rcpts)
    assert any(r["price_dropped"] is True for r in rcpts)


def test_dynamic_postal_code_and_city_labor_lookup():
    """Verify dynamic postal code (CA/US) and city name labor rate resolution."""
    # Red Deer Postal Code
    res_rd = client.get("/api/services/labor-index/lookup?query=T4N%201A1")
    assert res_rd.status_code == 200
    rd_data = res_rd.json()["resolved_metro"]
    assert rd_data["id"] == "red_deer"
    assert rd_data["multiplier"] == 1.00
    assert "Central Alberta" in rd_data["resolved_from"]

    # Calgary Postal Code
    res_cgy = client.get("/api/services/labor-index/lookup?query=T2P%201J9")
    assert res_cgy.status_code == 200
    cgy_data = res_cgy.json()["resolved_metro"]
    assert cgy_data["id"] == "calgary"
    assert cgy_data["multiplier"] == 1.08

    # Toronto Postal Code
    res_tor = client.get("/api/services/labor-index/lookup?query=M5V%202T6")
    assert res_tor.status_code == 200
    tor_data = res_tor.json()["resolved_metro"]
    assert tor_data["id"] == "toronto"
    assert tor_data["multiplier"] == 1.42

    # US ZIP Code
    res_ny = client.get("/api/services/labor-index/lookup?query=10001")
    assert res_ny.status_code == 200
    ny_data = res_ny.json()["resolved_metro"]
    assert ny_data["id"] == "new_york"
    assert ny_data["multiplier"] == 1.68

    # City Name Lookup
    res_sylvan = client.get("/api/services/labor-index/lookup?query=Sylvan%20Lake")
    assert res_sylvan.status_code == 200
    sylvan_data = res_sylvan.json()["resolved_metro"]
    assert sylvan_data["id"] == "red_deer"

    # Quote scan with dynamic location_query (e.g. Toronto postal code)
    scan_res = client.post("/api/services/quote-scan", json={
        "quote_text": "Water heater replacement quote $2,400.00",
        "location_query": "M5V 2T6"
    })
    assert scan_res.status_code == 200
    scan_data = scan_res.json()
    assert scan_data["metro"]["city"] == "Toronto"
