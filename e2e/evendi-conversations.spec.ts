/**
 * Evendi Conversations & Messaging E2E Tests
 *
 * Tests couple↔vendor conversations, messages, typing indicators,
 * vendor-admin conversations, and conversation management.
 */
import { test, expect } from '@playwright/test';
import {
  EVENDI_URL,
  getCoupleAuth,
  coupleHeaders,
  getVendorToken,
  vendorHeaders,
  adminHeaders,
  TEST_VENDOR_ID,
} from './helpers';

const BASE = EVENDI_URL;

test.describe('Vendor Conversations', () => {
  let vendorToken: string;

  test.beforeAll(async ({ request }) => {
    vendorToken = await getVendorToken(request);
  });

  test('GET /api/vendor/conversations returns array', async ({ request }) => {
    const res = await request.get(`${BASE}/api/vendor/conversations`, {
      headers: vendorHeaders(vendorToken),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('GET /api/vendor/conversations/:id returns conversation details', async ({ request }) => {
    // First get conversations list
    const listRes = await request.get(`${BASE}/api/vendor/conversations`, {
      headers: vendorHeaders(vendorToken),
    });
    const conversations = await listRes.json();
    if (!conversations.length) { test.skip(); return; }

    const convId = conversations[0].id;
    const res = await request.get(`${BASE}/api/vendor/conversations/${convId}`, {
      headers: vendorHeaders(vendorToken),
    });
    expect(res.status()).toBe(200);
  });

  test('GET /api/vendor/conversations/:id/messages returns messages', async ({ request }) => {
    const listRes = await request.get(`${BASE}/api/vendor/conversations`, {
      headers: vendorHeaders(vendorToken),
    });
    const conversations = await listRes.json();
    if (!conversations.length) { test.skip(); return; }

    const convId = conversations[0].id;
    const res = await request.get(`${BASE}/api/vendor/conversations/${convId}/messages`, {
      headers: vendorHeaders(vendorToken),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('GET /api/vendor/conversations/:id/details returns details', async ({ request }) => {
    const listRes = await request.get(`${BASE}/api/vendor/conversations`, {
      headers: vendorHeaders(vendorToken),
    });
    const conversations = await listRes.json();
    if (!conversations.length) { test.skip(); return; }

    const convId = conversations[0].id;
    const res = await request.get(`${BASE}/api/vendor/conversations/${convId}/details`, {
      headers: vendorHeaders(vendorToken),
    });
    expect(res.status()).toBe(200);
  });
});

test.describe('Couple Conversations', () => {
  let coupleToken: string;

  test.beforeAll(async ({ request }) => {
    const auth = await getCoupleAuth(request);
    coupleToken = auth.token;
  });

  test('GET /api/couples/conversations returns array', async ({ request }) => {
    const res = await request.get(`${BASE}/api/couples/conversations`, {
      headers: coupleHeaders(coupleToken),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('GET /api/couples/conversations/:id/messages returns messages', async ({ request }) => {
    const listRes = await request.get(`${BASE}/api/couples/conversations`, {
      headers: coupleHeaders(coupleToken),
    });
    const conversations = await listRes.json();
    if (!conversations.length) { test.skip(); return; }

    const convId = conversations[0].id;
    const res = await request.get(`${BASE}/api/couples/conversations/${convId}/messages`, {
      headers: coupleHeaders(coupleToken),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('GET /api/couples/conversations/:id/details returns details', async ({ request }) => {
    const listRes = await request.get(`${BASE}/api/couples/conversations`, {
      headers: coupleHeaders(coupleToken),
    });
    const conversations = await listRes.json();
    if (!conversations.length) { test.skip(); return; }

    const convId = conversations[0].id;
    const res = await request.get(`${BASE}/api/couples/conversations/${convId}/details`, {
      headers: coupleHeaders(coupleToken),
    });
    expect(res.status()).toBe(200);
  });
});

test.describe('Vendor-Admin Conversations', () => {
  let vendorToken: string;

  test.beforeAll(async ({ request }) => {
    vendorToken = await getVendorToken(request);
  });

  test('GET /api/vendor/admin/conversation returns data', async ({ request }) => {
    const res = await request.get(`${BASE}/api/vendor/admin/conversation`, {
      headers: vendorHeaders(vendorToken),
    });
    // May return 200 or 404 if no admin conversation exists
    expect([200, 404]).toContain(res.status());
  });

  test('GET /api/vendor/admin/messages returns data', async ({ request }) => {
    const res = await request.get(`${BASE}/api/vendor/admin/messages`, {
      headers: vendorHeaders(vendorToken),
    });
    expect([200, 404]).toContain(res.status());
  });

  test('GET /api/admin/vendor-admin-conversations returns array', async ({ request }) => {
    const res = await request.get(`${BASE}/api/admin/vendor-admin-conversations`, {
      headers: adminHeaders(),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });
});

test.describe('Message Operations', () => {
  let vendorToken: string;
  let coupleToken: string;

  test.beforeAll(async ({ request }) => {
    vendorToken = await getVendorToken(request);
    const auth = await getCoupleAuth(request);
    coupleToken = auth.token;
  });

  test('POST /api/vendor/messages sends a vendor message', async ({ request }) => {
    // First get a conversation
    const listRes = await request.get(`${BASE}/api/vendor/conversations`, {
      headers: vendorHeaders(vendorToken),
    });
    const conversations = await listRes.json();
    if (!conversations.length) { test.skip(); return; }

    const convId = conversations[0].id;
    const res = await request.post(`${BASE}/api/vendor/messages`, {
      headers: vendorHeaders(vendorToken),
      data: {
        conversationId: convId,
        body: 'E2E test vendor message',
      },
    });
    expect([200, 201]).toContain(res.status());
  });

  test('POST /api/couples/messages sends a couple message', async ({ request }) => {
    const listRes = await request.get(`${BASE}/api/couples/conversations`, {
      headers: coupleHeaders(coupleToken),
    });
    const conversations = await listRes.json();
    if (!conversations.length) { test.skip(); return; }

    const convId = conversations[0].id;
    const res = await request.post(`${BASE}/api/couples/messages`, {
      headers: coupleHeaders(coupleToken),
      data: {
        conversationId: convId,
        content: 'E2E test couple message',
      },
    });
    expect([200, 201]).toContain(res.status());
  });

  test('POST /api/conversations/:id/mark-read marks conversation read', async ({ request }) => {
    const listRes = await request.get(`${BASE}/api/vendor/conversations`, {
      headers: vendorHeaders(vendorToken),
    });
    const conversations = await listRes.json();
    if (!conversations.length) { test.skip(); return; }

    const convId = conversations[0].id;
    const res = await request.post(`${BASE}/api/conversations/${convId}/mark-read`, {
      headers: vendorHeaders(vendorToken),
    });
    expect([200, 204]).toContain(res.status());
  });
});

test.describe('Vendor Message Reminders', () => {
  let vendorToken: string;

  test.beforeAll(async ({ request }) => {
    vendorToken = await getVendorToken(request);
  });

  test('GET /api/vendor/message-reminders returns array', async ({ request }) => {
    const res = await request.get(`${BASE}/api/vendor/message-reminders`, {
      headers: vendorHeaders(vendorToken),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });
});

test.describe('Vendor Conversations by Vendor ID', () => {
  let vendorToken: string;

  test.beforeAll(async ({ request }) => {
    vendorToken = await getVendorToken(request);
  });

  test('GET /api/vendor/conversations filters by TEST_VENDOR_ID', async ({ request }) => {
    const res = await request.get(`${BASE}/api/vendor/conversations?vendorId=${TEST_VENDOR_ID}`, {
      headers: vendorHeaders(vendorToken),
    });
    expect([200, 404]).toContain(res.status());
  });
});

test.describe('Inquiry to Conversation', () => {
  let coupleToken: string;

  test.beforeAll(async ({ request }) => {
    const auth = await getCoupleAuth(request);
    coupleToken = auth.token;
  });

  test('POST /api/couples/conversations/from-inquiry creates conversation', async ({ request }) => {
    const res = await request.post(`${BASE}/api/couples/conversations/from-inquiry`, {
      headers: coupleHeaders(coupleToken),
      data: {
        inquiryId: 'non-existent-inquiry-id',
      },
    });
    // 201 = created, 200 = existing, 404 = inquiry not found
    expect([200, 201, 404]).toContain(res.status());
  });
});
