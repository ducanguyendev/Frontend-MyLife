const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const puppeteer = require('puppeteer');
const api = process.env.MYLIFE_REAL_API_URL;
const ui = process.env.MYLIFE_REAL_UI_URL;
if (!/^mylife_w10_[a-f0-9]{12}$/.test(process.env.MYLIFE_W10_ISOLATED || '') ||
    ![api, ui].every(url => url && new URL(url).hostname === '127.0.0.1')) {
  throw new Error('Use npm run test:integration: this suite requires its disposable loopback database and servers.');
}
const output = path.resolve('docs/review-w10/test-results');
const screenshots = path.resolve('docs/review-w10/screenshots/real-backend');
const checks = [];
function check(name) { checks.push({ name, status: 'PASS', transport: 'real HTTP / Kestrel / PostgreSQL' }); console.log('PASS:', name); }
function client() {
  const cookies = new Map();
  return {
    cookies,
    async request(method, route, body, options = {}) {
      const headers = { Origin: ui, 'X-Requested-With': 'MyLife', ...options.headers };
      if (cookies.size) headers.Cookie = [...cookies].map(([name, value]) => `${name}=${value}`).join('; ');
      if (options.noCsrf) delete headers['X-Requested-With'];
      if (body !== undefined) headers['Content-Type'] = 'application/json';
      let response = await fetch(api + route, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
      const setCookies = response.headers.getSetCookie();
      for (const cookie of setCookies) { const [pair] = cookie.split(';'); const at = pair.indexOf('='); const name = pair.slice(0, at), value = pair.slice(at + 1); if (value) cookies.set(name, value); else cookies.delete(name); }
      const data = response.status === 204 ? null : await response.json();
      if (options.status !== undefined) assert.equal(response.status, options.status, `${method} ${route} status`);
      return { status: response.status, data, setCookies, headers: response.headers };
    },
  };
}
const password = 'W10_User!23456789';
const registration = email => ({ fullName: 'Release Test', phoneNumber: '0912345678', gender: 'Nam', dateOfBirth: '1995-05-20', email, password, confirmPassword: password });
async function main() {
  fs.mkdirSync(screenshots, { recursive: true });
  const one = client(), two = client(), admin = client(), anonymous = client();
  const suffix = Date.now();
  const email = `w10.user.${suffix}@gmail.com`, otherEmail = `w10.other.${suffix}@gmail.com`;
  await anonymous.request('GET', '/health/live', undefined, { status: 200 });
  await anonymous.request('GET', '/health/ready', undefined, { status: 200 });
  await anonymous.request('GET', '/api/family-tree', undefined, { status: 401 });
  await one.request('POST', '/api/auth/register', registration(email), { status: 201 });
  await two.request('POST', '/api/auth/register', registration(otherEmail), { status: 201 });
  const login = await one.request('POST', '/api/login', { email, password }, { status: 200 });
  await two.request('POST', '/api/login', { email: otherEmail, password }, { status: 200 });
  await admin.request('POST', '/api/login', { email: 'w10.admin@gmail.com', password: process.env.MYLIFE_W10_ADMIN_PASSWORD }, { status: 200 });
  assert.equal(login.data.user.role, 'USER');
  assert.equal(Object.hasOwn(login.data, 'accessToken'), false);
  assert.equal(Object.hasOwn(login.data, 'refreshToken'), false);
  assert.ok(login.setCookies.length === 2 && login.setCookies.every(cookie => /httponly/i.test(cookie) && /samesite=lax/i.test(cookie)));
  check('startup, PostgreSQL readiness, role seed, registration, cookie-only web login');
  await one.request('GET', '/api/admin/stats', undefined, { status: 403 });
  await admin.request('GET', '/api/family-tree', undefined, { status: 403 });
  await one.request('POST', '/api/logout', undefined, { noCsrf: true, status: 403 });
  await one.request('POST', '/api/logout', undefined, { headers: { Origin: 'https://untrusted.invalid' }, status: 403 });
  await one.request('POST', '/api/logout', undefined, { headers: { 'X-Client-Platform': 'mobile' }, status: 403 });
  check('server RBAC, CSRF, untrusted Origin and mobile-header cookie spoof rejection');
  const memberPayload = { fullName: 'W10 Owner Member', generation: 1, gender: 'Nam', role: 'Ancestor', dateOfBirth: '1950-01-01' };
  const created = await one.request('POST', '/api/family-tree', memberPayload, { status: 201 });
  const id = created.data.data.id;
  await two.request('GET', `/api/family-tree/${id}`, undefined, { status: 404 });
  await two.request('DELETE', `/api/family-tree/${id}`, undefined, { status: 404 });
  await one.request('PUT', `/api/family-tree/${id}`, { ...memberPayload, fullName: 'W10 Updated Member' }, { status: 200 });
  const child = await one.request('POST', '/api/family-tree', { fullName: 'W10 Child', generation: 2, fatherId: id }, { status: 201 });
  assert.equal(child.data.data.fatherId, id);
  await one.request('PUT', `/api/family-tree/${id}/location`, { latitude: 200, longitude: 106 }, { status: 400 });
  await one.request('PUT', `/api/family-tree/${id}/location`, { latitude: 10.77, longitude: 106.69, displayName: 'W10 manual location' }, { status: 200 });
  const map = await one.request('GET', '/api/family-tree/map', undefined, { status: 200 });
  assert.ok(map.data.data.locations.some(location => location.members.some(member => member.id === id)));
  const foreignList = await two.request('GET', '/api/family-tree', undefined, { status: 200 });
  assert.ok(!foreignList.data.data.some(member => member.id === id));
  check('member CRUD/update persistence, parent relation, cross-account isolation, invalid and manual map coordinates');
  const timeline = { memberId: id, title: 'W10 Memory', eventType: 'MEMORY', eventDate: '2000-01-01' };
  const event = await one.request('POST', '/api/family-tree/timeline', timeline, { status: 201 });
  await one.request('PUT', `/api/family-tree/timeline/${event.data.data.id}`, { ...timeline, title: 'W10 Updated Memory' }, { status: 200 });
  await two.request('DELETE', `/api/family-tree/timeline/${event.data.data.id}`, undefined, { status: 404 });
  await one.request('DELETE', `/api/family-tree/timeline/${event.data.data.id}`, undefined, { status: 204 });
  const anniversary = { title: 'W10 Reunion', eventType: 'FAMILY_EVENT', relatedMemberId: id, originalSolarDate: '2000-01-01' };
  const occasion = await one.request('POST', '/api/family-tree/anniversaries', anniversary, { status: 201 });
  await one.request('PUT', `/api/family-tree/anniversaries/${occasion.data.data.id}`, { ...anniversary, title: 'W10 Reunion Updated' }, { status: 200 });
  await one.request('GET', '/api/family-tree/anniversaries/next-occurrence?day=1&month=1', undefined, { status: 200 });
  await one.request('DELETE', `/api/family-tree/anniversaries/${occasion.data.data.id}`, undefined, { status: 204 });
  await one.request('GET', '/api/library/overview', undefined, { status: 200 });
  await two.request('GET', '/api/library/photos/999999/image', undefined, { status: 404 });
  check('timeline/anniversary CRUD, lunar preview, library read and missing image permission path');
  const userId = login.data.user.id;
  await admin.request('PUT', `/api/admin/users/${userId}/status`, { isActive: false }, { status: 200 });
  await one.request('GET', '/api/me', undefined, { status: 401 });
  await one.request('POST', '/api/refresh-token', undefined, { status: 401 });
  await anonymous.request('POST', '/api/login', { email, password }, { status: 401 });
  await admin.request('PUT', `/api/admin/users/${userId}/status`, { isActive: true }, { status: 200 });
  await one.request('POST', '/api/login', { email, password }, { status: 200 });
  await admin.request('GET', '/api/admin/stats', undefined, { status: 200 });
  await admin.request('GET', '/api/admin/logs', undefined, { status: 200 });
  check('account lock revokes session, rejects login/refresh, unlock and admin metrics/logs');
  const staleCookies = new Map(one.cookies);
  await one.request('POST', '/api/logout', undefined, { status: 200 });
  one.cookies.clear(); for (const [key, value] of staleCookies) one.cookies.set(key, value);
  await one.request('GET', '/api/me', undefined, { status: 401 });
  await one.request('POST', '/api/refresh-token', undefined, { status: 401 });
  check('logout rejects copied access and refresh cookies immediately');
  const browser = await puppeteer.launch({ headless: true, pipe: true, timeout: 20000 });
  try {
    const page = await browser.newPage(); const errors = []; let refreshes = 0;
    await page.setViewport({ width: 1440, height: 900 });
    page.setDefaultTimeout(25000);
    page.on('pageerror', () => errors.push('pageerror'));
    await page.setRequestInterception(true);
    page.on('request', request => { if (new URL(request.url()).hostname !== '127.0.0.1') return request.abort(); if (request.method() === 'POST' && request.url().endsWith('/api/refresh-token')) refreshes++; return request.continue(); });
    await page.goto(ui, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.mylife-landing');
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('ui:openLogin')));
    await page.waitForSelector('.auth-login input[name=email]');
    await page.type('.auth-login input[name=email]', email);
    await page.type('.auth-login input[name=password]', password);
    await page.click('.auth-login button[type=submit]');
    await page.waitForFunction(() => !document.querySelector('.auth-login'));
    await page.goto(ui + '/mylife', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.my-life-hub');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.my-life-hub');
    const cookies = await page.cookies();
    assert.ok(cookies.filter(cookie => ['AccessToken', 'RefreshToken'].includes(cookie.name)).length === 2);
    assert.ok(cookies.filter(cookie => ['AccessToken', 'RefreshToken'].includes(cookie.name)).every(cookie => cookie.httpOnly));
    assert.equal(await page.evaluate(() => ['localStorage', 'sessionStorage'].some(store => Object.keys(window[store]).some(key => /^(accessToken|refreshToken)$/i.test(key)))), false);
    await new Promise(resolve => setTimeout(resolve, 5500));
    const before = refreshes;
    const concurrent = await page.evaluate(async () => {
      const { apiClient } = await import('/src/shared/api/apiClient.ts');
      return (await Promise.all(Array.from({ length: 6 }, () => apiClient.get('/api/me')))).every(user => user.role === 'USER');
    });
    assert.equal(concurrent, true); assert.equal(refreshes - before, 1, 'Concurrent requests issue one refresh POST (CORS OPTIONS is not a refresh)');
    check('real browser login, reload restoration, HttpOnly storage and six requests sharing one expired-token refresh');
    await page.goto(ui + '/familytree', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.family-toolbar');
    await page.click('.family-toolbar .ds-segments button:nth-child(2)');
    await page.waitForSelector('.family-gallery-card');
    await page.screenshot({ path: path.join(screenshots, 'real-family-cards-1440.png') });
    await page.evaluate(() => localStorage.setItem('userRole', 'ADMIN'));
    await page.goto(ui + '/Home/Admin', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => location.pathname === '/403');
    assert.equal(await page.$('.admin-console'), null);
    assert.deepEqual(errors, []);
    check('real member rendering, direct protected navigation and localStorage role spoof prevention');
  } finally { await browser.close(); }
  // Refresh each client before final cleanup, since the deliberate browser expiry wait also ages these cookies.
  await one.request('POST', '/api/login', { email, password }, { status: 200 });
  await one.request('DELETE', `/api/family-tree/${child.data.data.id}`, undefined, { status: 200 });
  await one.request('DELETE', `/api/family-tree/${id}`, undefined, { status: 200 });
  await one.request('GET', `/api/family-tree/${id}`, undefined, { status: 404 });
  check('member deletion persists after refetch');
}
main().then(() => fs.writeFileSync(path.join(output, 'real-http-browser.json'), JSON.stringify(checks, null, 2)))
  .catch(error => { fs.writeFileSync(path.join(output, 'real-http-browser.json'), JSON.stringify({ checks, failure: error.message }, null, 2)); console.error(error.message); process.exitCode = 1; });
