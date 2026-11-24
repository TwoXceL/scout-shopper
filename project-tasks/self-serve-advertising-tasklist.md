# Self-Service Advertising & Automated Lead Dispatch Engine - Task List

## Overview
Builds a fully automated, self-service advertising hub inside Scout $hopper where Etsy makers, Shopify boutique owners, local service contractors, and retail brands can launch 30, 60, or 90-day sponsored placements with zero manual work by the platform owner. Includes automated lead dispatch for contractors, in-feed sponsored product injection, live preview card, and AdMob programmatic fallback.

---

### [x] Task 1: SQLite Schema & Ad Repository (`backend/db.py`)
- [x] Create `ad_campaigns` table with fields for vendor type (`shopify`, `etsy`, `local_service`, `retailer`), store platform, store URL, title, description, category, price, image URL, badge label, duration days (30, 60, 90), cost cents ($49, $79, $99), start date, expires at, status, impressions, and clicks.
- [x] Create `ad_leads` table for automated contractor quote leads.
- [x] Implement CRUD methods: `create_ad_campaign`, `get_active_ad_campaigns`, `track_ad_click`, `dispatch_contractor_lead`, `get_campaign_stats`.
- [x] Seed high-quality demo campaigns (Etsy artisan leather wallet, Shopify pour-over coffee boutique, certified local HVAC/plumbing pro).

### [x] Task 2: REST Endpoints & Pricing Controller (`backend/main.py`)
- [x] `GET /api/ads/pricing`: Returns the 30-day ($49), 60-day ($79), and 90-day ($99) tier definitions with daily breakdown and savings percentages.
- [x] `POST /api/ads/campaigns`: Self-service ad creator validating duration and pricing.
- [x] `GET /api/ads/active`: Filtered ad serving by category and vendor type.
- [x] `POST /api/ads/campaigns/{id}/click`: Automated click counter.
- [x] `POST /api/ads/leads`: Dispatches contractor lead with automated quote notification.

### [x] Task 3: Automated Pytest Suite (`backend/tests/test_ads_self_serve.py`)
- [x] Test pricing tiers and savings calculations.
- [x] Test campaign creation for Shopify, Etsy, and Local Services.
- [x] Test impression and click tracking.
- [x] Test contractor lead dispatch.
- [x] Verify full test suite passes with zero regressions (42/42 passing).

### [x] Task 4: Interactive Mobile UI (`screen-sponsor`) & Integrations (`frontend/`)
- [x] Add `#screen-sponsor` to `frontend/index.html`.
- [x] Build `RENDER.sponsor`: Self-service campaign builder with store type picker (Shopify, Etsy, Local Pro), 30/60/90-day tier selector, live visual card preview, and campaign launcher.
- [x] Inject active sponsored cards into `RENDER.search`, `RENDER.home`, and `RENDER.gifts`.
- [x] Inject "Connect with Verified Local Pros" lead routing modal into `RENDER.services`.
- [x] Add Google AdMob placeholder container ("The Cherry on Top").
- [x] Add "Advertise With Us" button on Home and Settings.
- [x] Strict 4-color palette, zero emoji icons, single-line button constraints.

### [x] Task 5: End-to-End Visual Verification & Screenshot Evidence
- [x] Verify self-service campaign creation with live preview.
- [x] Verify sponsored cards rendered in Search and Local Services.
- [x] Verify lead dispatch notification flow.
- [x] Capture screenshot evidence and report final results.
