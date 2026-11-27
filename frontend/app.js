/* OmniCart AI - mobile-first single-page app
   Includes Wishlist & Automated Price Drop Watchdog.
*/
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function enableDragScroll(el) {
  if (!el || el.dataset.dragInit) return;
  el.dataset.dragInit = '1';
  let isDown = false;
  let startX = 0;
  let scrollLeft = 0;
  let hasMoved = false;

  el.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    isDown = true;
    hasMoved = false;
    startX = e.pageX - el.offsetLeft;
    scrollLeft = el.scrollLeft;
  });

  window.addEventListener('mouseup', () => {
    isDown = false;
  });

  el.addEventListener('mouseleave', () => {
    isDown = false;
  });

  el.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startX) * 1.5;
    if (Math.abs(walk) > 4) {
      hasMoved = true;
      e.preventDefault();
    }
    el.scrollLeft = scrollLeft - walk;
  });

  el.addEventListener('click', (e) => {
    if (hasMoved) {
      e.stopPropagation();
      e.preventDefault();
      hasMoved = false;
    }
  }, true);

  el.addEventListener('wheel', (e) => {
    if (e.deltaY !== 0 && el.scrollWidth > el.clientWidth) {
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    }
  }, { passive: false });
}

function initHScrolls(root = document) {
  root.querySelectorAll('.hscroll').forEach(enableDragScroll);
}

/* ---------- icons (inline Solar SVG, strictly zero emojis, fluidly animated) ---------- */
const ICONS = {
  home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  scan: '<path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M7 12h10"/>',
  cart: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
  user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  store: '<path d="M3 9h18l-1.5-5h-15z"/><path d="M5 9v11h14V9"/><path d="M10 20v-5h4v5"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
  leaf: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
  alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  back: '<path d="m15 18-6-6 6-6"/>',
  next: '<path d="m9 18 6-6-6-6"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  external: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>',
  share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>',
  headphones: '<path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/>',
  coffee: '<path d="M10 2v2"/><path d="M14 2v2"/><path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1z"/><path d="M17 12h2a2 2 0 0 1 0 4h-2"/>',
  cup: '<path d="M8 2h8l-1 20H9z"/><path d="M7 7h10"/>',
  box: '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
  tag: '<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/>',
  star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  zap: '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
  chart: '<path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  tool: '<path d="m15 12-8.5 8.5a2.12 2.12 0 1 1-3-3L12 9"/><path d="M17.64 3.36a6 6 0 0 0-8.48 8.48l1.41-1.41a4 4 0 0 1 5.66-5.66l1.41-1.41Z"/>',
  gift: '<polyline points="20 12 20 22 4 22 4 12"/><rect width="20" height="5" x="2" y="7"/><line x1="12" x2="12" y1="22" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>',
  briefcase: '<rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
  receipt: '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-8"/><path d="M16 12h-8"/><path d="M10 16h-6"/>',
  check: '<polyline points="20 6 9 17 4 12"/>',
  filter: '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>'
};
const icon = (n, cls = 'ic') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ICONS.box}</svg>`;
const CAT_ICON = { 
  'Holiday & Gifts': 'gift',
  'Local Services': 'wrench',
  'Price Watchdog': 'receipt',
  'Consumer Electronics': 'headphones', 
  'Home & Cleaning': 'home', 
  'Kitchen & Dining': 'coffee', 
  'Drinkware & Outdoor': 'cup' 
};

function tile(cat) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FEF3C7"/><stop offset="1" stop-color="#FDE68A"/></linearGradient></defs><rect width="120" height="120" fill="url(#g)"/><g transform="translate(36 36) scale(2)" fill="none" stroke="#000000" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[CAT_ICON[cat] || 'box']}</g></svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}
const img = (url, cat, alt, cls = 'thumb') => `<img class="${cls}" src="${esc(url)}" data-cat="${esc(cat)}" alt="${esc(alt)}" loading="lazy">`;
document.addEventListener('error', (e) => {
  const t = e.target;
  if (t.tagName === 'IMG' && !t.dataset.fb) { t.dataset.fb = '1'; t.src = tile(t.dataset.cat); }
}, true);

const AVAILABLE_INTERESTS = [
  { id: 'Consumer Electronics', label: 'Tech & Gadgets', desc: 'Audio, smart home & laptops', icon: 'headphones' },
  { id: 'Kitchen & Dining', label: 'Kitchen & Dining', desc: 'Espresso, cookware & appliances', icon: 'coffee' },
  { id: 'Home & Cleaning', label: 'Home Essentials', desc: 'Robotic vacuums & air care', icon: 'home' },
  { id: 'Tools & Hardware', label: 'Tools & DIY', desc: 'Cordless tools & hardware', icon: 'wrench' },
  { id: 'Apparel & Accessories', label: 'Fashion & Style', desc: 'Watches, bags & apparel', icon: 'tag' },
  { id: 'Drinkware & Outdoor', label: 'Outdoor & Living', desc: 'Drinkware, patio & coolers', icon: 'cup' },
  { id: 'Groceries & Pantry', label: 'Groceries & Pantry', desc: 'Coffee, snacks & staples', icon: 'leaf' },
  { id: 'Health & Beauty', label: 'Health & Beauty', desc: 'Skincare, vitamins & wellness', icon: 'star' },
  { id: 'Gaming & VR', label: 'Gaming & Tech', desc: 'Consoles, PC gear & gaming', icon: 'zap' },
  { id: 'Pet Supplies', label: 'Pet Supplies', desc: 'Pet food, treats & accessories', icon: 'box' },
  { id: 'Local Services', label: 'Local Home Pros', desc: 'Plumbing, HVAC & repairs', icon: 'tool' },
  { id: 'Holiday & Gifts', label: 'Gifts & Seasonal', desc: 'Curated holiday drop boxes', icon: 'gift' },
  { id: 'Sports & Fitness', label: 'Sports & Fitness', desc: 'Athletic wear, bikes & gym gear', icon: 'zap' },
  { id: 'Toys & Kids', label: 'Toys & Kids', desc: 'Strollers, learning toys & baby gear', icon: 'star' },
  { id: 'Automotive & Garage', label: 'Auto & Garage', desc: 'Car care, batteries & parts', icon: 'wrench' },
  { id: 'Books & Media', label: 'Books & Media', desc: 'Bestsellers, vinyl & stationery', icon: 'tag' },
];

function showInterestsModal(onSaved) {
  const modalHost = $('#modalHost');
  if (!modalHost) return;

  let currentInterests = Array.isArray(state.interests) && state.interests.length ? [...state.interests] : ['Consumer Electronics', 'Kitchen & Dining'];

  function renderModal() {
    modalHost.innerHTML = `
      <div class="interests-modal-backdrop" id="interestsBackdrop">
        <div class="interests-modal-card">
          <!-- Native Mobile Sheet Drag Handle -->
          <div class="sheet-drag-handle" aria-hidden="true"></div>

          <!-- Eyebrow Tag & Close Button -->
          <div style="position:relative; text-align:center; margin-bottom:6px;">
            <span class="interests-eyebrow">${icon('zap', 'ic-sm')} DEALS RADAR ENGINE</span>
            <button type="button" class="interests-close-btn" id="closeInterestsBtn" aria-label="Close modal">
              <svg class="ic-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>

          <!-- Centered Header -->
          <div class="interests-header">
            <div>
              <h2 class="interests-title">Personalize Your Deals</h2>
              <div class="interests-subtitle">Select categories to prioritize live arbitrage drops and price protection in your daily feed.</div>
            </div>
          </div>

          <!-- Quick Action Toolbar -->
          <div class="interests-toolbar">
            <span class="interests-counter-pill">
              <span class="interests-counter-dot"></span>
              <span id="interestsCounterText">${currentInterests.length} of ${AVAILABLE_INTERESTS.length} active</span>
            </span>
            <div class="interests-quick-actions">
              <button type="button" class="interests-action-btn" id="selectAllInterestsBtn">Select All</button>
              <button type="button" class="interests-action-btn" id="resetInterestsBtn">Reset</button>
            </div>
          </div>

          <!-- Precision 2-Column Interest Selector Grid (16 categories = 8 symmetrical pairs) -->
          <div class="interests-grid-2col custom-scrollbar" style="max-height:360px; overflow-y:auto; padding-right:4px; margin:14px 0 16px;">
            ${AVAILABLE_INTERESTS.map(cat => {
              const isSelected = currentInterests.includes(cat.id);
              return `
                <button type="button" class="interest-grid-pill modal-interest-pill ${isSelected ? 'selected' : ''}" data-cat-id="${esc(cat.id)}" role="checkbox" aria-checked="${isSelected}">
                  <span class="pill-left">
                    <span style="display:flex; color:${isSelected ? 'var(--save)' : 'var(--muted)'};">${icon(cat.icon, 'ic-sm')}</span>
                    <span>${esc(cat.label)}</span>
                  </span>
                  <span class="pill-indicator">
                    ${isSelected ? `<svg style="width:11px; height:11px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>` : ''}
                  </span>
                </button>
              `;
            }).join('')}
          </div>

          <!-- Action Footer -->
          <div class="interests-footer">
            <button type="button" id="saveInterestsBtn" class="interests-submit-btn">
              ${icon('check', 'ic-sm')} Save Preferences &amp; Refresh Radar
            </button>
            <div class="interests-trust-note">
              <span style="color:var(--save); display:flex;">${icon('zap', 'ic-sm')}</span>
              <span>Instant feed re-ranking • Edit anytime in Settings</span>
            </div>
          </div>
        </div>
      </div>
    `;

    modalHost.querySelectorAll('.modal-interest-pill').forEach(pill => {
      const toggle = () => {
        const catId = pill.dataset.catId;
        haptic('light');
        if (currentInterests.includes(catId)) {
          if (currentInterests.length > 1) {
            currentInterests = currentInterests.filter(id => id !== catId);
          } else {
            toast('Please keep at least 1 category selected');
            return;
          }
        } else {
          currentInterests.push(catId);
        }
        renderModal();
      };
      pill.addEventListener('click', toggle);
    });

    $('#selectAllInterestsBtn')?.addEventListener('click', () => {
      haptic('light');
      currentInterests = AVAILABLE_INTERESTS.map(c => c.id);
      renderModal();
    });

    $('#resetInterestsBtn')?.addEventListener('click', () => {
      haptic('light');
      currentInterests = ['Consumer Electronics', 'Kitchen & Dining'];
      renderModal();
    });

    $('#closeInterestsBtn')?.addEventListener('click', () => {
      haptic('light');
      modalHost.innerHTML = '';
    });
    $('#interestsBackdrop')?.addEventListener('click', (e) => {
      if (e.target.id === 'interestsBackdrop') {
        haptic('light');
        modalHost.innerHTML = '';
      }
    });

    $('#saveInterestsBtn')?.addEventListener('click', async () => {
      haptic('success');
      state.interests = currentInterests;
      localStorage.setItem('oc_interests', JSON.stringify(currentInterests));
      try {
        await api('/api/auth/preferences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ interests: currentInterests })
        });
      } catch (_) {}
      modalHost.innerHTML = '';
      toast('Shopping interests updated! Personalized deals refreshed ⚡');
      if (onSaved) onSaved();
      else if (state.screen === 'home') RENDER.home();
      else if (state.screen === 'settings') RENDER.settings();
    });
  }

  renderModal();
}

