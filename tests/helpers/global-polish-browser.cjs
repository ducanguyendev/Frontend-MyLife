// QA-only synthetic records. Every API request is intercepted; provider networking is blocked.
const { mapData } = require('./stabilization-browser.cjs');
const { users, logs, stats } = require('./admin-browser.cjs');
const stamp = '2026-11-08T10:00:00Z';
const members = [
  { id: 1, fullName: 'Nguyễn Quỳnh Ánh', generation: 1, gender: 'Nữ', spouseId: 2, childIds: [3], address: 'Địa chỉ kiểm thử, Hà Nội', latitude: 21.02, longitude: 105.83 },
  { id: 2, fullName: 'Trần Minh Khôi', generation: 1, gender: 'Nam', spouseId: 1, childIds: [3] },
  { id: 3, fullName: 'Nguyễn Quỳnh Ánh — Tên dài dành riêng cho kiểm tra giao diện', generation: 2, gender: 'Nữ', fatherId: 2, motherId: 1 },
].map(member => ({ role: 'Thành viên', lifeStatus: 'LIVING', dateOfBirth: '1985-02-12', email: 'member@example.test', biography: 'Tư liệu kiểm thử giao diện. A family story preserved across generations.', horizontalRelations: [], createdAt: stamp, updatedAt: stamp, ...member }));
const timeline = [2026, 2025].map((year, i) => ({ id: i + 1, eventType: i ? 'CUSTOM' : 'MEMORY', title: i ? 'A quiet afternoon across generations' : 'Ngày sum họp gia đình', memberId: 1, memberName: members[0].fullName, description: 'Tư liệu kiểm thử: lưu lại những câu chuyện, con người và địa điểm thân quen.', eventDate: `${year}-05-20`, eventYear: year, isApproximate: false, location: 'Hà Nội', latitude: null, longitude: null, relatedMemberId: null, sourceType: 'MANUAL', sourceId: null, isDerived: false }));
const anniversaries = [{ id: 1, eventType: 'FAMILY_EVENT', title: 'Ngày gia đình — A day to remember together', relatedMemberId: 1, relatedMemberName: members[0].fullName, originalSolarDate: '2025-11-20', nextSolarDate: '2026-11-20', daysUntil: 11, place: 'Family home', host: 'Our family', notes: 'Tư liệu kiểm thử.', createdAt: stamp, updatedAt: stamp }];
const photos = [1, 2].map(id => ({ id, title: id === 1 ? 'Khu vườn ký ức' : 'Stories across generations', description: 'Tư liệu kiểm thử giao diện, sử dụng asset công khai có sẵn.', author: 'Review family', displayDate: '08/11/2026', category: 'family', driveFileId: `qa-${id}`, url: '/assets/landing/garden-memory.jpg', fileName: 'review.jpg', contentType: 'image/jpeg', fileSize: 180000, sortOrder: id, takenAt: null, createdAt: stamp }));
const albums = [{ id: 1, name: 'Những mùa sum họp', description: 'Small moments, familiar faces, and a place to belong.', photoCount: 2, coverPhotoId: 1, coverPhotoUrl: null, createdAt: stamp, updatedAt: stamp, photos }, { id: 2, name: 'The family archive across many generations', description: 'Tư liệu kiểm thử tên album dài và mô tả nhiều dòng.', photoCount: 0, coverPhotoId: null, coverPhotoUrl: null, createdAt: stamp, updatedAt: stamp, photos: [] }];
async function createReviewPage(browser, { width = 1440, height = 900, theme = 'light', language = 'vi', touch = false } = {}) {
  const page = await browser.newPage(); page.setDefaultTimeout(20000);
  await page.setViewport({ width, height, isMobile: touch, hasTouch: touch });
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await page.evaluateOnNewDocument(({ theme, language }) => {
    // Touch emulation can recreate an opaque about:blank document before navigation.
    if (!['localhost', '127.0.0.1'].includes(location.hostname)) return;
    localStorage.setItem('app_language', language);
    localStorage.setItem('portfolio-theme-preference', theme);
  }, { theme, language });
  const state = { role: 'USER', anonymous: false, mode: 'normal', gate: null, errors: [], writes: [] };
  page.on('pageerror', error => state.errors.push(error.message.replace(/([?&]apikey=)[^&\s]+/gi, '$1[redacted]')));
  await page.setRequestInterception(true);
  page.on('request', async request => {
    const url = new URL(request.url()), route = url.pathname, method = request.method();
    if (!['localhost', '127.0.0.1'].includes(url.hostname)) return request.abort();
    if (!route.startsWith('/api/')) return request.continue();
    const headers = { 'Access-Control-Allow-Origin': request.headers().origin || '*', 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': request.headers()['access-control-request-headers'] || 'content-type,x-requested-with', 'Access-Control-Allow-Methods': 'GET,OPTIONS,POST,PUT,DELETE' };
    let status = 200, body = { success: true, data: [] };
    try {
      if (method === 'OPTIONS') return await request.respond({ status: 204, headers });
      if (route.startsWith('/api/avatar/')) return await request.respond({ status: 200, headers, contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect width="96" height="96" fill="#66816e"/><circle cx="48" cy="34" r="17" fill="#e7eee7"/><path d="M16 96c0-40 64-40 64 0" fill="#e7eee7"/></svg>' });
      if (method !== 'GET') { state.writes.push({ route, method }); status = 400; body = { message: 'QA fixture rejects writes' }; }
      if (route === '/api/me') {
        status = state.anonymous ? 401 : 200;
        body = state.anonymous ? { message: 'Unauthorized' } : { id: 1, email: 'long.address.for.global.polish.review.across.languages@example.test', displayName: 'Nguyễn Quỳnh Ánh — Review Account', fullName: 'Nguyễn Quỳnh Ánh — Review Account', role: state.role, roles: [state.role], isActive: true, authProvider: 0, loginProviders: { local: true }, phoneNumber: '0000000000', gender: 'Nữ', dateOfBirth: '2000-05-10' };
      } else if (route === '/api/refresh-token') { status = 401; body = { message: 'Unauthorized' }; }
      else if (route === '/api/admin/stats') body = stats(users);
      else if (route === '/api/admin/users') body = users;
      else if (route === '/api/admin/logs') body = logs;
      else if (route === '/api/family-tree') body.data = state.mode === 'empty' ? [] : members;
      else if (route.endsWith('/generations')) body.data = [1, 2].map(id => ({ id, name: String(id) }));
      else if (route.endsWith('/profile')) body.data = { member: members[0], relatives: members.slice(1), timeline, anniversaries, libraryMemberLinkAvailable: false };
      else if (route === '/api/family-tree/timeline') body.data = state.mode === 'empty' ? [] : timeline;
      else if (route === '/api/family-tree/anniversaries') body.data = state.mode === 'empty' ? [] : anniversaries;
      else if (route === '/api/family-tree/map') body.data = mapData(members);
      else if (route === '/api/library/overview') body = { categories: [], albums: state.mode === 'empty' ? [] : albums };
      else if (/^\/api\/library\/albums\/\d+$/.test(route)) body = albums[0];
      else if (/^\/api\/library\/photos\/\d+\/image$/.test(route)) return await request.respond({ status: 302, headers: { ...headers, Location: (process.env.MYLIFE_UI_URL || 'http://127.0.0.1:7009') + '/assets/landing/garden-memory.jpg' } });
      if (state.gate && route !== '/api/me') await state.gate;
      if (state.mode === 'error' && !['/api/me', '/api/refresh-token'].includes(route)) { status = 503; body = { message: 'Synthetic read error' }; }
      await request.respond({ status, headers, contentType: 'application/json', body: JSON.stringify(body) });
    } catch { /* Deliberate route changes can cancel a fixture response. */ }
  });
  return { page, state, go: route => page.goto((process.env.MYLIFE_UI_URL || 'http://127.0.0.1:7009') + route, { waitUntil: 'domcontentloaded' }) };
}
async function ready(page, selector) {
  await page.waitForSelector(selector, { visible: true });
  await page.waitForFunction(selector => {
    let element = document.querySelector(selector);
    if (!element) return false;
    while (element) { if (Number(getComputedStyle(element).opacity) < .99) return false; element = element.parentElement; }
    return true;
  }, {}, selector);
  await page.evaluate(async () => { await document.fonts.ready; await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))); });
}
module.exports = { createReviewPage, ready };
