const path = require('node:path');
const fs = require('node:fs');
const stamp = '2026-11-09T00:00:00Z';
const member = (id, fullName, generation, extra = {}) => ({ id, fullName, generation, gender: 'Nam', role: 'Thành viên', lifeStatus: 'LIVING', childIds: [], horizontalRelations: [], createdAt: stamp, updatedAt: stamp, ...extra });
// IDs and parent paths from the repository's existing Nguyen family regression fixture.
const members = [
  member(1, 'Mai Thu', 1, { gender: 'Nữ', spouseId: 2, childIds: [3,4,5], address: 'Quận 1, Hồ Chí Minh', latitude: 10.77, longitude: 106.69 }),
  member(2, 'Nguyễn Bửu', 1, { spouseId: 1, address: 'Hồ Chí Minh', latitude: 10.77, longitude: 106.69 }),
  member(3, 'Nguyễn Mai Anh', 2, { gender: 'Nữ', fatherId: 1, motherId: 2, childIds: [9,10], address: 'Hà Nội', latitude: 21.02, longitude: 105.83 }),
  member(4, 'Nguyễn Mai Sơn', 2, { fatherId: 1, motherId: 2, childIds: [11], address: 'Đà Nẵng', latitude: 16.07, longitude: 108.22 }),
  member(5, 'Nguyễn Mai Hồng Sơn', 2, { fatherId: 1, motherId: 2, spouseId: 6, childIds: [7,8,12] }),
  member(6, 'Nguyễn Thị Hồng Nhung', 2, { gender: 'Nữ', spouseId: 5, childIds: [7,8,12] }),
  member(7, 'Nguyễn Hoàng Minh', 3, { fatherId: 5, motherId: 6 }),
  member(8, 'Nguyễn Hoàng Anh', 3, { fatherId: 5, motherId: 6 }),
  member(9, 'Nguyễn Huỳnh Minh Đức', 3, { fatherId: 3, dateOfBirth: '2005-12-16', address: 'Đường Nguyễn Huệ, Hồ Chí Minh', latitude: 10.77, longitude: 106.69 }),
  member(10, 'Nguyễn Huỳnh Quốc Bảo', 3, { fatherId: 3 }),
  member(11, 'Nguyễn Sơn Tùng', 3, { fatherId: 4, horizontalRelations: [{ memberId: 9, relationType: 'Sibling' }] }),
  member(12, 'Nguyễn Hoàng Yến', 3, { gender: 'Nữ', fatherId: 5, motherId: 6 }),
  member(13, 'Thành viên thế hệ sau', 4, { fatherId: 10 }),
  member(14, 'Thành viên chưa định vị', 2, { address: 'Đà Lạt', locationStatus: 'FAILED' }),
];

function mapData(records) {
  const locations = new Map();
  for (const item of records.filter(m => m.latitude != null && m.longitude != null)) {
    const key = `${item.latitude}:${item.longitude}`;
    const value = locations.get(key) ?? { key, displayName: item.id === 4 ? 'Miền Trung' : item.address, latitude: item.latitude, longitude: item.longitude, members: [] };
    value.members.push({ id: item.id, fullName: item.fullName, generation: item.generation }); locations.set(key, value);
  }
  const locatedMembers = records.filter(m => m.latitude != null && m.longitude != null).length;
  return { totalMembers: records.length, locatedMembers, unlocatedMembers: records.length - locatedMembers, pendingGeocodingMembers: 0, noAddressMembers: 0, failedGeocodingMembers: 1,
    locations: [...locations.values()].map(location => ({ ...location, memberCount: location.members.length })),
    members: records.map(item => ({ ...item, status: item.latitude != null && item.longitude != null ? 'LOCATED' : item.locationStatus ?? 'UNAVAILABLE' })) };
}