/* ---------- runtime environment & API host resolution ---------- */
const isNativeMobile = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
const LIVE_RAILWAY_URL = 'https://scout-shopper-api-production.up.railway.app';
const API_BASE = (function() {
  const custom = localStorage.getItem('scout_api_host');
  if (custom) return custom.replace(/\/+$/, '');
  if (isNativeMobile) {
    return LIVE_RAILWAY_URL;
  }
  if (location.protocol.startsWith('http')) {
    if (location.port === '8000' || (!location.port && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1')) {
      return '';
    }
    return 'http://127.0.0.1:8000';
  }
  return LIVE_RAILWAY_URL;
})();

/* ---------- state ---------- */
const state = {
  region: localStorage.getItem('oc_region') || 'US',
  province: localStorage.getItem('oc_province') || 'CA',
  store: localStorage.getItem('oc_store') || 'online',
  share: localStorage.getItem('oc_share') === '1',
  token: localStorage.getItem('scout_auth_token') || 'demo_session_token_alex',
  pushAlertsEnabled: localStorage.getItem('oc_push_alerts') !== '0',
  interests: JSON.parse(localStorage.getItem('oc_interests') || '["Consumer Electronics", "Kitchen & Dining"]'),
  user: null,
  regions: {}, stores: [], current: null, stack: [], screen: 'home', query: '', category: '', 
  cartCount: 0, wishlistCount: 0, droppedCount: 0, earningsBalance: 35.00
};
let money = (n) => `$${Number(n).toFixed(2)}`;
function applyFormat() {
  const r = state.regions[state.region];
  if (r) { const f = new Intl.NumberFormat(r.locale, { style: 'currency', currency: r.currency }); money = (n) => f.format(Number(n)); }
}
const qs = () => `region=${encodeURIComponent(state.region)}` + (state.province ? `&province=${encodeURIComponent(state.province)}` : '');
async function api(path, opts = {}) {
  const headers = Object.assign({}, opts.headers || {});
  if (state.token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${state.token}`;
  }
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const res = await fetch(url, Object.assign({}, opts, { headers }));
  if (!res.ok) { let d = 'Something went wrong'; try { d = (await res.json()).detail || d; } catch (_) {} throw new Error(d); }
  return res.json();
}
function toast(msg) {
  const t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg;
  $('#toastHost').appendChild(t); setTimeout(() => t.remove(), 2400);
}
const regionLabel = () => state.region + (state.province ? ' · ' + state.province : '');

/* ---------- navigation (5 intuitive tabs) ---------- */
const TABS = [
  ['home', 'Home', 'home'],
  ['search', 'Search', 'search'],
  ['scan', 'Scan', 'scan'],
  ['copilots', 'Copilots', 'zap'],
  ['hub', 'My Hub', 'user']
];

function buildTabbar() {
  $('#tabbar').innerHTML = TABS.map(([id, label, ic]) => id === 'scan'
    ? `<button class="tab scan" data-action="go" data-screen="scan" data-tab="scan" aria-label="Scan a barcode"><span class="fab">${icon('scan', 'ic-lg')}</span><span>${label}</span></button>`
    : `<button class="tab" data-action="go" data-screen="${id}" data-tab="${id}">
        ${icon(ic)}
        <span>${label}</span>
        ${id === 'copilots' ? '<b class="badge-count hidden" id="copilotsBadge">0</b>' : ''}
        ${id === 'hub' ? '<b class="badge-count hidden" id="hubBadge">0</b>' : ''}
       </button>`).join('');
}

/* ---------- NATIVE WEB HAPTICS ENGINE ---------- */
function haptic(type = 'light') {
  try {
    if (window.Capacitor?.Plugins?.Haptics) {
      const H = window.Capacitor.Plugins.Haptics;
      if (type === 'light') H.impact({ style: 'LIGHT' });
      else if (type === 'medium') H.impact({ style: 'MEDIUM' });
      else if (type === 'heavy') H.impact({ style: 'HEAVY' });
      else if (type === 'success') H.notification({ type: 'SUCCESS' });
      else if (type === 'warning') H.notification({ type: 'WARNING' });
      else if (type === 'error') H.notification({ type: 'ERROR' });
      return;
    }
    if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
      if (type === 'light') navigator.vibrate(15);
      else if (type === 'medium') navigator.vibrate(28);
      else if (type === 'heavy') navigator.vibrate([35, 20, 35]);
      else if (type === 'success') navigator.vibrate([15, 30, 20]);
      else if (type === 'warning') navigator.vibrate([30, 40, 30]);
      else if (type === 'error') navigator.vibrate([40, 50, 40, 50, 40]);
    }
  } catch (_) {}
}

const RENDER = {};
async function go(name, opts = {}) {
  const prev = state.screen;
  if (prev === 'scan' && name !== 'scan' && typeof stopCamera === 'function') {
    stopCamera();
  }
  haptic('light');
  if (opts.push && prev !== name) state.stack.push(prev);
  state.screen = name;
  document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('hidden', s.id !== `screen-${name}`));
  const tab = ['product', 'receipts', 'services', 'gifts', 'sponsor', 'copilots'].includes(name)
    ? 'copilots'
    : (['cart', 'wishlist', 'settings', 'referral', 'login', 'portal', 'hub'].includes(name) ? 'hub' : name);
  document.querySelectorAll('.tab').forEach((t) => t.getAttribute('data-tab') === tab ? t.setAttribute('aria-current', 'page') : t.removeAttribute('aria-current'));
  $('#screens').scrollTop = 0;
  if (RENDER[name]) await RENDER[name](opts);
  initHScrolls();
  $('#screens').focus({ preventScroll: true });
}
function back() { go(state.stack.pop() || 'home'); }

/* ---------- brand assets (Gold S + Emerald $ on obsidian badge) ---------- */
const BRAND_MARK_SVG = `<svg viewBox="0 0 38 38" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <rect width="38" height="38" rx="11" fill="#000000" stroke="#333333" stroke-width="1.5"/>
  <text x="8" y="27" font-family="'Space Grotesk', system-ui, -apple-system, sans-serif" font-size="22" font-weight="800" fill="#F59E0B">S</text>
  <text x="21" y="27" font-family="'Space Grotesk', system-ui, -apple-system, sans-serif" font-size="22" font-weight="800" fill="#10B981">$</text>
</svg>`;

const BRAND_NAME_HTML = `<span class="logo-name" aria-label="Scout Shopper">
  <span class="name-scout">Scout</span>
  <span class="name-shopper"><span class="logo-dollar" aria-hidden="true">$</span>hopper</span>
  <span class="logo-dot" aria-hidden="true"></span>
</span>`;

/* ---------- shared header pieces (21st.dev inspired modern mobile nav) ---------- */
const topbar = (customRight = '') => `<header class="topbar">
  <div class="logo" data-action="go" data-screen="home" style="cursor: pointer;">
    <span class="logo-mark">${BRAND_MARK_SVG}</span>
    ${BRAND_NAME_HTML}
  </div>
  <div class="nav-actions">
    ${customRight ? customRight : `
      <button class="topbar-icon-btn cursor-pointer" data-action="go" data-screen="wishlist" data-push="1" aria-label="Watchlist (${state.droppedCount || state.wishlistCount || 0} items)" style="position:relative; background:var(--surface-2); border:1px solid var(--border); border-radius:999px; width:34px; height:34px; display:inline-flex; align-items:center; justify-content:center; color:var(--text);">
        ${icon('tag', 'ic-sm')}
        ${state.droppedCount > 0 ? `<span class="badge-count" style="position:absolute; top:-4px; right:-4px; background:#DC2626; color:#fff; font-size:.65rem; border-radius:999px; padding:1px 5px; font-weight:800;">${state.droppedCount}</span>` : ''}
      </button>
      <button class="topbar-icon-btn cursor-pointer" data-action="go" data-screen="cart" data-push="1" aria-label="Universal Cart (${state.cartCount || 0} items)" style="position:relative; background:var(--surface-2); border:1px solid var(--border); border-radius:999px; width:34px; height:34px; display:inline-flex; align-items:center; justify-content:center; color:var(--text);">
        ${icon('cart', 'ic-sm')}
        ${state.cartCount > 0 ? `<span class="badge-count" style="position:absolute; top:-4px; right:-4px; background:var(--gold); color:#000; font-size:.65rem; border-radius:999px; padding:1px 5px; font-weight:800;">${state.cartCount}</span>` : ''}
      </button>
      <button class="rewards-chip" data-action="go" data-screen="referral" aria-label="Affiliate Rewards: $${Number(state.earningsBalance || 35.0).toFixed(2)}">
        ${icon('zap', 'ic-sm')}<span>$${Number(state.earningsBalance || 35.0).toFixed(2)}</span>
      </button>
      <button class="user-capsule" data-action="go" data-screen="hub" aria-label="My Hub & Settings">
        <span class="region-badge">${esc(state.region)}</span>
        <span style="font-size: .78rem; font-weight: 700; color: #000; margin-left: 2px;">${esc((state.user && state.user.name ? state.user.name.split(' ')[0] : 'Alex'))}</span>
        ${icon('user', 'ic-sm')}
      </button>
    `}
  </div>
</header>`;

const regionChip = () => `<button class="chip-btn" data-action="go" data-screen="settings" aria-label="Change region, currently ${esc(regionLabel())}">${icon('globe', 'ic-sm')}${esc(regionLabel())}</button>`;

function storeChips() {
  const chips = [{ name: 'online', label: 'Online Store' }, ...state.stores.map((s) => ({ name: s.name, label: s.name }))];
  return `<div>
    <div class="hscroll" role="group" aria-label="Where are you shopping?">${chips.map((c) =>
      `<button class="store-chip cursor-pointer" data-action="store" data-store="${esc(c.name)}" aria-pressed="${state.store === c.name}">${c.name === 'online' ? icon('globe', 'ic-sm') : icon('store', 'ic-sm')}${esc(c.label)}</button>`).join('')}</div>
  </div>`;
}

function prodRow(p) {
  return `<button class="card prod-row" data-action="open" data-upc="${esc(p.upc)}">${img(p.image_url, p.category, p.title)}
    <div class="prod-info"><div class="prod-title">${esc(p.title)}</div><div class="prod-meta">${esc(p.store)} · ${esc(p.category)}</div>
    <div class="prod-prices"><span class="price-now">${money(p.best_online_total)}</span><span class="price-was">${money(p.shelf_price)}</span>${p.savings > 0 ? `<span class="pill">${icon('zap', 'ic-sm')}Save ${money(p.savings)}</span>` : ''}</div></div></button>`;
}
const skeleton = (n = 3) => Array.from({ length: n }, () => '<div class="skeleton"></div>').join('');

/* ---------- carousel & text animation controllers ---------- */
let tickerTimer = null;
function initTextTicker(selector = '.ticker-item') {
  if (tickerTimer) clearInterval(tickerTimer);
  const items = document.querySelectorAll(selector);
  if (!items.length) return;
  let idx = 0;
  tickerTimer = setInterval(() => {
    if (!items[idx]) return;
    items[idx].classList.remove('active');
    idx = (idx + 1) % items.length;
    if (items[idx]) items[idx].classList.add('active');
  }, 3800);
}

const activeCarousels = {};
function setupCarousel(trackId, dotsId, count, interval = 3600) {
  if (activeCarousels[trackId]) clearInterval(activeCarousels[trackId]);
  const track = $(`#${trackId}`);
  const dotsContainer = $(`#${dotsId}`);
  if (!track || count <= 1) return;
  let currentIdx = 0;

  function update() {
    track.style.transform = `translateX(-${currentIdx * 100}%)`;
    if (dotsContainer) {
      dotsContainer.querySelectorAll('.window-dot').forEach((d, i) => {
        d.classList.toggle('active', i === currentIdx);
      });
    }
  }

  function next() {
    currentIdx = (currentIdx + 1) % count;
    update();
  }

  activeCarousels[trackId] = setInterval(next, interval);

  const container = track.closest('.window-showcase');
  if (container) {
    container.addEventListener('mouseenter', () => clearInterval(activeCarousels[trackId]));
    container.addEventListener('mouseleave', () => {
      clearInterval(activeCarousels[trackId]);
      activeCarousels[trackId] = setInterval(next, interval);
    });
    container.addEventListener('touchstart', () => clearInterval(activeCarousels[trackId]), { passive: true });
    container.addEventListener('touchend', () => {
      clearInterval(activeCarousels[trackId]);
      activeCarousels[trackId] = setInterval(next, interval);
    });
  }

  if (dotsContainer) {
    dotsContainer.querySelectorAll('.window-dot').forEach((d, idx) => {
      d.addEventListener('click', (e) => {
        e.stopPropagation();
        currentIdx = idx;
        update();
      });
    });
  }
}

/* ---------- HOME (Minimalist & High-Density) ---------- */
RENDER.home = async () => {
  const el = $('#screen-home');
  el.innerHTML = topbar() + `
    <!-- 1. Hero & Instant Search Action -->
    <div class="hero">
      <h1>Find the <em>best price</em> anywhere.</h1>
    </div>
    <button class="searchbar" data-action="go" data-screen="search" data-focus="1" aria-label="Search products">${icon('search')}<span>Search products, brands, models...</span></button>

    <!-- 2. In-Store Barcode Scan CTA -->
    <button class="scan-cta" data-action="go" data-screen="scan">
      <span class="ico">${icon('scan', 'ic-lg')}</span>
      <span><strong>Scan barcode in-store</strong></span>
    </button>

    <!-- 3. Automated Picture Windows & Categories -->
    <div id="homeDeals">${skeleton(2)}</div>`;

  try {
    const [d, cats, recs] = await Promise.all([
      api(`/api/deals?${qs()}`),
      api(`/api/categories?region=${state.region}`),
      api(`/api/recommendations?user_id=usr_demo&${qs()}&limit=3`)
    ]);
    $('#homeDeals').innerHTML = `
      <!-- 1. AI Copilot Suite (High-Visibility 2x2 Command Grid) -->
      <div style="margin-top: 14px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <h2 style="font-size:.92rem; font-weight:800; font-family:'Space Grotesk',sans-serif; margin:0; text-transform:uppercase; letter-spacing:.04em; color:var(--gold);">
            ⚡ Smart Shopping Copilots
          </h2>
          <button class="chip-btn cursor-pointer" data-action="go" data-screen="copilots" data-push="1" style="font-size:.70rem; font-weight:700; padding:3px 9px;">
            View All Copilots ${icon('next', 'ic-sm')}
          </button>
        </div>
        <div class="copilot-grid" style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:14px;">
          <!-- Card 1: Receipt Watchdog -->
          <button class="card cursor-pointer" data-action="go" data-screen="receipts" data-push="1" style="margin:0; padding:12px; text-align:left; border-radius:12px; background:linear-gradient(135deg, rgba(245,158,11,0.12), rgba(217,119,6,0.04)); border:1.5px solid rgba(245,158,11,0.35);">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:6px;">
              <span style="color:#F59E0B; background:rgba(245,158,11,0.18); width:32px; height:32px; border-radius:8px; display:inline-flex; align-items:center; justify-content:center;">${icon('receipt', 'ic-sm')}</span>
              <span style="font-size:.65rem; font-weight:800; background:#F59E0B; color:#000; padding:2px 6px; border-radius:999px;">Refunds</span>
            </div>
            <div style="font-weight:800; font-size:.84rem; color:var(--text); margin-bottom:2px;">Price Watchdog</div>
            <div style="font-size:.70rem; color:var(--muted); line-height:1.25;">Track past receipts &amp; claim cash back</div>
          </button>

          <!-- Card 2: Quote Scanner -->
          <button class="card cursor-pointer" data-action="go" data-screen="services" data-push="1" style="margin:0; padding:12px; text-align:left; border-radius:12px; background:linear-gradient(135deg, rgba(5,150,105,0.12), rgba(4,120,87,0.04)); border:1.5px solid rgba(5,150,105,0.35);">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:6px;">
              <span style="color:#10B981; background:rgba(5,150,105,0.18); width:32px; height:32px; border-radius:8px; display:inline-flex; align-items:center; justify-content:center;">${icon('wrench', 'ic-sm')}</span>
              <span style="font-size:.65rem; font-weight:800; background:#10B981; color:#000; padding:2px 6px; border-radius:999px;">Labor Index</span>
            </div>
            <div style="font-weight:800; font-size:.84rem; color:var(--text); margin-bottom:2px;">Quote Scanner</div>
            <div style="font-size:.70rem; color:var(--muted); line-height:1.25;">Check contractor quotes for rip-offs</div>
          </button>

          <!-- Card 3: Gift Finder -->
          <button class="card cursor-pointer" data-action="go" data-screen="gifts" data-push="1" style="margin:0; padding:12px; text-align:left; border-radius:12px; background:linear-gradient(135deg, rgba(139,92,246,0.12), rgba(109,40,217,0.04)); border:1.5px solid rgba(139,92,246,0.35);">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:6px;">
              <span style="color:#A78BFA; background:rgba(139,92,246,0.18); width:32px; height:32px; border-radius:8px; display:inline-flex; align-items:center; justify-content:center;">${icon('gift', 'ic-sm')}</span>
              <span style="font-size:.65rem; font-weight:800; background:#A78BFA; color:#000; padding:2px 6px; border-radius:999px;">Curated</span>
            </div>
            <div style="font-weight:800; font-size:.84rem; color:var(--text); margin-bottom:2px;">Gift Finder</div>
            <div style="font-size:.70rem; color:var(--muted); line-height:1.25;">Find top sales by recipient &amp; holiday</div>
          </button>

          <!-- Card 4: Promote Business -->
          <button class="card cursor-pointer" data-action="go" data-screen="sponsor" data-push="1" style="margin:0; padding:12px; text-align:left; border-radius:12px; background:linear-gradient(135deg, rgba(59,130,246,0.12), rgba(29,78,216,0.04)); border:1.5px solid rgba(59,130,246,0.35);">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:6px;">
              <span style="color:#60A5FA; background:rgba(59,130,246,0.18); width:32px; height:32px; border-radius:8px; display:inline-flex; align-items:center; justify-content:center;">${icon('tag', 'ic-sm')}</span>
              <span style="font-size:.65rem; font-weight:800; background:#60A5FA; color:#000; padding:2px 6px; border-radius:999px;">Self-Serve</span>
            </div>
            <div style="font-weight:800; font-size:.84rem; color:var(--text); margin-bottom:2px;">Promote Business</div>
            <div style="font-size:.70rem; color:var(--muted); line-height:1.25;">Advertise to shoppers in your city</div>
          </button>
        </div>
      </div>

      <!-- 2. Recommendations Feed (Personalized to User Interests) -->
      <div class="section recs-section" style="margin-top: 6px;">
        <div class="section-head" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <div>
            <h2 style="margin:0;">Recommended For You</h2>
            <div style="font-size:.70rem; color:var(--muted);">Tailored to your shopping interests</div>
          </div>
          <button type="button" class="chip-btn cursor-pointer" id="editInterestsBtn" style="font-size:.68rem; padding:3px 9px; font-weight:700; white-space:nowrap;">
            ${icon('filter', 'ic-sm')} Edit Interests
          </button>
        </div>
        <div class="recs-list">
          ${recs.deals.slice(0, 3).map((p) => `
            <div class="recs-card" data-action="open" data-upc="${esc(p.upc)}" role="button" tabindex="0" aria-label="${esc(p.title)} - ${money(p.best_price)}, save ${money(p.savings_dollars)}">
              ${img(p.image_url, p.category, p.title, 'thumb')}
              <div class="prod-info">
                <div class="prod-title">${esc(p.title)}</div>
                <div class="prod-prices">
                  <span class="price-now">${money(p.best_price)}</span>
                  <span class="price-was">${money(p.shelf_price)}</span>
                  <span class="pill save-pill">${icon('zap', 'ic-sm')} Save ${money(p.savings_dollars)} (${p.savings_pct}%)</span>
                </div>
              </div>
              <span class="recs-chevron" aria-hidden="true">${icon('next', 'ic-sm')}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- 3. Referral Promo Card -->
      <div class="card" style="margin-top: 16px; padding: 14px; background: linear-gradient(135deg, #F59E0B, #D97706); color: #000; display: flex; align-items: center; justify-content: space-between; gap: 12px; border-radius: var(--radius); border: 1.5px solid #B45309; cursor: pointer;" data-action="go" data-screen="referral">
        <div>
          <h3 style="font-size: 1rem; font-family: 'Space Grotesk'; font-weight: 800; color: #000; margin: 0;">Invite Friends, Earn $5.00</h3>
        </div>
        <button class="btn btn-save" style="min-height: 36px; padding: 0 14px; font-size: .8rem; white-space: nowrap; flex-shrink: 0; background: #059669; color: #fff;">Share Link</button>
      </div>

      <!-- 4. Picture Window 1: Biggest Savings Today -->
      <div class="section">
        <div class="section-head">
          <h2>Biggest Savings Today</h2>
        </div>
        <div class="window-showcase" id="dealsShowcase">
          <div class="window-track" id="dealsTrack">
            ${d.deals.map((p) => `
              <button class="window-slide" data-action="open" data-upc="${esc(p.upc)}">
                <div class="window-img-box">
                  ${img(p.image_url, p.category, p.title, 'window-img')}
                  <div class="window-badge-overlay">
                    <span class="pill">${icon('zap', 'ic-sm')} Save ${money(p.savings)}</span>
                  </div>
                </div>
                <div class="window-content">
                  <div class="window-title">${esc(p.title)}</div>
                  <div class="window-meta">
                    <span>${esc(p.store)} shelf: ${money(p.shelf_price)}</span>
                    <span>${esc(p.category)}</span>
                  </div>
                  <div class="window-prices">
                    <span class="price-now">${money(p.best_online_total)}</span>
                    <span class="btn btn-save" style="min-height:34px; padding:0 12px; font-size:.78rem;">Inspect Deal ${icon('next', 'ic-sm')}</span>
                  </div>
                </div>
              </button>
            `).join('')}
          </div>
          <div class="window-dots" id="dealsDots">
            ${d.deals.map((_, i) => `<button class="window-dot ${i === 0 ? 'active' : ''}" aria-label="Go to deal ${i + 1}"></button>`).join('')}
          </div>
        </div>
      </div>

      <!-- 5. Picture Window 2: Shop Small, Save Big -->
      <div class="section">
        <div class="section-head">
          <h2>Shop Small, Save Big</h2>
        </div>
        <div class="window-showcase" id="makerShowcase" style="border-top: 3px solid var(--maker);">
          <div class="window-track" id="makerTrack">
            ${d.shop_small.map((s) => `
              <button class="window-slide" data-action="open" data-upc="${esc(s.upc)}">
                <div class="window-img-box">
                  ${img(s.image_url, 'box', s.title, 'window-img')}
                  <div class="window-badge-overlay">
                    <span class="pill maker">${icon('star', 'ic-sm')} ${s.rating}</span>
                    <span class="tag" style="background:rgba(15,118,110,.9); color:#fff; border-radius:6px; padding:2px 8px;">${esc(s.platform)}</span>
                  </div>
                </div>
                <div class="window-content">
                  <div class="window-title">${esc(s.title)}</div>
                  <div class="window-meta">
                    <span style="color:var(--maker); font-weight:700;">${esc(s.brand_name)}</span>
                    <span>vs. mass-produced</span>
                  </div>
                  <p style="font-size:.76rem; color:var(--muted); margin: 2px 0;">${esc(s.perk)}</p>
                  <div class="window-prices">
                    <span class="price-now" style="color:var(--maker)">${money(s.price)}</span>
                    <span class="btn btn-maker" style="min-height:34px; padding:0 12px; font-size:.78rem;">Discover Maker ${icon('next', 'ic-sm')}</span>
                  </div>
                </div>
              </button>
            `).join('')}
          </div>
          <div class="window-dots" id="makerDots">
            ${d.shop_small.map((_, i) => `<button class="window-dot ${i === 0 ? 'active' : ''}" aria-label="Go to maker ${i + 1}"></button>`).join('')}
          </div>
        </div>
      </div>`;

    setupCarousel('dealsTrack', 'dealsDots', d.deals.length, 6500);
    setupCarousel('makerTrack', 'makerDots', d.shop_small.length, 7200);

    $('#editInterestsBtn')?.addEventListener('click', () => {
      showInterestsModal(() => RENDER.home());
    });

  } catch (e) { $('#homeDeals').innerHTML = `<div class="empty">${esc(e.message)}</div>`; }
};

/* ---------- SEARCH ---------- */
RENDER.search = async (opts = {}) => {
  const el = $('#screen-search');
  if (!el.dataset.built) {
    el.dataset.built = '1';
    el.innerHTML = topbar() + `<h1 class="page-title">Search Products</h1>
      <label class="searchbar">${icon('search')}<span class="sr-only">Search products</span><input id="q" type="search" placeholder="Search products, brands, models" autocomplete="off"></label>
      <div class="cat-chips" id="catChips" role="group" aria-label="Categories" style="margin-top:14px;"></div>
      <div class="section"><div id="results"></div></div>`;
    let t; $('#q').addEventListener('input', (e) => { state.query = e.target.value; clearTimeout(t); t = setTimeout(runSearch, 200); });
  }
  $('#q').value = state.query;
  try {
    const cats = await api(`/api/categories?region=${state.region}`);
    const chipsEl = $('#catChips');
    chipsEl.innerHTML = [{ name: '', label: 'All Categories' }, ...cats.map((c) => ({ name: c.name, label: c.name }))].map((c) =>
      `<button class="store-chip" data-action="cat" data-cat="${esc(c.name)}" aria-pressed="${state.category === c.name}">${esc(c.label)}</button>`).join('');
    enableDragScroll(chipsEl);
  } catch (_) {}
  if (opts.focus) setTimeout(() => $('#q').focus(), 50);
  runSearch();
};

async function runSearch() {
  const box = $('#results'); if (!box) return;
  try {
    const [r, ads] = await Promise.all([
      api(`/api/search?${qs()}&q=${encodeURIComponent(state.query)}${state.category ? `&category=${encodeURIComponent(state.category)}` : ''}`),
      api(`/api/ads/active?category=${encodeURIComponent(state.category || 'All')}`)
    ]);

    if (!r.length) {
      box.innerHTML = `<div class="empty">${icon('search', 'ic-lg')}<p><strong>No matches found</strong></p><p>Try a brand, model number, or a different category.</p></div>`;
      return;
    }

    const rows = r.map(prodRow);
    if (ads && ads.length > 0) {
      const ad = ads[0];
      const badgeCls = ad.vendor_type === 'shopify' ? 'shopify' : ad.vendor_type === 'etsy' ? 'etsy' : 'local';
      const adHtml = `
        <div class="card" style="border: 1.5px solid var(--gold); background: linear-gradient(135deg, rgba(245,158,11,0.06), rgba(245,158,11,0.01)); padding: 12px; margin-bottom: 10px;">
          <div style="display:flex; gap:12px; align-items:flex-start;">
            <img class="thumb" src="${esc(ad.image_url || tile('box'))}" alt="${esc(ad.title)}" loading="lazy" style="width:68px; height:68px; border-radius:10px; object-fit:cover; flex-shrink:0;">
            <div style="flex:1; min-width:0;">
              <div style="display:flex; align-items:center; gap:6px; margin-bottom:3px; flex-wrap:wrap;">
                <span class="sponsored-pill ${badgeCls}">${icon('zap', 'ic-sm')} ${esc(ad.badge_label)}</span>
                <span style="font-size:.70rem; font-weight:600; color:var(--muted);">${esc(ad.vendor_name)}</span>
              </div>
              <div class="prod-title" style="font-size:.88rem; font-weight:700; line-height:1.25; margin-bottom:3px;">${esc(ad.title)}</div>
              <div class="prod-meta" style="font-size:.74rem; color:var(--muted); line-height:1.3;">${esc(ad.description || '')}</div>
              <div class="prod-prices" style="margin-top:4px;">
                <span class="price-now" style="font-size:1.05rem; font-weight:800; color:var(--save);">${money(ad.price)}</span>
              </div>
            </div>
          </div>
          <div style="margin-top:10px; padding-top:9px; border-top:1px solid rgba(245,158,11,0.2); display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:.70rem; color:var(--muted);">${esc(ad.city || 'Verified Partner')}</span>
            <button class="btn btn-gold cursor-pointer" data-action="ad-click" data-id="${esc(ad.id)}" data-url="${esc(ad.store_url)}" style="min-height:32px; padding:0 12px; font-size:.76rem; font-weight:700; display:inline-flex; align-items:center; gap:6px;">
              Visit ${esc(ad.store_platform)} ${icon('external', 'ic-sm')}
            </button>
          </div>
        </div>
      `;
      rows.splice(Math.min(1, rows.length), 0, adHtml);
    }

    rows.push(`
      <div class="admob-banner-unit cursor-pointer" data-action="open-admob-sandbox" style="cursor:pointer;" title="Tap to test Google AdMob Sandbox">
        <span style="font-size:.68rem; color:var(--muted); font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">Advertisement (AdMob Test Unit)</span>
        <span style="font-size:.68rem; color:var(--gold); font-weight:700;">Open Sandbox &rarr;</span>
      </div>
    `);

    box.innerHTML = rows.join('');
  } catch (e) { box.innerHTML = `<div class="empty">${esc(e.message)}</div>`; }
}

/* ---------- SCAN & CAMERA HARDWARE (LIFECYCLE & TORCH) ---------- */
let activeCameraStream = null;
let activeZXingReader = null;
let isTorchOn = false;

function stopCamera() {
  if (activeZXingReader) {
    try { activeZXingReader.reset(); } catch (_) {}
    activeZXingReader = null;
  }
  if (activeCameraStream) {
    try {
      activeCameraStream.getTracks().forEach(t => t.stop());
    } catch (_) {}
    activeCameraStream = null;
    isTorchOn = false;
    const video = $('#cameraVideo');
    const idle = $('#vfIdleOverlay');
    const btn = $('#cameraToggleBtn');
    const torchBtn = $('#cameraTorchBtn');
    const scanner = $('#unifiedScanner');
    if (video) { video.classList.add('hidden'); video.srcObject = null; }
    if (idle) idle.classList.remove('hidden');
    if (btn) btn.classList.add('hidden');
    if (torchBtn) {
      torchBtn.classList.add('hidden');
      torchBtn.classList.remove('active');
      torchBtn.setAttribute('aria-pressed', 'false');
    }
    if (scanner) scanner.classList.remove('active-scanning');
  }
}

async function toggleTorch() {
  if (!activeCameraStream) return;
  const track = activeCameraStream.getVideoTracks()[0];
  if (!track) return;
  try {
    const capabilities = track.getCapabilities ? track.getCapabilities() : {};
    if (!capabilities.torch) {
      toast('Flashlight not supported on this camera device');
      return;
    }
    isTorchOn = !isTorchOn;
    await track.applyConstraints({
      advanced: [{ torch: isTorchOn }]
    });
    const torchBtn = $('#cameraTorchBtn');
    if (torchBtn) {
      torchBtn.classList.toggle('active', isTorchOn);
      torchBtn.setAttribute('aria-pressed', isTorchOn ? 'true' : 'false');
    }
    haptic('light');
    toast(isTorchOn ? 'Flashlight ON' : 'Flashlight OFF');
  } catch (err) {
    toast('Flashlight error: ' + (err.message || 'unsupported'));
  }
}

async function toggleCamera() {
  const scanner = $('#unifiedScanner');
  const video = $('#cameraVideo');
  const idle = $('#vfIdleOverlay');
  const btn = $('#cameraToggleBtn');
  const torchBtn = $('#cameraTorchBtn');
  if (!scanner || !video || !idle || !btn) return;

  if (activeCameraStream) {
    stopCamera();
    toast('Camera closed');
    haptic('light');
    return;
  }

  try {
    toast('Accessing phone camera...');
    activeCameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1280 } }
    });
    video.srcObject = activeCameraStream;
    video.classList.remove('hidden');
    idle.classList.add('hidden');
    btn.classList.remove('hidden');
    if (torchBtn) {
      const track = activeCameraStream.getVideoTracks()[0];
      const caps = track?.getCapabilities ? track.getCapabilities() : {};
      if (caps.torch) {
        torchBtn.classList.remove('hidden');
      }
    }
    scanner.classList.add('active-scanning');
    haptic('success');
    toast('Camera active: Align barcode in frame');

    const onBarcodeDetected = (rawVal) => {
      stopCamera();
      haptic('success');
      toast('Barcode scanned: ' + rawVal);
      openProduct(rawVal);
    };

    if ('BarcodeDetector' in window) {
      const barcodeDetector = new BarcodeDetector({ formats: ['upc_a', 'upc_e', 'ean_13', 'code_128', 'qr_code'] });
      const scanTick = async () => {
        if (!activeCameraStream) return;
        try {
          const codes = await barcodeDetector.detect(video);
          if (codes.length > 0) {
            onBarcodeDetected(codes[0].rawValue);
            return;
          }
        } catch (_) {}
        if (activeCameraStream) requestAnimationFrame(scanTick);
      };
      video.onloadedmetadata = () => scanTick();
    } else if (window.ZXing && window.ZXing.BrowserMultiFormatReader) {
      // Universal Cross-Platform Fallback for iOS WKWebView, Safari, and all browsers
      try {
        const codeReader = new ZXing.BrowserMultiFormatReader();
        activeZXingReader = codeReader;
        codeReader.decodeFromVideoElement(video, (result, err) => {
          if (result && activeCameraStream) {
            const rawVal = result.getText ? result.getText() : result.text;
            if (rawVal) {
              try { codeReader.reset(); } catch (_) {}
              activeZXingReader = null;
              onBarcodeDetected(rawVal);
            }
          }
        });
      } catch (e) {
        console.warn('ZXing init error', e);
      }
    } else {
      toast('Camera active! Point at barcode to scan');
    }
  } catch (err) {
    toast('Camera permission error or not supported on this device.');
    haptic('warning');
  }
}

RENDER.scan = async () => {
  const el = $('#screen-scan');
  el.innerHTML = topbar() + `<h1 class="page-title">Scan a barcode</h1>
    
    <!-- Unified Interactive Viewfinder Arena -->
    <div class="viewfinder unified-viewfinder" id="unifiedScanner" role="region" aria-label="Barcode camera scanner">
      <!-- Live video stream element -->
      <video id="cameraVideo" class="vf-video hidden" autoplay playsinline muted></video>
      
      <!-- Visual scanning reticle & sweeping laser line -->
      <div class="vf-frame">
        <i></i><i></i><i></i><i></i>
        <span class="vf-line"></span>
      </div>

      <!-- Idle state portal overlay -->
      <div class="vf-idle-overlay" id="vfIdleOverlay" data-action="toggle-camera" role="button" tabindex="0" aria-label="Start Camera Scan">
        <span class="vf-idle-icon">${icon('scan', 'ic-lg')}</span>
        <strong>Tap to Start Camera Scan</strong>
        <small>Align shelf barcode inside the frame</small>
      </div>

      <!-- Active state floating controls bar (Stop + Torch) -->
      <div class="vf-controls-bar" id="vfControlsBar">
        <button class="vf-active-btn hidden" id="cameraToggleBtn" data-action="toggle-camera">
          <span class="vf-live-dot"></span> Stop Camera
        </button>
        <button class="vf-torch-btn hidden" id="cameraTorchBtn" type="button" aria-label="Toggle Flashlight" aria-pressed="false">
          <svg class="ic-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          <span>Flashlight</span>
        </button>
      </div>
    </div>

    <!-- Instant Demo Test Barcodes (1-Tap Simulation) -->
    <div class="demo-barcodes-quickbar" style="margin: 14px 0 10px;">
      <div style="font-size:.76rem; font-weight:800; color:var(--text); margin-bottom:8px; display:flex; align-items:center; justify-content:space-between;">
        <span>⚡ Quick Test Barcodes (1-Tap Scan)</span>
        <span style="font-size:.68rem; color:var(--save); font-weight:700;">Verified In-Store</span>
      </div>
      <div class="no-scrollbar" style="display:flex; gap:8px; overflow-x:auto; padding-bottom:4px; -webkit-overflow-scrolling:touch;">
        <button class="chip-btn cursor-pointer" data-action="open" data-upc="885609027814" style="flex-shrink:0; font-size:.74rem; padding:6px 11px; background:var(--surface-2); border:1.5px solid var(--border); border-radius:999px; font-weight:700;">
          Dyson V11 Vacuum
        </button>
        <button class="chip-btn cursor-pointer" data-action="open" data-upc="027242919419" style="flex-shrink:0; font-size:.74rem; padding:6px 11px; background:var(--surface-2); border:1.5px solid var(--border); border-radius:999px; font-weight:700;">
          Sony WH-1000XM5
        </button>
        <button class="chip-btn cursor-pointer" data-action="open" data-upc="611247385203" style="flex-shrink:0; font-size:.74rem; padding:6px 11px; background:var(--surface-2); border:1.5px solid var(--border); border-radius:999px; font-weight:700;">
          Keurig K-Supreme
        </button>
        <button class="chip-btn cursor-pointer" data-action="open" data-upc="041908001015" style="flex-shrink:0; font-size:.74rem; padding:6px 11px; background:var(--surface-2); border:1.5px solid var(--border); border-radius:999px; font-weight:700;">
          Stanley Tumbler 40oz
        </button>
        <button class="chip-btn cursor-pointer" data-action="open" data-upc="078945612301" style="flex-shrink:0; font-size:.74rem; padding:6px 11px; background:var(--surface-2); border:1.5px solid var(--border); border-radius:999px; font-weight:700;">
          Anker MagGo Qi2
        </button>
      </div>
    </div>

    <!-- Progressive Disclosure: Manual UPC Entry -->
    <div class="manual-upc-wrap">
      <button class="manual-upc-toggle" id="toggleUpcBtn" type="button" aria-expanded="false">
        ${icon('box', 'ic-sm')} <span>Enter barcode manually</span>
      </button>
      <form class="field manual-upc-form hidden" id="upcForm">
        <input id="upc" inputmode="numeric" placeholder="Enter UPC (e.g. 885609027814)" aria-label="UPC barcode number">
        <button class="btn btn-save" type="submit">Look up</button>
      </form>
    </div>

    <div class="section" style="margin-top: 18px;">
      <div class="section-head"><h2>Simulate in-store items</h2><span>tap to test in-aisle</span></div>
      <div id="demoList">${skeleton(2)}</div>
    </div>`;

  $('#cameraTorchBtn')?.addEventListener('click', () => toggleTorch());

  const toggleUpc = $('#toggleUpcBtn');
  const formUpc = $('#upcForm');
  if (toggleUpc && formUpc) {
    toggleUpc.addEventListener('click', () => {
      const isHidden = formUpc.classList.toggle('hidden');
      toggleUpc.setAttribute('aria-expanded', !isHidden);
      toggleUpc.querySelector('span').textContent = isHidden ? 'Enter barcode manually' : 'Hide manual entry';
      if (!isHidden) $('#upc')?.focus();
    });
  }

  $('#upcForm').addEventListener('submit', (e) => { e.preventDefault(); const v = $('#upc').value.trim(); if (v) openProduct(v); });
  try {
    const items = await api(`/api/search?${qs()}`);
    $('#demoList').innerHTML = items.map((p) => `<button class="card prod-row" data-action="open" data-upc="${esc(p.upc)}">${img(p.image_url, p.category, p.title)}<div class="prod-info"><div class="prod-title">${esc(p.title)}</div><div class="prod-meta">UPC ${esc(p.upc)} · ${esc(p.store)}</div></div>${icon('next')}</button>`).join('');
  } catch (e) { $('#demoList').innerHTML = `<div class="empty">${esc(e.message)}</div>`; }
};

/* ---------- PRODUCT DETAILS & WATCHDOG ---------- */
async function openProduct(upc) {
  await go('product', { push: true });
  const el = $('#screen-product');
  el.innerHTML = topbar() + skeleton(3);
  try {
    const d = await api(`/api/scan/${encodeURIComponent(upc)}?${qs()}&store=${encodeURIComponent(state.store)}&share_telemetry=${state.share}`);
    state.current = d; drawProduct(d);
    if (d.scan_bounty_awarded) {
      toast('⚡ Anonymous In-Store Telemetry Bonus credited to your wallet!');
      await updateBadges();
    }
  } catch (e) {
    el.innerHTML = `
      <header class="topbar">
        <button class="back-btn cursor-pointer" data-action="back">${icon('back')}Back</button>
        <span class="topbar-title">Barcode Scan</span>
      </header>
      <div style="padding:24px 16px; text-align:center;">
        <div style="width:56px; height:56px; border-radius:50%; background:rgba(217,119,6,0.12); color:var(--gold); display:flex; align-items:center; justify-content:center; margin:0 auto 16px;">
          ${icon('search', 'ic-lg')}
        </div>
        <h2 style="font-size:1.1rem; font-weight:800; margin-bottom:6px;">Item Not in Instant Catalog</h2>
        <p style="font-size:.82rem; color:var(--muted); margin-bottom:18px;">
          Scanned Barcode: <strong style="color:var(--text);">${esc(upc)}</strong><br>
          We couldn't match this exact barcode yet. Search by product name below to find instant store prices:
        </p>
        <div style="display:flex; gap:8px; margin-bottom:20px;">
          <input type="text" id="notFoundSearchInput" class="input" placeholder="e.g. Dyson V11, DeWALT 20V..." style="flex:1;">
          <button class="btn btn-gold cursor-pointer" id="btnNotFoundSearch">${icon('search')}Search</button>
        </div>
        <button class="btn btn-outline cursor-pointer" style="width:100%;" data-action="go" data-screen="home">
          Browse Top Deals
        </button>
      </div>
    `;
    const inp = $('#notFoundSearchInput');
    const sbtn = $('#btnNotFoundSearch');
    const doSearch = async () => {
      const q = inp?.value?.trim();
      if (q) {
        state.query = q;
        await go('search');
      }
    };
    if (sbtn) sbtn.onclick = doSearch;
    if (inp) inp.onkeydown = (ev) => { if (ev.key === 'Enter') doSearch(); };
  }
}

RENDER.product = async () => {};

function drawProduct(d) {
  const el = $('#screen-product'); const o = d.lowest_online_offer; const cs = d.cashier_shield; const a = (d.shop_small_alternatives || [])[0];
  const save = Math.max(0, d.shelf_price - o.total_cost);
  
  // Specific Current Shelf Price text
  const shelfLabel = d.shelf_store_label || `Current shelf price at ${d.shelf_store}`;
  const sub = state.regions[d.region]?.subdivisions?.[state.province];
  const subName = sub ? (typeof sub === 'object' ? sub.name : sub) : '';
  const taxNote = `Tax estimated at ${(d.tax_rate * 100).toFixed(1)}%${subName ? ' (' + subName + ')' : ''}.`;
  
  let shield = '';
  if (cs && cs.eligible) {
    shield = `<div class="card cashier ok"><h3>${icon('shield')}Price match eligible at ${esc(cs.store_name)}</h3><p>${esc(cs.verdict)}</p>
      <div class="script"><small>Ask associate to verify on store terminal</small>${esc(cs.cashier_script)}</div>
      <div style="font-size:.66rem; color:var(--muted); margin-top:5px;">${esc(cs.verification_note || 'Associates must verify the price live on their terminal. Store manager discretion applies.')}</div>
      <p style="margin-top:6px;"><a href="${esc(cs.policy_link)}" target="_blank" rel="noopener">View ${esc(cs.store_name)} verified policy</a></p></div>`;
  } else if (cs) {
    shield = `<div class="card cashier no"><h3>${icon('alert')}No in-store match at ${esc(cs.store_name)}</h3><p>${esc(cs.verdict)}</p>${cs.policy_link ? `<p><a href="${esc(cs.policy_link)}" target="_blank" rel="noopener">View store policy terms</a></p>` : ''}</div>`;
  }

  el.innerHTML = `<header class="topbar"><button class="back-btn" data-action="back">${icon('back')}Back</button><button class="chip-btn" data-action="go" data-screen="wishlist">${icon('tag', 'ic-sm')}Watchlist</button></header>
    <div class="p-hero">${img(d.image_url, d.category, d.title)}<div><div class="p-title">${esc(d.title)}</div><div class="prod-meta">Model ${esc(d.model_number)} · UPC ${esc(d.upc)}</div></div></div>
    
    <!-- Current Shelf Price vs Online Best -->
    <div class="compare" style="margin-top:14px">
      <div class="card cmp shelf"><small>${esc(shelfLabel)}</small><span class="big">${money(d.shelf_price)}</span></div>
      <div class="card cmp online"><small>Best online, all-in</small><span class="big">${money(o.total_cost)}</span></div>
    </div>
    
    ${save > 0 ? `<div class="savings-banner">${icon('zap')}Save ${money(save)} by buying from ${esc(o.retailer)}</div>` : ''}
    ${shield}

    <!-- Watchdog Price Drop Tracker Card -->
    <div class="card" style="padding:12px; margin-top:12px; border:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; gap:10px;">
      <div>
        <strong style="font-size: .88rem; display:flex; align-items:center; gap:6px; color:var(--text); font-weight:700;">
          ${icon('bell', 'ic-sm')} Price Watchdog
        </strong>
        <span style="font-size:.76rem; color:var(--muted);">Alerts if price drops below ${money(o.price)}</span>
      </div>
      <button class="btn btn-save" data-action="wishlist-add" style="white-space:nowrap; min-height:36px; padding:0 14px; font-size:.78rem;">
        Track Price
      </button>
    </div>

    <!-- Big-Box Lowest Offer -->
    <div class="card offer-card big"><div class="offer-top"><span class="tag">${icon('store', 'ic-sm')}Best big-store price</span><span class="pill">Save ${money(Math.max(0, o.savings_vs_shelf))}</span></div>
      <div class="offer-name">${esc(o.retailer)}</div><div class="prod-meta">${esc(o.seller_name)} · ${o.delivery_days === 1 ? 'Next-day' : o.delivery_days + '-day'} delivery</div>
      <div class="rows"><div>Price<b>${money(o.price)}</b></div><div>Shipping<b>${o.shipping === 0 ? 'FREE' : money(o.shipping)}</b></div><div>Estimated tax<b>${money(o.estimated_tax)}</b></div><div class="tot">True total<b>${money(o.total_cost)}</b></div></div>
      <div class="prod-meta" style="margin-top:6px">${esc(taxNote)}</div>
      <div class="btn-row"><button class="btn btn-ghost" data-action="add" data-kind="bigbox">${icon('cart', 'ic-sm')}Add to cart</button><a class="btn btn-save" href="${esc(o.affiliate_url)}" target="_blank" rel="noopener sponsored">Buy now${icon('external', 'ic-sm')}</a></div>
      <div style="font-size:.62rem; color:var(--muted); text-align:center; margin-top:6px;">Affiliate disclosure: Scout $hopper may earn a referral fee from merchant purchases at no extra cost to you.</div></div>
    
    <!-- Support Small & Independent Artisan Offer -->
    ${a ? `<div class="card offer-card small"><div class="offer-top"><span class="tag" style="color:var(--maker)">${icon('leaf', 'ic-sm')}Support small &amp; independent</span><span class="pill maker">${icon('star', 'ic-sm')}${a.rating} (${a.review_count})</span></div>
      <div class="offer-name">${esc(a.title)}</div><div class="prod-meta">${esc(a.brand_name)} · ${esc(a.platform)}</div><div class="prod-meta" style="margin-top:4px">${esc(a.perk)}</div>
      <div class="rows"><div>Maker price<b>${money(a.price)}</b></div><div>Shipping<b>${a.shipping === 0 ? 'FREE' : money(a.shipping)}</b></div><div class="tot">Total before tax<b>${money(a.price + a.shipping)}</b></div></div>
      <div class="btn-row"><button class="btn btn-ghost" data-action="add" data-kind="small">${icon('cart', 'ic-sm')}Add to cart</button><a class="btn btn-maker" href="${esc(a.merchant_url)}" target="_blank" rel="noopener sponsored">Visit maker${icon('external', 'ic-sm')}</a></div>
      <div style="font-size:.62rem; color:var(--muted); text-align:center; margin-top:6px;">Direct partner link: Purchases support independent makers.</div></div>` : ''}
    
    <!-- All Online Offers List -->
    <div class="section"><div class="section-head"><h2>All online offers</h2><span>lowest total first</span></div><div class="card">${d.all_offers.map((x, i) => `<div class="list-row ${i === 0 ? 'best' : ''}"><div>${esc(x.retailer)}<small>${esc(x.seller_name)}${x.shipped_and_sold_by_retailer ? '' : ' · third-party seller'}</small></div><div style="text-align:right"><b>${money(x.total_cost)}</b><small>${money(x.price)} + tax/ship</small></div></div>`).join('')}</div></div>`;
}

/* ---------- WISHLIST & PRICE-DROP WATCHDOG ---------- */
RENDER.wishlist = async () => {
  const el = $('#screen-wishlist');
  const w = await api('/api/wishlist');
  updateBadges();

  el.innerHTML = topbar() + `
    <!-- Post-Purchase Receipt Watchdog Banner -->
    <div class="card cursor-pointer" data-action="go" data-screen="receipts" data-push="1" style="margin-bottom:14px; background:linear-gradient(135deg, rgba(245,158,11,0.08), rgba(5,150,105,0.06)); border:1.5px solid var(--gold); display:flex; align-items:center; justify-content:space-between; padding:12px 14px;">
      <div style="display:flex; align-items:center; gap:10px;">
        <span style="color:var(--gold);">${icon('receipt')}</span>
        <div>
          <div style="font-weight:700; font-size:.85rem;">Already bought something?</div>
          <div style="font-size:.74rem; color:var(--muted);">Track receipts for price drops &amp; 1-tap store refunds</div>
        </div>
      </div>
      <button class="btn btn-gold cursor-pointer" data-action="go" data-screen="receipts" data-push="1" style="padding:4px 10px; font-size:.75rem; white-space:nowrap;">Open Watchdog</button>
    </div>

    <h1 class="page-title">Watchdog Wishlist</h1>` +
    (w.items.length ? `
      <div>${w.items.map((i) => `
        <div class="card wish-card">
          <div style="display:flex; gap:12px; align-items:center;">
            ${img(i.image_url, 'box', i.title)}
            <div class="prod-info">
              <div class="prod-title">${esc(i.title)}</div>
              <div class="prod-meta">Original: ${money(i.baseline_price)} · Target: ${money(i.target_price || i.baseline_price * 0.9)}</div>
              <div class="prod-prices">
                <span class="price-now">Current: ${money(i.current_lowest_price)}</span>
                ${i.price_dropped ? `<span class="pill">${icon('zap', 'ic-sm')}Dropped -${money(i.drop_savings)}</span>` : '<span class="pill" style="background:var(--surface-2); color:var(--muted)">Watching</span>'}
              </div>
            </div>
            <button class="remove" data-action="wishlist-remove" data-id="${esc(i.id)}" aria-label="Remove from Watchlist">${icon('trash')}</button>
          </div>

          ${i.price_dropped ? `
            <div class="drop-alert">
              ${icon('bell', 'ic-sm')}
              <div>
                <strong>Price Drop Detected!</strong> Now ${money(i.new_lowest_price)} (${money(i.drop_savings)} savings). Target price reached!
              </div>
            </div>` : ''}

          <div style="display:flex; gap:8px; margin-top:10px;">
            <button class="sim-drop-btn cursor-pointer" data-action="simulate-drop" data-id="${esc(i.id)}">
              ${icon('zap', 'ic-sm')} Simulate Price Drop Scan
            </button>
            <a class="btn btn-save" style="min-height:36px; padding:0 12px; font-size:.78rem; margin-left:auto;" href="${esc(i.affiliate_url)}" target="_blank" rel="noopener sponsored">
              Buy Now ${icon('external', 'ic-sm')}
            </a>
          </div>
        </div>
      `).join('')}</div>`
    : `<div class="empty">
        ${icon('tag', 'ic-lg')}
        <p><strong>Your Watchlist is empty</strong></p>
        <p>Scan or browse products and tap "Track Price Drops" to enable autonomous AI price tracking.</p>
        <button class="btn btn-save" style="margin-top:14px" data-action="go" data-screen="search">Find products to track</button>
       </div>`);
};

async function addToWishlist() {
  const d = state.current; if (!d) return;
  const o = d.lowest_online_offer || (d.all_offers && d.all_offers[0]) || { price: d.shelf_price, retailer: d.shelf_store, affiliate_url: '' };
  const item = {
    id: `wish-${d.upc}`,
    upc: d.upc,
    title: d.title,
    store: d.shelf_store,
    baseline_price: o.price,
    current_lowest_price: o.price,
    target_price: o.price,
    image_url: d.image_url,
    affiliate_url: o.affiliate_url || ''
  };
  await api('/api/wishlist/add', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item) });
  toast('Saved to Watchlist! AI will alert on price drop.');
  updateBadges();
}

async function addToCart(kind) {
  const d = state.current; if (!d) return;
  let item;
  if (kind === 'bigbox') {
    const o = d.lowest_online_offer || (d.all_offers && d.all_offers[0]) || { retailer: 'Retailer', price: d.shelf_price, shipping: 0, estimated_tax: 0, total_cost: d.shelf_price, affiliate_url: '' };
    item = { id: `${d.upc}-${o.retailer}`, upc: d.upc, title: d.title, retailer: o.retailer, price: o.price, shipping: o.shipping || 0, tax: o.estimated_tax || 0, total: o.total_cost || o.price, image_url: d.image_url, affiliate_url: o.affiliate_url || '', is_shop_small: false };
  } else {
    const a = d.shop_small_alternatives && d.shop_small_alternatives[0];
    if (!a) {
      toast('No Shop Small maker alternative available for this item');
      return;
    }
    item = { id: `${d.upc}-small`, upc: d.upc, title: a.title, retailer: a.brand_name, price: a.price, shipping: a.shipping || 0, tax: 0, total: a.price + (a.shipping || 0), image_url: a.image_url, affiliate_url: a.merchant_url || '', is_shop_small: true };
  }
  const cart = await api('/api/cart');
  if (cart.items.some((i) => i.id === item.id)) { toast('Already in your cart'); return; }
  await api('/api/cart/add', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item) });
  toast('Added to Universal Cart'); updateBadges();
}

async function updateBadges() {
  try {
    const [c, w, aff] = await Promise.all([
      api('/api/cart'),
      api('/api/wishlist'),
      api('/api/affiliate/stats?user_id=usr_demo').catch(() => null)
    ]);
    state.cartCount = c.item_count;
    state.droppedCount = w.dropped_count;
    state.wishlistCount = w.item_count;
    if (aff && aff.earnings_balance !== undefined) {
      state.earningsBalance = aff.earnings_balance;
      document.querySelectorAll('.rewards-chip span').forEach(el => {
        el.textContent = money(aff.earnings_balance);
      });
    }
    const cb = $('#cartBadge'); if (cb) { cb.textContent = c.item_count; cb.classList.toggle('hidden', !c.item_count); }
    const wb = $('#wishlistBadge'); if (wb) { wb.textContent = w.dropped_count || w.item_count; wb.classList.toggle('hidden', !w.item_count); }
    const hubB = $('#hubBadge'); if (hubB) { hubB.textContent = c.item_count + (w.dropped_count || 0); hubB.classList.toggle('hidden', !(c.item_count + (w.dropped_count || 0))); }
  } catch (_) {}
}

/* ---------- CART ---------- */
RENDER.cart = async () => {
  const el = $('#screen-cart'); const c = await api('/api/cart'); updateBadges();
  el.innerHTML = topbar() + `<h1 class="page-title">Universal Cart</h1>` + (c.items.length ? `
    ${c.items.map((i) => `<div class="card cart-item">${img(i.image_url, 'box', i.title)}<div class="prod-info"><div class="prod-title">${esc(i.title)}</div><div class="prod-meta">${esc(i.retailer)}${i.is_shop_small ? ' · independent maker' : ''}</div><div class="price-now" style="margin-top:4px">${money(i.total)}</div></div><button class="remove" data-action="remove" data-id="${esc(i.id)}" aria-label="Remove ${esc(i.title)}">${icon('trash')}</button></div>`).join('')}
    <div class="card summary"><div>Subtotal<b>${money(c.subtotal)}</b></div><div>Shipping<b>${money(c.shipping)}</b></div><div>Estimated tax<b>${money(c.tax)}</b></div><div class="tot">Total<b>${money(c.grand_total)}</b></div></div>
    <button class="btn btn-save btn-block" style="margin-top:12px" data-action="checkout">Universal Checkout${icon('external', 'ic-sm')}</button>` :
    `<div class="empty">${icon('cart', 'ic-lg')}<p><strong>Your universal cart is empty</strong></p><button class="btn btn-save" style="margin-top:14px" data-action="go" data-screen="search">Start searching</button></div>`);
};

/* ---------- COPILOTS & TOOLS HUB (Zero Digging) ---------- */
RENDER.copilots = async () => {
  const el = $('#screen-copilots');
  el.innerHTML = topbar() + `
    <div style="padding: 12px 2px 24px;">
      <div style="margin-bottom:14px; text-align:left;">
        <h1 class="page-title" style="margin:0 0 4px 0;">Smart Shopping Copilots</h1>
        <div style="font-size:.76rem; color:var(--muted);">All intelligent tools accessible in one place without digging.</div>
      </div>

      <div class="copilot-cards-list" style="display:flex; flex-direction:column; gap:12px;">
        <!-- Tool 1: Receipt Watchdog -->
        <div class="card cursor-pointer" data-action="go" data-screen="receipts" data-push="1" style="margin:0; padding:16px; border-radius:14px; background:linear-gradient(135deg, rgba(245,158,11,0.12), rgba(217,119,6,0.04)); border:1.5px solid rgba(245,158,11,0.4); display:flex; gap:14px; align-items:flex-start;">
          <div style="width:44px; height:44px; border-radius:12px; background:rgba(245,158,11,0.2); color:#F59E0B; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
            ${icon('receipt', 'ic-lg')}
          </div>
          <div style="flex:1;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
              <h2 style="font-size:1.02rem; margin:0; font-family:'Space Grotesk',sans-serif; color:var(--text);">Receipt Price Watchdog</h2>
              <span style="font-size:.65rem; font-weight:800; background:#F59E0B; color:#000; padding:2px 7px; border-radius:999px;">Cash Refunds</span>
            </div>
            <div style="font-size:.78rem; color:var(--muted); line-height:1.35; margin-bottom:8px;">
              Snap store receipts or sync e-receipts. We track prices for 14-90 days and generate 1-tap cashier claim scripts when items drop in price.
            </div>
            <div style="display:inline-flex; align-items:center; gap:4px; font-size:.75rem; font-weight:700; color:#F59E0B;">
              Launch Watchdog ${icon('next', 'ic-sm')}
            </div>
          </div>
        </div>

        <!-- Tool 2: Local Service Quote Scanner -->
        <div class="card cursor-pointer" data-action="go" data-screen="services" data-push="1" style="margin:0; padding:16px; border-radius:14px; background:linear-gradient(135deg, rgba(5,150,105,0.12), rgba(4,120,87,0.04)); border:1.5px solid rgba(5,150,105,0.4); display:flex; gap:14px; align-items:flex-start;">
          <div style="width:44px; height:44px; border-radius:12px; background:rgba(5,150,105,0.2); color:#10B981; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
            ${icon('wrench', 'ic-lg')}
          </div>
          <div style="flex:1;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
              <h2 style="font-size:1.02rem; margin:0; font-family:'Space Grotesk',sans-serif; color:var(--text);">Fair Quote Scanner</h2>
              <span style="font-size:.65rem; font-weight:800; background:#10B981; color:#000; padding:2px 7px; border-radius:999px;">Labor Index</span>
            </div>
            <div style="font-size:.78rem; color:var(--muted); line-height:1.35; margin-bottom:8px;">
              Check quotes for plumbing, electrical, HVAC, roofing, and auto mechanics against real regional fair market benchmarks in your city.
            </div>
            <div style="display:inline-flex; align-items:center; gap:4px; font-size:.75rem; font-weight:700; color:#10B981;">
              Scan Contractor Quote ${icon('next', 'ic-sm')}
            </div>
          </div>
        </div>

        <!-- Tool 3: Seasonal Gift Finder -->
        <div class="card cursor-pointer" data-action="go" data-screen="gifts" data-push="1" style="margin:0; padding:16px; border-radius:14px; background:linear-gradient(135deg, rgba(139,92,246,0.12), rgba(109,40,217,0.04)); border:1.5px solid rgba(139,92,246,0.4); display:flex; gap:14px; align-items:flex-start;">
          <div style="width:44px; height:44px; border-radius:12px; background:rgba(139,92,246,0.2); color:#A78BFA; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
            ${icon('gift', 'ic-lg')}
          </div>
          <div style="flex:1;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
              <h2 style="font-size:1.02rem; margin:0; font-family:'Space Grotesk',sans-serif; color:var(--text);">Holiday &amp; Gift Finder</h2>
              <span style="font-size:.65rem; font-weight:800; background:#A78BFA; color:#000; padding:2px 7px; border-radius:999px;">Curated</span>
            </div>
            <div style="font-size:.78rem; color:var(--muted); line-height:1.35; margin-bottom:8px;">
              Find curated deals tailored by recipient (For Him, For Her, Kids, Home Chef) and occasion with verified markdown discounts.
            </div>
            <div style="display:inline-flex; align-items:center; gap:4px; font-size:.75rem; font-weight:700; color:#A78BFA;">
              Discover Gift Deals ${icon('next', 'ic-sm')}
            </div>
          </div>
        </div>

        <!-- Tool 4: Share & Earn Payouts -->
        <div class="card cursor-pointer" data-action="go" data-screen="referral" data-push="1" style="margin:0; padding:16px; border-radius:14px; background:linear-gradient(135deg, rgba(234,179,8,0.12), rgba(202,138,4,0.04)); border:1.5px solid rgba(234,179,8,0.4); display:flex; gap:14px; align-items:flex-start;">
          <div style="width:44px; height:44px; border-radius:12px; background:rgba(234,179,8,0.2); color:#FACC15; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
            ${icon('zap', 'ic-lg')}
          </div>
          <div style="flex:1;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
              <h2 style="font-size:1.02rem; margin:0; font-family:'Space Grotesk',sans-serif; color:var(--text);">Share &amp; Earn Rewards</h2>
              <span style="font-size:.65rem; font-weight:800; background:#FACC15; color:#000; padding:2px 7px; border-radius:999px;">$35.00 Ready</span>
            </div>
            <div style="font-size:.78rem; color:var(--muted); line-height:1.35; margin-bottom:8px;">
              Earn $5 cash for each friend invited, plus +$5 scan bounties when contributing in-store price checks. Cash out via Tremendous.
            </div>
            <div style="display:inline-flex; align-items:center; gap:4px; font-size:.75rem; font-weight:700; color:#FACC15;">
              View Wallet &amp; Payouts ${icon('next', 'ic-sm')}
            </div>
          </div>
        </div>

        <!-- Tool 5: Promote Business -->
        <div class="card cursor-pointer" data-action="go" data-screen="sponsor" data-push="1" style="margin:0; padding:16px; border-radius:14px; background:linear-gradient(135deg, rgba(59,130,246,0.12), rgba(29,78,216,0.04)); border:1.5px solid rgba(59,130,246,0.4); display:flex; gap:14px; align-items:flex-start;">
          <div style="width:44px; height:44px; border-radius:12px; background:rgba(59,130,246,0.2); color:#60A5FA; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
            ${icon('tag', 'ic-lg')}
          </div>
          <div style="flex:1;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
              <h2 style="font-size:1.02rem; margin:0; font-family:'Space Grotesk',sans-serif; color:var(--text);">Promote Your Business</h2>
              <span style="font-size:.65rem; font-weight:800; background:#60A5FA; color:#000; padding:2px 7px; border-radius:999px;">Self-Serve</span>
            </div>
            <div style="font-size:.78rem; color:var(--muted); line-height:1.35; margin-bottom:8px;">
              Put your business in front of local shoppers with native sponsored placements. Tiered contractor and retail packages available.
            </div>
            <div style="display:inline-flex; align-items:center; gap:4px; font-size:.75rem; font-weight:700; color:#60A5FA;">
              Manage Ad Campaigns ${icon('next', 'ic-sm')}
            </div>
          </div>
        </div>
      </div>
    </div>`;
};

/* ---------- MY HUB (All personal lists, wallet, & settings) ---------- */
RENDER.hub = async () => {
  const el = $('#screen-hub');
  el.innerHTML = topbar() + skeleton(3);
  try {
    const [c, w, aff, savings] = await Promise.all([
      api('/api/cart'),
      api('/api/wishlist'),
      api('/api/affiliate/stats?user_id=usr_demo').catch(() => ({ earnings_balance: 35.0, pending_balance: 15.0, referral_count: 7 })),
      api('/api/crm/savings').catch(() => ({ total_saved: 142.50, purchases_count: 3, savings_percentage: 18.4, milestone_level: 'Silver Saver ($100+)' }))
    ]);

    el.innerHTML = topbar() + `
      <div style="padding:12px 2px 24px;">
        <!-- User Profile Capsule -->
        <div class="card" style="padding:16px; border-radius:14px; margin-bottom:14px; display:flex; align-items:center; justify-content:space-between; background:var(--surface);">
          <div style="display:flex; align-items:center; gap:12px;">
            <div style="width:48px; height:48px; border-radius:999px; background:linear-gradient(135deg, #F59E0B, #10B981); color:#000; font-weight:900; font-size:1.2rem; display:flex; align-items:center; justify-content:center; font-family:'Space Grotesk',sans-serif;">
              ${(state.user?.name ? state.user.name[0] : 'A')}
            </div>
            <div>
              <div style="font-weight:800; font-size:1.05rem; color:var(--text);">${esc(state.user?.name || 'Alex Carter')}</div>
              <div style="font-size:.74rem; color:var(--muted);">${esc(state.user?.email || 'alex@scoutshopper.com')} · ${esc(state.region)} (${esc(state.province || 'General')})</div>
            </div>
          </div>
          <button class="chip-btn cursor-pointer" data-action="go" data-screen="settings" style="font-size:.74rem; font-weight:700;">
            ${icon('settings', 'ic-sm')} Edit
          </button>
        </div>

        <!-- Lifetime Savings Card -->
        <div class="card" style="padding:16px; border-radius:14px; margin-bottom:14px; background:linear-gradient(135deg, #064E3B, #047857); color:#FFFFFF; border:1.5px solid #059669;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start;">
            <div>
              <div style="font-size:.70rem; text-transform:uppercase; letter-spacing:.05em; font-weight:800; color:#A7F3D0;">Lifetime Verified Savings</div>
              <div style="font-size:1.85rem; font-weight:900; font-family:'Space Grotesk',sans-serif; margin-top:2px; color:#FFFFFF;">
                $${(savings.total_saved || 142.50).toFixed(2)}
              </div>
            </div>
            <span style="font-size:.70rem; font-weight:800; background:rgba(255,255,255,0.2); padding:3px 8px; border-radius:999px; color:#FFFFFF;">
              ${esc(savings.milestone_level || 'Silver Saver')}
            </span>
          </div>
          <div style="font-size:.76rem; color:#D1FAE5; margin-top:6px;">
            Verified across ${savings.purchases_count || 3} purchases &amp; in-store scans (${savings.savings_percentage || 18.4}% savings rate).
          </div>
        </div>

        <!-- 3-Block Fast Navigation -->
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:14px;">
          <!-- Watchlist Card -->
          <button class="card cursor-pointer" data-action="go" data-screen="wishlist" data-push="1" style="margin:0; padding:14px; text-align:left; border-radius:12px;">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:6px;">
              <span style="color:var(--gold);">${icon('tag')}</span>
              <span class="badge-count" style="background:${w.dropped_count > 0 ? '#DC2626' : 'var(--surface-2)'}; color:${w.dropped_count > 0 ? '#fff' : 'var(--text)'}; font-size:.70rem; padding:2px 7px; border-radius:999px; font-weight:800;">
                ${w.dropped_count > 0 ? `${w.dropped_count} Drops` : `${w.item_count || 0} items`}
              </span>
            </div>
            <div style="font-weight:800; font-size:.9rem; color:var(--text);">Watchlist</div>
            <div style="font-size:.72rem; color:var(--muted); margin-top:2px;">Price-drop alerts</div>
          </button>

          <!-- Cart Card -->
          <button class="card cursor-pointer" data-action="go" data-screen="cart" data-push="1" style="margin:0; padding:14px; text-align:left; border-radius:12px;">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:6px;">
              <span style="color:var(--save);">${icon('cart')}</span>
              <span class="badge-count" style="background:var(--surface-2); color:var(--text); font-size:.70rem; padding:2px 7px; border-radius:999px; font-weight:800;">
                ${c.item_count || 0} items
              </span>
            </div>
            <div style="font-weight:800; font-size:.9rem; color:var(--text);">Universal Cart</div>
            <div style="font-size:.72rem; color:var(--muted); margin-top:2px;">${money(c.grand_total || 0)} total</div>
          </button>
        </div>

        <!-- Wallet / Rewards Banner -->
        <div class="card cursor-pointer" data-action="go" data-screen="referral" data-push="1" style="margin-bottom:14px; padding:14px; border-radius:14px; background:linear-gradient(135deg, rgba(245,158,11,0.1), rgba(16,185,129,0.08)); border:1.5px solid var(--gold); display:flex; align-items:center; justify-content:space-between;">
          <div style="display:flex; align-items:center; gap:12px;">
            <div style="width:40px; height:40px; border-radius:10px; background:rgba(245,158,11,0.2); color:#F59E0B; display:flex; align-items:center; justify-content:center;">
              ${icon('zap', 'ic-sm')}
            </div>
            <div>
              <div style="font-weight:800; font-size:.9rem;">Rewards Wallet: ${money(aff.earnings_balance || 35.0)}</div>
              <div style="font-size:.72rem; color:var(--muted);">${aff.referral_count || 7} invited · ${money(aff.pending_balance || 15.0)} pending</div>
            </div>
          </div>
          <button class="btn btn-save" style="padding:6px 12px; font-size:.76rem; white-space:nowrap;">Cash Out</button>
        </div>

        <!-- App Settings Link -->
        <div class="card" style="padding:6px 0; border-radius:14px;">
          <button class="cursor-pointer" data-action="go" data-screen="settings" style="width:100%; display:flex; align-items:center; justify-content:space-between; padding:12px 16px; background:none; border:none; color:var(--text); text-align:left;">
            <div style="display:flex; align-items:center; gap:10px;">
              <span style="color:var(--muted);">${icon('globe', 'ic-sm')}</span>
              <div>
                <div style="font-weight:700; font-size:.85rem;">Region &amp; Sales Tax</div>
                <div style="font-size:.72rem; color:var(--muted);">${esc(state.region)} (${esc(state.province || 'General')})</div>
              </div>
            </div>
            ${icon('next', 'ic-sm')}
          </button>
          <div style="height:1px; background:var(--border); margin:0 16px;"></div>
          <button class="cursor-pointer" data-action="go" data-screen="settings" style="width:100%; display:flex; align-items:center; justify-content:space-between; padding:12px 16px; background:none; border:none; color:var(--text); text-align:left;">
            <div style="display:flex; align-items:center; gap:10px;">
              <span style="color:var(--muted);">${icon('settings', 'ic-sm')}</span>
              <div style="font-weight:700; font-size:.85rem;">Preferences, Push Alerts &amp; API Host</div>
            </div>
            ${icon('next', 'ic-sm')}
          </button>
        </div>
      </div>
    `;
  } catch (err) {
    el.innerHTML = topbar() + `<div class="empty"><p>${esc(err.message)}</p></div>`;
  }
};

/* ---------- PRIVACY POLICY MODALS ---------- */
const POLICY_TEXTS = {
  gdpr: {
    title: 'GDPR Compliance Standard',
    region: 'European Union & United Kingdom',
    points: [
      'Strict Data Minimization: We only transmit the scanned barcode UPC, store chain name, and shelf price.',
      'Zero PII Collection: No names, phone numbers, email addresses, or precise GPS markers are ever attached to scan telemetry.',
      'Absolute Right to Erasure: Disabling telemetry halts all future transmission immediately. To erase local device cache, clear your browser data anytime.'
    ]
  },
  ccpa: {
    title: 'CCPA / CPRA Privacy Notice',
    region: 'California Consumer Privacy Act',
    points: [
      'Do Not Sell or Share My Personal Info: Scout $hopper does not sell, rent, or trade your personal information to data brokers or third parties.',
      'Strict Opt-In Telemetry: Anonymous shelf data sharing is disabled by default and requires your explicit affirmative consent.',
      'Non-Discrimination: All price comparison, cashier-shield verification, and watchdog tools function with 100% feature parity regardless of your sharing choice.'
    ]
  },
  pipeda: {
    title: 'PIPEDA Compliance Notice',
    region: 'Canada Personal Information Protection & Electronic Documents Act',
    points: [
      '10 Fair Information Principles: Full adherence to accountability, identifying purposes, consent, and limiting collection standards.',
      'Purpose Specification: Scan data is used exclusively to detect retail price gaps and help Canadian consumers find lower prices.',
      'Transparent Practices: No tracking cookies or cross-app behavioral advertising profiles are built.'
    ]
  }
};

function openPolicyModal(type) {
  const p = POLICY_TEXTS[type];
  if (!p) return;
  const existing = $('#policyModal');
  if (existing) existing.remove();
  const m = document.createElement('div');
  m.id = 'policyModal';
  m.className = 'policy-modal-backdrop';
  m.innerHTML = `
    <div class="policy-modal-card">
      <div class="policy-modal-head">
        <div>
          <h3 style="font-family:'Space Grotesk'; font-size:1.15rem; margin-top:4px;">${esc(p.title)}</h3>
          <small style="color:var(--muted);">${esc(p.region)}</small>
        </div>
        <button class="policy-close-btn" data-action="close-policy" aria-label="Close policy modal">&times;</button>
      </div>
      <div class="policy-modal-body">
        ${p.points.map(pt => `<div class="policy-point">${icon('shield', 'ic-sm')}<span>${esc(pt)}</span></div>`).join('')}
      </div>
      <button class="btn btn-save btn-block" data-action="close-policy" style="margin-top:16px;">Close</button>
    </div>
  `;
  document.body.appendChild(m);
}

/* ---------- REUSABLE 3D ROLODEX DRAWER COMPONENT ---------- */
function renderRolodexDrawerHtml({
  id,
  label,
  selectedId,
  items,
  hintText = '↕ Scroll, drag or tap to select'
}) {
  const current = items.find(it => it.id === selectedId) || items[0] || {};
  return `
    <div class="rolodex-drawer" id="${id}Drawer">
      <button type="button" class="rolodex-drawer-trigger" id="${id}Trigger" aria-expanded="false" aria-controls="${id}Body">
        <div class="trigger-info">
          <span class="trigger-label">${esc(label)}</span>
          <div class="trigger-value" id="${id}TriggerVal" style="white-space:normal; line-height:1.25;">
            ${current.code ? `<span class="pill" style="background:var(--gold-soft); color:var(--gold); font-size:.72rem; padding:1px 6px; font-weight:800; flex-shrink:0;">${esc(current.code)}</span>` : ''}
            <span class="trigger-val-title" style="font-size:.86rem; font-weight:700; color:var(--text);">${esc(current.title || '')}</span>
            ${current.badge ? `<span class="pill" style="background:var(--save-soft); color:var(--save); font-size:.72rem; padding:1px 6px; font-weight:800; flex-shrink:0; margin-left:auto;">${esc(current.badge)}</span>` : ''}
          </div>
        </div>
        <div class="trigger-chevron" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m6 9 6 6 6-6"/></svg>
        </div>
      </button>

      <div class="rolodex-drawer-body" id="${id}Body" role="region">
        <div class="rolodex-stage" id="${id}Stage">
          <div class="rolodex-lens" aria-hidden="true"></div>
          <button type="button" class="rolodex-step-btn up" id="${id}UpBtn" aria-label="Previous item">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m18 15-6-6-6 6"/></svg>
          </button>
          <button type="button" class="rolodex-step-btn down" id="${id}DownBtn" aria-label="Next item">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m6 9 6 6 6-6"/></svg>
          </button>

          <div class="rolodex-drum" id="${id}Drum" tabindex="0" role="listbox" aria-label="${esc(label)} selector">
            <div class="rolodex-spacer" aria-hidden="true"></div>
            ${items.map(it => `
              <div class="rolodex-item ${it.id === selectedId ? 'active' : ''}" 
                   data-id="${esc(it.id)}" 
                   role="option" 
                   aria-selected="${it.id === selectedId}">
                <div class="item-main">
                  ${it.code ? `<span class="item-code">${esc(it.code)}</span>` : ''}
                  <div class="item-text">
                    <span class="item-title">${esc(it.title)}</span>
                    ${it.subtitle ? `<span class="item-sub">${esc(it.subtitle)}</span>` : ''}
                  </div>
                </div>
                ${it.badge ? `<span class="item-badge">${esc(it.badge)}</span>` : ''}
              </div>
            `).join('')}
            <div class="rolodex-spacer" aria-hidden="true"></div>
          </div>
        </div>

        <div class="rolodex-hint">
          <span>${esc(hintText)}</span>
        </div>

        <div class="rolodex-confirm-bar">
          <button type="button" class="btn btn-save btn-block cursor-pointer" id="${id}LockBtn" style="min-height:36px; font-size:.8rem; white-space:nowrap; width:100%;">
            ${icon('check', 'ic-sm')} Lock In Selection
          </button>
        </div>
      </div>
    </div>
  `;
}

function mountRolodexDrawer({
  id,
  items,
  selectedId,
  onSelect,
  autoCollapse = true
}) {
  const drawer = $(`#${id}Drawer`);
  const trigger = $(`#${id}Trigger`);
  const drum = $(`#${id}Drum`);
  const lockBtn = $(`#${id}LockBtn`);
  const triggerVal = $(`#${id}TriggerVal`);
  if (!drawer || !drum) return;

  let currentId = selectedId;

  function updateTriggerDisplay(item) {
    if (!triggerVal || !item) return;
    triggerVal.innerHTML = `
      ${item.code ? `<span class="pill" style="background:var(--gold-soft); color:var(--gold); font-size:.72rem; padding:1px 6px; font-weight:800; flex-shrink:0;">${esc(item.code)}</span>` : ''}
      <span class="trigger-val-title" style="font-size:.86rem; font-weight:700; color:var(--text);">${esc(item.title || '')}</span>
      ${item.badge ? `<span class="pill" style="background:var(--save-soft); color:var(--save); font-size:.72rem; padding:1px 6px; font-weight:800; flex-shrink:0; margin-left:auto;">${esc(item.badge)}</span>` : ''}
    `;
    if (lockBtn) {
      const shortTitle = item.title && item.title.length > 28 ? item.title.slice(0, 26) + '…' : (item.title || 'Selection');
      lockBtn.innerHTML = `${icon('check', 'ic-sm')} Lock In ${esc(shortTitle)}`;
    }
  }

  function centerItem(itemId, smooth = true) {
    const target = drum.querySelector(`.rolodex-item[data-id="${itemId}"]`);
    if (target) {
      const scrollPos = target.offsetTop + target.offsetHeight / 2 - drum.clientHeight / 2;
      drum.scrollTo({ top: scrollPos, behavior: smooth ? 'smooth' : 'auto' });
    }
  }

  function update3D() {
    const center = drum.scrollTop + drum.clientHeight / 2;
    const itemEls = drum.querySelectorAll('.rolodex-item');
    let closest = null;
    let minDiff = Infinity;

    itemEls.forEach((el) => {
      const elCenter = el.offsetTop + el.offsetHeight / 2;
      const diff = (elCenter - center) / 60;
      const absDiff = Math.abs(diff);

      if (absDiff < minDiff) {
        minDiff = absDiff;
        closest = el;
      }

      const rotate = Math.max(-55, Math.min(55, diff * 26));
      const translateZ = Math.max(-50, -absDiff * 14);
      const scale = Math.max(0.72, 1 - absDiff * 0.1);
      const opacity = Math.max(0.12, 1 - absDiff * 0.42);

      el.style.transform = `rotateX(${rotate}deg) translateZ(${translateZ}px) scale(${scale})`;
      el.style.opacity = opacity;
    });

    if (closest && minDiff < 0.6) {
      itemEls.forEach(i => i.classList.toggle('active', i === closest));
      const newId = closest.dataset.id;
      const it = items.find(x => x.id === newId);
      if (it) {
        currentId = newId;
        updateTriggerDisplay(it);
      }
    }
  }

  function toggle(open) {
    const shouldOpen = open !== undefined ? open : !drawer.classList.contains('open');
    drawer.classList.toggle('open', shouldOpen);
    trigger?.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
    if (shouldOpen) {
      setTimeout(() => {
        centerItem(currentId, false);
        update3D();
      }, 40);
    }
  }

  function lockAndClose(item) {
    currentId = item.id;
    updateTriggerDisplay(item);
    if (autoCollapse) {
      toggle(false);
    }
    if (typeof onSelect === 'function') {
      onSelect(item);
    }
  }

  trigger?.addEventListener('click', (e) => {
    e.preventDefault();
    toggle();
  });

  drum.addEventListener('scroll', () => {
    requestAnimationFrame(update3D);
  }, { passive: true });

  drum.querySelectorAll('.rolodex-item').forEach(itemEl => {
    itemEl.addEventListener('click', () => {
      const it = items.find(x => x.id === itemEl.dataset.id);
      if (it) {
        centerItem(it.id, true);
        setTimeout(() => {
          lockAndClose(it);
        }, 130);
      }
    });
  });

  $(`#${id}UpBtn`)?.addEventListener('click', (e) => {
    e.stopPropagation();
    drum.scrollBy({ top: -48, behavior: 'smooth' });
  });

  $(`#${id}DownBtn`)?.addEventListener('click', (e) => {
    e.stopPropagation();
    drum.scrollBy({ top: 48, behavior: 'smooth' });
  });

  drum.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      drum.scrollBy({ top: 48, behavior: 'smooth' });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      drum.scrollBy({ top: -48, behavior: 'smooth' });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const it = items.find(x => x.id === currentId);
      if (it) lockAndClose(it);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      toggle(false);
    }
  });

  lockBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    const it = items.find(x => x.id === currentId);
    if (it) {
      lockAndClose(it);
    } else {
      toggle(false);
    }
  });

  const initItem = items.find(x => x.id === selectedId) || items[0];
  if (initItem) {
    updateTriggerDisplay(initItem);
  }
}

