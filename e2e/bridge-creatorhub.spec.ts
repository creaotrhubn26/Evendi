/**
 * CreatorHub Bridge E2E Tests — Evendi-side (/api/creatorhub/*)
 *
 * Tests all CreatorHub integration endpoints exposed on the Evendi server (:5000).
 * These endpoints are authenticated via X-API-Key (CreatorHub API key).
 */
import { test, expect } from '@playwright/test';
import {
  EVENDI_URL,
  ADMIN_SECRET,
  CREATORHUB_API_KEY,
  adminHeaders,
  LINKED_VENDOR_ID,
} from './helpers';

const BASE = EVENDI_URL;

function bridgeApiHeaders() {
  return { 'X-API-Key': CREATORHUB_API_KEY };
}

// ─── Projects ────────────────────────────────────────────────────

test.describe('CreatorHub Bridge — Projects', () => {
  test('GET /api/creatorhub/projects returns array', async ({ request }) => {
    const res = await request.get(`${BASE}/api/creatorhub/projects`, {
      headers: { 'x-admin-secret': ADMIN_SECRET },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('GET /api/creatorhub/project returns project for api key', async ({ request }) => {
    const res = await request.get(`${BASE}/api/creatorhub/project`, {
      headers: bridgeApiHeaders(),
    });
    expect(res.status()).toBe(200);
  });
});

// ─── Users ───────────────────────────────────────────────────────

test.describe('CreatorHub Bridge — Users', () => {
  let userId: string;

  test('GET /api/creatorhub/users returns users', async ({ request }) => {
    const res = await request.get(`${BASE}/api/creatorhub/users`, {
      headers: bridgeApiHeaders(),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    if (body.length > 0) userId = body[0].id;
  });

  test('GET /api/creatorhub/users/:id returns specific user', async ({ request }) => {
    if (!userId) test.skip();
    const res = await request.get(`${BASE}/api/creatorhub/users/${userId}`, {
      headers: bridgeApiHeaders(),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.id).toBe(userId);
  });
});

// ─── Invitations ─────────────────────────────────────────────────

test.describe('CreatorHub Bridge — Invitations', () => {
  let inviteId: string;

  test('GET /api/creatorhub/invitations returns array', async ({ request }) => {
    const res = await request.get(`${BASE}/api/creatorhub/invitations`, {
      headers: bridgeApiHeaders(),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('POST /api/creatorhub/invitations creates invite', async ({ request }) => {
    const res = await request.post(`${BASE}/api/creatorhub/invitations`, {
      headers: bridgeApiHeaders(),
      data: {
        email: 'e2e-invite@test.com',
        role: 'creator',
        invitedByUserId: '43724096-0b81-4f0b-b819-a52c24e1bfeb',
      },
    });
    expect([200, 201, 409]).toContain(res.status());
    const body = await res.json();
    if (body.id) inviteId = body.id;
  });

  test('DELETE /api/creatorhub/invitations/:id removes', async ({ request }) => {
    if (!inviteId) test.skip();
    const res = await request.delete(`${BASE}/api/creatorhub/invitations/${inviteId}`, {
      headers: bridgeApiHeaders(),
    });
    expect(res.status()).toBe(200);
  });
});

// ─── Bookings ────────────────────────────────────────────────────

test.describe('CreatorHub Bridge — Bookings', () => {
  let bookingId: string;

  test('GET /api/creatorhub/bookings returns array', async ({ request }) => {
    const res = await request.get(`${BASE}/api/creatorhub/bookings`, {
      headers: bridgeApiHeaders(),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('POST /api/creatorhub/bookings creates booking', async ({ request }) => {
    const res = await request.post(`${BASE}/api/creatorhub/bookings`, {
      headers: bridgeApiHeaders(),
      data: {
        title: 'E2E Test Wedding',
        clientName: 'E2E Client',
        clientEmail: 'e2e-client@test.com',
        eventDate: '2026-08-15',
        location: 'Oslo',
        notes: 'E2E test booking',
        creatorUserId: '43724096-0b81-4f0b-b819-a52c24e1bfeb',
      },
    });
    expect([200, 201]).toContain(res.status());
    const body = await res.json();
    if (body.id) bookingId = body.id;
  });

  test('GET /api/creatorhub/bookings/:id returns booking', async ({ request }) => {
    if (!bookingId) test.skip();
    const res = await request.get(`${BASE}/api/creatorhub/bookings/${bookingId}`, {
      headers: bridgeApiHeaders(),
    });
    expect(res.status()).toBe(200);
  });

  test('PATCH /api/creatorhub/bookings/:id updates', async ({ request }) => {
    if (!bookingId) test.skip();
    const res = await request.patch(`${BASE}/api/creatorhub/bookings/${bookingId}`, {
      headers: bridgeApiHeaders(),
      data: { notes: 'Updated E2E notes' },
    });
    expect(res.status()).toBe(200);
  });

  test('DELETE /api/creatorhub/bookings/:id removes', async ({ request }) => {
    if (!bookingId) test.skip();
    const res = await request.delete(`${BASE}/api/creatorhub/bookings/${bookingId}`, {
      headers: bridgeApiHeaders(),
    });
    expect(res.status()).toBe(200);
  });
});

// ─── CRM Notes ───────────────────────────────────────────────────

test.describe('CreatorHub Bridge — CRM Notes', () => {
  let noteId: string;

  test('GET /api/creatorhub/crm/notes returns array', async ({ request }) => {
    const res = await request.get(`${BASE}/api/creatorhub/crm/notes`, {
      headers: bridgeApiHeaders(),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('POST /api/creatorhub/crm/notes creates note', async ({ request }) => {
    const res = await request.post(`${BASE}/api/creatorhub/crm/notes`, {
      headers: bridgeApiHeaders(),
      data: {
        body: 'E2E test note',
        noteType: 'note',
        subject: 'E2E Contact',
        creatorUserId: '43724096-0b81-4f0b-b819-a52c24e1bfeb',
      },
    });
    expect([200, 201]).toContain(res.status());
    const body = await res.json();
    if (body.id) noteId = body.id;
  });

  test('PATCH /api/creatorhub/crm/notes/:id updates', async ({ request }) => {
    if (!noteId) test.skip();
    const res = await request.patch(`${BASE}/api/creatorhub/crm/notes/${noteId}`, {
      headers: bridgeApiHeaders(),
      data: { content: 'Updated E2E note' },
    });
    expect(res.status()).toBe(200);
  });

  test('DELETE /api/creatorhub/crm/notes/:id removes', async ({ request }) => {
    if (!noteId) test.skip();
    const res = await request.delete(`${BASE}/api/creatorhub/crm/notes/${noteId}`, {
      headers: bridgeApiHeaders(),
    });
    expect(res.status()).toBe(200);
  });
});

// ─── Analytics ───────────────────────────────────────────────────

test.describe('CreatorHub Bridge — Analytics', () => {
  test('GET /api/creatorhub/analytics/summary returns data', async ({ request }) => {
    const res = await request.get(`${BASE}/api/creatorhub/analytics/summary`, {
      headers: bridgeApiHeaders(),
    });
    expect(res.status()).toBe(200);
  });

  test('GET /api/creatorhub/analytics/events returns array', async ({ request }) => {
    const res = await request.get(`${BASE}/api/creatorhub/analytics/events`, {
      headers: bridgeApiHeaders(),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('POST /api/creatorhub/analytics/events logs event', async ({ request }) => {
    const res = await request.post(`${BASE}/api/creatorhub/analytics/events`, {
      headers: bridgeApiHeaders(),
      data: {
        eventType: 'page_view',
        eventData: { page: '/test' },
      },
    });
    expect([200, 201]).toContain(res.status());
  });
});

// ─── Audit Log ───────────────────────────────────────────────────

test.describe('CreatorHub Bridge — Audit Log', () => {
  test('GET /api/creatorhub/audit-log returns array', async ({ request }) => {
    const res = await request.get(`${BASE}/api/creatorhub/audit-log`, {
      headers: bridgeApiHeaders(),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });
});

// ─── Evendi Data Bridge (couples, vendors, conversations) ───────

test.describe('CreatorHub Bridge — Evendi Data', () => {
  test('GET /api/creatorhub/evendi/statistics returns stats', async ({ request }) => {
    const res = await request.get(`${BASE}/api/creatorhub/evendi/statistics`, {
      headers: bridgeApiHeaders(),
    });
    expect(res.status()).toBe(200);
  });

  test('GET /api/creatorhub/evendi/vendors returns array', async ({ request }) => {
    const res = await request.get(`${BASE}/api/creatorhub/evendi/vendors`, {
      headers: bridgeApiHeaders(),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('GET /api/creatorhub/evendi/vendors/:id returns vendor', async ({ request }) => {
    const res = await request.get(`${BASE}/api/creatorhub/evendi/vendors/${LINKED_VENDOR_ID}`, {
      headers: bridgeApiHeaders(),
    });
    expect(res.status()).toBe(200);
  });

  test('GET /api/creatorhub/evendi/couples returns array', async ({ request }) => {
    const res = await request.get(`${BASE}/api/creatorhub/evendi/couples`, {
      headers: bridgeApiHeaders(),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('GET /api/creatorhub/evendi/conversations returns array', async ({ request }) => {
    const res = await request.get(`${BASE}/api/creatorhub/evendi/conversations?vendorId=${LINKED_VENDOR_ID}`, {
      headers: bridgeApiHeaders(),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('GET /api/creatorhub/evendi/all-conversations returns array', async ({ request }) => {
    const res = await request.get(`${BASE}/api/creatorhub/evendi/all-conversations`, {
      headers: bridgeApiHeaders(),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('GET /api/creatorhub/evendi/offers returns array', async ({ request }) => {
    const res = await request.get(`${BASE}/api/creatorhub/evendi/offers?vendorId=${LINKED_VENDOR_ID}`, {
      headers: bridgeApiHeaders(),
    });
    expect(res.status()).toBe(200);
  });
});

// ─── Speeches/Tables/Music/Coordinators/Reviews Bridge ──────────

test.describe('CreatorHub Bridge — Couple Data', () => {
  // Use a known couple ID
  const E2E_COUPLE_ID = '53611b93-4d2d-4088-9696-6b147faa64ff';

  test('GET /api/creatorhub/speeches/:coupleId returns data', async ({ request }) => {
    const res = await request.get(`${BASE}/api/creatorhub/speeches/${E2E_COUPLE_ID}`, {
      headers: bridgeApiHeaders(),
    });
    expect([200, 404]).toContain(res.status());
  });

  test('GET /api/creatorhub/tables/:coupleId returns data', async ({ request }) => {
    const res = await request.get(`${BASE}/api/creatorhub/tables/${E2E_COUPLE_ID}`, {
      headers: bridgeApiHeaders(),
    });
    expect([200, 404]).toContain(res.status());
  });

  test('GET /api/creatorhub/music/:coupleId returns data', async ({ request }) => {
    const res = await request.get(`${BASE}/api/creatorhub/music/${E2E_COUPLE_ID}`, {
      headers: bridgeApiHeaders(),
    });
    expect([200, 404]).toContain(res.status());
    if (res.status() !== 200) return;
    const body = await res.json();
    expect(body).toHaveProperty('matcherProfile');
    expect(Array.isArray(body.sets)).toBe(true);
    expect(Array.isArray(body.moments)).toBe(true);
    expect(body.couple).toBeDefined();
    expect(Array.isArray(body.couple?.selectedTraditions || [])).toBe(true);
  });

  test('GET /api/creatorhub/coordinators/:coupleId returns data', async ({ request }) => {
    const res = await request.get(`${BASE}/api/creatorhub/coordinators/${E2E_COUPLE_ID}`, {
      headers: bridgeApiHeaders(),
    });
    expect([200, 404]).toContain(res.status());
  });

  test('GET /api/creatorhub/reviews/:vendorId returns data', async ({ request }) => {
    const res = await request.get(`${BASE}/api/creatorhub/reviews/${LINKED_VENDOR_ID}`, {
      headers: bridgeApiHeaders(),
    });
    expect([200, 404]).toContain(res.status());
  });
});

// ─── Impersonation ───────────────────────────────────────────────

test.describe('CreatorHub Bridge — Impersonation', () => {
  const E2E_COUPLE_ID = '53611b93-4d2d-4088-9696-6b147faa64ff';

  test('POST /api/creatorhub/evendi/impersonate/couple returns session', async ({ request }) => {
    const res = await request.post(`${BASE}/api/creatorhub/evendi/impersonate/couple`, {
      headers: bridgeApiHeaders(),
      data: { coupleId: E2E_COUPLE_ID },
    });
    expect([200, 404]).toContain(res.status());
  });

  test('POST /api/creatorhub/evendi/impersonate/vendor returns session', async ({ request }) => {
    const res = await request.post(`${BASE}/api/creatorhub/evendi/impersonate/vendor`, {
      headers: bridgeApiHeaders(),
      data: { vendorId: LINKED_VENDOR_ID },
    });
    expect([200, 404]).toContain(res.status());
  });
});
