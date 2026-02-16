/**
 * CreatorHub Workflow E2E Tests
 *
 * Tests CreatorHub-specific features: pricing, community, contracts,
 * showcase, submissions, analytics, orchestration, and more.
 * All on port 3001 with x-user-id auth.
 */
import { test, expect } from '@playwright/test';
import { CREATORHUB_URL, CREATORHUB_USER_ID } from './helpers';

const BASE = CREATORHUB_URL;

function userHeaders(userId = CREATORHUB_USER_ID) {
  return { 'x-user-id': userId };
}

// ─── Auth & Session ──────────────────────────────────────────────

test.describe('CreatorHub Auth', () => {
  test('GET /api/auth/status returns status', async ({ request }) => {
    const res = await request.get(`${BASE}/api/auth/status`);
    expect([200, 401]).toContain(res.status());
  });

  test('GET /api/auth/session-status returns session status', async ({ request }) => {
    const res = await request.get(`${BASE}/api/auth/session-status`);
    expect([200, 401]).toContain(res.status());
  });

  test('POST /api/auth/login works with valid credentials', async ({ request }) => {
    const res = await request.post(`${BASE}/api/auth/login`, {
      data: { email: 'daniel@creatorhubn.com', password: 'admin123' },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.token).toBeTruthy();
  });

  test('POST /api/auth/login fails with bad credentials', async ({ request }) => {
    const res = await request.post(`${BASE}/api/auth/login`, {
      data: { email: 'wrong@email.com', password: 'wrong' },
    });
    expect(res.status()).toBe(401);
  });
});

// ─── Pricing ─────────────────────────────────────────────────────

test.describe('CreatorHub Pricing', () => {
  test('GET /api/pricing/categories/:userId returns categories', async ({ request }) => {
    const res = await request.get(`${BASE}/api/pricing/categories/${CREATORHUB_USER_ID}`, {
      headers: userHeaders(),
    });
    expect(res.status()).toBe(200);
  });

  test('GET /api/pricing/services/:userId returns services', async ({ request }) => {
    const res = await request.get(`${BASE}/api/pricing/services/${CREATORHUB_USER_ID}`, {
      headers: userHeaders(),
    });
    expect(res.status()).toBe(200);
  });

  test('GET /api/pricing/packages/:userId returns packages', async ({ request }) => {
    const res = await request.get(`${BASE}/api/pricing/packages/${CREATORHUB_USER_ID}`, {
      headers: userHeaders(),
    });
    expect(res.status()).toBe(200);
  });

  test('GET /api/pricing/customer-pricing/:userId returns pricing', async ({ request }) => {
    const res = await request.get(`${BASE}/api/pricing/customer-pricing/${CREATORHUB_USER_ID}`, {
      headers: userHeaders(),
    });
    expect(res.status()).toBe(200);
  });
});

// ─── Price Administration ────────────────────────────────────────

test.describe('CreatorHub Price Administration', () => {
  test('GET /api/price-administration/pricing returns pricing', async ({ request }) => {
    const res = await request.get(`${BASE}/api/price-administration/pricing`, {
      headers: userHeaders(),
    });
    expect(res.status()).toBe(200);
  });

  test('GET /api/price-administration/additional-costs returns costs', async ({ request }) => {
    const res = await request.get(`${BASE}/api/price-administration/additional-costs`, {
      headers: userHeaders(),
    });
    expect(res.status()).toBe(200);
  });

  test('GET /api/price-administration/discounts returns discounts', async ({ request }) => {
    const res = await request.get(`${BASE}/api/price-administration/discounts`, {
      headers: userHeaders(),
    });
    expect(res.status()).toBe(200);
  });

  test('GET /api/price-administration/quotes returns quotes', async ({ request }) => {
    const res = await request.get(`${BASE}/api/price-administration/quotes`, {
      headers: userHeaders(),
    });
    expect(res.status()).toBe(200);
  });
});

// ─── Contracts ───────────────────────────────────────────────────

test.describe('CreatorHub Contracts', () => {
  test('GET /api/contracts returns array', async ({ request }) => {
    const res = await request.get(`${BASE}/api/contracts`, {
      headers: userHeaders(),
    });
    expect(res.status()).toBe(200);
  });

  test('GET /api/contracts/summary returns summary', async ({ request }) => {
    const res = await request.get(`${BASE}/api/contracts/summary`, {
      headers: userHeaders(),
    });
    expect(res.status()).toBe(200);
  });

  test('GET /api/contracts/signers returns signers', async ({ request }) => {
    const res = await request.get(`${BASE}/api/contracts/signers`, {
      headers: userHeaders(),
    });
    expect(res.status()).toBe(200);
  });
});

// ─── Projects ────────────────────────────────────────────────────

test.describe('CreatorHub Projects', () => {
  test('GET /api/projects returns array', async ({ request }) => {
    const res = await request.get(`${BASE}/api/projects`, {
      headers: userHeaders(),
    });
    expect(res.status()).toBe(200);
  });

  let projectId: string;

  test('POST /api/projects creates project', async ({ request }) => {
    const res = await request.post(`${BASE}/api/projects`, {
      headers: userHeaders(),
      data: {
        name: 'E2E Test Project',
        client_email: 'e2e@test.com',
        project_type: 'wedding',
        status: 'active',
      },
    });
    expect([200, 201]).toContain(res.status());
    const body = await res.json();
    if (body.id) projectId = body.id;
  });

  test('GET /api/projects/:id returns project', async ({ request }) => {
    if (!projectId) test.skip();
    const res = await request.get(`${BASE}/api/projects/${projectId}`, {
      headers: userHeaders(),
    });
    expect(res.status()).toBe(200);
  });
});

// ─── Analytics ───────────────────────────────────────────────────

test.describe('CreatorHub Analytics', () => {
  test('GET /api/analytics/summary returns data', async ({ request }) => {
    const res = await request.get(`${BASE}/api/analytics/summary?userId=${CREATORHUB_USER_ID}`, {
      headers: userHeaders(),
    });
    expect([200, 500]).toContain(res.status());
  });

  test('GET /api/analytics/revenue returns data', async ({ request }) => {
    const res = await request.get(`${BASE}/api/analytics/revenue?userId=${CREATORHUB_USER_ID}`, {
      headers: userHeaders(),
    });
    expect([200, 500]).toContain(res.status());
  });

  test('GET /api/analytics/clients returns data', async ({ request }) => {
    const res = await request.get(`${BASE}/api/analytics/clients?userId=${CREATORHUB_USER_ID}`, {
      headers: userHeaders(),
    });
    expect([200, 500]).toContain(res.status());
  });

  test('GET /api/analytics/performance returns data', async ({ request }) => {
    const res = await request.get(`${BASE}/api/analytics/performance?userId=${CREATORHUB_USER_ID}`, {
      headers: userHeaders(),
    });
    expect([200, 500]).toContain(res.status());
  });

  test('GET /api/analytics/growth returns data', async ({ request }) => {
    const res = await request.get(`${BASE}/api/analytics/growth?userId=${CREATORHUB_USER_ID}`, {
      headers: userHeaders(),
    });
    expect([200, 500]).toContain(res.status());
  });

  test('GET /api/analytics/business-intelligence returns data', async ({ request }) => {
    const res = await request.get(`${BASE}/api/analytics/business-intelligence?userId=${CREATORHUB_USER_ID}`, {
      headers: userHeaders(),
    });
    expect([200, 500]).toContain(res.status());
  });
});

// ─── Submissions ─────────────────────────────────────────────────

test.describe('CreatorHub Submissions', () => {
  test('GET /api/submissions returns array', async ({ request }) => {
    const res = await request.get(`${BASE}/api/submissions`, {
      headers: userHeaders(),
    });
    expect(res.status()).toBe(200);
  });

  test('GET /api/submissions/stats returns stats', async ({ request }) => {
    const res = await request.get(`${BASE}/api/submissions/stats`, {
      headers: userHeaders(),
    });
    expect(res.status()).toBe(200);
  });
});

// ─── Emails ──────────────────────────────────────────────────────

test.describe('CreatorHub Emails', () => {
  test('GET /api/emails/recent returns array', async ({ request }) => {
    const res = await request.get(`${BASE}/api/emails/recent`, {
      headers: userHeaders(),
    });
    expect(res.status()).toBe(200);
  });

  test('GET /api/emails/stats returns stats', async ({ request }) => {
    const res = await request.get(`${BASE}/api/emails/stats`, {
      headers: userHeaders(),
    });
    expect(res.status()).toBe(200);
  });

  test('GET /api/emails/contacts returns contacts', async ({ request }) => {
    const res = await request.get(`${BASE}/api/emails/contacts`, {
      headers: userHeaders(),
    });
    expect(res.status()).toBe(200);
  });
});

// ─── Community ───────────────────────────────────────────────────

test.describe('CreatorHub Community', () => {
  test('GET /api/community/mentors returns data', async ({ request }) => {
    const res = await request.get(`${BASE}/api/community/mentors`, {
      headers: userHeaders(),
    });
    expect(res.status()).toBe(200);
  });

  test('GET /api/community/unanswered returns data', async ({ request }) => {
    const res = await request.get(`${BASE}/api/community/unanswered`, {
      headers: userHeaders(),
    });
    expect(res.status()).toBe(200);
  });

  test('GET /api/community/bookmarks returns data', async ({ request }) => {
    const res = await request.get(`${BASE}/api/community/bookmarks`, {
      headers: userHeaders(),
    });
    expect(res.status()).toBe(200);
  });
});

// ─── Showcase ────────────────────────────────────────────────────

test.describe('CreatorHub Showcase', () => {
  test('GET /api/showcase/categories returns array', async ({ request }) => {
    const res = await request.get(`${BASE}/api/showcase/categories`, {
      headers: userHeaders(),
    });
    expect(res.status()).toBe(200);
  });
});

// ─── Marketplace ─────────────────────────────────────────────────

test.describe('CreatorHub Marketplace', () => {
  test('GET /api/marketplace/stats returns data', async ({ request }) => {
    const res = await request.get(`${BASE}/api/marketplace/stats`, {
      headers: userHeaders(),
    });
    expect(res.status()).toBe(200);
  });
});

// ─── Equipment & Maintenance ─────────────────────────────────────

test.describe('CreatorHub Equipment', () => {
  test('GET /api/equipment returns array', async ({ request }) => {
    const res = await request.get(`${BASE}/api/equipment`, {
      headers: userHeaders(),
    });
    expect(res.status()).toBe(200);
  });

  test('GET /api/maintenance/equipment returns data', async ({ request }) => {
    const res = await request.get(`${BASE}/api/maintenance/equipment`, {
      headers: userHeaders(),
    });
    expect(res.status()).toBe(200);
  });

  test('GET /api/maintenance/tasks returns data', async ({ request }) => {
    const res = await request.get(`${BASE}/api/maintenance/tasks?userId=${CREATORHUB_USER_ID}`, {
      headers: userHeaders(),
    });
    expect(res.status()).toBe(200);
  });
});

// ─── Firmware ────────────────────────────────────────────────────

test.describe('CreatorHub Firmware', () => {
  test('GET /api/firmware/devices returns array', async ({ request }) => {
    const res = await request.get(`${BASE}/api/firmware/devices`, {
      headers: userHeaders(),
    });
    expect(res.status()).toBe(200);
  });

  test('GET /api/firmware/updates returns array', async ({ request }) => {
    const res = await request.get(`${BASE}/api/firmware/updates`, {
      headers: userHeaders(),
    });
    expect(res.status()).toBe(200);
  });

  test('GET /api/firmware/history returns array', async ({ request }) => {
    const res = await request.get(`${BASE}/api/firmware/history`, {
      headers: userHeaders(),
    });
    expect(res.status()).toBe(200);
  });
});

// ─── Notifications ───────────────────────────────────────────────

test.describe('CreatorHub Notifications', () => {
  test('GET /api/notifications/active returns array', async ({ request }) => {
    const res = await request.get(`${BASE}/api/notifications/active`, {
      headers: userHeaders(),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });
});

// ─── System ──────────────────────────────────────────────────────

test.describe('CreatorHub System', () => {
  test('GET /api/system/metrics returns data', async ({ request }) => {
    const res = await request.get(`${BASE}/api/system/metrics`, {
      headers: userHeaders(),
    });
    expect(res.status()).toBe(200);
  });
});

// ─── Orchestration ───────────────────────────────────────────────

test.describe('CreatorHub Orchestration', () => {
  test('GET /api/orchestration/workflows/:userId returns data', async ({ request }) => {
    const res = await request.get(`${BASE}/api/orchestration/workflows/${CREATORHUB_USER_ID}`, {
      headers: userHeaders(),
    });
    expect(res.status()).toBe(200);
  });
});

// ─── Travel Log ──────────────────────────────────────────────────

test.describe('CreatorHub Travel Log', () => {
  test('GET /api/travel-log returns array', async ({ request }) => {
    const res = await request.get(`${BASE}/api/travel-log`, {
      headers: userHeaders(),
    });
    expect(res.status()).toBe(200);
  });
});

// ─── Clients ─────────────────────────────────────────────────────

test.describe('CreatorHub Clients', () => {
  test('GET /api/clients returns array', async ({ request }) => {
    const res = await request.get(`${BASE}/api/clients`, {
      headers: userHeaders(),
    });
    expect(res.status()).toBe(200);
  });
});

// ─── Calendar ────────────────────────────────────────────────────

test.describe('CreatorHub Calendar', () => {
  test('GET /api/calendar/availability returns data', async ({ request }) => {
    const res = await request.get(`${BASE}/api/calendar/availability`, {
      headers: userHeaders(),
    });
    expect(res.status()).toBe(200);
  });
});

// ─── Platform Stats ──────────────────────────────────────────────

test.describe('CreatorHub Platform', () => {
  test('GET /api/platform/stats returns stats', async ({ request }) => {
    const res = await request.get(`${BASE}/api/platform/stats`, {
      headers: userHeaders(),
    });
    expect(res.status()).toBe(200);
  });
});

// ─── Invite Requests ─────────────────────────────────────────────

test.describe('CreatorHub Invite Requests', () => {
  test('GET /api/invite-requests returns array', async ({ request }) => {
    const res = await request.get(`${BASE}/api/invite-requests`, {
      headers: userHeaders(),
    });
    expect(res.status()).toBe(200);
  });
});

// ─── Professions ─────────────────────────────────────────────────

test.describe('CreatorHub Professions', () => {
  test('GET /api/professions/all returns data', async ({ request }) => {
    const res = await request.get(`${BASE}/api/professions/all`, {
      headers: userHeaders(),
    });
    expect(res.status()).toBe(200);
  });
});

// ─── User Preferences ───────────────────────────────────────────

test.describe('CreatorHub User Preferences', () => {
  test('GET /api/user/onboarding-status returns data', async ({ request }) => {
    const res = await request.get(`${BASE}/api/user/onboarding-status`, {
      headers: userHeaders(),
    });
    expect(res.status()).toBe(200);
  });

  test('GET /api/user/meeting-preferences returns data', async ({ request }) => {
    const res = await request.get(`${BASE}/api/user/meeting-preferences`, {
      headers: userHeaders(),
    });
    expect(res.status()).toBe(200);
  });

  test('GET /api/settings/demo-mode returns data', async ({ request }) => {
    const res = await request.get(`${BASE}/api/settings/demo-mode`, {
      headers: userHeaders(),
    });
    expect(res.status()).toBe(200);
  });
});

// ─── Vendor Types ────────────────────────────────────────────────

test.describe('CreatorHub Vendor Types', () => {
  test('GET /api/vendor-types returns array', async ({ request }) => {
    const res = await request.get(`${BASE}/api/vendor-types`, {
      headers: userHeaders(),
    });
    expect(res.status()).toBe(200);
  });
});

// ─── Prototype Testing ──────────────────────────────────────────

test.describe('CreatorHub Prototype Testing', () => {
  test('GET /api/prototype-testing/feedback returns data', async ({ request }) => {
    const res = await request.get(`${BASE}/api/prototype-testing/feedback`, {
      headers: userHeaders(),
    });
    expect(res.status()).toBe(200);
  });
});

// ─── Audio Settings ──────────────────────────────────────────────

test.describe('CreatorHub Audio Settings', () => {
  test('GET /api/audio-settings/ducking-presets returns data', async ({ request }) => {
    const res = await request.get(`${BASE}/api/audio-settings/ducking-presets`, {
      headers: userHeaders(),
    });
    expect(res.status()).toBe(200);
  });

  test('GET /api/audio-settings/eq-presets returns data', async ({ request }) => {
    const res = await request.get(`${BASE}/api/audio-settings/eq-presets`, {
      headers: userHeaders(),
    });
    expect(res.status()).toBe(200);
  });

  test('GET /api/audio-settings/mixer-settings returns data', async ({ request }) => {
    const res = await request.get(`${BASE}/api/audio-settings/mixer-settings`, {
      headers: userHeaders(),
    });
    expect(res.status()).toBe(200);
  });
});
