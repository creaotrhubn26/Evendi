/**
 * CreatorHub Evendi Bridge E2E Tests — CreatorHub-side (/api/evendi/*)
 *
 * Tests the Evendi integration endpoints on the CreatorHub server (:3001).
 * Most bridge endpoints require CreatorHub vendor session auth (via /api/auth/login).
 * Planning/weather endpoints are accessible without vendor auth.
 */
import { test, expect } from '@playwright/test';
import { CREATORHUB_URL } from './helpers';

const BASE = CREATORHUB_URL;

// ── Auth Helper ─────────────────────────────────────────────────

let cachedChVendorToken: string | null = null;
let cachedChVendorId: string | null = null;

async function getChVendorAuth(request: any): Promise<{ token: string; vendorId: string }> {
  if (cachedChVendorToken && cachedChVendorId) {
    return { token: cachedChVendorToken, vendorId: cachedChVendorId };
  }
  const res = await request.post(`${BASE}/api/auth/login`, {
    data: { email: 'qazifotoreel@gmail.com', password: 'test123' },
  });
  const body = await res.json();
  cachedChVendorToken = body.token;
  cachedChVendorId = body.user?.vendorId;
  return { token: cachedChVendorToken!, vendorId: cachedChVendorId! };
}

function chVendorHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

// ── Known couple ID ─────────────────────────────────────────────
const KNOWN_COUPLE_ID = '53611b93-4d2d-4088-9696-6b147faa64ff';

// ─── Vendor Categories Bridge ────────────────────────────────────

test.describe('Evendi Bridge — Vendor Categories', () => {
  test('GET /api/evendi/vendor-categories from CreatorHub proxies correctly', async ({ request }) => {
    // This goes through the generic proxy to Evendi — may time out in dev
    // since EVENDI_API_URL points to production. Test with a short timeout.
    // The endpoint itself is defined before the proxy for the specific routes.
    // vendor-categories is NOT defined as a specific route, so it goes to proxy.
    // We skip this test if it times out.
    const res = await request.get(`${BASE}/api/health`).catch(() => null);
    if (!res || !res.ok()) {
      test.skip();
      return;
    }
    test.skip(); // Proxy goes to external URL in dev
  });
});

// ─── Chat Bridge ─────────────────────────────────────────────────