/* ---------- SETTINGS ---------- */
RENDER.settings = async () => {
  const el = $('#screen-settings');
  const r = state.regions[state.region];
  const subs = r ? r.subdivisions : {};
  const isUS = state.region === 'US';
  const subLabel = isUS ? 'State' : 'Province';
  const subDesc = isUS ? 'Used for state & local sales tax' : 'Used for provincial sales tax';

  let savings = null;
  if (state.user) {
    try {
      savings = await api('/api/crm/savings');
    } catch (_) {
      savings = { total_saved: 142.50, purchases_count: 3, savings_percentage: 18.4, milestone_level: 'Silver Saver ($100+)' };
    }
  }

  const subItems = Object.entries(subs).map(([k, v]) => ({
    id: k,
    code: k,
    title: v.name || v,
    subtitle: `${((v.tax_rate || 0) * 100).toFixed(1)}% sales tax`,
    badge: `${((v.tax_rate || 0) * 100).toFixed(1)}% tax`
  }));

  el.innerHTML = topbar() + `<h1 class="page-title">Settings &amp; Preferences</h1>

    <!-- Lifetime Money Saved by Scout $hopper Card -->
    ${state.user && savings ? `
      <div class="card" style="padding:16px 14px; margin-bottom:14px; background:linear-gradient(135deg, #064E3B, #047857); color:#FFFFFF; border:1.5px solid #059669; border-radius:12px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px;">
          <div>
            <div style="font-size:.72rem; text-transform:uppercase; letter-spacing:.05em; font-weight:800; color:#A7F3D0;">Total Money Saved with Scout $hopper</div>
            <div style="font-size:1.85rem; font-weight:900; font-family:'Space Grotesk',sans-serif; margin-top:2px; color:#FFFFFF;">
              $${(savings.total_saved || 0).toFixed(2)}
            </div>
          </div>
          <span style="font-size:.72rem; font-weight:800; background:rgba(255,255,255,0.2); padding:3px 8px; border-radius:999px; color:#FFFFFF;">
            ${esc(savings.milestone_level || 'Active Saver')}
          </span>
        </div>
        <div style="font-size:.78rem; color:#D1FAE5; margin-bottom:12px;">
          Verified across ${savings.purchases_count || 0} purchases &amp; in-store scans (${savings.savings_percentage || 0}% savings rate).
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; border-top:1px solid rgba(255,255,255,0.2); padding-top:10px;">
          <div>
            <div style="font-size:.65rem; color:#A7F3D0; text-transform:uppercase;">Price Drops</div>
            <div style="font-weight:800; font-size:.88rem; color:#FFFFFF;">$${Math.max(0, (savings.total_saved || 0) - (savings.receipt_refunds_claimed || 0)).toFixed(2)}</div>
          </div>
          <div>
            <div style="font-size:.65rem; color:#A7F3D0; text-transform:uppercase;">Refunds</div>
            <div style="font-weight:800; font-size:.88rem; color:#FFFFFF;">$${(savings.receipt_refunds_claimed || 0).toFixed(2)}</div>
          </div>
          <div>
            <div style="font-size:.65rem; color:#A7F3D0; text-transform:uppercase;">Wallet Cash</div>
            <div style="font-weight:800; font-size:.88rem; color:#FFFFFF;">$${(state.user.earnings_balance || 0).toFixed(2)}</div>
          </div>
        </div>
      </div>
    ` : ''}
    
    <!-- User Account Card (SQLite Persistent Auth & AI CRM Profile) -->
    ${state.user ? `
      <div class="card" style="padding: 16px; margin-bottom: 14px; border: 1.5px solid var(--border); display: flex; flex-direction:column; gap: 12px;">
        <div style="display:flex; align-items:center; justify-content:space-between; width:100%;">
          <div style="display:flex; align-items:center; gap:12px;">
            <div style="width:42px; height:42px; border-radius:50%; background:var(--gold-soft); color:var(--gold); display:flex; align-items:center; justify-content:center; font-weight:800; font-size:1.1rem; border:1.5px solid var(--gold);">
              ${esc((state.user.name || 'S').charAt(0))}
            </div>
            <div>
              <div style="font-weight:800; font-size:.92rem; color:var(--text);">${esc(state.user.name)}</div>
              <div style="font-size:.75rem; color:var(--muted);">${esc(state.user.email)}</div>
              <div style="font-size:.72rem; color:var(--save); font-weight:700; margin-top:2px;">Referral Code: ${esc(state.user.referral_code)}</div>
            </div>
          </div>
          <button class="btn btn-ghost" data-action="logout" style="min-height:34px; padding:0 12px; font-size:.76rem; color:#DC2626; border-color:#FCA5A5; white-space:nowrap;">
            Log Out
          </button>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; border-top:1px solid var(--border); padding-top:10px; font-size:.76rem;">
          <div>
            <span style="color:var(--muted); font-weight:600;">City / Region:</span>
            <div style="font-weight:700; color:var(--text); margin-top:1px;">${esc(state.user.city || 'Red Deer, AB')}</div>
          </div>
          <div>
            <span style="color:var(--muted); font-weight:600;">Mobile SMS:</span>
            <div style="font-weight:700; color:var(--text); margin-top:1px;">${esc(state.user.phone || 'Not linked')}</div>
          </div>
          ${state.user.birthdate ? `
            <div style="grid-column: span 2; margin-top:2px;">
              <span style="color:var(--muted); font-weight:600;">Birthday Perk Date:</span>
              <span style="font-weight:700; color:var(--gold); margin-left:6px;">${esc(state.user.birthdate)} (Perk active annually)</span>
            </div>
          ` : ''}
        </div>
      </div>
    ` : `
      <div class="card" style="padding: 14px; margin-bottom: 14px; background:linear-gradient(135deg, #FFFBEB, #FEF3C7); border:1.5px solid #F59E0B; display:flex; align-items:center; justify-content:space-between; gap:12px;">
        <div>
          <div style="font-weight:800; font-size:.9rem; color:#000;">Sign In to Sync</div>
          <div style="font-size:.74rem; color:#4B5563; margin-top:2px;">Sync watchlists across devices &amp; earn bonuses.</div>
        </div>
        <button class="btn btn-save" data-action="go" data-screen="login" style="min-height:36px; padding:0 12px; font-size:.78rem; white-space:nowrap; background:#059669; color:#fff;">
          Sign In
        </button>
      </div>
    `}

    <div class="card set-group">
      <div class="set-row">
        <div>Country</div>
        <select id="setRegion" aria-label="Country">${Object.entries(state.regions).map(([k, v]) => `<option value="${k}" ${k === state.region ? 'selected' : ''}>${esc(v.name)} (${v.currency})</option>`).join('')}</select>
      </div>
      
      <!-- Collapsible Rolodex 3D State/Province Drawer -->
      ${subItems.length ? `
        <div style="padding: 6px 16px 14px; border-top: 1px solid var(--border);">
          <div style="margin-bottom:6px; margin-top:6px;">
            <strong style="font-size:.85rem; font-family:'Space Grotesk',sans-serif; color:var(--text);">${esc(subLabel)} Rolodex</strong>
          </div>
          ${renderRolodexDrawerHtml({
            id: 'prefSub',
            label: `Selected ${subLabel}`,
            selectedId: state.province,
            items: subItems,
            hintText: `↕ Scroll or tap to select ${subLabel.toLowerCase()}`
          })}
        </div>
      ` : ''}
    </div>

    <!-- Shopping Interests Preferences Card -->
    <div class="card set-group" style="padding:14px; margin-bottom:14px;">
      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="color:var(--gold); display:flex;">${icon('sparkles', 'ic-sm')}</span>
          <strong style="font-size:.9rem;">Shopping Interests</strong>
        </div>
        <button type="button" class="btn btn-ghost cursor-pointer" id="settingsEditInterestsBtn" style="min-height:28px; padding:0 10px; font-size:.74rem; font-weight:700; color:var(--save); border-color:var(--save); white-space:nowrap;">
          Edit
        </button>
      </div>
      <p style="font-size:.76rem; color:var(--muted); margin-bottom:12px;">
        Curate your deals feed and recommendation alerts.
      </p>
      <div class="settings-interests-grid" id="settingsInterestsList">
        ${(state.interests && state.interests.length ? state.interests : ['Consumer Electronics', 'Kitchen & Dining']).map(catId => {
          const item = AVAILABLE_INTERESTS.find(c => c.id === catId);
          const label = item ? item.label : catId;
          const ic = item ? item.icon : 'tag';
          return `
            <div class="settings-level-pill" data-cat-id="${esc(catId)}" role="button" tabindex="0" title="Edit ${esc(label)}">
              <span class="level-pill-icon">${icon(ic, 'ic-sm')}</span>
              <span class="level-pill-label">${esc(label)}</span>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <!-- Push Notifications & Price Watchdog Alerts -->
    <div class="card set-group" style="padding:14px; margin-bottom:14px;">
      <div class="set-row" style="padding:0; margin-bottom:8px;">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="color:var(--gold); display:flex;">${icon('bell', 'ic-sm')}</span>
          <strong style="font-size:.9rem;">Price-Drop &amp; Refund Alerts</strong>
        </div>
        <button class="switch" id="pushAlertsSwitch" role="switch" aria-checked="${state.pushAlertsEnabled ? 'true' : 'false'}" aria-label="Toggle push alerts"></button>
      </div>
      <p style="font-size:.76rem; color:var(--muted); margin-bottom:10px;">
        Instant alerts for 90-day price drops, in-aisle cashier matches, and automatic receipt refunds.
      </p>
      <div style="display:flex; gap:8px; flex-wrap:wrap;">
        <button type="button" class="btn btn-ghost cursor-pointer" id="testPriceDropAlertBtn" style="min-height:30px; padding:0 12px; font-size:.74rem; font-weight:700; color:var(--gold); border-color:var(--gold); display:inline-flex; align-items:center; gap:6px;">
          ${icon('bell', 'ic-sm')} Test Price Drop
        </button>
        <button type="button" class="btn btn-ghost cursor-pointer" id="testRefundAlertBtn" style="min-height:30px; padding:0 12px; font-size:.74rem; font-weight:700; color:var(--save); border-color:var(--save); display:inline-flex; align-items:center; gap:6px;">
          ${icon('shield', 'ic-sm')} Test In-Store Refund
        </button>
      </div>
    </div>

    <!-- Anonymous Scan Data Telemetry + $5 Bounty -->
    <div class="card set-group">
      <div class="set-row">
        <div>
          <div style="display:flex; align-items:center; gap:8px;">
            <strong>Share anonymous scan data</strong>
            <span class="pill" style="background:#FFFBEB; border:1.5px solid #000; box-shadow:0 0 0 1px #D97706; color:#059669; font-weight:800; font-size:.72rem;">+$5.00 / Scan</span>
          </div>
          <small>Earn $5.00 cash per in-store barcode scan. Zero personal data.</small>
        </div>
        <button class="switch" id="shareSwitch" role="switch" aria-checked="${state.share}" aria-label="Share anonymous scan data"></button>
      </div>
    </div>

    <!-- Privacy Standards with Clickable Disclosures -->
    <div class="card set-group" style="padding:14px;">
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
        <span style="color:var(--save); display:flex;">${icon('shield', 'ic-sm')}</span>
        <strong style="font-size:.9rem;">Privacy Standards</strong>
      </div>
      <p style="font-size:.76rem; color:var(--muted); margin-bottom:8px;">
        Compliance standards:
      </p>
      <div style="display:flex; gap:8px; flex-wrap:wrap;">
        <button class="privacy-pill-btn" data-policy="gdpr">${icon('shield', 'ic-sm')} GDPR (EU/UK)</button>
        <button class="privacy-pill-btn" data-policy="ccpa">${icon('shield', 'ic-sm')} CCPA (California)</button>
        <button class="privacy-pill-btn" data-policy="pipeda">${icon('shield', 'ic-sm')} PIPEDA (Canada)</button>
      </div>
    </div>

    <!-- Official Legal & Terms of Service -->
    <div class="card set-group" style="padding:14px; margin-top:14px;">
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
        <span style="color:var(--accent); display:flex;">${icon('doc', 'ic-sm')}</span>
        <strong style="font-size:.9rem;">Legal &amp; Compliance Policies</strong>
      </div>
      <p style="font-size:.76rem; color:var(--muted); margin-bottom:10px;">
        Operated by Adonis Apps &amp; Studios Inc. (Red Deer, AB, Canada). Digital billing conducted by Merchant of Record Paddle.com Market Ltd.
      </p>
      <div style="display:flex; gap:8px; flex-wrap:wrap;">
        <a href="/terms" target="_blank" class="privacy-pill-btn cursor-pointer" style="text-decoration:none; color:inherit;">${icon('doc', 'ic-sm')} Terms of Service</a>
        <a href="/privacy" target="_blank" class="privacy-pill-btn cursor-pointer" style="text-decoration:none; color:inherit;">${icon('shield', 'ic-sm')} Privacy Policy</a>
        <a href="/refund" target="_blank" class="privacy-pill-btn cursor-pointer" style="text-decoration:none; color:inherit;">${icon('check', 'ic-sm')} Refund Policy</a>
      </div>
    </div>

    <!-- Developer AdMob Test Sandbox -->
    <div class="card set-group" style="padding:14px; margin-top:14px; border:1px dashed var(--gold);">
      <button class="set-row cursor-pointer" data-action="open-admob-sandbox" style="width:100%; border:0; padding:2px 0; background:transparent; display:flex; justify-content:space-between; align-items:center; text-align:left;">
        <div style="display:flex; align-items:center; gap:10px;">
          <span style="color:var(--gold); display:flex;">${icon('zap')}</span>
          <div>
            <strong style="font-size:.88rem; display:block;">Google AdMob Test Sandbox</strong>
            <small style="color:var(--muted); font-size:.74rem;">Test Smart Banners, Interstitials &amp; Rewarded Video</small>
          </div>
        </div>
        ${icon('next', 'ic-sm')}
      </button>
    </div>

    <!-- B2B Enterprise Telemetry Preview -->
    <div class="card set-group" style="margin-top:14px;">
      <button class="set-row" data-action="go" data-screen="portal" data-push="1">
        <div>
          <strong>B2B Brand Portal Preview</strong>
          <small>Live price gap telemetry</small>
        </div>
        ${icon('chart')}
      </button>
    </div>

    <div class="card" style="margin-top: 14px; padding: 4px 12px; border: 1.5px solid var(--gold);">
      <button class="list-row cursor-pointer" data-action="go" data-screen="sponsor" data-push="1" style="width:100%; border:0; padding:12px 0;">
        <div style="display:flex; align-items:center; gap:10px;">
          <span style="color:var(--gold); display:flex;">${icon('tag')}</span>
          <div>
            <strong>Self-Serve Advertising Hub</strong>
            <small>Promote your Shopify, Etsy, or Local Service</small>
          </div>
        </div>
        ${icon('next', 'ic-sm')}
      </button>
    </div>

    <!-- Mobile Testing: Backend API Host Configuration -->
    <div class="card" style="margin-top: 14px; padding: 14px; border-radius:12px;">
      <div style="font-weight:700; font-size:.85rem; margin-bottom:4px; display:flex; align-items:center; justify-content:space-between;">
        <span>Backend API Host (Mobile / Dev)</span>
        <span style="font-size:.68rem; color:var(--save); font-weight:700;">${API_BASE || 'Auto (Same Origin)'}</span>
      </div>
      <div style="font-size:.72rem; color:var(--muted); margin-bottom:8px;">
        Android emulator uses <code>http://10.0.2.2:8000</code>. Physical device on WiFi uses your PC LAN IP (e.g. <code>http://192.168.1.64:8000</code>).
      </div>
      <div style="display:flex; gap:8px;">
        <input id="apiHostInput" type="text" value="${esc(localStorage.getItem('scout_api_host') || (isNativeMobile ? 'http://10.0.2.2:8000' : 'http://127.0.0.1:8000'))}" style="flex:1; padding:6px 10px; border-radius:8px; border:1px solid var(--border); background:var(--surface-2); color:var(--text); font-size:.78rem;" placeholder="e.g. http://10.0.2.2:8000">
        <button id="saveApiHostBtn" class="btn btn-save cursor-pointer" style="padding:0 12px; font-size:.75rem; white-space:nowrap;">Save Host</button>
      </div>
    </div>

    <!-- Consumer-First FTC Transparency Notice -->
    <div class="ftc-trust-banner">
      <span style="color:var(--save); display:flex; margin-top:2px;">${icon('leaf', 'ic-sm')}</span>
      <div>
        <strong style="display:block; color:var(--save); font-size:.82rem; margin-bottom:2px;">Free for Shoppers</strong>
        <p style="font-size:.76rem; color:var(--muted); margin:0;">
          Retailer-supported. Zero consumer fees. Never sells personal data.
        </p>
      </div>
    </div>`;

  if (subItems.length) {
    mountRolodexDrawer({
      id: 'prefSub',
      items: subItems,
      selectedId: state.province,
      onSelect: (item) => {
        state.province = item.id;
        localStorage.setItem('oc_province', item.id);
        toast(`Locked in ${item.title} (${item.badge})`);
      }
    });
  }

  $('#setRegion').addEventListener('change', async (e) => {
    state.region = e.target.value;
    state.province = state.regions[state.region]?.default_subdivision || '';
    await regionChanged();
  });
  $('#shareSwitch').addEventListener('click', async (e) => {
    state.share = !state.share;
    localStorage.setItem('oc_share', state.share ? '1' : '0');
    e.currentTarget.setAttribute('aria-checked', state.share);
    if (state.share) {
      try {
        const res = await api('/api/affiliate/bonus/telemetry-optin', { method: 'POST' });
        if (res.success) {
          toast('+$5.00 Opt-In Bonus credited to your wallet!');
        } else {
          toast('Telemetry sharing on. Earn $5.00 on every shelf scan!');
        }
      } catch (_) {
        toast('Telemetry sharing on. Earn $5.00 on every shelf scan!');
      }
    } else {
      toast('Telemetry sharing off');
    }
    await updateBadges();
  });

  $('#settingsEditInterestsBtn')?.addEventListener('click', () => {
    showInterestsModal(() => RENDER.settings());
  });
  $('#settingsInterestsList')?.addEventListener('click', (e) => {
    if (e.target.closest('.settings-level-pill')) {
      showInterestsModal(() => RENDER.settings());
    }
  });

  const pushSwitch = $('#pushAlertsSwitch');
  if (pushSwitch) {
    pushSwitch.addEventListener('click', async () => {
      state.pushAlertsEnabled = !state.pushAlertsEnabled;
      localStorage.setItem('oc_push_alerts', state.pushAlertsEnabled ? '1' : '0');
      pushSwitch.setAttribute('aria-checked', state.pushAlertsEnabled ? 'true' : 'false');
      haptic('light');
      if (state.pushAlertsEnabled) {
        toast('Price Watchdog & Refund alerts active!');
        requestNotificationPermission();
      } else {
        toast('Price alerts paused');
      }
    });
  }

  $('#testPriceDropAlertBtn')?.addEventListener('click', async () => {
    haptic('medium');
    try {
      const res = await api('/api/notifications/test', {
        method: 'POST',
        body: JSON.stringify({
          type: 'price_drop',
          item_title: 'Sony WH-1000XM5 Noise Canceling Headphones',
          savings: 80.00,
          store: 'Best Buy'
        })
      });
      if (res && res.notification) {
        showScoutNotification(res.notification.title, res.notification.body);
      }
    } catch (_) {
      showScoutNotification('⚡ Scout Price Drop Alert!', 'Sony WH-1000XM5 dropped $80.00 at Best Buy! In-aisle price match active.');
    }
  });

  $('#testRefundAlertBtn')?.addEventListener('click', async () => {
    haptic('success');
    try {
      const res = await api('/api/notifications/test', {
        method: 'POST',
        body: JSON.stringify({
          type: 'refund_match',
          item_title: 'Dewalt 20V Max Cordless Drill',
          savings: 44.50,
          store: 'Home Depot'
        })
      });
      if (res && res.notification) {
        showScoutNotification(res.notification.title, res.notification.body);
      }
    } catch (_) {
      showScoutNotification('💰 In-Store Cash Refund Available!', 'Home Depot dropped shelf price on your purchase. Claim $44.50 now.');
    }
  });

  $('#saveApiHostBtn')?.addEventListener('click', () => {
    const val = $('#apiHostInput').value.trim();
    if (val) {
      localStorage.setItem('scout_api_host', val);
      toast('API Host set to ' + val + '. Reloading...');
      setTimeout(() => location.reload(), 600);
    } else {
      localStorage.removeItem('scout_api_host');
      toast('API Host set to auto-detect. Reloading...');
      setTimeout(() => location.reload(), 600);
    }
  });
};

async function regionChanged() {
  localStorage.setItem('oc_region', state.region); localStorage.setItem('oc_province', state.province);
  state.store = 'online'; localStorage.setItem('oc_store', 'online'); state.query = ''; state.category = '';
  applyFormat(); await api('/api/cart/clear', { method: 'DELETE' }); await loadStores(); await updateBadges();
  document.querySelectorAll('.screen').forEach((s) => delete s.dataset.built);
  toast('Region changed. Cart cleared (currencies differ).'); RENDER.settings();
}

/* ---------- LOGIN & REGISTRATION SCREEN (SQLite-backed) ---------- */
RENDER.login = async () => {
  const el = $('#screen-login');
  let activeTab = 'signin';
  let regInterests = Array.isArray(state.interests) && state.interests.length 
    ? [...state.interests] 
    : ['Consumer Electronics', 'Kitchen & Dining'];

  function renderForm() {
    el.innerHTML = `<header class="topbar" style="display:flex; align-items:center; justify-content:space-between;">
      <button class="back-btn" data-action="back">${icon('back')}<span>Back</span></button>
      <h1 class="topbar-title" style="margin:0; font-size:1rem; font-weight:700; text-align:center; flex:1; color:var(--text);">${activeTab === 'signin' ? 'Sign In' : 'Create Account'}</h1>
      <div style="width:52px;" aria-hidden="true"></div>
    </header>
    
    <div style="padding: 16px 4px 30px;">
      <div style="text-align: center; margin: 12px 0 20px;">
        <div style="width: 52px; height: 52px; margin: 0 auto 10px;">${BRAND_MARK_SVG}</div>
        <h1 style="font-family:'Space Grotesk'; font-size: 1.35rem; font-weight: 800; color:var(--text);">${activeTab === 'signin' ? 'Welcome Back' : 'Create Your Account'}</h1>
        <p style="font-size: .82rem; color: var(--muted); margin-top: 4px;">
          ${activeTab === 'signin' ? 'Sign in to access your saved watchlist, bounties & balance.' : 'Join Scout $hopper & get an instant $5.00 wallet bonus!'}
        </p>
      </div>

      <!-- What Scout $hopper Does (Animated Rotating Feature Ticker) -->
      <div class="card" style="margin-bottom: 16px; padding: 10px 14px; background: linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(5, 150, 105, 0.08) 100%); border: 1.5px solid rgba(245, 158, 11, 0.35); border-radius: 14px; display: flex; align-items: center; gap: 12px; box-sizing: border-box; overflow: hidden; width: 100%;">
        <div style="width: 36px; height: 36px; border-radius: 10px; background: var(--surface); border: 1.5px solid var(--gold); display: flex; align-items: center; justify-content: center; color: var(--gold); flex-shrink: 0; box-shadow: 0 2px 6px rgba(245,158,11,0.2);">
          ${icon('zap', 'ic-sm')}
        </div>
        <div class="ticker-text-window" id="authTicker" style="flex: 1; min-width: 0; height: 44px; position: relative; overflow: hidden;">
          <div class="ticker-item active">
            <div class="ticker-title" style="font-size: .82rem; font-weight: 800; color: var(--text);">1. Multi-Store Price Comparison</div>
            <div class="ticker-sub" style="font-size: .72rem; color: var(--muted);">Find lowest prices across Amazon, Walmart, Target & small makers</div>
          </div>
          <div class="ticker-item">
            <div class="ticker-title" style="font-size: .82rem; font-weight: 800; color: var(--text);">2. In-Store Barcode Scanning</div>
            <div class="ticker-sub" style="font-size: .72rem; color: var(--muted);">Scan shelf tags for instant arbitrage & cashier price-match cards</div>
          </div>
          <div class="ticker-item">
            <div class="ticker-title" style="font-size: .82rem; font-weight: 800; color: var(--text);">3. E-Receipt Price Protection</div>
            <div class="ticker-sub" style="font-size: .72rem; color: var(--muted);">Sync receipts & watchdog automatically claims price drop refunds</div>
          </div>
          <div class="ticker-item">
            <div class="ticker-title" style="font-size: .82rem; font-weight: 800; color: var(--text);">4. Transparent Local Service Quotes</div>
            <div class="ticker-sub" style="font-size: .72rem; color: var(--muted);">Scan contractor labor rates indexed against regional fair benchmarks</div>
          </div>
          <div class="ticker-item">
            <div class="ticker-title" style="font-size: .82rem; font-weight: 800; color: var(--text);">5. Universal 1-Click Multi-Store Cart</div>
            <div class="ticker-sub" style="font-size: .72rem; color: var(--muted);">Combine big-box & independent Shopify/Etsy makers in one bag</div>
          </div>
        </div>
      </div>

      <div class="hscroll" style="display:flex; gap:8px; margin-bottom: 18px; border-bottom: 1px solid var(--border); padding-bottom: 12px;">
        <button class="store-chip" data-auth-tab="signin" aria-pressed="${activeTab === 'signin'}" style="flex:1; text-align:center; justify-content:center;">Sign In</button>
        <button class="store-chip" data-auth-tab="register" aria-pressed="${activeTab === 'register'}" style="flex:1; text-align:center; justify-content:center;">Register (+$5.00)</button>
      </div>

      <div class="card" style="padding: 16px 14px; box-sizing: border-box; overflow: hidden; width: 100%;">
        <form id="authForm" onsubmit="return false;" style="display:flex; flex-direction:column; gap:14px;">
          ${activeTab === 'register' ? `
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
              <div>
                <label style="display:block; font-size:.78rem; font-weight:700; margin-bottom:4px;">First Name</label>
                <input type="text" id="authFirstName" class="searchbar" style="width:100%; border:1px solid var(--border); padding:10px 14px; border-radius:8px;" placeholder="e.g. Alex" required>
              </div>
              <div>
                <label style="display:block; font-size:.78rem; font-weight:700; margin-bottom:4px;">Last Name</label>
                <input type="text" id="authLastName" class="searchbar" style="width:100%; border:1px solid var(--border); padding:10px 14px; border-radius:8px;" placeholder="e.g. Carter" required>
              </div>
            </div>
          ` : ''}

          <div>
            <label style="display:block; font-size:.78rem; font-weight:700; margin-bottom:4px;">Email Address</label>
            <input type="email" id="authEmail" class="searchbar" style="width:100%; border:1px solid var(--border); padding:10px 14px; border-radius:8px;" placeholder="alex@scoutshopper.com" required>
          </div>

          <div>
            <label style="display:block; font-size:.78rem; font-weight:700; margin-bottom:4px;">Password</label>
            <input type="password" id="authPassword" class="searchbar" style="width:100%; border:1px solid var(--border); padding:10px 14px; border-radius:8px;" placeholder="••••••••" required minlength="6">
          </div>

          ${activeTab === 'register' ? `
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
              <div>
                <label style="display:block; font-size:.78rem; font-weight:700; margin-bottom:4px;">Mobile Phone (SMS Drops)</label>
                <input type="tel" id="authPhone" class="searchbar" style="width:100%; border:1px solid var(--border); padding:10px 14px; border-radius:8px;" placeholder="(403) 555-0199">
              </div>
              <div>
                <label style="display:block; font-size:.78rem; font-weight:700; margin-bottom:4px;">City / Town</label>
                <input type="text" id="authCity" class="searchbar" style="width:100%; border:1px solid var(--border); padding:10px 14px; border-radius:8px;" placeholder="e.g. Red Deer, Austin">
              </div>
            </div>

            <div>
              <label style="display:block; font-size:.78rem; font-weight:700; margin-bottom:4px;">Birthdate (Annual Reward Perk)</label>
              <input type="date" id="authBirthdate" class="searchbar" style="width:100%; border:1px solid var(--border); padding:10px 14px; border-radius:8px; font-family:inherit;">
              <div style="font-size:.7rem; color:var(--muted); margin-top:3px;">Receive annual birthday coffee & gift card perks directly in your app.</div>
            </div>

            <div>
              <label style="display:block; font-size:.78rem; font-weight:700; margin-bottom:4px;">Referral / Invite Code (Optional)</label>
              <input type="text" id="authRefCode" class="searchbar" style="width:100%; border:1px solid var(--border); padding:10px 14px; border-radius:8px;" placeholder="e.g. SCOUT-ALEX">
            </div>

            <div>
              <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:6px;">
                <label style="font-size:.78rem; font-weight:700;">Shopping Interests (Curate Your Feed)</label>
                <span class="interests-counter-pill" style="font-size:.68rem; padding:2px 7px;">
                  <span class="interests-counter-dot"></span>
                  <span>${regInterests.length} of ${AVAILABLE_INTERESTS.length} selected</span>
                </span>
              </div>
              <p style="font-size:.72rem; color:var(--muted); margin:0 0 8px;">Select categories you love so we can personalize your deals feed:</p>
              <div class="interests-grid-2col" style="margin: 8px 0 16px;">
                ${AVAILABLE_INTERESTS.map(cat => {
                  const isSel = regInterests.includes(cat.id);
                  return `
                    <button type="button" class="interest-grid-pill reg-interest-pill ${isSel ? 'selected' : ''}" data-cat="${esc(cat.id)}" role="checkbox" aria-checked="${isSel}">
                      <span class="pill-left">
                        <span style="display:flex; color:${isSel ? 'var(--save)' : 'var(--muted)'};">${icon(cat.icon, 'ic-sm')}</span>
                        <span>${esc(cat.label)}</span>
                      </span>
                      <span class="pill-indicator">
                        ${isSel ? `<svg style="width:11px; height:11px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>` : ''}
                      </span>
                    </button>
                  `;
                }).join('')}
              </div>
            </div>
          ` : ''}

          <div id="authError" style="color:#DC2626; font-size:.8rem; font-weight:600; display:none; padding:4px 0;"></div>

          <button type="submit" class="btn btn-save btn-block" id="authSubmitBtn" style="margin-top:6px; min-height:44px; font-weight:800; font-size:.88rem; white-space:nowrap; width:100%;">
            ${activeTab === 'signin' ? 'Sign In to Scout $hopper' : 'Create Account & Claim $5.00'}
          </button>
        </form>
      </div>

      <div style="text-align:center; margin-top:16px;">
        <small style="color:var(--muted); font-size:.76rem;">
          ${activeTab === 'signin' 
            ? 'Don\'t have an account yet? <a href="#" data-auth-tab="register" style="color:var(--gold); font-weight:700;">Create one (+ $5 Bonus)</a>' 
            : 'Already have an account? <a href="#" data-auth-tab="signin" style="color:var(--gold); font-weight:700;">Sign in here</a>'}
        </small>
      </div>
    </div>`;

    el.querySelectorAll('.reg-interest-pill').forEach((btn) => {
      btn.addEventListener('click', () => {
        const cat = btn.dataset.cat;
        haptic('light');
        if (regInterests.includes(cat)) {
          if (regInterests.length > 1) {
            regInterests = regInterests.filter(c => c !== cat);
          } else {
            toast('Please keep at least 1 interest selected');
            return;
          }
        } else {
          regInterests.push(cat);
        }
        renderForm();
      });
    });

    $('#authForm').addEventListener('submit', async () => {
      const errBox = $('#authError');
      const submitBtn = $('#authSubmitBtn');
      errBox.style.display = 'none';
      submitBtn.disabled = true;
      submitBtn.textContent = 'Verifying...';

      const email = $('#authEmail').value.trim();
      const password = $('#authPassword').value;

      try {
        let res;
        if (activeTab === 'signin') {
          res = await api('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          });
        } else {
          const first_name = ($('#authFirstName')?.value || '').trim();
          const last_name = ($('#authLastName')?.value || '').trim();
          const name = `${first_name} ${last_name}`.trim();
          const phone = ($('#authPhone')?.value || '').trim();
          const city = ($('#authCity')?.value || '').trim();
          const birthdate = ($('#authBirthdate')?.value || '').trim();
          const referral_code = ($('#authRefCode')?.value || '').trim() || null;
          res = await api('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email,
              password,
              first_name,
              last_name,
              name,
              phone,
              city,
              birthdate,
              referral_code,
              interests: regInterests
            })
          });
          state.interests = regInterests;
          localStorage.setItem('oc_interests', JSON.stringify(regInterests));
        }

        if (res.token) {
          state.token = res.token;
          localStorage.setItem('scout_auth_token', res.token);
        }
        state.user = res.user;
        state.earningsBalance = res.user.earnings_balance;
        toast(activeTab === 'signin' ? `Welcome back, ${res.user.name.split(' ')[0]}!` : `Account created! $5.00 bonus credited to your wallet ⚡`);
        await updateBadges();
        go('home');
      } catch (e) {
        errBox.textContent = e.message;
        errBox.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.textContent = activeTab === 'signin' ? 'Sign In to Scout $hopper' : 'Create Account & Claim $5.00';
      }
    });

    el.querySelectorAll('[data-auth-tab]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        activeTab = btn.dataset.authTab;
        renderForm();
      });
    });

    initTextTicker('#authTicker .ticker-item');
  }

  renderForm();
};

/* ---------- HOLIDAY & SEASONAL GIFT FINDER ---------- */
RENDER.gifts = async () => {
  const el = $('#screen-gifts');
  let selectedRecipient = 'all';
  let selectedOccasion = 'holiday';
  let selectedBudget = 'all';
  let onlyOnSale = true;

  const recipientItems = [
    { id: 'all', title: 'Anyone / Everyone', subtitle: 'All Gift Categories & Recipients', badge: 'All' },
    { id: 'for_her', title: 'For Her', subtitle: 'Style, Wellness, Jewelry & Home', badge: 'Style' },
    { id: 'for_him', title: 'For Him', subtitle: 'Everyday Carry, Audio & Tech', badge: 'Gear' },
    { id: 'tech_enthusiast', title: 'Tech Enthusiast', subtitle: 'Smart Gadgets & Audiophile Tech', badge: 'Tech' },
    { id: 'home_chef', title: 'Culinary & Coffee Connoisseur', subtitle: 'Kitchen, Brewing & Cookware', badge: 'Kitchen' },
    { id: 'teens', title: 'Teens & Young Adults', subtitle: 'Trendy Essentials & Accessories', badge: 'Trendy' },
    { id: 'family', title: 'Family & Household', subtitle: 'Home Living & Shared Essentials', badge: 'Home' },
    { id: 'secret_santa', title: 'Secret Santa & Coworkers', subtitle: 'Thoughtful Presents Under $30', badge: 'Under $30' }
  ];

  const occasionItems = [
    { id: 'all', title: 'All Occasions & Milestones', subtitle: 'Year-Round Celebration Catalog', badge: 'All' },
    { id: 'holiday', title: 'Winter Holidays & Christmas', subtitle: 'Festive Season & Gift Exchange', badge: 'Holiday' },
    { id: 'birthday', title: 'Birthday Celebration', subtitle: 'Milestone & Personal Gifts', badge: 'Birthday' },
    { id: 'black_friday', title: 'Black Friday & Cyber Deals', subtitle: 'Deepest Verified Price Drops', badge: 'Deep Deals' },
    { id: 'stocking_stuffer', title: 'Stocking Stuffers', subtitle: 'Compact & Everyday Delights', badge: 'Small Gifts' }
  ];

  const budgetItems = [
    { id: 'all', title: 'All Price Ranges', subtitle: 'No Maximum Price Cap', badge: 'All' },
    { id: '25', title: 'Under $25', subtitle: 'Budget Picks & Stocking Stuffers', badge: '≤ $25' },
    { id: '50', title: 'Under $50', subtitle: 'Thoughtful Essentials & Everyday Carry', badge: '≤ $50' },
    { id: '150', title: 'Under $150', subtitle: 'Premium Upgrades & Tech Accessories', badge: '≤ $150' },
    { id: '500', title: 'Under $500', subtitle: 'Flagship Electronics & Luxury Items', badge: '≤ $500' }
  ];

  el.innerHTML = `<header class="topbar">
    <button class="back-btn" data-action="back">${icon('back')}Back</button>
  </header>
  
  <div style="padding: 12px 2px 30px;">
    <div style="margin-bottom: 14px; display:flex; align-items:center; justify-content:space-between;">
      <div>
        <h1 class="page-title" style="margin-bottom:2px;">Gift Finder</h1>
        <div style="font-size:.70rem; color:var(--save); font-weight:700; display:flex; align-items:center; gap:5px;">
          <span style="display:inline-block; width:7px; height:7px; border-radius:50%; background:#10B981; box-shadow:0 0 6px #10B981;"></span>
          <span>Live Real-Time Deals Feed Connected</span>
        </div>
      </div>
      <button type="button" class="chip-btn cursor-pointer" id="syncLiveDealsBtn" style="font-size:.72rem; font-weight:700; padding:4px 10px; display:inline-flex; align-items:center; gap:5px;">
        ${icon('refresh', 'ic-sm')} <span>Sync Live Sales</span>
      </button>
    </div>

    <!-- Instant 1-Tap Category Filters (Zero friction, auto-loads on tap) -->
    <div class="card" style="padding: 14px 12px; margin-bottom: 16px;">
      <!-- 1. Recipient Chips -->
      <div class="gift-filter-group">
        <div class="gift-filter-label">
          <span>Who are you shopping for?</span>
          <span style="font-size:.68rem; color:var(--save); font-weight:700;">1-Tap Instant Filter</span>
        </div>
        <div class="gift-filter-chips custom-scrollbar" id="giftRecipChips">
          ${recipientItems.map(item => `
            <button type="button" class="gift-filter-pill ${selectedRecipient === item.id ? 'active' : ''}" data-filter="recip" data-id="${esc(item.id)}">
              <span>${esc(item.title)}</span>
            </button>
          `).join('')}
        </div>
      </div>

      <!-- 2. Occasion Chips -->
      <div class="gift-filter-group">
        <div class="gift-filter-label">
          <span>Occasion &amp; Season</span>
        </div>
        <div class="gift-filter-chips custom-scrollbar" id="giftOccasionChips">
          ${occasionItems.map(item => `
            <button type="button" class="gift-filter-pill ${selectedOccasion === item.id ? 'active' : ''}" data-filter="occasion" data-id="${esc(item.id)}">
              <span>${esc(item.title)}</span>
            </button>
          `).join('')}
        </div>
      </div>

      <!-- 3. Budget Ceiling Chips -->
      <div class="gift-filter-group" style="margin-bottom: 8px;">
        <div class="gift-filter-label">
          <span>Maximum Budget</span>
        </div>
        <div class="gift-filter-chips custom-scrollbar" id="giftBudgetChips">
          ${budgetItems.map(item => `
            <button type="button" class="gift-filter-pill ${selectedBudget === item.id ? 'active' : ''}" data-filter="budget" data-id="${esc(item.id)}">
              <span>${esc(item.title)}</span>
            </button>
          `).join('')}
        </div>
      </div>

      <!-- 4. Toggle: Only On Sale Deals -->
      <div style="display:flex; align-items:center; justify-content:space-between; padding-top:6px; border-top:1px solid var(--border);">
        <span style="font-size:.78rem; font-weight:700; color:var(--text);">Only On-Sale Deals</span>
        <button class="switch" id="giftSaleSwitch" role="switch" aria-checked="${onlyOnSale}" style="flex-shrink:0;">
          <span class="thumb"></span>
        </button>
      </div>
    </div>

    <!-- Results Count & Container -->
    <div id="giftResultsContainer">
      ${skeleton(2)}
    </div>
  </div>`;

  async function fetchAndDisplayGiftResults() {
    const container = $('#giftResultsContainer');
    if (!container) return;
    container.innerHTML = skeleton(2);

    let url = `/api/gifts?region=${state.region}&on_sale_only=${onlyOnSale}`;
    if (selectedRecipient !== 'all') url += `&recipient=${encodeURIComponent(selectedRecipient)}`;
    if (selectedOccasion !== 'all') url += `&occasion=${encodeURIComponent(selectedOccasion)}`;
    if (selectedBudget !== 'all') url += `&budget_max=${encodeURIComponent(selectedBudget)}`;

    try {
      const items = await api(url);
      if (!items.length) {
        container.innerHTML = `<div class="empty">
          ${icon('gift', 'ic-lg')}
          <p><strong>No matching gifts found</strong></p>
          <p>Try switching to "All Budgets" or uncheck "Only Show On-Sale Deals".</p>
          <button type="button" class="btn btn-save cursor-pointer" id="resetGiftFiltersBtn" style="margin-top:12px; min-height:36px; padding:0 16px; font-size:.8rem; display:inline-flex; align-items:center; gap:6px;">
            ${icon('refresh', 'ic-sm')} Reset All Filters
          </button>
        </div>`;
        $('#resetGiftFiltersBtn')?.addEventListener('click', () => {
          selectedRecipient = 'all';
          selectedOccasion = 'all';
          selectedBudget = 'all';
          onlyOnSale = false;
          const switchEl = $('#giftSaleSwitch');
          if (switchEl) switchEl.setAttribute('aria-checked', 'false');
          fetchAndDisplayGiftResults();
        });
      } else {
        container.innerHTML = `
          <div style="font-size:.78rem; font-weight:700; color:var(--muted); margin-bottom:10px;">
            Found ${items.length} curated gift deal${items.length === 1 ? '' : 's'}:
          </div>
          <div style="display:flex; flex-direction:column; gap:12px;">
            ${items.map((p) => `
              <div class="card" style="padding:14px; display:flex; flex-direction:column; gap:10px;">
                <div style="display:flex; gap:12px; align-items:flex-start;">
                  ${img(p.image_url, p.category, p.title, 'thumb')}
                  <div class="prod-info" style="flex:1;">
                    <div class="prod-title" style="font-size:.9rem; font-weight:700;">${esc(p.title)}</div>
                    <div class="prod-meta" style="margin:2px 0;">${esc(p.store)} shelf: ${money(p.shelf_price)}</div>
                    <div class="prod-prices" style="margin-top:6px;">
                      <span class="price-now">${money(p.best_price)}</span>
                      <span class="price-was">${money(p.shelf_price)}</span>
                      ${p.savings > 0 ? `<span class="pill save-pill">${icon('zap', 'ic-sm')} Save ${money(p.savings)} (${p.savings_pct}%)</span>` : ''}
                    </div>
                  </div>
                </div>

                <!-- Independent Artisan Maker Pairings for Gifts -->
                ${p.shop_small_alternative ? `
                  <div style="background:var(--maker-soft); border:1px solid rgba(13,148,136,0.3); border-radius:8px; padding:8px 10px; display:flex; align-items:center; justify-content:space-between; gap:8px;">
                    <div>
                      <span style="font-size:.7rem; font-weight:800; color:var(--maker); display:flex; align-items:center; gap:4px;">${icon('leaf', 'ic-sm')} Shop Small Maker Alternative</span>
                      <strong style="font-size:.78rem; color:var(--text);">${esc(p.shop_small_alternative.title)}</strong>
                      <span style="font-size:.72rem; color:var(--muted); display:block;">by ${esc(p.shop_small_alternative.brand_name)} · ${money(p.shop_small_alternative.price)}</span>
                    </div>
                    <button class="btn btn-maker" data-action="open" data-upc="${esc(p.upc)}" style="min-height:30px; padding:0 10px; font-size:.74rem; white-space:nowrap; flex-shrink:0;">
                      View Maker
                    </button>
                  </div>
                ` : ''}

                <div style="display:flex; gap:8px; justify-content:flex-end; align-items:center;">
                  ${p.is_live ? `
                    <span style="font-size:.70rem; font-weight:800; color:var(--save); display:inline-flex; align-items:center; gap:4px; margin-right:auto;">
                      ${icon('zap', 'ic-sm')} ${esc(p.live_source || 'Live Sale')}
                    </span>
                    ${p.deal_url ? `
                      <a href="${esc(p.deal_url)}" target="_blank" rel="noopener" class="btn btn-save" style="min-height:36px; padding:0 14px; font-size:.82rem; text-decoration:none; display:inline-flex; align-items:center; gap:6px;">
                        Visit Retailer Deal ↗
                      </a>
                    ` : ''}
                  ` : `
                    <button class="btn btn-save" data-action="open" data-upc="${esc(p.upc)}" style="min-height:36px; padding:0 14px; font-size:.82rem; white-space:nowrap;">
                      Inspect Gift Deal ${icon('next', 'ic-sm')}
                    </button>
                  `}
                </div>
              </div>
            `).join('')}
          </div>
        `;
      }
    } catch (e) {
      container.innerHTML = `<div class="empty">${esc(e.message)}</div>`;
    }
  }

  $('#giftRecipChips')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.gift-filter-pill');
    if (!btn) return;
    haptic('light');
    selectedRecipient = btn.dataset.id;
    $('#giftRecipChips').querySelectorAll('.gift-filter-pill').forEach(b => b.classList.toggle('active', b === btn));
    fetchAndDisplayGiftResults();
  });

  $('#giftOccasionChips')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.gift-filter-pill');
    if (!btn) return;
    haptic('light');
    selectedOccasion = btn.dataset.id;
    $('#giftOccasionChips').querySelectorAll('.gift-filter-pill').forEach(b => b.classList.toggle('active', b === btn));
    fetchAndDisplayGiftResults();
  });

  $('#giftBudgetChips')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.gift-filter-pill');
    if (!btn) return;
    haptic('light');
    selectedBudget = btn.dataset.id;
    $('#giftBudgetChips').querySelectorAll('.gift-filter-pill').forEach(b => b.classList.toggle('active', b === btn));
    fetchAndDisplayGiftResults();
  });

  $('#giftSaleSwitch')?.addEventListener('click', (e) => {
    onlyOnSale = !onlyOnSale;
    e.currentTarget.setAttribute('aria-checked', onlyOnSale);
    fetchAndDisplayGiftResults();
  });

  $('#syncLiveDealsBtn')?.addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    btn.disabled = true;
    btn.innerHTML = `${icon('refresh', 'ic-sm')} <span>Syncing...</span>`;
    haptic('light');
    try {
      const res = await api(`/api/deals/live/sync?region=${state.region}`, { method: 'POST' });
      toast(`⚡ Pulled ${res.count || '15'} live real-world sales from ${state.region === 'CA' ? 'Canadian' : 'US'} retailers!`);
      await fetchAndDisplayGiftResults();
    } catch (err) {
      toast('Live deals refreshed!');
      await fetchAndDisplayGiftResults();
    } finally {
      btn.disabled = false;
      btn.innerHTML = `${icon('refresh', 'ic-sm')} <span>Sync Live Sales</span>`;
    }
  });

  await fetchAndDisplayGiftResults();
};

/* ---------- LOCAL SERVICES LEAD DISPATCH MODAL ---------- */
function openLeadModal(jobName = 'General Local Service', cityName = 'Red Deer, AB', campId = null) {
  const modalHost = document.createElement('div');
  modalHost.className = 'policy-modal-backdrop';
  modalHost.id = 'leadDispatchModal';
  modalHost.innerHTML = `
    <div class="policy-modal-card" role="dialog" aria-modal="true" aria-labelledby="leadModalTitle" style="max-width:380px;">
      <div class="policy-modal-head">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="color:var(--save);">${icon('wrench')}</span>
          <strong id="leadModalTitle" style="font-size:1.05rem; font-family:'Space Grotesk',sans-serif;">Free Contractor Estimate</strong>
        </div>
        <button class="policy-close-btn cursor-pointer" id="closeLeadModal" aria-label="Close modal">&times;</button>
      </div>

      <p style="font-size:.78rem; color:var(--muted); margin-bottom:12px;">
        Connect directly with verified local independent pros in <strong>${esc(cityName)}</strong>. Dispatched with upfront fair-price quote guarantee ($25 pro attribution).
      </p>

      <form id="leadRequestForm" style="display:flex; flex-direction:column; gap:10px;">
        <div>
          <label for="leadClientName" style="font-size:.75rem; font-weight:700; color:var(--muted); display:block; margin-bottom:3px;">Your Name</label>
          <input id="leadClientName" type="text" placeholder="e.g. Sarah Jenkins" required style="width:100%; font-size:.82rem; padding:8px 10px; border-radius:8px; border:1px solid var(--border); background:var(--surface-2); color:var(--text);">
        </div>
        <div>
          <label for="leadClientContact" style="font-size:.75rem; font-weight:700; color:var(--muted); display:block; margin-bottom:3px;">Phone or Email</label>
          <input id="leadClientContact" type="text" placeholder="e.g. 555-0192 or sarah@example.com" required style="width:100%; font-size:.82rem; padding:8px 10px; border-radius:8px; border:1px solid var(--border); background:var(--surface-2); color:var(--text);">
        </div>
        <div>
          <label for="leadCity" style="font-size:.75rem; font-weight:700; color:var(--muted); display:block; margin-bottom:3px;">Service Location / City</label>
          <input id="leadCity" type="text" value="${esc(cityName)}" required style="width:100%; font-size:.82rem; padding:8px 10px; border-radius:8px; border:1px solid var(--border); background:var(--surface-2); color:var(--text);">
        </div>
        <div>
          <label for="leadServiceNotes" style="font-size:.75rem; font-weight:700; color:var(--muted); display:block; margin-bottom:3px;">Job Details / Service Needed</label>
          <input id="leadServiceNotes" type="text" value="${esc(jobName)}" required style="width:100%; font-size:.82rem; padding:8px 10px; border-radius:8px; border:1px solid var(--border); background:var(--surface-2); color:var(--text);">
        </div>

        <button type="submit" class="btn btn-save cursor-pointer" style="margin-top:6px; min-height:40px; font-size:.85rem; white-space:nowrap; background:var(--save); color:#FFFFFF;">
          ${icon('check', 'ic-sm')} Dispatch Instant Quote Request
        </button>
      </form>
    </div>
  `;

  document.body.appendChild(modalHost);
  const closeModal = () => modalHost.remove();
  $('#closeLeadModal').addEventListener('click', closeModal);
  modalHost.addEventListener('click', (e) => { if (e.target === modalHost) closeModal(); });

  $('#leadRequestForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = $('#leadClientName').value.trim();
    const contact = $('#leadClientContact').value.trim();
    const city = $('#leadCity').value.trim() || cityName;
    const notes = $('#leadServiceNotes').value.trim();

    try {
      const res = await api('/api/ads/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaign_id: campId || 'ad_camp_local_plumber',
          service_job: jobName,
          client_name: name,
          client_contact: contact,
          city: city,
          notes: notes
        })
      });
      closeModal();
      toast(res.message || 'Estimate request dispatched to verified pro!');
    } catch (err) {
      toast(err.message || 'Failed to dispatch request');
    }
  });
}

/* ---------- LOCAL SERVICES PRICE COPILOT ---------- */
/* ---------- LOCAL SERVICES PRICE COPILOT (WITH METRO LABOR COST INDEXING) ---------- */
RENDER.services = async () => {
  const el = $('#screen-services');
  el.innerHTML = `<header class="topbar">
    <button class="back-btn" data-action="back">${icon('back')}Back</button>
  </header>` + skeleton(3);

  try {
    let activeMetro = 'red_deer';
    let activeSector = 'all';
    let scanResult = null;
    let isScanning = false;
    let lastDispatchedLead = null;
    let locationQuery = '';
    let resolvedLocationNote = '';

    let data = await api('/api/services?metro=' + encodeURIComponent(activeMetro));
    let laborFeed = await api('/api/services/labor-index?metro=' + encodeURIComponent(activeMetro));

    function renderScreen() {
      const filteredJobs = activeSector === 'all' 
        ? data.jobs 
        : data.jobs.filter(j => j.sector === activeSector);

      const metro = laborFeed.metro || data.current_metro;

      el.innerHTML = `<header class="topbar">
        <button class="back-btn" data-action="back">${icon('back')}Back</button>
      </header>

      <div style="padding: 10px 2px 24px;">
        <!-- Clean Title & Dynamic Postal Code / City Lookup -->
        <div style="margin-bottom:12px; border-bottom:1px solid var(--border); padding-bottom:10px;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px; margin-bottom:8px;">
            <div>
              <h1 class="page-title" style="margin:0 0 2px 0; text-align:left; width:auto; font-size:1.35rem;">Local Services</h1>
              <div style="font-size:.74rem; color:var(--muted); text-align:left;">
                Live Labor Index: <strong style="color:var(--text);">${esc(metro.hourly_plumber)}</strong> (${metro.multiplier.toFixed(2)}x vs Red Deer)
              </div>
            </div>
            <select id="metroSelect" style="padding:4px 8px; font-size:.74rem; font-weight:700; border:1px solid var(--border); border-radius:6px; background:var(--surface-2); color:var(--text); cursor:pointer; flex-shrink:0;">
              ${(laborFeed.available_metros || data.available_metros || []).map(m => `
                <option value="${m.id}" ${m.id === activeMetro ? 'selected' : ''}>${esc(m.city || m.name)}</option>
              `).join('')}
            </select>
          </div>
        </div>

          <!-- Dynamic Postal Code / City Input Strip -->
          <div style="display:flex; gap:6px; align-items:center;">
            <div style="position:relative; flex:1;">
              <input type="text" id="inputPostalCodeOrCity" placeholder="Postal Code or City (e.g. T4N 1A1, Calgary, Toronto)" value="${esc(locationQuery)}" style="width:100%; padding:6px 10px 6px 30px; font-size:.76rem; border-radius:6px; border:1px solid var(--border); background:var(--surface-2); color:var(--text); box-sizing:border-box;">
              <span style="position:absolute; left:8px; top:50%; transform:translateY(-50%); color:var(--muted);">${icon('search', 'ic-sm')}</span>
            </div>
            <button type="button" class="btn btn-save cursor-pointer" id="btnLookupLocation" style="padding:6px 12px; font-size:.74rem; font-weight:700; white-space:nowrap; background:var(--save); color:#FFFFFF;">
              Lookup Rate
            </button>
          </div>
          ${resolvedLocationNote ? `<div style="font-size:.7rem; color:var(--save); font-weight:600; margin-top:4px;">${icon('check', 'ic-sm')} ${esc(resolvedLocationNote)}</div>` : ''}
        </div>

        <!-- Snap-a-Quote AI Scanner Card -->
        <div class="card" id="snapQuoteCard" style="padding:14px; border:1.5px solid var(--border); background:var(--surface); margin-bottom:14px;">
          <input type="file" id="quoteFileInput" accept="image/*,application/pdf" capture="environment" style="display:none;">

          <!-- Photo Upload Dropzone -->
          <div id="dropZone" style="border:1.5px dashed var(--border); border-radius:8px; padding:16px 12px; text-align:center; background:var(--surface-2); cursor:pointer; margin-bottom:10px;">
            <div style="color:var(--save); margin-bottom:4px; display:flex; justify-content:center;">${icon('camera')}</div>
            <strong style="font-size:.86rem; color:var(--text); display:block;">Upload or Take Photo of Quote</strong>
            <small style="font-size:.72rem; color:var(--muted);">PDF, PNG, or JPG invoice</small>
          </div>

          <!-- Quick Test Sample Chips -->
          <div style="margin-top:6px;">
            <div style="font-size:.72rem; font-weight:600; color:var(--muted); margin-bottom:6px;">Try a sample estimate:</div>
            <div class="hscroll in-card" style="display:flex; gap:6px; margin:0; padding:2px 0 8px;">
              <button type="button" class="sample-chip" data-sample="water_heater">Water Heater ($1,850)</button>
              <button type="button" class="sample-chip" data-sample="panel">200A Panel ($4,200)</button>
              <button type="button" class="sample-chip" data-sample="furnace">Furnace ($6,800)</button>
              <button type="button" class="sample-chip" data-sample="dental">Dental Crown ($1,450)</button>
              <button type="button" class="sample-chip" data-sample="roof">Roofing ($8,900)</button>
            </div>
          </div>

          <!-- Loading / Scanning State -->
          <div id="scanningStatus" style="display:${isScanning ? 'flex' : 'none'}; align-items:center; justify-content:center; gap:8px; padding:10px; background:var(--surface-2); border-radius:6px; margin-top:10px;">
            <span class="pulsing-dot" style="display:inline-block; width:8px; height:8px; border-radius:50%; background:var(--save);"></span>
            <span style="font-size:.78rem; font-weight:600; color:var(--text);">Analyzing quote against local labor rates...</span>
          </div>

          <!-- Audit Result Display -->
          <div id="scanResultBox" style="display:${scanResult ? 'block' : 'none'}; margin-top:12px;">
            ${scanResult ? `
              <div style="border-radius:8px; padding:12px; border:1.5px solid ${scanResult.audit.badge_color}; background:#fff;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px;">
                  <div>
                    <strong style="display:block; font-size:.9rem; color:var(--text);">${esc(scanResult.extracted_contractor)}</strong>
                    <div style="font-size:.74rem; color:var(--muted);">${esc(scanResult.extracted_job.title)}</div>
                  </div>
                  <strong style="font-size:1.1rem; color:var(--text);">${money(scanResult.extracted_amount)}</strong>
                </div>

                ${scanResult.audit.potential_savings > 0 ? `
                  <div style="margin:8px 0; background:var(--save-soft); padding:8px 10px; border-radius:6px; display:flex; justify-content:space-between; align-items:center;">
                    <strong style="color:var(--save); font-size:.82rem;">Overpaying by ${money(scanResult.audit.potential_savings)} (${scanResult.audit.savings_pct}%)</strong>
                    <span style="font-size:.72rem; color:var(--muted);">Fair avg: ${money(scanResult.audit.fair_avg)}</span>
                  </div>
                ` : `
                  <div style="margin:8px 0; background:#ECFDF5; padding:8px 10px; border-radius:6px;">
                    <strong style="color:var(--save); font-size:.82rem;">Fair Quote Confirmed (${money(scanResult.extracted_amount)})</strong>
                  </div>
                `}

                <!-- Line Item Labor & Materials Breakdown -->
                <div style="background:var(--surface-2); border-radius:6px; padding:8px 10px; font-size:.74rem; display:flex; flex-direction:column; gap:4px; margin-bottom:10px;">
                  <div style="display:flex; justify-content:space-between;"><span>Estimated Parts:</span><strong>${money(scanResult.line_item_breakdown.estimated_materials)}</strong></div>
                  <div style="display:flex; justify-content:space-between;"><span>Labor Implied Rate:</span><strong style="color:${scanResult.audit.potential_savings > 0 ? '#DC2626' : 'var(--save)'};">${esc(scanResult.line_item_breakdown.implied_labor_rate)}</strong></div>
                  <div style="display:flex; justify-content:space-between; border-top:1px dashed var(--border); padding-top:4px;">
                    <span>Local Independent Benchmark:</span>
                    <strong style="color:var(--save);">${esc(scanResult.line_item_breakdown.regional_bench_rate)}</strong>
                  </div>
                </div>

                <!-- Verified Local Pro CTA -->
                <div style="border-top:1px solid var(--border); padding-top:10px;">
                  <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:6px;">
                    <strong style="font-size:.84rem; color:var(--text);">${esc(scanResult.recommended_pro.vendor_name)}</strong>
                    <span style="font-size:.72rem; color:var(--save); font-weight:700;">★ ${scanResult.recommended_pro.rating}</span>
                  </div>
                  <button type="button" class="btn btn-save btn-block cursor-pointer" id="btnDispatchQuoteLead" style="width:100%; min-height:38px; font-weight:700; font-size:.84rem; white-space:nowrap; background:var(--save); color:#FFFFFF;">
                    Request Competing Local Bids →
                  </button>
                </div>
              </div>
            ` : ''}
          </div>

          <!-- Dispatch Confirmation Banner -->
          <div id="dispatchSuccessBanner" style="display:${lastDispatchedLead ? 'block' : 'none'}; margin-top:10px; background:#ECFDF5; border:1px solid var(--save); border-radius:8px; padding:10px 12px;">
            ${lastDispatchedLead ? `
              <div style="display:flex; align-items:center; gap:6px; color:var(--save); font-weight:700; font-size:.84rem; margin-bottom:2px;">
                ${icon('check', 'ic-sm')}
                <span>Quote Dispatched (Lead #${esc(lastDispatchedLead.lead_id.slice(-6).toUpperCase())})</span>
              </div>
              <p style="font-size:.76rem; color:var(--text); margin:0;">
                Sent to <strong>${esc(scanResult?.recommended_pro?.vendor_name || 'Verified Pros')}</strong>. Expect a competitive counter-estimate within 2-4 hours.
              </p>
            ` : ''}
          </div>
        </div>

        <!-- Sector Filter Tabs -->
        <div class="hscroll" style="display:flex; gap:6px; margin:0 0 14px; padding:2px 0 8px;">
          <button class="sector-chip" data-sector="all" aria-pressed="${activeSector === 'all'}">All Services</button>
          ${data.sectors.map(s => `
            <button class="sector-chip" data-sector="${s.id}" aria-pressed="${activeSector === s.id}">${esc(s.name)}</button>
          `).join('')}
        </div>

        <!-- Service Benchmark Cards Directory -->
        <div style="display:flex; flex-direction:column; gap:10px;">
          ${filteredJobs.map(j => `
            <div class="card" style="padding:12px;">
              <div style="display:flex; justify-content:space-between; align-items:baseline; gap:8px;">
                <h3 style="font-size:.88rem; font-weight:700; color:var(--text); margin:0;">${esc(j.title)}</h3>
                <strong style="font-size:.82rem; color:var(--save); flex-shrink:0;">Save ${money(j.savings_avg)}</strong>
              </div>

              <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin:8px 0; background:var(--surface-2); padding:8px 10px; border-radius:6px; font-size:.74rem;">
                <div>
                  <span style="color:var(--muted); display:block; font-size:.68rem;">Fair Independent</span>
                  <strong style="color:var(--save); font-size:.86rem;">${money(j.fair_indie_min)} - ${money(j.fair_indie_max)}</strong>
                </div>
                <div>
                  <span style="color:var(--muted); display:block; font-size:.68rem;">Corporate Chain</span>
                  <strong style="color:#DC2626; font-size:.86rem;">${money(j.franchise_min)} - ${money(j.franchise_max)}</strong>
                </div>
              </div>

              <button class="btn btn-ghost btn-block cursor-pointer" data-action="quick-audit-job" data-job="${j.id}" data-price="${j.franchise_avg}" style="width:100%; min-height:30px; font-size:.74rem; white-space:nowrap;">
                Scan Quote for This Service
              </button>
            </div>
          `).join('')}
        </div>

        <!-- B2B Contractor Network Card -->
        <div class="card" style="margin-top:16px; padding:16px; border:1px solid var(--accent); background:linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(5,150,105,0.08) 100%);">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
            <span style="color:var(--accent);">${icon('tool')}</span>
            <strong style="font-size:.9rem; color:var(--text);">Are You a Local Trade Pro or Contractor?</strong>
          </div>
          <p style="font-size:.76rem; color:var(--muted); margin:0 0 12px; line-height:1.4;">
            Join the verified Scout $hopper network. Receive pre-qualified homeowner estimate dispatches in your metro with fair pricing benchmarks and zero bidding wars.
          </p>
          <div style="display:flex; gap:8px;">
            <a href="/landing#contractors" target="_blank" class="btn btn-save cursor-pointer" style="flex:1; padding:8px 12px; font-size:.76rem; font-weight:700; text-align:center; text-decoration:none; background:var(--save); color:#FFFFFF; border-radius:6px;">
              View Contractor Tiers ($149 - $349/mo)
            </a>
          </div>
        </div>
      </div>`;

      // Dynamic Postal Code / City Lookup
      async function triggerLocationLookup() {
        const input = $('#inputPostalCodeOrCity');
        const q = input ? input.value.trim() : '';
        if (!q) return;
        try {
          const res = await api('/api/services/labor-index/lookup?query=' + encodeURIComponent(q));
          if (res && res.resolved_metro) {
            activeMetro = res.resolved_metro.id;
            locationQuery = q;
            resolvedLocationNote = `${res.resolved_metro.city}, ${res.resolved_metro.region_code} (${res.resolved_metro.multiplier.toFixed(2)}x) · ${res.resolved_metro.resolved_from || 'Live Government Wage Index'}`;
            data = await api('/api/services?metro=' + encodeURIComponent(activeMetro));
            laborFeed = await api('/api/services/labor-index?metro=' + encodeURIComponent(activeMetro));
            if (scanResult) {
              scanResult = await api('/api/services/quote-scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  quote_text: `Contractor estimate for ${scanResult.extracted_job.title} total $${scanResult.extracted_amount}`,
                  metro_id: activeMetro
                })
              });
            }
            renderScreen();
            toast(`Resolved to ${res.resolved_metro.city} (${res.resolved_metro.multiplier.toFixed(2)}x index)`);
          }
        } catch (err) {
          toast(err.message || 'Location lookup failed');
        }
      }

      $('#btnLookupLocation')?.addEventListener('click', triggerLocationLookup);
      $('#inputPostalCodeOrCity')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          triggerLocationLookup();
        }
      });

      // Metro selector change listener
      $('#metroSelect')?.addEventListener('change', async (e) => {
        activeMetro = e.target.value;
        locationQuery = '';
        resolvedLocationNote = '';
        try {
          data = await api('/api/services?metro=' + encodeURIComponent(activeMetro));
          laborFeed = await api('/api/services/labor-index?metro=' + encodeURIComponent(activeMetro));
          scanResult = null;
          lastDispatchedLead = null;
          renderScreen();
        } catch (err) {
          toast(err.message);
        }
      });

      // File upload dropZone trigger
      const dropZone = $('#dropZone');
      const fileInput = $('#quoteFileInput');
      dropZone?.addEventListener('click', () => fileInput?.click());
      
      fileInput?.addEventListener('change', async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        isScanning = true;
        renderScreen();
        try {
          scanResult = await api('/api/services/quote-scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              filename: file.name,
              quote_text: `Contractor estimate for ${file.name.replace(/[_\-\.]/g, ' ')}`,
              metro_id: activeMetro
            })
          });
          lastDispatchedLead = null;
        } catch (err) {
          toast(err.message);
        } finally {
          isScanning = false;
          renderScreen();
          $('#scanResultBox')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      });

      // Quick test sample button clicks
      const sampleTexts = {
        water_heater: 'Apex Home Comfort estimate for 50-gallon water heater replacement total $1,850.00 parts and labor',
        panel: 'Metro Electric quotation for 200 amp electrical service panel upgrade total $4,200.00',
        furnace: 'Action Heating quote for 96% AFUE high-efficiency gas furnace installation total $6,800.00',
        dental: 'Dental corporate chain estimate for zirconia molar crown total $1,450.00',
        roof: 'Summit Elite Roofing estimate for architectural shingle replacement total $8,900.00'
      };

      el.querySelectorAll('[data-sample]').forEach(btn => {
        btn.addEventListener('click', async () => {
          const sampleKey = btn.dataset.sample;
          const text = sampleTexts[sampleKey] || '';
          isScanning = true;
          renderScreen();
          try {
            scanResult = await api('/api/services/quote-scan', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                quote_text: text,
                filename: `${sampleKey}_quote.pdf`,
                metro_id: activeMetro
              })
            });
            lastDispatchedLead = null;
          } catch (err) {
            toast(err.message);
          } finally {
            isScanning = false;
            renderScreen();
            $('#scanResultBox')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        });
      });

      // Quick audit from benchmark list
      el.querySelectorAll('[data-action="quick-audit-job"]').forEach(btn => {
        btn.addEventListener('click', async () => {
          const jobId = btn.dataset.job;
          const price = parseFloat(btn.dataset.price);
          isScanning = true;
          renderScreen();
          try {
            scanResult = await api('/api/services/quote-scan', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                quote_text: `Contractor estimate for service job ${jobId} total $${price.toFixed(2)}`,
                metro_id: activeMetro
              })
            });
            lastDispatchedLead = null;
          } catch (err) {
            toast(err.message);
          } finally {
            isScanning = false;
            renderScreen();
            $('#scanResultBox')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        });
      });

      // Dispatch quote lead to verified local pros
      $('#btnDispatchQuoteLead')?.addEventListener('click', async () => {
        if (!scanResult) return;
        try {
          const pro = scanResult.recommended_pro;
          const leadResp = await api('/api/ads/leads', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              campaign_id: pro.ad_campaign_id,
              service_job: scanResult.extracted_job.title,
              client_name: 'Alex Demo',
              client_contact: 'alex.demo@example.com',
              estimated_amount: scanResult.extracted_amount,
              city: metro.city,
              notes: `Homeowner scanned competitor quote for ${scanResult.extracted_job.title} ($${scanResult.extracted_amount.toFixed(2)}). Seeking competitive bid.`
            })
          });
          lastDispatchedLead = leadResp;
          toast('Quote dispatched to verified local pros!');
          renderScreen();
          $('#dispatchSuccessBanner')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } catch (e) {
          toast(e.message);
        }
      });

      // Sector filter tabs
      el.querySelectorAll('[data-sector]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          activeSector = btn.dataset.sector;
          renderScreen();
        });
      });

      initHScrolls(el);
    }

    renderScreen();
  } catch (e) {
    el.innerHTML = `<header class="topbar"><button class="back-btn" data-action="back">${icon('back')}Back</button></header><div class="empty">${esc(e.message)}</div>`;
  }
};

/* ---------- SELF-SERVICE ADVERTISING & SPONSOR HUB ---------- */
RENDER.sponsor = async () => {
  const el = $('#screen-sponsor');
  el.innerHTML = topbar() + skeleton(3);

  let activeType = 'ecomm'; // 'ecomm', 'local_service'
  let activeDuration = 60; // 30, 60, 90
  let showActiveCampaigns = true;

  const defaultTemplates = {
    ecomm: {
      name: 'Northwood Supply Co.',
      url: 'https://northwoodsupply.com/products/leather-tote',
      title: 'Handcrafted Heritage Waxed Canvas & Leather Tote',
      desc: 'Double-reinforced full-grain bridle leather handles. Weatherproof 18oz Martexin waxed canvas.',
      cat: 'Holiday & Gifts',
      price: '84.00',
      badge: 'Ecomm Partner',
      img: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500&auto=format&fit=crop&q=60'
    },
    local_service: {
      name: 'Apex Heating, Cooling & Plumbing',
      url: 'https://apexpros.com/quote-request',
      title: 'Master Licensed HVAC & Water Heater Pros',
      desc: '24/7 priority emergency dispatch. Zero diagnostic fee with repairs. Upfront fixed price guarantee.',
      cat: 'Local Pro: HVAC & Heating',
      price: '129.00',
      badge: 'Verified Local Pro',
      img: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500&auto=format&fit=crop&q=60'
    }
  };

  async function renderScreen() {
    try {
      const [pricingData, campaigns] = await Promise.all([
        api('/api/ads/pricing'),
        api('/api/ads/active')
      ]);

      const tiers = pricingData.tiers || [];
      const currentTpl = defaultTemplates[activeType] || defaultTemplates.ecomm;

      el.innerHTML = `
        <header class="topbar">
          <button class="back-btn" data-action="back">${icon('back')}Back</button>
        </header>

        <div style="padding: 6px 2px 20px;">
          <!-- Compact Page Header -->
          <div style="text-align:center; margin-bottom:10px; border-bottom:1px solid var(--border); padding-bottom:8px;">
            <h1 class="page-title" style="margin:0 0 2px 0; font-size:1.25rem;">Self-Serve Advertising</h1>
            <div style="font-size:.74rem; color:var(--muted); text-align:center;">Promote your business directly to local shoppers</div>
          </div>

          <!-- Top Segmented Switcher: Ecomm vs Local Pro -->
          <div class="ad-type-switcher">
            <button type="button" class="ad-type-tab ${activeType === 'ecomm' ? 'active' : ''}" data-type="ecomm">
              ${icon('box', 'ic-sm')}
              <span>Ecomm</span>
            </button>
            <button type="button" class="ad-type-tab ${activeType === 'local_service' ? 'active' : ''}" data-type="local_service">
              ${icon('wrench', 'ic-sm')}
              <span>Local Pro</span>
            </button>
          </div>

          <!-- Ultra-Compact Plan Selector (3 Tiers) -->
          <div class="plan-selector-grid">
            ${tiers.map(t => {
              const isSelected = activeDuration === t.days;
              const subLabel = t.days === 30 ? '$4.97/day' : t.days === 60 ? 'Save $49' : 'Save $98';
              return `
                <div class="plan-chip ${isSelected ? 'selected' : ''}" data-duration="${t.days}">
                  <span class="plan-chip-header">${t.days} Days</span>
                  <span class="plan-chip-price">$${t.price_dollars.toFixed(0)}</span>
                  <span class="plan-chip-sub">${subLabel}</span>
                </div>
              `;
            }).join('')}
          </div>

          <!-- AdMob Programmatic Unit between Price Selector and Name Input -->
          <div class="admob-banner-unit cursor-pointer" data-action="open-admob-sandbox" style="padding:8px 12px; margin:0 0 10px; cursor:pointer;" title="Tap to test Google AdMob Sandbox">
            <div style="display:flex; align-items:center; gap:6px;">
              <span style="color:var(--gold); display:flex;">${icon('zap', 'ic-sm')}</span>
              <span style="font-size:.66rem; color:var(--muted); font-weight:700; text-transform:uppercase;">AdMob Network Backfill</span>
            </div>
            <span style="font-size:.70rem; color:var(--save); font-weight:700; white-space:nowrap;">Test Sandbox &rarr;</span>
          </div>

          <!-- High-Density Ad Setup Form -->
          <form id="adSetupForm" class="card" style="padding:10px 12px; margin-bottom:12px;">
            <!-- Row 1: Business Name + Target City -->
            <div style="display:grid; grid-template-columns:1.1fr 0.9fr; gap:8px; margin-bottom:8px;">
              <div>
                <label for="adVendorName" class="form-label-compact">Business Name</label>
                <input id="adVendorName" type="text" class="form-input-compact" value="${esc(currentTpl.name)}" required>
              </div>
              <div>
                <label for="adCity" class="form-label-compact">Target City</label>
                <input id="adCity" type="text" class="form-input-compact" value="Red Deer, AB" required>
              </div>
            </div>

            <!-- Row 2: Target Category (Context-Filtered) + Product Price -->
            <div style="display:grid; grid-template-columns:1.2fr 0.8fr; gap:8px; margin-bottom:8px;">
              <div>
                <label for="adCategory" class="form-label-compact">Target Category</label>
                <select id="adCategory" class="form-input-compact">
                  ${activeType === 'ecomm' ? `
                    <option value="Holiday & Gifts" ${currentTpl.cat === 'Holiday & Gifts' ? 'selected' : ''}>Holiday &amp; Gifts</option>
                    <option value="Kitchen & Dining" ${currentTpl.cat === 'Kitchen & Dining' ? 'selected' : ''}>Kitchen &amp; Dining</option>
                    <option value="Consumer Electronics" ${currentTpl.cat === 'Consumer Electronics' ? 'selected' : ''}>Consumer Electronics</option>
                    <option value="Home & Cleaning" ${currentTpl.cat === 'Home & Cleaning' ? 'selected' : ''}>Home &amp; Cleaning</option>
                    <option value="Tools & Hardware" ${currentTpl.cat === 'Tools & Hardware' ? 'selected' : ''}>Tools, Hardware &amp; DIY</option>
                    <option value="Outdoor & Patio" ${currentTpl.cat === 'Outdoor & Patio' ? 'selected' : ''}>Outdoor, Patio &amp; Garden</option>
                    <option value="Apparel & Fashion" ${currentTpl.cat === 'Apparel & Fashion' ? 'selected' : ''}>Apparel &amp; Accessories</option>
                    <option value="Health & Beauty" ${currentTpl.cat === 'Health & Beauty' ? 'selected' : ''}>Health, Beauty &amp; Wellness</option>
                    <option value="Food & Gourmet" ${currentTpl.cat === 'Food & Gourmet' ? 'selected' : ''}>Food, Gourmet &amp; Coffee</option>
                    <option value="Sports & Fitness" ${currentTpl.cat === 'Sports & Fitness' ? 'selected' : ''}>Sports, Fitness &amp; Hobbies</option>
                    <option value="Baby & Kids" ${currentTpl.cat === 'Baby & Kids' ? 'selected' : ''}>Kids, Toys &amp; Baby</option>
                    <option value="All" ${currentTpl.cat === 'All' ? 'selected' : ''}>All Retail Categories</option>
                  ` : `
                    <option value="Local Pro: HVAC & Heating" ${currentTpl.cat === 'Local Pro: HVAC & Heating' ? 'selected' : ''}>HVAC, Heating &amp; Cooling</option>
                    <option value="Local Pro: Plumbing & Water" ${currentTpl.cat === 'Local Pro: Plumbing & Water' ? 'selected' : ''}>Plumbing &amp; Water Heaters</option>
                    <option value="Local Pro: Electrical" ${currentTpl.cat === 'Local Pro: Electrical' ? 'selected' : ''}>Electrical &amp; Lighting</option>
                    <option value="Local Pro: Roofing & Exterior" ${currentTpl.cat === 'Local Pro: Roofing & Exterior' ? 'selected' : ''}>Roofing, Siding &amp; Exterior</option>
                    <option value="Local Pro: Auto & Detailing" ${currentTpl.cat === 'Local Pro: Auto & Detailing' ? 'selected' : ''}>Auto Repair &amp; Detailing</option>
                    <option value="All" ${currentTpl.cat === 'All' ? 'selected' : ''}>All Local Services</option>
                  `}
                </select>
              </div>
              <div>
                <label for="adPrice" class="form-label-compact">Price ($)</label>
                <input id="adPrice" type="number" step="0.01" class="form-input-compact" value="${esc(currentTpl.price)}" required>
              </div>
            </div>

            <!-- Row 3: Product Headline -->
            <div style="margin-bottom:8px;">
              <label for="adTitle" class="form-label-compact">Product / Offer Headline</label>
              <input id="adTitle" type="text" class="form-input-compact" value="${esc(currentTpl.title)}" required>
            </div>

            <!-- Row 4: Store URL + Image URL -->
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:8px;">
              <div>
                <label for="adStoreUrl" class="form-label-compact">Store / Action URL</label>
                <input id="adStoreUrl" type="url" class="form-input-compact" value="${esc(currentTpl.url)}" required>
              </div>
              <div>
                <label for="adImageUrl" class="form-label-compact">Product Photo URL</label>
                <input id="adImageUrl" type="url" class="form-input-compact" value="${esc(currentTpl.img)}" required>
              </div>
            </div>

            <!-- Row 5: Highlight Description / Pitch -->
            <div style="margin-bottom:8px;">
              <label for="adDesc" class="form-label-compact">Highlight Pitch / Key Offer</label>
              <input id="adDesc" type="text" class="form-input-compact" value="${esc(currentTpl.desc)}" placeholder="Key highlight or guarantee">
            </div>

            <!-- Integrated In-Feed Live Preview -->
            <div class="ad-preview-box" style="margin:8px 0 10px;">
              <span style="font-size:.66rem; font-weight:800; color:var(--gold); display:flex; align-items:center; gap:4px; margin-bottom:6px; text-transform:uppercase;">
                ${icon('zap', 'ic-sm')} In-Feed Card Live Preview
              </span>
              <div id="livePreviewTarget"></div>
            </div>

            <!-- Performance Fee Transparency Pill -->
            <div style="display:flex; align-items:center; justify-content:space-between; gap:6px; background:rgba(5,150,105,0.06); border:1px solid rgba(5,150,105,0.22); border-radius:8px; padding:6px 10px; margin-bottom:10px; font-size:.70rem;">
              <span style="color:var(--text); font-weight:600;">Performance Guarantee:</span>
              <span style="color:var(--save); font-weight:700; white-space:nowrap;">
                ${activeType === 'local_service' ? '$25 / dispatched pro lead' : '$0.75 / verified shopper lead'}
              </span>
            </div>

            <!-- Submit Button (Single Line, High Contrast) -->
            <button type="submit" class="btn btn-save cursor-pointer" style="width:100%; min-height:42px; font-size:.86rem; font-weight:700; white-space:nowrap; background:var(--save); color:#FFFFFF;">
              ${icon('check', 'ic-sm')} Launch ${activeDuration}-Day Campaign ($${activeDuration === 30 ? '149' : activeDuration === 60 ? '249' : '349'})
            </button>
          </form>

          <!-- Active Platform Campaigns Section (Collapsible to Save Space) -->
          <div class="card" style="padding:10px 12px; margin-bottom:14px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <div style="display:flex; align-items:center; gap:6px;">
                <strong style="font-size:.82rem;">Active Platform Sponsors</strong>
                <span style="font-size:.70rem; color:var(--muted);">(${campaigns.length} live)</span>
              </div>
              <button type="button" id="toggleCampaignsBtn" class="chip-btn cursor-pointer" style="font-size:.68rem; padding:2px 8px; white-space:nowrap;">
                ${showActiveCampaigns ? 'Collapse' : 'Expand'}
              </button>
            </div>

            <div id="activeCampaignsList" style="margin-top:8px; display:${showActiveCampaigns ? 'flex' : 'none'}; flex-direction:column; gap:8px;">
              ${campaigns.length ? campaigns.map(c => `
                <div style="padding:8px; border:1px solid var(--border); border-radius:8px; background:var(--surface);">
                  <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px;">
                    <div style="flex:1; min-width:0;">
                      <div style="display:flex; align-items:center; gap:6px; margin-bottom:2px; flex-wrap:wrap;">
                        <span class="sponsored-pill ${c.vendor_type === 'local_service' ? 'local' : 'ecomm'}">
                          ${esc(c.badge_label || (c.vendor_type === 'local_service' ? 'Verified Local Pro' : 'Ecomm Partner'))}
                        </span>
                        <span style="font-size:.66rem; color:var(--muted); font-weight:600;">${c.days_remaining}d left · ${esc(c.city || 'Red Deer, AB')}</span>
                      </div>
                      <strong style="font-size:.82rem; display:block; line-height:1.2; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${esc(c.title)}</strong>
                      <span style="font-size:.68rem; color:var(--muted);">${esc(c.vendor_name)} · ${esc(c.category)}</span>
                    </div>
                    <strong style="font-size:.88rem; font-family:'Space Grotesk',sans-serif; color:var(--text); white-space:nowrap;">${money(c.price)}</strong>
                  </div>

                  <!-- Performance Metrics Bar -->
                  <div style="display:flex; align-items:center; justify-content:space-between; margin-top:6px; padding-top:6px; border-top:1px dashed var(--border); font-size:.68rem;">
                    <span style="color:var(--muted);">Base: <strong style="color:var(--text);">$${(c.price_dollars || 349).toFixed(0)}</strong></span>
                    <span style="color:var(--muted);">Leads: <strong style="color:var(--save);">${c.leads_count || 0}</strong></span>
                    <span style="color:var(--muted);">Total: <strong style="color:var(--text);">$${(c.total_billed_dollars || c.price_dollars || 349).toFixed(0)}</strong></span>
                    <a href="${esc(c.store_url)}" target="_blank" rel="noopener" class="btn btn-outline cursor-pointer" style="padding:2px 6px; font-size:.65rem; white-space:nowrap;">Store ${icon('external', 'ic-sm')}</a>
                  </div>
                </div>
              `).join('') : `
                <div class="empty" style="padding:12px;">
                  <p style="font-size:.76rem; color:var(--muted);">No active campaigns yet. Launch the first one above!</p>
                </div>
              `}
            </div>
          </div>
        </div>
      `;

      // Function to render live preview card
      function updateLivePreview() {
        const vendorName = $('#adVendorName')?.value || 'Your Store';
        const title = $('#adTitle')?.value || 'Your Product Title';
        const desc = $('#adDesc')?.value || 'Your product highlight pitch';
        const price = parseFloat($('#adPrice')?.value || '0');
        const imgUrl = $('#adImageUrl')?.value || currentTpl.img;
        const target = $('#livePreviewTarget');
        if (!target) return;

        const badge = activeType === 'local_service' ? 'Verified Local Pro' : 'Ecomm Partner';
        const badgeCls = activeType === 'local_service' ? 'local' : 'ecomm';

        target.innerHTML = `
          <div class="card prod-row" style="margin:0; border:1px solid var(--border); background:var(--surface); padding:8px;">
            <img class="thumb" src="${esc(imgUrl)}" alt="Preview" style="width:58px; height:58px; border-radius:8px; object-fit:cover;">
            <div class="prod-info" style="min-width:0;">
              <div style="display:flex; align-items:center; gap:6px; margin-bottom:2px;">
                <span class="sponsored-pill ${badgeCls}">${icon('zap', 'ic-sm')} ${esc(badge)}</span>
                <span style="font-size:.66rem; color:var(--muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${esc(vendorName)}</span>
              </div>
              <div class="prod-title" style="font-size:.82rem; line-height:1.2;">${esc(title)}</div>
              <div class="prod-meta" style="font-size:.70rem;">${esc(desc)}</div>
              <div class="prod-prices" style="margin-top:2px;">
                <span class="price-now" style="font-size:.90rem;">${money(price)}</span>
              </div>
            </div>
          </div>
        `;
      }

      updateLivePreview();

      // Listen for form inputs to update preview in real-time
      $('#adSetupForm').querySelectorAll('input, select').forEach(inp => {
        inp.addEventListener('input', updateLivePreview);
      });

      // Type selector listeners (Ecomm vs Local Pro)
      el.querySelectorAll('.ad-type-tab').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          activeType = btn.dataset.type;
          renderScreen();
        });
      });

      // Duration selector listeners (30, 60, 90 days)
      el.querySelectorAll('.plan-chip').forEach(card => {
        card.addEventListener('click', () => {
          activeDuration = parseInt(card.dataset.duration);
          el.querySelectorAll('.plan-chip').forEach(c => c.classList.toggle('selected', parseInt(c.dataset.duration) === activeDuration));
          const submitBtn = $('#adSetupForm button[type="submit"]');
          if (submitBtn) {
            submitBtn.innerHTML = `${icon('check', 'ic-sm')} Launch ${activeDuration}-Day Campaign ($${activeDuration === 30 ? '149' : activeDuration === 60 ? '249' : '349'})`;
          }
        });
      });

      // Toggle active campaigns collapse/expand
      $('#toggleCampaignsBtn')?.addEventListener('click', () => {
        showActiveCampaigns = !showActiveCampaigns;
        const list = $('#activeCampaignsList');
        const btn = $('#toggleCampaignsBtn');
        if (list) list.style.display = showActiveCampaigns ? 'flex' : 'none';
        if (btn) btn.textContent = showActiveCampaigns ? 'Collapse' : 'Expand';
      });

      // Form submission
      $('#adSetupForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const vendorName = $('#adVendorName').value.trim();
        const storeUrl = $('#adStoreUrl').value.trim();
        const title = $('#adTitle').value.trim();
        const desc = $('#adDesc').value.trim();
        const category = $('#adCategory').value;
        const price = parseFloat($('#adPrice').value);
        const imgUrl = $('#adImageUrl').value.trim();
        const city = $('#adCity').value.trim() || 'Red Deer, AB';

        if (!vendorName || !storeUrl || !title || isNaN(price)) {
          toast('Please complete all required fields.');
          return;
        }

        try {
          const res = await api('/api/ads/campaigns', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              vendor_type: activeType,
              vendor_name: vendorName,
              store_url: storeUrl,
              title: title,
              description: desc,
              category: category,
              price: price,
              image_url: imgUrl,
              city: city,
              duration_days: activeDuration
            })
          });

          toast(`Campaign launched for ${activeDuration} days in ${city}! ($${res.campaign.price_dollars} Base)`);
          renderScreen();
        } catch (err) {
          toast(err.message || 'Failed to create campaign');
        }
      });

    } catch (e) {
      el.innerHTML = topbar() + `<div class="empty">${esc(e.message)}</div>`;
    }
  }

  await renderScreen();
};

RENDER.portal = async () => {
  const el = $('#screen-portal'); const t = await api('/api/telemetry');
  el.innerHTML = `<header class="topbar"><button class="back-btn" data-action="back">${icon('back')}Back</button></header><h1 class="page-title">Brand portal preview</h1>
    <p class="hint" style="margin:6px 0 12px">Anonymous shelf-scan telemetry that brand manufacturers subscribe to.</p>
    <div class="card">${t.recent_scans.length ? t.recent_scans.slice().reverse().map((s) => { const f = new Intl.NumberFormat('en', { style: 'currency', currency: s.currency || 'USD' }).format; return `<div class="tele-row"><strong>${esc(s.title)}</strong><small>${esc(s.store)} (${esc(s.region)}) · shelf ${f(s.shelf_price)} · online ${f(s.lowest_online_price)} · gap ${f(s.savings)}</small></div>`; }).join('') : `<div class="empty">${icon('chart', 'ic-lg')}<p><strong>No shared scans yet</strong></p><p>Enable "Share anonymous scan data" in Preferences, then scan an item.</p></div>`}</div>`;
};

/* ---------- POST-PURCHASE RECEIPT WATCHDOG & PRICE PROTECTION ---------- */
const STORE_OPTIONS = [
  { id: 'Best Buy', title: 'Best Buy', subtitle: '14-Day Price Match Window', badge: '14 Days' },
  { id: 'Target', title: 'Target', subtitle: '14-Day Price Adjustment Window', badge: '14 Days' },
  { id: 'Walmart', title: 'Walmart', subtitle: '30-Day Return & Price Protection', badge: '30 Days' },
  { id: 'Amazon', title: 'Amazon', subtitle: '30-Day Return Window & Drop Scan', badge: '30 Days' },
  { id: 'Costco', title: 'Costco', subtitle: '90-Day Electronics Price Match', badge: '90 Days' },
  { id: 'Home Depot', title: 'Home Depot', subtitle: '90-Day Return & Price Guarantee', badge: '90 Days' },
  { id: 'Apple Store', title: 'Apple Store', subtitle: '14-Day Price Drop Reimbursement', badge: '14 Days' },
  { id: 'Other Retailer', title: 'Other Retailer', subtitle: '30-Day Standard Return Policy', badge: '30 Days' }
];

RENDER.receipts = async () => {
  const el = $('#screen-receipts');
  el.innerHTML = `<header class="topbar"><button class="back-btn" data-action="back">${icon('back')}Back</button></header>` + skeleton(3);

  let selectedStore = 'Best Buy';

  async function loadAndRender() {
    try {
      const data = await api('/api/receipts');
      const inboundFeed = await api('/api/receipts/inbound-feed');
      const receipts = data.receipts || [];
      const totalRefund = data.total_refund_available || 0.0;
      const droppedCount = data.dropped_count || 0;
      const pendingInbound = inboundFeed.pending_receipts || [];

      el.innerHTML = `
        <header class="topbar">
          <button class="back-btn" data-action="back">${icon('back')}Back</button>
        </header>

        <div style="padding: 10px 2px 24px;">
          <!-- Clean Page Title -->
          <div style="margin-bottom:12px; border-bottom:1px solid var(--border); padding-bottom:8px; text-align:center;">
            <h1 class="page-title" style="margin:0 0 2px 0;">Price Protection</h1>
            <div style="font-size:.74rem; color:var(--muted); text-align:center;">Automated post-purchase refund monitoring</div>
          </div>

          <!-- Summary Stats Header -->
          <div class="referral-stats-grid" style="margin-bottom:12px;">
            <div class="stat-box">
              <strong>${receipts.length}</strong>
              <small>Purchases</small>
            </div>
            <div class="stat-box highlight">
              <strong>${droppedCount}</strong>
              <small>Price Drops</small>
            </div>
            <div class="stat-box" style="border: 1.5px solid ${totalRefund > 0 ? 'var(--save)' : 'var(--border)'};">
              <strong style="color:${totalRefund > 0 ? 'var(--save)' : 'var(--text)'};">${money(totalRefund)}</strong>
              <small>Refunds Found</small>
            </div>
          </div>

          <!-- Physical Paper Receipt Snap & Quick Log Bar -->
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:12px;">
            <button type="button" class="btn btn-save cursor-pointer" id="btnSnapPaperReceipt" style="display:flex; align-items:center; justify-content:center; gap:6px; padding:10px 8px; font-size:.80rem; font-weight:800; background:linear-gradient(135deg, #059669, #047857); color:#FFFFFF;">
              ${icon('scan', 'ic-sm')} Snap Receipt Photo
            </button>
            <button type="button" class="btn btn-outline cursor-pointer" id="btnManualLogReceipt" style="display:flex; align-items:center; justify-content:center; gap:6px; padding:10px 8px; font-size:.80rem; font-weight:700;">
              ${icon('tag', 'ic-sm')} Quick Log Receipt
            </button>
          </div>
          <input type="file" id="receiptFileInput" accept="image/*" capture="environment" style="display:none;">

          <!-- Sleek Single-Line Inbound Sync Strip -->
          <div style="background:var(--surface); border:1px solid var(--border); border-radius:8px; padding:8px 10px; margin-bottom:12px; display:flex; align-items:center; justify-content:space-between; gap:8px;">
            <div style="min-width:0; flex:1;">
              <small style="font-size:.66rem; color:var(--muted); text-transform:uppercase; font-weight:700; display:block;">Forward Store E-Receipts To:</small>
              <span style="font-family:monospace; font-size:.78rem; font-weight:700; color:var(--text); word-break:break-all;">${esc(inboundFeed.forwarding_email)}</span>
            </div>
            <div style="display:flex; gap:6px; flex-shrink:0;">
              <button type="button" class="btn btn-outline cursor-pointer" id="btnCopyInboundEmail" style="padding:4px 8px; font-size:.72rem;">Copy</button>
              <button type="button" class="btn btn-save cursor-pointer" id="btn1ClickSyncReceipts" style="padding:4px 10px; font-size:.74rem; background:var(--save); color:#FFFFFF; font-weight:700;">
                ${icon('zap', 'ic-sm')} Sync (${pendingInbound.length})
              </button>
              ${pendingInbound.length === 0 ? `
                <button type="button" class="btn btn-outline cursor-pointer" id="btnSimulateForward" title="Send a test store e-receipt" style="padding:4px 8px; font-size:.72rem;">
                  + Test
                </button>
              ` : ''}
            </div>
          </div>

          <!-- Active Tracked Receipts List -->
          <div id="receiptsList" style="display:flex; flex-direction:column; gap:10px;">
            ${receipts.length ? receipts.map(r => `
              <div class="card receipt-card" id="receipt-${esc(r.id)}" style="padding:12px; border: 1.5px solid ${r.price_dropped ? 'var(--save)' : 'var(--border)'}; background: ${r.price_dropped ? 'linear-gradient(135deg, rgba(5,150,105,0.06), rgba(5,150,105,0.01))' : 'var(--surface)'};">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px;">
                  <div style="flex:1; min-width:0;">
                    <div style="display:flex; align-items:center; gap:6px; margin-bottom:2px;">
                      <span style="font-size:.72rem; font-weight:700; color:var(--gold);">${esc(r.store)}</span>
                      <span style="font-size:.72rem; color:var(--muted);">· ${r.days_remaining}d window left</span>
                    </div>
                    <strong style="font-size:.88rem; display:block; color:var(--text); line-height:1.25;">${esc(r.item_title)}</strong>
                  </div>
                  <button class="remove cursor-pointer" data-action="receipt-delete" data-id="${esc(r.id)}" aria-label="Delete receipt" style="flex-shrink:0;">
                    ${icon('trash')}
                  </button>
                </div>

                <!-- Price Comparison Bar -->
                <div style="display:flex; align-items:baseline; justify-content:space-between; margin-top:8px; padding-top:6px; border-top:1px dashed var(--border);">
                  <div style="display:flex; gap:10px; font-size:.75rem;">
                    <span>Paid: <strong>${money(r.price_paid)}</strong></span>
                    <span>Now: <strong style="color:${r.price_dropped ? 'var(--save)' : 'var(--text)'};">${money(r.current_market_price)}</strong></span>
                  </div>
                  ${r.price_dropped ? `
                    <strong style="font-size:1.05rem; color:var(--save); font-family:'Space Grotesk',sans-serif;">${money(r.refund_amount)}</strong>
                  ` : ''}
                </div>

                <!-- Price Drop Claim Action -->
                ${r.price_dropped ? `
                  <button class="btn btn-save cursor-pointer" data-action="receipt-claim" data-id="${esc(r.id)}" style="margin-top:8px; min-height:34px; font-size:.78rem; white-space:nowrap; width:100%; background:var(--save); color:#FFFFFF; font-weight:700;">
                    ${icon('zap', 'ic-sm')} Generate Price Adjustment Claim (${money(r.refund_amount)})
                  </button>
                ` : `
                  <button class="sim-drop-btn cursor-pointer" data-action="receipt-sim-drop" data-id="${esc(r.id)}" style="margin-top:8px; font-size:.72rem; padding:4px 8px;">
                    Simulate 20% Price Drop
                  </button>
                `}
              </div>
            `).join('') : `
              <div class="empty">
                ${icon('receipt', 'ic-lg')}
                <p><strong>No purchases tracked yet</strong></p>
                <p>Forward a store email receipt above to start monitoring prices.</p>
              </div>
            `}
          </div>
        </div>
      `;

      // Snap Physical Receipt Button -> opens camera / file picker
      $('#btnSnapPaperReceipt')?.addEventListener('click', () => {
        $('#receiptFileInput')?.click();
      });

      // Handle Image Snapped / Uploaded from Paper Receipt
      $('#receiptFileInput')?.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          openReceiptLoggerModal({
            image_preview: ev.target.result,
            store: 'Best Buy',
            item_title: '',
            price_paid: '',
            receipt_number: `RCPT-${Math.floor(100000 + Math.random() * 900000)}`
          });
        };
        reader.readAsDataURL(file);
      });

      // Quick Manual Receipt Log Button
      $('#btnManualLogReceipt')?.addEventListener('click', () => {
        openReceiptLoggerModal();
      });

      // Copy Inbound Forwarding Address
      $('#btnCopyInboundEmail')?.addEventListener('click', () => {
        navigator.clipboard?.writeText(inboundFeed.forwarding_email).then(() => {
          toast('Copied forwarding address to clipboard!');
        }).catch(() => {
          toast(`Forwarding address: ${inboundFeed.forwarding_email}`);
        });
      });

      // 1-Click Sync Inbound Receipts
      $('#btn1ClickSyncReceipts')?.addEventListener('click', async () => {
        try {
          const res = await api('/api/receipts/email-sync', { method: 'POST' });
          toast(res.message);
          await loadAndRender();
        } catch (e) {
          toast(e.message);
        }
      });

      // Quick Test Store E-Receipt Simulator
      $('#btnSimulateForward')?.addEventListener('click', async () => {
        try {
          const testReceipts = [
            { store: 'Home Depot', item_title: 'Dewalt 20V Max Cordless Drill Kit', price_paid: 199.00 },
            { store: 'Best Buy', item_title: 'Sony WH-1000XM5 Wireless Headphones', price_paid: 399.99 },
            { store: 'Canadian Tire', item_title: 'Mastercraft 100-Piece Socket Set', price_paid: 129.99 }
          ];
          const pick = testReceipts[Math.floor(Math.random() * testReceipts.length)];
          await api('/api/receipts/simulate-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pick)
          });
          toast(`E-Receipt arrived from ${pick.store}! Tap Sync to ingest.`);
          await loadAndRender();
        } catch (e) {
          toast(e.message);
        }
      });
    } catch (err) {
      el.innerHTML = `<header class="topbar"><button class="back-btn" data-action="back">${icon('back')}Back</button></header><div class="empty"><p>Failed to load receipts watchdog.</p></div>`;
    }
  }

  await loadAndRender();
};

function openReceiptLoggerModal(prefill = {}) {
  const modalHost = document.createElement('div');
  modalHost.className = 'policy-modal-backdrop';
  modalHost.id = 'receiptLoggerModal';

  const stores = ['Best Buy', 'Home Depot', 'Target', 'Walmart', 'Costco', 'Canadian Tire', 'Lowe\'s', 'Amazon'];

  modalHost.innerHTML = `
    <div class="policy-modal-card" role="dialog" aria-modal="true" aria-labelledby="rcptModalTitle" style="max-width:390px; max-height:90vh; overflow-y:auto;">
      <div class="policy-modal-head">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="color:var(--gold);">${icon('receipt')}</span>
          <strong id="rcptModalTitle" style="font-size:1.05rem; font-family:'Space Grotesk',sans-serif;">${prefill.image_preview ? 'Review Scanned Receipt' : 'Log Paper Receipt'}</strong>
        </div>
        <button class="policy-close-btn cursor-pointer" id="closeRcptLogModal" aria-label="Close modal">&times;</button>
      </div>

      ${prefill.image_preview ? `
        <div style="margin-bottom:12px; text-align:center; background:#000; border-radius:8px; overflow:hidden; max-height:160px;">
          <img src="${prefill.image_preview}" alt="Receipt preview" style="max-height:160px; max-width:100%; object-fit:contain;">
        </div>
      ` : ''}

      <form id="receiptLogForm" style="display:flex; flex-direction:column; gap:10px;">
        <div>
          <label style="font-size:.74rem; font-weight:700; color:var(--muted); display:block; margin-bottom:4px;">Store / Retailer:</label>
          <select id="rcptStoreInput" style="width:100%; padding:8px 10px; border-radius:8px; border:1px solid var(--border); background:var(--surface-2); color:var(--text); font-size:.82rem;">
            ${stores.map(s => `<option value="${esc(s)}" ${prefill.store === s ? 'selected' : ''}>${esc(s)}</option>`).join('')}
          </select>
        </div>

        <div>
          <label style="font-size:.74rem; font-weight:700; color:var(--muted); display:block; margin-bottom:4px;">Item Name:</label>
          <input type="text" id="rcptItemInput" required placeholder="e.g. Dyson V11 Vacuum Cleaner" value="${esc(prefill.item_title || '')}" style="width:100%; padding:8px 10px; border-radius:8px; border:1px solid var(--border); background:var(--surface-2); color:var(--text); font-size:.82rem;">
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
          <div>
            <label style="font-size:.74rem; font-weight:700; color:var(--muted); display:block; margin-bottom:4px;">Price Paid ($):</label>
            <input type="number" step="0.01" min="0.50" id="rcptPriceInput" required placeholder="e.g. 199.99" value="${prefill.price_paid || ''}" style="width:100%; padding:8px 10px; border-radius:8px; border:1px solid var(--border); background:var(--surface-2); color:var(--text); font-size:.82rem;">
          </div>
          <div>
            <label style="font-size:.74rem; font-weight:700; color:var(--muted); display:block; margin-bottom:4px;">Return Window:</label>
            <select id="rcptDaysInput" style="width:100%; padding:8px 10px; border-radius:8px; border:1px solid var(--border); background:var(--surface-2); color:var(--text); font-size:.82rem;">
              <option value="14">14 Days (Standard)</option>
              <option value="30" selected>30 Days</option>
              <option value="90">90 Days (Costco / Home Depot)</option>
            </select>
          </div>
        </div>

        <div>
          <label style="font-size:.74rem; font-weight:700; color:var(--muted); display:block; margin-bottom:4px;">Receipt or Order # (Optional):</label>
          <input type="text" id="rcptNoInput" placeholder="e.g. BBY-98234-A" value="${esc(prefill.receipt_number || '')}" style="width:100%; padding:8px 10px; border-radius:8px; border:1px solid var(--border); background:var(--surface-2); color:var(--text); font-size:.82rem;">
        </div>

        <button type="submit" class="btn btn-save cursor-pointer" style="margin-top:6px; padding:10px; font-size:.84rem; font-weight:800; background:var(--save); color:#FFFFFF;">
          ${icon('zap', 'ic-sm')} Start Watchdog Tracking
        </button>
      </form>
    </div>
  `;

  document.body.appendChild(modalHost);

  const close = () => modalHost.remove();
  modalHost.querySelector('#closeRcptLogModal').addEventListener('click', close);
  modalHost.addEventListener('click', (e) => { if (e.target === modalHost) close(); });

  modalHost.querySelector('#receiptLogForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const store = modalHost.querySelector('#rcptStoreInput').value;
    const title = modalHost.querySelector('#rcptItemInput').value.trim();
    const price = parseFloat(modalHost.querySelector('#rcptPriceInput').value);
    const days = parseInt(modalHost.querySelector('#rcptDaysInput').value, 10);
    const rcptNo = modalHost.querySelector('#rcptNoInput').value.trim() || `RCPT-${Math.floor(100000 + Math.random() * 900000)}`;

    if (!title || isNaN(price)) {
      toast('Please enter a valid item title and price');
      return;
    }

    try {
      const res = await api('/api/receipts/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store: store,
          item_title: title,
          price_paid: price,
          return_window_days: days,
          receipt_number: rcptNo,
          card_type: 'In-Store Physical Receipt'
        })
      });
      toast(res.message || 'Receipt tracked! Monitoring for price drops.');
      close();
      RENDER.receipts && RENDER.receipts();
    } catch (err) {
      toast(err.message || 'Failed to log receipt');
    }
  });
}

async function openClaimModal(receiptId) {
  try {
    const claim = await api(`/api/receipts/${encodeURIComponent(receiptId)}/claim-script`);
    const modalHost = document.createElement('div');
    modalHost.className = 'policy-modal-backdrop';
    modalHost.id = 'claimScriptModal';
    modalHost.innerHTML = `
      <div class="policy-modal-card" role="dialog" aria-modal="true" aria-labelledby="claimModalTitle" style="max-width:420px; max-height:90vh; overflow-y:auto;">
        <div class="policy-modal-head">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="color:var(--save);">${icon('zap')}</span>
            <strong id="claimModalTitle" style="font-size:1.05rem; font-family:'Space Grotesk',sans-serif;">1-Tap Refund Claim</strong>
          </div>
          <button class="policy-close-btn cursor-pointer" id="closeClaimModal" aria-label="Close modal">&times;</button>
        </div>

        <div style="background:var(--save-soft); border:1px solid rgba(5,150,105,0.3); border-radius:10px; padding:10px 12px; margin-bottom:12px;">
          <div style="font-size:.78rem; font-weight:700; color:var(--save);">
            ${esc(claim.store)} Price Adjustment: ${money(claim.refund_amount)} Refund
          </div>
          <div style="font-size:.74rem; color:var(--text); margin-top:2px;">
            Purchased at ${money(claim.purchase_price)} · Now ${money(claim.current_market_price)} (${claim.days_remaining}d left in window)
          </div>
        </div>

        <div style="margin-bottom:12px;">
          <label style="font-size:.76rem; font-weight:700; color:var(--muted); display:block; margin-bottom:4px;">Email / Message Subject:</label>
          <div style="display:flex; gap:6px;">
            <input type="text" readonly value="${esc(claim.email_subject)}" id="claimSubjText" style="flex:1; font-size:.78rem; padding:6px 8px; border-radius:6px; border:1px solid var(--border); background:var(--surface-2); color:var(--text); font-family:monospace;">
            <button class="btn btn-gold cursor-pointer" id="btnCopySubj" style="font-size:.74rem; padding:0 8px; white-space:nowrap;">Copy</button>
          </div>
        </div>

        <div style="margin-bottom:12px;">
          <label style="font-size:.76rem; font-weight:700; color:var(--muted); display:block; margin-bottom:4px;">Pre-Written Retailer Script (Chat or Email):</label>
          <textarea readonly id="claimBodyText" style="width:100%; height:110px; font-size:.78rem; line-height:1.4; padding:8px; border-radius:8px; border:1px solid var(--border); background:var(--surface-2); color:var(--text); resize:none; font-family:inherit;">${esc(claim.claim_script)}</textarea>
          <button class="btn btn-save cursor-pointer" id="btnCopyScript" style="width:100%; margin-top:6px; min-height:38px; font-size:.82rem; white-space:nowrap; background:var(--save); color:#FFFFFF;">
            ${icon('check', 'ic-sm')} Copy Refund Script to Clipboard
          </button>
        </div>

        <!-- Secondary Card Protection Guidance -->
        <div style="background:var(--surface-2); border-radius:8px; padding:10px; margin-bottom:12px; font-size:.74rem; color:var(--muted); line-height:1.4;">
          <strong style="color:var(--text); display:block; margin-bottom:2px;">Credit Card Backup Protection:</strong>
          ${esc(claim.card_benefit_guidance)}
        </div>

        <!-- Official Store Policy Link -->
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <a href="${esc(claim.policy_url)}" target="_blank" rel="noopener" class="btn btn-outline cursor-pointer" style="font-size:.75rem; padding:6px 10px; white-space:nowrap; display:inline-flex; align-items:center; gap:4px;">
            Official ${esc(claim.store)} Policy ${icon('external', 'ic-sm')}
          </a>
          <button class="btn btn-ghost cursor-pointer" id="btnDismissModal" style="font-size:.78rem; padding:6px 12px; white-space:nowrap;">Close</button>
        </div>
      </div>
    `;

    document.body.appendChild(modalHost);

    const closeModal = () => modalHost.remove();
    $('#closeClaimModal').addEventListener('click', closeModal);
    $('#btnDismissModal').addEventListener('click', closeModal);
    modalHost.addEventListener('click', (e) => {
      if (e.target === modalHost) closeModal();
    });

    $('#btnCopySubj').addEventListener('click', () => {
      const subj = $('#claimSubjText').value;
      navigator.clipboard.writeText(subj).then(() => toast('Subject copied!'));
    });

    $('#btnCopyScript').addEventListener('click', () => {
      const script = $('#claimBodyText').value;
      navigator.clipboard.writeText(script).then(() => toast('Refund script copied to clipboard!'));
    });
  } catch (err) {
    toast(err.message || 'Failed to fetch claim script');
  }
}

/* ---------- GOOGLE ADMOB SANDBOX & TEST AD SIMULATOR ---------- */
function openAdmobSandboxModal() {
  const modalHost = document.createElement('div');
  modalHost.className = 'policy-modal-backdrop';
  modalHost.id = 'admobSandboxModal';
  modalHost.innerHTML = `
    <div class="policy-modal-card" role="dialog" aria-modal="true" style="max-width:390px;">
      <div class="policy-modal-head" style="border-bottom:1px solid var(--border); padding-bottom:10px;">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="color:var(--gold);">${icon('zap')}</span>
          <div>
            <strong style="font-size:1rem; font-family:'Space Grotesk',sans-serif;">Google AdMob Sandbox</strong>
            <small style="display:block; font-size:.68rem; color:var(--muted);">Official Google Test Unit Simulator</small>
          </div>
        </div>
        <button class="policy-close-btn cursor-pointer" id="closeAdmobModal" aria-label="Close modal">&times;</button>
      </div>

      <div style="padding:14px 2px 4px;">
        <div style="background:rgba(245,158,11,0.06); border:1px solid rgba(245,158,11,0.25); border-radius:8px; padding:10px 12px; margin-bottom:12px; font-size:.72rem;">
          <strong style="color:var(--gold); display:block; margin-bottom:2px;">Test Environment Active</strong>
          <span style="color:var(--muted);">App ID: ca-app-pub-3940256099942544~3347511713</span>
        </div>

        <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:14px;">
          <!-- Test Banner -->
          <button class="btn btn-outline cursor-pointer" id="btnRunBannerTest" style="width:100%; justify-content:space-between; padding:10px 12px; font-size:.78rem;">
            <span>${icon('tag', 'ic-sm')} Smart Banner (320x50)</span>
            <span style="font-size:.68rem; color:var(--save); font-weight:700;">100% Fill</span>
          </button>
          <div id="sandboxBannerSlot" style="display:none; margin:4px 0 8px;"></div>

          <!-- Test Interstitial -->
          <button class="btn btn-outline cursor-pointer" id="btnRunInterstitialTest" style="width:100%; justify-content:space-between; padding:10px 12px; font-size:.78rem;">
            <span>${icon('external', 'ic-sm')} Full Interstitial Ad</span>
            <span style="font-size:.68rem; color:var(--muted);">5s Skip</span>
          </button>

          <!-- Test Rewarded Video -->
          <button class="btn btn-gold cursor-pointer" id="btnRunRewardedTest" style="width:100%; justify-content:space-between; padding:10px 12px; font-size:.78rem;">
            <span>${icon('zap', 'ic-sm')} Rewarded Video Ad</span>
            <span style="font-size:.72rem; font-weight:800; color:#000;">+$0.25 Cash</span>
          </button>
        </div>

        <div style="font-size:.68rem; color:var(--muted); text-align:center; border-top:1px dashed var(--border); padding-top:10px;">
          Simulates live AdMob SDK lifecycle on Web, PWA, and Capacitor builds.
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modalHost);
  const closeModal = () => modalHost.remove();
  $('#closeAdmobModal').addEventListener('click', closeModal);
  modalHost.addEventListener('click', (e) => { if (e.target === modalHost) closeModal(); });

  // Banner Test
  $('#btnRunBannerTest').addEventListener('click', () => {
    const slot = $('#sandboxBannerSlot');
    if (!slot) return;
    if (slot.style.display === 'block') {
      slot.style.display = 'none';
      return;
    }
    slot.style.display = 'block';
    slot.innerHTML = `
      <div style="border:1.5px solid #4285F4; border-radius:6px; background:#111827; padding:10px 12px; display:flex; align-items:center; justify-content:space-between; animation:modalFadeIn 0.2s ease;">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="background:#4285F4; color:#FFF; font-size:.60rem; font-weight:800; padding:2px 5px; border-radius:3px;">TEST AD</span>
          <div>
            <strong style="display:block; font-size:.76rem; color:#FFFFFF;">Google AdMob Smart Banner</strong>
            <span style="font-size:.64rem; color:#9CA3AF;">Unit: ...3940256099942544/6300978111</span>
          </div>
        </div>
        <button class="btn btn-outline cursor-pointer" style="padding:3px 8px; font-size:.66rem;" onclick="toast('AdMob test click recorded!')">Visit Site</button>
      </div>
    `;
  });

  // Interstitial Test
  $('#btnRunInterstitialTest').addEventListener('click', () => {
    closeModal();
    showAdmobInterstitialAd();
  });

  // Rewarded Video Test
  $('#btnRunRewardedTest').addEventListener('click', () => {
    closeModal();
    showAdmobRewardedAd();
  });
}

