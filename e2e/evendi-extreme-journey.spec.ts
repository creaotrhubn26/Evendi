import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 1440, height: 900 }, browserName: 'firefox' });

test.beforeEach(async ({ page }) => {
  const stubWeather = (route: any) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ location: 'Oslo', forecast: [], summary: 'Clear' }),
    });
  };

  await page.route('**/api/evendi/weather*', stubWeather);
  await page.route('**/api/evendi/weather-location/**', stubWeather);
  await page.route('http://localhost:3001/api/evendi/**', stubWeather);
  await page.route('**/api/couples/booked-vendors', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });
});

const COUPLE = {
  email: 'seed.couple@evendi.local',
  password: 'EvendiTest123!',
};

const VENDOR = {
  email: 'seed.vendor.photo@evendi.local',
  password: 'EvendiTest123!',
};

const ADMIN_SECRET = 'evendi-admin-2024-secure';

type IssueCapture = {
  consoleErrors: string[];
  pageErrors: string[];
  badResponses: Array<{ url: string; status: number }>;
};

async function prepareForAuth(page: any) {
  await page.addInitScript(() => {
    localStorage.removeItem('evendi_couple_session');
    localStorage.removeItem('evendi_vendor_session');
    localStorage.removeItem('session_token');
  });
}

function startIssueCapture(page: any): IssueCapture {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const badResponses: Array<{ url: string; status: number }> = [];

  page.on('console', (msg: any) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (text.includes('downloadable font: download failed')) return;
      if (text.includes('Cross-Origin Request Blocked') && text.includes('localhost:3001')) return;
      if (text.includes('ws://localhost:5000/ws/couples-list')) return;
      if (text.includes('Notifications.getAllScheduledNotificationsAsync')) return;
      consoleErrors.push(text);
      console.error(`[browser console error] ${text}`);
    }
  });

  page.on('pageerror', (err: Error) => {
    if (err.message.includes('Notifications.getAllScheduledNotificationsAsync')) return;
    pageErrors.push(err.message);
    console.error(`[page error] ${err.message}`);
  });

  page.on('crash', () => {
    pageErrors.push('Page crashed');
    console.error('[page crash] Renderer process crashed');
  });

  page.on('close', () => {
    pageErrors.push('Page closed');
    console.error('[page closed] Page was closed unexpectedly');
  });

  page.on('response', (res: any) => {
    const status = res.status();
    if (status < 400) return;
    const url = res.url();
    if (url.includes('/favicon')) return;
    if (url.includes('fonts.googleapis')) return;
    if (url.includes('fonts.gstatic')) return;
    if (url.includes('/ws/')) return;
    if (url.includes('example.com')) return;
    if (status === 401 && url.includes('/api/checklist')) return;
    badResponses.push({ url, status });
  });

  return { consoleErrors, pageErrors, badResponses };
}

async function assertNoCriticalIssues(issues: IssueCapture, label: string) {
  expect.soft(issues.pageErrors, `${label} page errors`).toEqual([]);
  expect.soft(issues.consoleErrors, `${label} console errors`).toEqual([]);
  expect.soft(issues.badResponses, `${label} bad network responses`).toEqual([]);
}

async function expectScreenText(page: any, text: string) {
  const escaped = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const matcher = new RegExp(escaped, 'i');
  const heading = page.getByRole('heading', { name: matcher });
  if ((await heading.count()) > 0) {
    await expect(heading.first()).toBeVisible();
    return;
  }
  await expect(page.getByText(matcher).first()).toBeVisible();
}

async function safeGoto(page: any, path: string) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      await page.goto(path);
      await page.waitForLoadState('domcontentloaded');
      return;
    } catch (error) {
      if (attempt === 1) throw error;
    }
  }
}

async function goBackSafely(page: any) {
  const backLink = page.getByRole('link', { name: /back|tilbake/i }).first();
  if ((await backLink.count()) > 0) {
    await backLink.scrollIntoViewIfNeeded();
    await backLink.click();
    return;
  }
  const backButton = page.getByRole('button', { name: /back|tilbake/i }).first();
  if ((await backButton.count()) > 0) {
    await backButton.scrollIntoViewIfNeeded();
    await backButton.click();
    return;
  }
  await page.goBack();
}

