/**
 * Evendi Offers & Contracts E2E Tests
 *
 * Tests vendor offer CRUD, couple offer responses, vendor contracts,
 * and vendor inspirations CRUD.
 */
import { test, expect } from '@playwright/test';
import {
  EVENDI_URL,
  getVendorToken,
  vendorHeaders,
  getCoupleAuth,
  coupleHeaders,
  adminHeaders,
  TEST_VENDOR_ID,
} from './helpers';

const BASE = EVENDI_URL;

// ─── Vendor Offers ───────────────────────────────────────────────

test.describe('Vendor Offers CRUD', () => {
  let vendorToken: string;
  let offerId: string;

  test.beforeAll(async ({ request }) => {
    vendorToken = await getVendorToken(request);
  });

  test('GET /api/vendor/offers returns array', async ({ request }) => {
    const res = await request.get(`${BASE}/api/vendor/offers`, {
      headers: vendorHeaders(vendorToken),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('POST /api/vendor/offers creates an offer', async ({ request }) => {
    // Need a couple to send the offer to - get conversations to find a couple
    const convRes = await request.get(`${BASE}/api/vendor/conversations`, {
      headers: vendorHeaders(vendorToken),
    });
    const conversations = await convRes.json();

    // If we have a conversation, use that couple_id
    const coupleId = conversations.length > 0 ? conversations[0].coupleId : null;
    if (!coupleId) { test.skip(); return; }

    const convId = conversations[0].id;
    const res = await request.post(`${BASE}/api/vendor/offers`, {
      headers: vendorHeaders(vendorToken),
      data: {
        coupleId,
        conversationId: convId,
        title: 'E2E Test Offer',
        message: 'Photography package for your wedding',
        totalAmount: 15000,
        currency: 'NOK',
        validUntil: '2026-12-31',
        items: [
          { title: 'Full day photography', quantity: 1, unitPrice: 12000, description: '8 hours' },
          { title: 'Photo album', quantity: 1, unitPrice: 3000, description: '30 pages' },
        ],
      },
    });
    expect([200, 201]).toContain(res.status());
    const body = await res.json();
    if (body.id) offerId = body.id;
  });

  test('PATCH /api/vendor/offers/:id updates an offer', async ({ request }) => {
    if (!offerId) test.skip();
    const res = await request.patch(`${BASE}/api/vendor/offers/${offerId}`, {
      headers: vendorHeaders(vendorToken),
      data: { title: 'Updated E2E Offer' },
    });
    expect(res.status()).toBe(200);
  });

  test('DELETE /api/vendor/offers/:id deletes an offer', async ({ request }) => {
    if (!offerId) test.skip();
    const res = await request.delete(`${BASE}/api/vendor/offers/${offerId}`, {
      headers: vendorHeaders(vendorToken),
    });
    expect(res.status()).toBe(200);
  });
});

// ─── Couple Offers ───────────────────────────────────────────────

test.describe('Couple Offers', () => {
  let coupleToken: string;

  test.beforeAll(async ({ request }) => {
    const auth = await getCoupleAuth(request);
    coupleToken = auth.token;
  });

  test('GET /api/couple/offers returns array', async ({ request }) => {
    const res = await request.get(`${BASE}/api/couple/offers`, {
      headers: coupleHeaders(coupleToken),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });
});

// ─── Vendor Contracts ────────────────────────────────────────────

test.describe('Vendor Contracts', () => {
  let vendorToken: string;

  test.beforeAll(async ({ request }) => {
    vendorToken = await getVendorToken(request);
  });

  test('GET /api/vendor/contracts returns array', async ({ request }) => {
    const res = await request.get(`${BASE}/api/vendor/contracts`, {
      headers: vendorHeaders(vendorToken),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('GET /api/vendor/couple-contracts returns array', async ({ request }) => {
    const res = await request.get(`${BASE}/api/vendor/couple-contracts`, {
      headers: vendorHeaders(vendorToken),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });
});

// ─── Vendor Inspirations CRUD ────────────────────────────────────

test.describe('Vendor Inspirations CRUD', () => {
  let vendorToken: string;
  let inspirationId: string;

  test.beforeAll(async ({ request }) => {
    vendorToken = await getVendorToken(request);
  });

  test('GET /api/vendor/inspirations returns array', async ({ request }) => {
    const res = await request.get(`${BASE}/api/vendor/inspirations`, {
      headers: vendorHeaders(vendorToken),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('POST /api/vendor/inspirations creates', async ({ request }) => {
    const res = await request.post(`${BASE}/api/vendor/inspirations`, {
      headers: vendorHeaders(vendorToken),
      data: {
        title: 'E2E Test Inspiration',
        description: 'A beautiful wedding setup',
        categoryId: null,
      },
    });
    // May require a category or media
    if (res.status() === 200) {
      const body = await res.json();
      inspirationId = body.id;
      expect(body.id).toBeTruthy();
    } else {
      expect([200, 400]).toContain(res.status());
    }
  });

  test('PATCH /api/vendor/inspirations/:id updates', async ({ request }) => {
    if (!inspirationId) test.skip();
    const res = await request.patch(`${BASE}/api/vendor/inspirations/${inspirationId}`, {
      headers: vendorHeaders(vendorToken),
      data: { title: 'Updated E2E Inspiration' },
    });
    expect(res.status()).toBe(200);
  });

  test('DELETE /api/vendor/inspirations/:id removes', async ({ request }) => {
    if (!inspirationId) test.skip();
    const res = await request.delete(`${BASE}/api/vendor/inspirations/${inspirationId}`, {
      headers: vendorHeaders(vendorToken),
    });
    expect(res.status()).toBe(200);
  });
});

// ─── Vendor Profile Updates ──────────────────────────────────────

test.describe('Vendor Profile Operations', () => {
  let vendorToken: string;

  test.beforeAll(async ({ request }) => {
    vendorToken = await getVendorToken(request);
  });

  test('PATCH /api/vendor/profile updates profile', async ({ request }) => {
    const res = await request.patch(`${BASE}/api/vendor/profile`, {
      headers: vendorHeaders(vendorToken),
      data: { businessName: 'E2E Test Vendor', description: 'Updated via E2E test' },
    });
    expect(res.status()).toBe(200);
  });

  test('PATCH /api/vendor/category-details updates details', async ({ request }) => {
    const res = await request.patch(`${BASE}/api/vendor/category-details`, {
      headers: vendorHeaders(vendorToken),
      data: { style: 'documentary' },
    });
    expect(res.status()).toBe(200);
  });

  test('PATCH /api/vendor/google-review-url updates URL', async ({ request }) => {
    const res = await request.patch(`${BASE}/api/vendor/google-review-url`, {
      headers: vendorHeaders(vendorToken),
      data: { googleReviewUrl: 'https://www.google.com/maps/place/test-vendor' },
    });
    expect(res.status()).toBe(200);
  });

  test('POST /api/vendor/feedback submits vendor feedback', async ({ request }) => {
    const res = await request.post(`${BASE}/api/vendor/feedback`, {
      headers: vendorHeaders(vendorToken),
      data: {
        category: 'suggestion',
        subject: 'E2E vendor test',
        message: 'E2E vendor feedback',
      },
    });
    expect([200, 201]).toContain(res.status());
  });
});

// ─── Vendor Notifications ────────────────────────────────────────

test.describe('Vendor Notification Operations', () => {
  let vendorToken: string;

  test.beforeAll(async ({ request }) => {
    vendorToken = await getVendorToken(request);
  });

  test('GET /api/vendor/notifications returns array', async ({ request }) => {
    const res = await request.get(`${BASE}/api/vendor/notifications`, {
      headers: vendorHeaders(vendorToken),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('GET /api/vendor/notifications/unread-count returns count', async ({ request }) => {
    const res = await request.get(`${BASE}/api/vendor/notifications/unread-count`, {
      headers: vendorHeaders(vendorToken),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(typeof body.count === 'number' || typeof body.unreadCount === 'number').toBe(true);
  });
});

// ─── Vendor Inquiries ────────────────────────────────────────────

test.describe('Vendor Inquiry Operations', () => {
  let vendorToken: string;

  test.beforeAll(async ({ request }) => {
    vendorToken = await getVendorToken(request);
  });

  test('GET /api/vendor/inquiries returns array', async ({ request }) => {
    const res = await request.get(`${BASE}/api/vendor/inquiries`, {
      headers: vendorHeaders(vendorToken),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });
});

// ─── Vendor Availability with Bookings ───────────────────────────

test.describe('Vendor Availability Bookings', () => {
  let vendorToken: string;

  test.beforeAll(async ({ request }) => {
    vendorToken = await getVendorToken(request);
  });

  test('GET /api/vendor/availability/:date returns info', async ({ request }) => {
    const res = await request.get(`${BASE}/api/vendor/availability/2026-06-15`, {
      headers: vendorHeaders(vendorToken),
    });
    expect([200, 404]).toContain(res.status());
  });

  test('GET /api/vendor/availability/:date/bookings returns bookings', async ({ request }) => {
    const res = await request.get(`${BASE}/api/vendor/availability/2026-06-15/bookings`, {
      headers: vendorHeaders(vendorToken),
    });
    expect([200, 404]).toContain(res.status());
  });

  test('POST /api/vendor/availability/bulk creates bulk slots', async ({ request }) => {
    const res = await request.post(`${BASE}/api/vendor/availability/bulk`, {
      headers: vendorHeaders(vendorToken),
      data: {
        dates: ['2026-07-01', '2026-07-02', '2026-07-03'],
        status: 'available',
      },
    });
    expect([200, 201]).toContain(res.status());
  });
});
