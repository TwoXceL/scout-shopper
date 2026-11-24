# Phase 3: Post-Purchase Price Protection & Automated Refund Watchdog - Master Task List

## Overview
Phase 3 expands OmniCart AI / Scout $hopper from pre-purchase arbitrage into post-purchase retention: automated 30-day receipt price tracking, return window monitoring, instant price-drop alerts, and 1-tap retailer price adjustment claim generation.

---

### [x] Task 1: SQLite Schema & Receipt Storage Engine (`backend/db.py`)
- [x] Create `receipts` table in SQLite (`id`, `user_id`, `store`, `item_title`, `item_upc`, `price_paid`, `purchase_date`, `return_window_days`, `window_expires_at`, `current_market_price`, `price_dropped`, `refund_amount`, `status`, `created_at`).
- [x] Add retailer return window policies (Best Buy 14-60 days, Target 14-90 days, Walmart 30-90 days, Amazon 30 days, Costco 90 days, Home Depot 90 days).
- [x] Add CRUD repository methods: `log_receipt`, `get_user_receipts`, `delete_receipt`, `simulate_receipt_price_drop`.

### [x] Task 2: Watchdog Price Drop Engine & Endpoints (`backend/main.py`)
- [x] `POST /api/receipts/log`: Log purchase with automatic return window calculation.
- [x] `GET /api/receipts`: Return active tracked receipts with remaining countdown days and refund alerts.
- [x] `DELETE /api/receipts/{id}`: Remove tracked receipt.
- [x] `POST /api/receipts/simulate-drop/{id}`: Simulator that drops price to demonstrate instant refund alert.

### [x] Task 3: 1-Tap Retailer Price Adjustment Claim Generator (`backend/policy_engine.py`, `backend/main.py`)
- [x] `GET /api/receipts/{id}/claim-script`: Generates retailer-specific, policy-compliant price adjustment email / chat script quoting the store policy, receipt/order details, and proof of price drop.
- [x] Include retailer customer service direct links / chat endpoints.

### [x] Task 4: Credit Card Purchase Protection Companion (`backend/catalog_data.py`, `backend/main.py`)
- [x] Card benefits database for major issuers (Chase Sapphire/Freedom, Amex, Capital One Venture, Citi).
- [x] Pre-fills secondary claim guidance if retailer window has expired.

### [x] Task 5: Interactive Mobile UI (`frontend/app.js`, `frontend/styles.css`)
- [x] `screen-receipts`: Post-Purchase Watchdog & Refund Tracker page.
- [x] Receipt logger form with store selection (via 3D Rolodex!), product lookup, and purchase price.
- [x] Active purchases list with return window countdown badge (`10d window left`).
- [x] Instant alert banners for price drops with potential cash refund amount.
- [x] 1-Tap "Copy Claim Script" modal for instant copy-paste into retailer chat/email.
- [x] Strict 4-color palette, single-line button constraint, strictly zero emojis (SVG icons only).
- [x] Wire entry point on Home screen and Watchlist.

### [x] Task 6: Automated Pytest Suite & Browser QA Validation
- [x] Automated pytest tests covering receipt logging, return windows, price drop detection, and claim scripts (38/38 passing).
- [x] Browser QA visual verification with screenshot evidence (`phase3_watchdog_verified.png`).
