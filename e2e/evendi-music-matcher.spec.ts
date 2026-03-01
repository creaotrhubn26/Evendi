/**
 * Evendi Music Matcher MVP E2E tests (API-level)
 */
import { test, expect } from '@playwright/test';
import {
  EVENDI_URL,
  getCoupleAuth,
  coupleHeaders,
  getVendorToken,
  vendorHeaders,
} from './helpers';

const BASE = EVENDI_URL;

test.describe('Evendi Music Matcher MVP', () => {
  let coupleToken = '';
  let vendorToken = '';

  test.beforeAll(async ({ request }) => {
    const coupleAuth = await getCoupleAuth(request);
    coupleToken = coupleAuth.token;
    vendorToken = await getVendorToken(request);
  });

  test('couple matcher profile + moments + recommendations endpoints', async ({ request }) => {
    const profileRes = await request.get(`${BASE}/api/couple/music/matcher/profile`, {
      headers: coupleHeaders(coupleToken),
    });

    if (profileRes.status() === 404) {
      test.skip(true, 'music_matcher_v1 is disabled in this environment');
    }

    expect(profileRes.status()).toBe(200);
    const profile = await profileRes.json();
    expect(Array.isArray(profile.preferredCultures)).toBe(true);
    expect(Array.isArray(profile.preferredLanguages)).toBe(true);
    expect(Array.isArray(profile.selectedMoments)).toBe(true);

    const momentsRes = await request.get(`${BASE}/api/couple/music/matcher/moments`, {
      headers: coupleHeaders(coupleToken),
    });
    expect(momentsRes.status()).toBe(200);
    const moments = await momentsRes.json();
    expect(Array.isArray(moments)).toBe(true);

    const candidateMoments = Array.isArray(profile.selectedMoments) && profile.selectedMoments.length > 0
      ? profile.selectedMoments.slice(0, 2)
      : moments.slice(0, 2).map((moment: any) => moment.key);

    const recRes = await request.post(`${BASE}/api/couple/music/matcher/recommendations`, {
      headers: coupleHeaders(coupleToken),
      data: {
        moments: candidateMoments,
        limitPerMoment: 10,
      },
    });

    expect(recRes.status()).toBe(200);
    const recBody = await recRes.json();
    expect(recBody.profile).toBeDefined();
    expect(recBody.recommendations).toBeDefined();
  });

  test('couple set CRUD + share-links export', async ({ request }) => {
    const createSetRes = await request.post(`${BASE}/api/couple/music/sets`, {
      headers: coupleHeaders(coupleToken),
      data: {
        title: 'E2E Music Matcher Set',
        description: 'Created by e2e test',
      },
    });

    if (createSetRes.status() === 404) {
      test.skip(true, 'music_matcher_v1 is disabled in this environment');
    }

    expect(createSetRes.status()).toBe(201);
    const createdSet = await createSetRes.json();
    const setId = createdSet.id as string;
    expect(setId).toBeTruthy();

    const addItemRes = await request.post(`${BASE}/api/couple/music/sets/${setId}/items`, {
      headers: coupleHeaders(coupleToken),
      data: {
        title: 'E2E Song',
        artist: 'E2E Artist',
        youtubeVideoId: 'dQw4w9WgXcQ',
        momentKey: 'afterparty_peak',
        dropMarkerSeconds: 45,
      },
    });
    expect(addItemRes.status()).toBe(201);
    const item = await addItemRes.json();
    const itemId = item.id as string;
    expect(itemId).toBeTruthy();

    const patchItemRes = await request.patch(`${BASE}/api/couple/music/sets/${setId}/items/${itemId}`, {
      headers: coupleHeaders(coupleToken),
      data: {
        dropMarkerSeconds: 60,
      },
    });
    expect(patchItemRes.status()).toBe(200);

    const reorderRes = await request.patch(`${BASE}/api/couple/music/sets/${setId}/reorder`, {
      headers: coupleHeaders(coupleToken),
      data: {
        orderedItemIds: [itemId],
      },
    });
    expect(reorderRes.status()).toBe(200);

    const shareRes = await request.post(`${BASE}/api/couple/music/export/share-links`, {
      headers: coupleHeaders(coupleToken),
      data: { setId },
    });
    expect(shareRes.status()).toBe(200);
    const shareBody = await shareRes.json();
    expect(shareBody.setId).toBe(setId);
    expect(Array.isArray(shareBody.links)).toBe(true);
    expect(shareBody.totalLinks).toBeGreaterThanOrEqual(1);

    const deleteItemRes = await request.delete(`${BASE}/api/couple/music/sets/${setId}/items/${itemId}`, {
      headers: coupleHeaders(coupleToken),
    });
    expect(deleteItemRes.status()).toBe(200);
  });

  test('youtube connect-url + disconnect endpoints respond', async ({ request }) => {
    const connectRes = await request.get(`${BASE}/api/couple/music/youtube/connect-url`, {
      headers: coupleHeaders(coupleToken),
    });

    if (connectRes.status() === 404) {
      test.skip(true, 'music_matcher_v1 is disabled in this environment');
    }

    expect([200, 500]).toContain(connectRes.status());
    if (connectRes.status() === 200) {
      const body = await connectRes.json();
      expect(typeof body.url).toBe('string');
      expect(body.url).toContain('accounts.google.com');
    }

    const disconnectRes = await request.post(`${BASE}/api/couple/music/youtube/disconnect`, {
      headers: coupleHeaders(coupleToken),
    });
    expect([200, 404]).toContain(disconnectRes.status());
  });

  test('vendor music preferences endpoint returns matcher payload for accepted offer', async ({ request }) => {
    const offersRes = await request.get(`${BASE}/api/vendor/offers`, {
      headers: vendorHeaders(vendorToken),
    });
    expect(offersRes.status()).toBe(200);
    const offers = await offersRes.json();
    expect(Array.isArray(offers)).toBe(true);

    const accepted = offers.find((offer: any) => offer.status === 'accepted');
    if (!accepted) {
      test.skip(true, 'No accepted vendor offer available in this environment');
    }

    const prefsRes = await request.get(`${BASE}/api/vendor/music/preferences/${accepted.id}`, {
      headers: vendorHeaders(vendorToken),
    });

    if (prefsRes.status() === 404) {
      test.skip(true, 'music_matcher_v1 is disabled in this environment');
    }

    expect(prefsRes.status()).toBe(200);
    const body = await prefsRes.json();
    expect(body).toHaveProperty('matcherProfile');
    expect(Array.isArray(body.sets)).toBe(true);
    expect(Array.isArray(body.moments)).toBe(true);
  });
});