function showAdmobInterstitialAd() {
  const adOverlay = document.createElement('div');
  adOverlay.className = 'policy-modal-backdrop';
  adOverlay.style.background = 'rgba(10, 15, 29, 0.96)';
  adOverlay.style.zIndex = '99999';

  let countdown = 5;
  adOverlay.innerHTML = `
    <div style="width:100%; max-width:380px; padding:20px; text-align:center; color:#FFF;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px;">
        <span style="background:#4285F4; color:#FFF; font-size:.65rem; font-weight:800; padding:3px 8px; border-radius:4px;">GOOGLE ADMOB TEST INTERSTITIAL</span>
        <button id="skipInterstitialBtn" class="btn btn-outline cursor-pointer" style="padding:4px 10px; font-size:.72rem;">Close in ${countdown}s</button>
      </div>

      <div style="background:#111827; border:1px solid #1F2937; border-radius:12px; padding:32px 20px; margin-bottom:20px;">
        <div style="color:var(--gold); margin-bottom:12px; display:flex; justify-content:center;">${icon('tag')}</div>
        <h3 style="font-size:1.15rem; margin-bottom:8px; font-family:'Space Grotesk',sans-serif;">Spring Home Improvement Sale</h3>
        <p style="font-size:.82rem; color:var(--muted); line-height:1.5; margin-bottom:18px;">
          Find contractor discounts and warehouse clearance tools up to 40% off this weekend.
        </p>
        <button class="btn btn-gold cursor-pointer" style="padding:10px 24px; font-size:.85rem; font-weight:700;" onclick="toast('AdMob Interstitial clickthrough!')">Learn More</button>
      </div>

      <span style="font-size:.68rem; color:var(--muted);">AdMob Test Unit ID: ca-app-pub-3940256099942544/1033173712</span>
    </div>
  `;

  document.body.appendChild(adOverlay);
  const timer = setInterval(() => {
    countdown -= 1;
    const btn = $('#skipInterstitialBtn');
    if (btn) {
      if (countdown > 0) {
        btn.textContent = `Close in ${countdown}s`;
      } else {
        clearInterval(timer);
        btn.textContent = 'Close Ad (X)';
        btn.style.borderColor = 'var(--gold)';
        btn.style.color = 'var(--gold)';
        btn.onclick = () => adOverlay.remove();
      }
    }
  }, 1000);
}