const redact = value => String(value).replace(/([?&]apikey=)[^&\s"'<>]+/gi, '$1[redacted]');
async function setupPage(browser, base, { width = 1440, height = 900, theme = 'light', language = 'vi' } = {}) {
  const page = await browser.newPage(); page.setDefaultTimeout(20000);
  const state = { members: structuredClone(members), writes: [], errors: [], providerResponses: [], providerMessages: [], providerFailure: false, relationshipReversed: false };
  await page.setViewport({ width, height });
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await page.evaluateOnNewDocument(({ theme, language }) => { localStorage.setItem('app_language', language); localStorage.setItem('portfolio-theme-preference', theme); }, { theme, language });
  page.on('pageerror', error => state.errors.push(redact(error.message)));
  page.on('console', message => { if (['error','warn'].includes(message.type())) state.providerMessages.push(redact(message.text())); });
  page.on('response', response => {
    const url = new URL(response.url());
    if (url.hostname === 'maps.vietmap.vn') state.providerResponses.push({ path: url.pathname, status: response.status() });
  });
  await page.setRequestInterception(true);
  page.on('request', async request => {
    const url = new URL(request.url()), p = url.pathname, method = request.method();
    if (url.hostname === 'maps.vietmap.vn' && state.providerFailure) return request.respond({ status: 503, contentType: 'application/json', body: '{}' });
    if (!['localhost', '127.0.0.1'].includes(url.hostname) || !p.startsWith('/api/')) return request.continue();
    if (p === '/api/family-tree/map') {
      if (state.mapResponseGate) await state.mapResponseGate;
      if (state.mapApiFailure) return request.respond({status:503,contentType:'application/json',headers:{'Access-Control-Allow-Origin':request.headers().origin||'*','Access-Control-Allow-Credentials':'true'},body:JSON.stringify({message:'Synthetic API failure'})});
    }
    let body = { success: true, data: [] };
    if (method !== 'GET' && method !== 'OPTIONS') state.writes.push({ path: p, method, payload: request.postData() });
    if (p === '/api/me') body = { id: 42, email: 'review@example.test', displayName: 'Stabilization review', fullName: 'Review Account', role: 'USER', roles: ['USER'], authProvider: 0, loginProviders: { local: true }, isActive: true, phoneNumber: '0912345678', gender: 'Nam', dateOfBirth: '2000-05-10' };
    else if (p === '/api/family-tree') body.data = state.members;
    else if (p === '/api/family-tree/generations') body.data = [1,2,3,4].map(id => ({ id, name: String(id) }));
    else if (p === '/api/family-tree/map') body.data = mapData(state.members);
    else if (/\/\d+\/location$/.test(p) && method === 'PUT') {
      const id = Number(p.split('/')[3]), payload = JSON.parse(request.postData());
      state.members = state.members.map(item => item.id === id ? { ...item, ...payload, locationSource: 'MANUAL' } : item);
    } else if (p.endsWith('/retry-geocoding')) body.data = { queued: 1, skippedManual: 0, skippedLocated: 0, noAddress: 0 };
    else if (/\/\d+\/profile$/.test(p)) {
      const id = Number(p.split('/')[3]);
      body.data = { member: state.members.find(item => item.id === id), relatives: state.members.filter(item => item.id !== id), timeline: [], anniversaries: [], libraryMemberLinkAvailable: false };
    } else if (p.endsWith('/relationship')) {
      const from = Number(url.searchParams.get('fromMemberId')), to = Number(url.searchParams.get('toMemberId'));
      const node = id => ({ memberId: id, fullName: state.members.find(item => item.id === id).fullName });
      if (state.relationshipAnswer) body.data = state.relationshipAnswer(from, to);
      else if (from === 1 && to === 3 || from === 3 && to === 1) {
        const forward = from === 1;
        body.data = { fromMemberId: 1, toMemberId: 3, relationshipCode: 'daughter', relationshipLabel: 'Con gái', reverseRelationshipCode: 'mother', reverseRelationshipLabel: 'Mẹ', distance: 1, path: [node(1), { ...node(3), edge: 'CHILD' }] };
        if (!state.relationshipReversed && !forward) body.data = { fromMemberId: 3, toMemberId: 1, relationshipCode: 'mother', relationshipLabel: 'Mẹ', reverseRelationshipCode: 'daughter', reverseRelationshipLabel: 'Con gái', distance: 1, path: [node(3), { ...node(1), edge: 'PARENT' }] };
      } else body.data = { fromMemberId: from, toMemberId: to, relationshipCode: 'unknown', relationshipLabel: 'Chưa rõ quan hệ', reverseRelationshipCode: 'unknown', reverseRelationshipLabel: 'Chưa rõ quan hệ', distance: 0, path: [] };
    }
    try { await request.respond({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': request.headers().origin || '*', 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': request.headers()['access-control-request-headers'] || 'content-type,x-requested-with', 'Access-Control-Allow-Methods': 'GET,OPTIONS,PUT,POST,DELETE' }, body: JSON.stringify(body) }); } catch { /* A deliberate navigation may cancel a fixture request. */ }
  });
  return { page, state, go: route => page.goto(base + route, { waitUntil: 'domcontentloaded' }) };
}
function outputDirectory(name) { const dir = path.resolve(process.env.MYLIFE_REVIEW_DIR || 'docs/review-final', name); fs.mkdirSync(dir, { recursive: true }); return dir; }
async function switchTheme(page, theme) {
  await page.click('button[aria-label="Mở menu tài khoản"]');
  await page.waitForSelector('[data-user-menu]');
  await page.$eval('[data-user-menu] button:has(svg.lucide-settings)', el => el.click());
  await page.waitForSelector('.appearance-language-modal');
  await page.$$eval('.appearance-theme .ds-segments button', (buttons, index) => buttons[index].click(), theme === 'light' ? 1 : 2);
  await page.waitForFunction(theme => document.documentElement.dataset.theme === theme, {}, theme);
  await page.click('.appearance-language-modal > div:first-child button');
  await page.waitForFunction(() => !document.querySelector('.appearance-language-modal'));
}
module.exports = { members, mapData, setupPage, outputDirectory, redact, switchTheme };