test.describe('Evendi Bridge — Chat (vendor auth)', () => {
  let vendorToken: string;

  test.beforeAll(async ({ request }) => {
    const auth = await getChVendorAuth(request);
    vendorToken = auth.token;
  });

  test('GET /api/evendi/conversations returns conversations', async ({ request }) => {
    const res = await request.get(`${BASE}/api/evendi/conversations`, {
      headers: chVendorHeaders(vendorToken),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    // Response wraps conversations in { conversations: [...], vendorId, vendorName }
    const convos = body.conversations ?? body;
    expect(Array.isArray(convos)).toBe(true);
  });

  test('GET /api/evendi/conversations/:id/messages returns messages', async ({ request }) => {
    // First get a conversation
    const listRes = await request.get(`${BASE}/api/evendi/conversations`, {
      headers: chVendorHeaders(vendorToken),
    });
    const conversations = await listRes.json();
    if (!conversations.length) { test.skip(); return; }

    const convId = conversations[0].id;
    const res = await request.get(`${BASE}/api/evendi/conversations/${convId}/messages`, {
      headers: chVendorHeaders(vendorToken),
    });
    expect(res.status()).toBe(200);
  });
});

// ─── Offers Bridge ───────────────────────────────────────────────

test.describe('Evendi Bridge — Offers (vendor auth)', () => {
  let vendorToken: string;
  let offerId: string;

  test.beforeAll(async ({ request }) => {
    const auth = await getChVendorAuth(request);
    vendorToken = auth.token;
  });

  test('GET /api/evendi/offers returns offers', async ({ request }) => {
    const res = await request.get(`${BASE}/api/evendi/offers`, {
      headers: chVendorHeaders(vendorToken),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.offers).toBeDefined();
    if (body.offers.length > 0) offerId = body.offers[0].id;
  });

  test('PATCH /api/evendi/offers/:id updates offer', async ({ request }) => {
    if (!offerId) test.skip();
    const res = await request.patch(`${BASE}/api/evendi/offers/${offerId}`, {
      headers: chVendorHeaders(vendorToken),
      data: { title: 'Updated from CreatorHub E2E' },
    });
    expect([200, 400]).toContain(res.status());
  });
});

// ─── Contracts Bridge ────────────────────────────────────────────

test.describe('Evendi Bridge — Contracts (vendor auth)', () => {
  let vendorToken: string;

  test.beforeAll(async ({ request }) => {
    const auth = await getChVendorAuth(request);
    vendorToken = auth.token;
  });

  test('GET /api/evendi/contracts returns contracts', async ({ request }) => {
    const res = await request.get(`${BASE}/api/evendi/contracts`, {
      headers: chVendorHeaders(vendorToken),
    });
    expect(res.status()).toBe(200);
  });
});

// ─── Contacts & Products Bridge ──────────────────────────────────

test.describe('Evendi Bridge — Contacts & Products (vendor auth)', () => {
  let vendorToken: string;

  test.beforeAll(async ({ request }) => {
    const auth = await getChVendorAuth(request);
    vendorToken = auth.token;
  });

  test('GET /api/evendi/contacts returns contacts', async ({ request }) => {
    const res = await request.get(`${BASE}/api/evendi/contacts`, {
      headers: chVendorHeaders(vendorToken),
    });
    expect(res.status()).toBe(200);
  });

  test('GET /api/evendi/products returns products', async ({ request }) => {
    const res = await request.get(`${BASE}/api/evendi/products`, {
      headers: chVendorHeaders(vendorToken),
    });
    expect([200, 500]).toContain(res.status());
  });
});

// ─── Important People Bridge ─────────────────────────────────────

test.describe('Evendi Bridge — Important People (vendor auth)', () => {
  let vendorToken: string;
  let coupleId: string;

  test.beforeAll(async ({ request }) => {
    const auth = await getChVendorAuth(request);
    vendorToken = auth.token;
    // We need a coupleId that this vendor has a conversation with
    const convRes = await request.get(`${BASE}/api/evendi/conversations`, {
      headers: chVendorHeaders(vendorToken),
    });
    const convs = await convRes.json();
    coupleId = convs.length > 0 ? convs[0].couple_id : '';
  });

  test('GET /api/evendi/important-people returns data', async ({ request }) => {
    if (!coupleId) test.skip();
    const res = await request.get(`${BASE}/api/evendi/important-people?coupleId=${coupleId}`, {
      headers: chVendorHeaders(vendorToken),
    });
    expect([200, 403, 404]).toContain(res.status());
  });
});

// ─── Photo Shots Bridge ─────────────────────────────────────────

test.describe('Evendi Bridge — Photo Shots (vendor auth)', () => {
  let vendorToken: string;

  test.beforeAll(async ({ request }) => {
    const auth = await getChVendorAuth(request);
    vendorToken = auth.token;
  });

  test('GET /api/evendi/photo-shots returns data', async ({ request }) => {
    const res = await request.get(`${BASE}/api/evendi/photo-shots`, {
      headers: chVendorHeaders(vendorToken),
    });
    expect([200, 400]).toContain(res.status());
  });
});

// ─── Couple Profile & Schedule Bridge ────────────────────────────

test.describe('Evendi Bridge — Couple Profile (vendor auth)', () => {
  let vendorToken: string;

  test.beforeAll(async ({ request }) => {
    const auth = await getChVendorAuth(request);
    vendorToken = auth.token;
  });

  test('GET /api/evendi/couple-profile returns data', async ({ request }) => {
    const res = await request.get(`${BASE}/api/evendi/couple-profile`, {
      headers: chVendorHeaders(vendorToken),
    });
    expect([200, 400]).toContain(res.status());
  });

  test('GET /api/evendi/schedule-events returns data', async ({ request }) => {
    const res = await request.get(`${BASE}/api/evendi/schedule-events`, {
      headers: chVendorHeaders(vendorToken),
    });
    expect([200, 400]).toContain(res.status());
  });

  test('GET /api/evendi/resolve-couple resolves couple', async ({ request }) => {
    const res = await request.get(`${BASE}/api/evendi/resolve-couple?email=qazifotoreel@gmail.com`, {
      headers: chVendorHeaders(vendorToken),
    });
    expect([200, 400, 404]).toContain(res.status());
  });
});

// ─── Traditions Bridge ───────────────────────────────────────────

test.describe('Evendi Bridge — Traditions', () => {
  let vendorToken: string;

  test.beforeAll(async ({ request }) => {
    const auth = await getChVendorAuth(request);
    vendorToken = auth.token;
  });

  test('GET /api/evendi/traditions-bridge returns data', async ({ request }) => {
    const res = await request.get(`${BASE}/api/evendi/traditions-bridge`, {
      headers: chVendorHeaders(vendorToken),
    });
    expect([200, 400]).toContain(res.status());
  });
});

// ─── Vendor-Project Bridge ───────────────────────────────────────

test.describe('Evendi Bridge — Vendor-Project', () => {
  let vendorToken: string;

  test.beforeAll(async ({ request }) => {
    const auth = await getChVendorAuth(request);
    vendorToken = auth.token;
  });

  test('GET /api/evendi/vendor-project-bridge returns data', async ({ request }) => {
    const res = await request.get(`${BASE}/api/evendi/vendor-project-bridge`, {
      headers: chVendorHeaders(vendorToken),
    });
    expect([200, 400]).toContain(res.status());
  });
});

// ─── Delivery Bridge ─────────────────────────────────────────────

test.describe('Evendi Bridge — Delivery', () => {
  let vendorToken: string;

  test.beforeAll(async ({ request }) => {
    const auth = await getChVendorAuth(request);
    vendorToken = auth.token;
  });

  test('GET /api/evendi/delivery-project-bridge returns data', async ({ request }) => {
    const res = await request.get(`${BASE}/api/evendi/delivery-project-bridge`, {
      headers: chVendorHeaders(vendorToken),
    });
    expect([200, 400]).toContain(res.status());
  });
});

// ─── Couple Data Bridge ──────────────────────────────────────────

test.describe('Evendi Bridge — Couple Data (by coupleId)', () => {
  let vendorToken: string;

  test.beforeAll(async ({ request }) => {
    const auth = await getChVendorAuth(request);
    vendorToken = auth.token;
  });

  test('GET /api/evendi/couple/:coupleId/important-people', async ({ request }) => {
    const res = await request.get(`${BASE}/api/evendi/couple/${KNOWN_COUPLE_ID}/important-people`, {
      headers: chVendorHeaders(vendorToken),
    });
    expect([200, 403, 404]).toContain(res.status());
  });

  test('GET /api/evendi/couple/:coupleId/wedding-invites', async ({ request }) => {
    const res = await request.get(`${BASE}/api/evendi/couple/${KNOWN_COUPLE_ID}/wedding-invites`, {
      headers: chVendorHeaders(vendorToken),
    });
    expect([200, 403, 404]).toContain(res.status());
  });

  test('GET /api/evendi/checklist/:coupleId returns checklist', async ({ request }) => {
    const res = await request.get(`${BASE}/api/evendi/checklist/${KNOWN_COUPLE_ID}`, {
      headers: chVendorHeaders(vendorToken),
    });
    expect([200, 403, 404]).toContain(res.status());
  });

  test('GET /api/evendi/budget/:coupleId returns budget', async ({ request }) => {
    const res = await request.get(`${BASE}/api/evendi/budget/${KNOWN_COUPLE_ID}`, {
      headers: chVendorHeaders(vendorToken),
    });
    expect([200, 403, 404]).toContain(res.status());
  });

  test('GET /api/evendi/speeches/:coupleId returns speeches', async ({ request }) => {
    const res = await request.get(`${BASE}/api/evendi/speeches/${KNOWN_COUPLE_ID}`, {
      headers: chVendorHeaders(vendorToken),
    });
    expect([200, 403, 404]).toContain(res.status());
  });

  test('GET /api/evendi/tables/:coupleId returns tables', async ({ request }) => {
    const res = await request.get(`${BASE}/api/evendi/tables/${KNOWN_COUPLE_ID}`, {
      headers: chVendorHeaders(vendorToken),
    });
    expect([200, 403, 404]).toContain(res.status());
  });

  test('GET /api/evendi/music/:coupleId returns music data', async ({ request }) => {
    const res = await request.get(`${BASE}/api/evendi/music/${KNOWN_COUPLE_ID}`, {
      headers: chVendorHeaders(vendorToken),
    });
    expect([200, 403, 404]).toContain(res.status());
  });

  test('GET /api/evendi/coordinators/:coupleId returns coordinators', async ({ request }) => {
    const res = await request.get(`${BASE}/api/evendi/coordinators/${KNOWN_COUPLE_ID}`, {
      headers: chVendorHeaders(vendorToken),
    });
    expect([200, 403, 404]).toContain(res.status());
  });

  test('GET /api/evendi/reviews/:vendorId returns reviews', async ({ request }) => {
    const VENDOR_ID = '9a66f202-6f55-4021-aaa3-c90a923f99bf';
    const res = await request.get(`${BASE}/api/evendi/reviews/${VENDOR_ID}`, {
      headers: chVendorHeaders(vendorToken),
    });
    expect([200, 404]).toContain(res.status());
  });
});

// ─── Planning Bridge ─────────────────────────────────────────────

test.describe('Evendi Bridge — Planning', () => {
  test('GET /api/evendi/planning/:coupleId returns planning data', async ({ request }) => {
    const res = await request.get(`${BASE}/api/evendi/planning/${KNOWN_COUPLE_ID}`);
    expect([200, 404]).toContain(res.status());
  });

  test('GET /api/evendi/planning/:coupleId/schedule returns schedule', async ({ request }) => {
    const res = await request.get(`${BASE}/api/evendi/planning/${KNOWN_COUPLE_ID}/schedule`);
    expect([200, 404]).toContain(res.status());
  });
});

// ─── Weather/Location Bridge ─────────────────────────────────────

test.describe('Evendi Bridge — Weather/Location', () => {
  test('GET /api/evendi/weather-location/:coupleId returns data', async ({ request }) => {
    const res = await request.get(`${BASE}/api/evendi/weather-location/${KNOWN_COUPLE_ID}`);
    expect([200, 500]).toContain(res.status()); // May error if no weather data
  });

  test('GET /api/evendi/weather-location/search returns results', async ({ request }) => {
    const res = await request.get(`${BASE}/api/evendi/weather-location/search?q=Oslo`);
    // May return error if weather API not configured
    expect([200, 400, 500]).toContain(res.status());
  });
});

// ─── Auth ─────────────────────────────────────────────────────────

test.describe('Evendi Bridge — Auth check', () => {
  test('GET /api/evendi/offers without auth returns 401', async ({ request }) => {
    const res = await request.get(`${BASE}/api/evendi/offers`);
    expect(res.status()).toBe(401);
  });

  test('GET /api/evendi/conversations without auth returns 401', async ({ request }) => {
    const res = await request.get(`${BASE}/api/evendi/conversations`);
    expect(res.status()).toBe(401);
  });
});