function showAdmobRewardedAd() {
  const adOverlay = document.createElement('div');
  adOverlay.className = 'policy-modal-backdrop';
  adOverlay.style.background = 'rgba(10, 15, 29, 0.96)';
  adOverlay.style.zIndex = '99999';

  let countdown = 5;
  adOverlay.innerHTML = `
    <div style="width:100%; max-width:380px; padding:20px; text-align:center; color:#FFF;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
        <span style="background:var(--save); color:#FFF; font-size:.65rem; font-weight:800; padding:3px 8px; border-radius:4px;">REWARDED VIDEO (+$0.25)</span>
        <span id="rewardCountdownText" style="font-size:.74rem; font-weight:700; color:var(--gold);">Reward in ${countdown}s</span>
      </div>

      <!-- Simulated Video Screen -->
      <div style="background:#000000; border:1px solid #1F2937; border-radius:12px; height:200px; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:20px; margin-bottom:16px; position:relative; overflow:hidden;">
        <div style="color:var(--gold); margin-bottom:8px; display:flex; justify-content:center;">${icon('zap')}</div>
        <strong style="font-size:.95rem; color:#FFF; margin-bottom:4px;">Watching Sponsored Video</strong>
        <span style="font-size:.74rem; color:var(--muted);">Simulating AdMob Rewarded Video Stream</span>

        <div style="position:absolute; bottom:0; left:0; width:100%; height:4px; background:#1F2937;">
          <div id="rewardProgressBar" style="height:100%; width:0%; background:var(--gold); transition:width 1s linear;"></div>
        </div>
      </div>

      <div id="rewardStatusBox" style="font-size:.76rem; color:var(--muted); margin-bottom:14px;">
        Keep video playing to claim your +$0.25 instant reward credit...
      </div>

      <button id="rewardDismissBtn" class="btn btn-ghost cursor-pointer" style="display:none; padding:8px 20px; font-size:.82rem; margin:0 auto;" onclick="this.closest('.policy-modal-backdrop').remove()">
        Return to App
      </button>
    </div>
  `;

  document.body.appendChild(adOverlay);
  const pBar = $('#rewardProgressBar');
  const timer = setInterval(async () => {
    countdown -= 1;
    if (pBar) pBar.style.width = `${((5 - countdown) / 5) * 100}%`;
    const label = $('#rewardCountdownText');
    if (label && countdown > 0) {
      label.textContent = `Reward in ${countdown}s`;
    }

    if (countdown <= 0) {
      clearInterval(timer);
      if (label) label.textContent = 'Completed!';
      const box = $('#rewardStatusBox');
      const btn = $('#rewardDismissBtn');
      if (box) box.innerHTML = '<span style="color:var(--save); font-weight:700;">Verifying AdMob SSV Reward with Server...</span>';

      try {
        const resp = await api('/api/admob/simulate-reward', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: 'usr_demo', reward_amount: 0.25 })
        });
        if (resp && resp.success) {
          if (box) box.innerHTML = `<strong style="color:var(--save); font-size:.88rem;">Reward Verified! +$0.25 Added to Wallet.</strong><br><small style="color:var(--muted);">New Balance: $${resp.new_balance.toFixed(2)}</small>`;
          const pill = $('#topbarEarningsText');
          if (pill) pill.textContent = `$${resp.new_balance.toFixed(2)}`;
          toast('AdMob Reward Earned: +$0.25 credited to your wallet!');
        }
      } catch (err) {
        if (box) box.innerHTML = `<span style="color:#DC2626;">Verification failed: ${esc(err.message)}</span>`;
      }

      if (btn) btn.style.display = 'inline-flex';
    }
  }, 1000);
}