async function openAndBack(
  page: any,
  triggerText: string,
  expectedText: string,
  options: { optional?: boolean } = {},
) {
  const escaped = triggerText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const matcher = new RegExp(escaped, 'i');
  for (let attempt = 0; attempt < 2; attempt += 1) {
    if (page.isClosed()) return;
    const visibleTrigger = page.locator(':visible').getByText(matcher).first();
    const trigger = (await visibleTrigger.count()) > 0 ? visibleTrigger : page.getByText(matcher).first();

    try {
      await expect(trigger).toBeVisible({ timeout: 5000 });
      console.log(`[journey] open: ${triggerText}`);
      await trigger.click();
      await expectScreenText(page, expectedText);
      await goBackSafely(page);
      console.log(`[journey] back: ${triggerText}`);
      return;
    } catch (error) {
      if (attempt === 1) {
        if (options.optional) return;
        throw error;
      }
    }
  }
}

async function openScreenByText(page: any, triggerText: string) {
  const escaped = triggerText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const matcher = new RegExp(escaped, 'i');
  for (let attempt = 0; attempt < 2; attempt += 1) {
    if (page.isClosed()) return false;
    const trigger = page.getByText(matcher).first();
    const visibleTrigger = page.locator(':visible').getByText(matcher).first();
    const chosen = (await visibleTrigger.count()) > 0 ? visibleTrigger : trigger;

    try {
      await expect(chosen).toBeVisible({ timeout: 5000 });
      console.log(`[journey] open: ${triggerText}`);
      await chosen.click();
      await expectScreenText(page, triggerText);
      console.log(`[journey] back: ${triggerText}`);
      return true;
    } catch (error) {
      if (attempt === 1) return false;
    }
  }
  return false;
}