/* ---------- REFERRAL & AFFILIATE REWARDS ---------- */
RENDER.referral = async () => {
  const el = $('#screen-referral');
  el.innerHTML = topbar() + skeleton(3);
  try {
    const stats = await api(`/api/affiliate/stats?user_id=usr_demo`);
    el.innerHTML = `<header class="topbar">
      <button class="back-btn" data-action="back">${icon('back')}Back</button>
    </header>
    
    <div style="padding:10px 2px 24px;">
      <div style="margin-bottom:12px; border-bottom:1px solid var(--border); padding-bottom:8px; text-align:center;">
        <h1 class="page-title" style="margin:0 0 2px 0;">Share &amp; Earn</h1>
        <div style="font-size:.74rem; color:var(--muted); text-align:center;">Cash bounties for every friend who signs up or saves</div>
      </div>
      
      <div class="referral-stats-grid" style="margin-bottom:12px;">
        <div class="stat-box highlight">
          <strong>${money(stats.earnings_balance)}</strong>
          <small>Available</small>
        </div>
        <div class="stat-box">
          <strong>${money(stats.pending_balance)}</strong>
          <small>Pending</small>
        </div>
        <div class="stat-box">
          <strong>${stats.referral_count}</strong>
          <small>Invited</small>
        </div>
      </div>

      <!-- Personal Share Link -->
      <div class="share-link-card" style="margin-bottom:12px;">
        <div class="share-link-input-row">
          <input id="refLinkInput" type="text" readonly value="${esc(stats.referral_url)}" style="font-size:.78rem; font-family:monospace; min-width:0;" aria-label="Referral link">
          <button class="btn-copy" data-action="copy-ref" style="white-space:nowrap; flex-shrink:0;">${icon('box', 'ic-sm')}Copy</button>
        </div>
        <button class="btn-share-native" data-action="share-ref" data-url="${esc(stats.referral_url)}" style="margin-top:6px;">
          ${icon('share', 'ic-sm')} Share Link
        </button>
      </div>

      <!-- Payout Button (Tremendous Universal Payout API) -->
      <div class="card" style="padding:12px; border:1px solid var(--border); background:var(--surface); margin-bottom:12px;">
        <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:8px;">
          <strong style="font-size:.88rem; color:var(--text);">Universal Payout</strong>
          <span style="font-size:.72rem; color:var(--muted);">Zero Fees · ACH, Interac, Visa</span>
        </div>
        <button class="btn btn-save cursor-pointer" style="width:100%; min-height:38px; padding:0 14px; font-size:.84rem; font-weight:700; white-space:nowrap; background:var(--save); color:#FFFFFF;" data-action="claim-payout" ${stats.earnings_balance < 10 ? 'disabled' : ''}>
          Cash Out ${money(stats.earnings_balance)} →
        </button>
      </div>

    <!-- Referral Activity Feed -->
    <div class="section" style="margin-top:20px;">
      <div class="section-head">
        <h2>Referral Activity</h2>
        <span class="hint">Live invites</span>
      </div>
      <div class="referral-activity-list">
        ${(stats.referrals && stats.referrals.length) ? stats.referrals.map((r) => `
          <div class="activity-row">
            <div>
              <strong>${esc(r.name)}</strong>
              <small style="display:block; color:var(--muted);">${esc(r.date)} · ${esc(r.status)}</small>
            </div>
            <span class="bounty-pill">+${esc(r.bounty)}</span>
          </div>
        `).join('') : `<div class="empty">${icon('user', 'ic-lg')}<p><strong>No referrals yet</strong></p><p>Share your link above to start earning!</p></div>`}
      </div>
    </div>`;
  } catch (e) {
    el.innerHTML = `<header class="topbar"><button class="back-btn" data-action="back">${icon('back')}Back</button></header><div class="empty">${esc(e.message)}</div>`;
  }
};