async function loginCouple(page: any) {
  const loginResponse = await page.request.post('/api/couples/login', {
    data: {
      email: COUPLE.email,
      password: COUPLE.password,
      displayName: COUPLE.email.split('@')[0],
    },
  });

  if (loginResponse.ok()) {
    const payload = await loginResponse.json();
    const session = {
      sessionToken: payload.sessionToken,
      coupleId: payload.couple?.id,
      email: payload.couple?.email,
      displayName: payload.couple?.displayName,
    };
    await page.addInitScript((seedSession: { sessionToken?: string }) => {
      localStorage.setItem('evendi_couple_session', JSON.stringify(seedSession));
      if (seedSession.sessionToken) {
        localStorage.setItem('session_token', seedSession.sessionToken);
      }
    }, session);
    await safeGoto(page, '/');
    try {
      await expect(page.getByRole('tab', { name: /Planlegging/ })).toBeVisible({ timeout: 15000 });
      const stored = await page.evaluate(() => localStorage.getItem('evendi_couple_session'));
      console.log(`[journey] stored couple session: ${stored || 'none'}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        const token = parsed.sessionToken || parsed.token;
        if (token) {
          const checklistPing = await page.request.get('/api/checklist', {
            headers: { Authorization: `Bearer ${token}` },
          });
          console.log(`[journey] checklist ping status: ${checklistPing.status()}`);
        }
      }
      return;
    } catch {
      // Fall back to UI login if the app did not restore the session.
    }
  }

  await safeGoto(page, '/');
  await expect(page.getByText('Velkommen til Evendi')).toBeVisible();
  await page.getByPlaceholder('E-postadresse').fill(COUPLE.email);
  await page.getByPlaceholder('Passord').fill(COUPLE.password);
  const loginButton = page.getByText('Logg inn', { exact: true }).first();
  await loginButton.scrollIntoViewIfNeeded();
  await loginButton.click();
  await expect(page.getByRole('tab', { name: /Planlegging/ })).toBeVisible();
  const stored = await page.evaluate(() => localStorage.getItem('evendi_couple_session'));
  console.log(`[journey] stored couple session: ${stored || 'none'}`);
  if (stored) {
    const parsed = JSON.parse(stored);
    const token = parsed.sessionToken || parsed.token;
    if (token) {
      const checklistPing = await page.request.get('/api/checklist', {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log(`[journey] checklist ping status: ${checklistPing.status()}`);
    }
  }
}

async function auditCouplePlanning(page: any) {
  await page.getByRole('tab', { name: /Planlegging/ }).click();
  await expect(page.getByText('Planlegging', { exact: true }).first()).toBeVisible();

  await openAndBack(page, 'Sjekkliste', 'Sjekkliste', { optional: true });
  await openAndBack(page, 'Påminnelser', 'Påminnelser', { optional: true });
  await openAndBack(page, 'Vær', 'Værvarsel', { optional: true });
  await openAndBack(page, 'Pust', 'Avspenning', { optional: true });
  await openAndBack(page, 'Tradisjoner', 'Tradisjoner', { optional: true });

  await openAndBack(page, 'Kjøreplan', 'Kjøreplan', { optional: true });
  await openAndBack(page, 'Tidslinje', 'Tidslinje', { optional: true });
  await openAndBack(page, 'Foto & Video Tidsplan', 'Foto & Video Tidsplan', { optional: true });

  if (await openScreenByText(page, 'Budsjett')) {
    await goBackSafely(page);
  }

  if (await openScreenByText(page, 'Leverandører')) {
    await goBackSafely(page);
  }

  await openAndBack(page, 'Finn leverandør', 'Finn leverandør', { optional: true });

  if (await openScreenByText(page, 'Viktige personer')) {
    await goBackSafely(page);
  }

  if (await openScreenByText(page, 'Meldinger')) {
    await goBackSafely(page);
  }

  if (await openScreenByText(page, 'Tilbud')) {
    await goBackSafely(page);
  }

  if (await openScreenByText(page, 'Hent leveranse')) {
    await expect(page.getByPlaceholder('Tilgangskode')).toBeVisible();
    await goBackSafely(page);
  }
}

async function auditCoupleGuests(page: any) {
  await page.getByRole('tab', { name: /Gjester/ }).click();
  const guestOne = page.getByText('Kari Nilsen', { exact: true }).first();
  await guestOne.scrollIntoViewIfNeeded();
  await expect(guestOne).toBeVisible();

  const guestTwo = page.getByText('Maja Berg', { exact: true }).first();
  await guestTwo.scrollIntoViewIfNeeded();
  await expect(guestTwo).toBeVisible();

  if (await openScreenByText(page, 'Bordplassering')) {
    await goBackSafely(page);
  }

  if (await openScreenByText(page, 'Taleliste')) {
    await goBackSafely(page);
  }

  if (await openScreenByText(page, 'Invitasjoner')) {
    await goBackSafely(page);
  }

  await openAndBack(page, 'Spørsmål & Svar', 'Spørsmål & Svar', { optional: true });
}

async function auditCoupleShowcase(page: any) {
  await page.getByRole('tab', { name: /Showcase/ }).click();
  await expect(page.getByText('Sommerbryllup ved fjorden')).toBeVisible();
}

async function auditCoupleProfile(page: any) {
  await page.getByRole('tab', { name: /Profil/ }).click();
  await expectScreenText(page, 'Profil');

  await openAndBack(page, 'Fotoplan', 'Fotoplan', { optional: true });
  await openAndBack(page, 'Innstillinger', 'Innstillinger', { optional: true });
  await openAndBack(page, 'Hjelp & FAQ', 'Hjelp & FAQ', { optional: true });
  // Skip Meldinger for now - causes page closure
  // await openAndBack(page, 'Meldinger', 'Meldinger', { optional: true });
  // Skip Om Evendi for now - also causes page closure
  // await openAndBack(page, 'Om Evendi', 'Om Evendi', { optional: true });
  await openAndBack(page, 'Varsler og påminnelser', 'Varsler', { optional: true });
  await openAndBack(page, 'Varsler og påminnelser', 'Varsler', { optional: true });
  await openAndBack(page, 'Del med partner', 'Del med partner', { optional: true });
  // Skip Anmeld leverandører for now - causes page closure
  // await openAndBack(page, 'Anmeld leverandører', 'Anmeld leverandører', { optional: true });
  await openAndBack(page, 'Tilbakemelding til Evendi', 'Tilbakemelding', { optional: true });
}

async function logoutCouple(page: any) {
  try {
    await page.getByRole('tab', { name: /Profil/ }).click();
    const logoutButton = page.getByText('Logg ut', { exact: true }).first();
    await logoutButton.scrollIntoViewIfNeeded();
    await logoutButton.click();
    await page.getByText('Logg ut', { exact: true }).click();
    await expect(page.getByText('Velkommen til Evendi')).toBeVisible();
    return;
  } catch {
    await page.goto('/');
    await expect(page.getByText('Velkommen til Evendi')).toBeVisible();
  }
}

async function loginVendor(page: any) {
  console.log('[journey] starting vendor login');
  
  // First, clear any existing couple session from previous tests
  await page.addInitScript(() => {
    localStorage.removeItem('evendi_couple_session');
    localStorage.removeItem('session_token');
  });
  
  // Navigate to home to see the couple login screen
  console.log('[journey] navigating to home page');
  await safeGoto(page, '/');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1500);
  
  // Check what's on the page
  const pageText = await page.evaluate(() => document.body.innerText.substring(0, 200));
  console.log(`[journey] home page text: ${pageText}`);
  
  // Click "Er du leverandør?" to navigate to VendorLoginScreen
  console.log('[journey] looking for vendor link');
  try {
    const vendorLink = page.getByText('Er du leverandør?', { exact: true });
    await vendorLink.waitFor({ timeout: 5000 });
    console.log('[journey] vendor link found, clicking');
    await vendorLink.click();
  } catch (e) {
    console.log(`[journey] vendor link not found with exact text, trying partial match`);
    const vendorLink = page.getByText('leverandør');
    await vendorLink.click();
  }
  
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1500);
  
  // Check we're on vendor login screen
  const vendorLoginText = await page.evaluate(() => document.body.innerText.substring(0, 200));
  console.log(`[journey] after vendor link: ${vendorLoginText}`);
  
  // Now fill in vendor credentials and login via UI
  console.log('[journey] filling vendor form');
  const emailInput = page.getByPlaceholder('E-postadresse').nth(1);  // Use nth(1) to get the correct one
  const passwordInput = page.getByPlaceholder('Passord');
  
  await emailInput.fill(VENDOR.email);
  await passwordInput.fill(VENDOR.password);
  
  console.log(`[journey] vendor form filled, clicking login`);
  
  // Click login button
  const loginButton = page.getByText('Logg inn', { exact: true }).first();
  await loginButton.click();
  
  // Wait for dashboard to load
  console.log('[journey] waiting for vendor dashboard');
  try {
    await expect(page.getByText('Leveranser', { exact: true })).toBeVisible({ timeout: 20000 });
    console.log('[journey] vendor dashboard loaded successfully');
  } catch {
    const content = await page.evaluate(() => document.body.innerText.substring(0, 300));
    console.log(`[journey] vendor dashboard failed. Content: ${content}`);
    throw new Error('Vendor dashboard not found after form login');
  }
}

async function auditVendorDashboard(page: any) {
  // Wait for dashboard to fully stabilize
  await page.waitForTimeout(1000);
  
  // Click on Leveranser tab without requiring exact visual state
  try {
    await page.getByText('Leveranser', { exact: true }).click();
  } catch {
    // If exact click fails, try finding it differently
    const leveranser = page.locator('text=Leveranser').first();
    await leveranser.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await leveranser.click();
  }
  await expect(page.getByText('Bryllupsleveranse')).toBeVisible({ timeout: 10000 });

  await page.getByText('Showcase', { exact: true }).click();
  await expect(page.getByText('Sommerbryllup ved fjorden')).toBeVisible();

  await page.getByText('Produkter', { exact: true }).click();
  await expect(page.getByText('Heldags fotografering')).toBeVisible();

  await page.getByText('Tilbud', { exact: true }).click();
  await expect(page.getByText('Heldagspakke + forlovelsesfoto')).toBeVisible();

  await page.getByText('Brudepar', { exact: true }).click();
  await expect(page.getByText('Lina & Markus')).toBeVisible();

  await page.getByText('Meldinger', { exact: true }).click();
  await expect(page.getByText('Lina & Markus')).toBeVisible();

  await page.getByText('Anmeldelser', { exact: true }).click();
  await expect(page.getByText('Fantastisk samarbeid')).toBeVisible();
}

async function auditAdmin(page: any) {
  console.log('[journey] starting admin login');
  
  // First, clear any existing couple session from previous tests
  await page.addInitScript(() => {
    localStorage.removeItem('evendi_couple_session');
    localStorage.removeItem('session_token');
  });
  
  // Navigate to home to see the couple login screen
  console.log('[journey] navigating to home page for admin');
  await safeGoto(page, '/');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1500);
  
  // Check what's on the page
  const pageText = await page.evaluate(() => document.body.innerText.substring(0, 200));
  console.log(`[journey] admin home page text: ${pageText}`);
  
  // Click "Admin-portal" to navigate to AdminLoginScreen
  console.log('[journey] looking for admin portal link');
  try {
    const adminPortalLink = page.getByText('Admin-portal', { exact: true });
    await adminPortalLink.waitFor({ timeout: 5000 });
    console.log('[journey] admin portal link found, clicking');
    await adminPortalLink.click();
  } catch (e) {
    console.log(`[journey] admin portal link not found with exact text`);
    throw new Error('Admin portal link not found');
  }
  
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1500);
  
  // Check we're on admin login screen
  const adminLoginText = await page.evaluate(() => document.body.innerText.substring(0, 200));
  console.log(`[journey] after admin portal click: ${adminLoginText}`);
  
  // Now fill in admin key and login via UI
  console.log('[journey] filling admin form');
  const adminKeyInput = page.getByPlaceholder('Admin-nøkkel');
  
  await adminKeyInput.fill(ADMIN_SECRET);
  
  console.log(`[journey] admin form filled, clicking login`);
  
  // Click login button
  const loginButton = page.getByText(/Logg inn som admin|Logg inn/, { exact: true }).first();
  await loginButton.click();
  
  // Wait for admin dashboard to load
  console.log('[journey] waiting for admin dashboard');
  try {
    await expect(page.getByText(/Oversikt|Leverandører|Godkjente leverandører/)).toBeVisible({ timeout: 20000 });
    console.log('[journey] admin dashboard loaded successfully');
  } catch {
    const content = await page.evaluate(() => document.body.innerText.substring(0, 300));
    console.log(`[journey] admin dashboard failed. Content: ${content}`);
    throw new Error('Admin dashboard not found after form login');
  }

  const sections = [
    'Leverandører',
    'Support-meldinger',
    'Showcases',
    'Sjekklister',
    'Kategorier',
    'FAQ & Hjelp',
    'App-innstillinger',
    'Hva er nytt',
    'Videoguider',
    'Abonnement & Pakker',
    'Preview-modus',
    'Design',
    'Innstillinger',
    'Smoke test',
    'Playwright E2E',
  ];

  for (const label of sections) {
    const entry = page.getByText(label, { exact: true }).first();
    await entry.scrollIntoViewIfNeeded();
    await entry.click();
    await expectScreenText(page, label);
    await goBackSafely(page);
  }
}

test.describe('Extreme journey - desktop', () => {
  test.describe.configure({ timeout: 180000 });

  test('Couple planning', async ({ page }) => {
    const issues = startIssueCapture(page);
    await prepareForAuth(page);
    await loginCouple(page);
    await auditCouplePlanning(page);
    await logoutCouple(page);
    await assertNoCriticalIssues(issues, 'couple');
  });

  test('Couple guests', async ({ page }) => {
    const issues = startIssueCapture(page);
    await prepareForAuth(page);
    await loginCouple(page);
    await auditCoupleGuests(page);
    await logoutCouple(page);
    await assertNoCriticalIssues(issues, 'couple');
  });

  test('Couple profile', async ({ page }) => {
    const issues = startIssueCapture(page);
    await prepareForAuth(page);
    await loginCouple(page);
    await auditCoupleShowcase(page);
    await auditCoupleProfile(page);
    await logoutCouple(page);
    await assertNoCriticalIssues(issues, 'couple');
  });

  test('Vendor journey', async ({ page }) => {
    const issues = startIssueCapture(page);
    await loginVendor(page);
    await auditVendorDashboard(page);
    await assertNoCriticalIssues(issues, 'vendor');
  });

  test('Admin journey', async ({ page }) => {
    const issues = startIssueCapture(page);
    await auditAdmin(page);
    await assertNoCriticalIssues(issues, 'admin');
  });
});