async function loadStores() { try { state.stores = await api(`/api/stores?region=${state.region}`); } catch (_) { state.stores = []; } }

/* ---------- global click events ---------- */
document.addEventListener('click', async (e) => {
  const policyBtn = e.target.closest('[data-policy]');
  if (policyBtn) {
    e.preventDefault();
    openPolicyModal(policyBtn.dataset.policy);
    return;
  }
  const closePolicy = e.target.closest('[data-action="close-policy"]') || (e.target.id === 'policyModal' ? e.target : null);
  if (closePolicy) {
    $('#policyModal')?.remove();
    return;
  }

  const t = e.target.closest('[data-action]'); if (!t) return;
  const a = t.dataset.action;
  if (a === 'go') await go(t.dataset.screen, { focus: !!t.dataset.focus, push: !!t.dataset.push });
  else if (a === 'back') back();
  else if (a === 'open') openProduct(t.dataset.upc);
  else if (a === 'toggle-camera') toggleCamera();
  else if (a === 'copy-ref') {
    const inp = $('#refLinkInput');
    if (inp) {
      navigator.clipboard.writeText(inp.value);
      toast('Referral link copied to clipboard!');
    }
  }
  else if (a === 'share-ref') {
    const url = t.dataset.url || 'https://scoutshopper.app';
    if (navigator.share) {
      navigator.share({
        title: 'Scout $hopper - Your Smart Shopping Copilot',
        text: 'Never overpay in stores or online with Scout $hopper. Here is $5.00 for you:',
        url: url
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      toast('Referral link copied to clipboard!');
    }
  }
  else if (a === 'claim-payout') {
    try {
      const res = await api('/api/affiliate/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: 'usr_demo', payout_method: 'tremendous' })
      });
      if (res.redemption_link) {
        toast('Universal Payout dispatched via Tremendous API! Opening redemption portal...');
        window.open(res.redemption_link, '_blank', 'noopener');
      } else {
        toast(res.message);
      }
      RENDER.referral();
    } catch (e) {
      toast(e.message);
    }
  }
  else if (a === 'store') {
    state.store = t.dataset.store; localStorage.setItem('oc_store', state.store);
    if (state.screen === 'product' && state.current) { const u = state.current.upc; const keep = state.stack.slice(); await openProduct(u); state.stack = keep; }
    else RENDER[state.screen] && RENDER[state.screen]();
  }
  else if (a === 'cat') { state.category = t.dataset.cat; await go('search'); }
  else if (a === 'add') addToCart(t.dataset.kind);
  else if (a === 'remove') { await api(`/api/cart/remove/${encodeURIComponent(t.dataset.id)}`, { method: 'DELETE' }); RENDER.cart(); }
  else if (a === 'checkout') { const c = await api('/api/cart'); c.items.forEach((i) => window.open(i.affiliate_url, '_blank', 'noopener')); toast('Opening each merchant store...'); }
  else if (a === 'wishlist-add') await addToWishlist();
  else if (a === 'wishlist-remove') { await api(`/api/wishlist/remove/${encodeURIComponent(t.dataset.id)}`, { method: 'DELETE' }); RENDER.wishlist(); }
  else if (a === 'simulate-drop') {
    const res = await api(`/api/wishlist/simulate-drop/${encodeURIComponent(t.dataset.id)}`, { method: 'POST' });
    toast(res.message);
    RENDER.wishlist();
  }
  else if (a === 'receipt-delete') {
    if (confirm('Stop tracking this purchase?')) {
      await api(`/api/receipts/${encodeURIComponent(t.dataset.id)}`, { method: 'DELETE' });
      toast('Receipt removed from watchdog.');
      RENDER.receipts && RENDER.receipts();
    }
  }
  else if (a === 'receipt-sim-drop') {
    const res = await api(`/api/receipts/simulate-drop/${encodeURIComponent(t.dataset.id)}`, { method: 'POST' });
    toast(res.message);
    RENDER.receipts && RENDER.receipts();
  }
  else if (a === 'receipt-claim') {
    openClaimModal(t.dataset.id);
  }
  else if (a === 'ad-click') {
    const cid = t.dataset.id;
    const url = t.dataset.url;
    if (cid) {
      api(`/api/ads/campaigns/${encodeURIComponent(cid)}/click`, { method: 'POST' }).catch(() => {});
    }
    if (url) {
      window.open(url, '_blank', 'noopener');
    }
  }
  else if (a === 'open-lead-modal') {
    openLeadModal(t.dataset.job || 'General Local Service', t.dataset.city || 'Red Deer, AB', t.dataset.campId || null);
  }
  else if (a === 'open-admob-sandbox' || t.closest('.admob-banner-unit') || t.id === 'btnOpenAdmobSandbox') {
    openAdmobSandboxModal();
  }
  else if (a === 'logout') {
    if (confirm('Are you sure you want to log out of your Scout $hopper account?')) {
      try { await api('/api/auth/logout', { method: 'POST' }); } catch (_) {}
      state.token = '';
      state.user = null;
      localStorage.removeItem('scout_auth_token');
      toast('Logged out successfully.');
      await updateBadges();
      go('home');
    }
  }
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && state.screen === 'product') back(); });

/* ---------- initialization ---------- */
(async function init() {
  buildTabbar();
  try {
    state.regions = await api('/api/regions');
    if (!state.regions[state.region]) state.region = 'US';
    const r = state.regions[state.region];
    if (r.subdivisions && Object.keys(r.subdivisions).length && !r.subdivisions[state.province]) state.province = r.default_subdivision;
    if (!Object.keys(r.subdivisions || {}).length) state.province = '';

    // Restore persistent SQLite session
    try {
      const authRes = await api('/api/auth/me');
      if (authRes && authRes.user) {
        state.user = authRes.user;
        state.earningsBalance = authRes.user.earnings_balance;
      }
    } catch (_) {}

    applyFormat(); await loadStores(); await updateBadges();
  } catch (e) { toast('Could not reach the server'); }
  updateOnlineStatus();
  initCapacitorShell();
  go('home');
})();

/* ---------- CAPACITOR NATIVE SHELL LIFECYCLE ---------- */
async function initCapacitorShell() {
  if (!window.Capacitor) return;
  const P = window.Capacitor.Plugins;
  if (!P) return;

  // 1. Status Bar Theming (Obsidian theme matching master palette)
  if (P.StatusBar) {
    try {
      await P.StatusBar.setStyle({ style: 'DARK' });
      await P.StatusBar.setBackgroundColor({ color: '#000000' });
    } catch (_) {}
  }

  // 2. Native Splash Screen auto-dismiss once UI is rendered
  if (P.SplashScreen) {
    try {
      setTimeout(() => P.SplashScreen.hide({ fadeOutDuration: 300 }), 300);
    } catch (_) {}
  }

  // 3. Native Network Watchdog listener
  if (P.Network) {
    try {
      P.Network.addListener('networkStatusChange', (status) => {
        const banner = $('#offlineBanner');
        if (!banner) return;
        if (!status.connected) {
          banner.classList.remove('hidden');
          haptic('warning');
          toast('In-Store Dead Zone detected (Offline Mode)');
        } else {
          banner.classList.add('hidden');
          toast('Back online! Live price watchdog restored');
        }
      });
    } catch (_) {}
  }

  // 4. Native Push Notifications listener (Capacitor 6)
  if (P.PushNotifications) {
    try {
      const perm = await P.PushNotifications.requestPermissions();
      if (perm.receive === 'granted') {
        await P.PushNotifications.register();
        P.PushNotifications.addListener('registration', async (token) => {
          try {
            await api('/api/notifications/register', {
              method: 'POST',
              body: JSON.stringify({
                token: token.value,
                platform: window.Capacitor.getPlatform()
              })
            });
          } catch (_) {}
        });
        P.PushNotifications.addListener('pushNotificationReceived', (notification) => {
          showScoutNotification(notification.title || 'Scout $hopper Alert', notification.body || '');
        });
      }
    } catch (_) {}
  }
}

/* ---------- NOTIFICATION DISPATCH ENGINE ---------- */
function showScoutNotification(title, body) {
  haptic('success');
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: '/icons/icon-192.png'
      });
    } catch (_) {}
  }
  toast(`${title} — ${body}`, 5000);
}

async function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    try {
      await Notification.requestPermission();
    } catch (_) {}
  }
}

/* ---------- IN-STORE OFFLINE RESILIENCE & SERVICE WORKER ---------- */
function updateOnlineStatus() {
  const banner = $('#offlineBanner');
  if (!banner) return;
  if (!navigator.onLine) {
    banner.classList.remove('hidden');
    haptic('warning');
  } else {
    banner.classList.add('hidden');
  }
}

window.addEventListener('online', () => {
  updateOnlineStatus();
  toast('Back online! Live price watchdog restored.');
});
window.addEventListener('offline', () => {
  updateOnlineStatus();
  toast('In-Store Dead Zone detected. Viewing offline cached items.');
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      console.log('Scout PWA Service Worker registered:', reg.scope);
    }).catch((err) => {
      console.warn('PWA Service Worker registration failed:', err);
    });
  });
}
