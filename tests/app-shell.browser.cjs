// Isolated UI smoke test. API interception never forwards fixture requests to the backend.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const puppeteer = require('../scratch_puppeteer/node_modules/puppeteer');
const root = path.resolve(__dirname, '..');
const artifacts = path.join(root, 'docs', 'review-w2-w3');
const base = process.env.MYLIFE_UI_URL || 'http://127.0.0.1:7000';
const stamp = '2026-11-03T00:00:00Z';
const person = (id, fullName, generation, extra = {}) => ({ id, fullName, generation, gender: 'Nam', lifeStatus: 'LIVING', childIds: [], horizontalRelations: [], createdAt: stamp, updatedAt: stamp, ...extra });
const members = [person(1, 'Nguyễn An', 1, { spouseId: 2, childIds: [3, 4] }), person(2, 'Trần Mai', 1, { gender: 'Nữ', spouseId: 1, childIds: [3, 4] }), person(3, 'Nguyễn Minh', 2, { fatherId: 1, motherId: 2, childIds: [5] }), person(4, 'Nguyễn Lan', 2, { gender: 'Nữ', fatherId: 1, motherId: 2 }), person(5, 'Nguyễn Bình', 3, { fatherId: 3 })];
const timeline = [{ id: 1, title: 'A family gathering', eventType: 'CUSTOM', description: 'An afternoon of shared stories.', memberId: 1, memberName: 'Nguyễn An', eventDate: '2025-05-20', eventYear: 2025, isApproximate: false, location: null, latitude: null, longitude: null, relatedMemberId: null, sourceType: 'MANUAL', sourceId: null, isDerived: false }];
const anniversaries = [{ id: 1, title: 'Family reunion', eventType: 'FAMILY_EVENT', relatedMemberId: 1, relatedMemberName: 'Nguyễn An', relatedMemberGeneration: 1, relatedMemberRole: null, nextSolarDate: '2026-11-10', nextLunarYear: 2026, daysUntil: 7, originalSolarDate: '2020-11-10', lunarDay: null, lunarMonth: null, lunarYear: null, isLeapMonth: false, place: 'Family home', host: null, notes: null }];

async function main() {
  fs.mkdirSync(artifacts, { recursive: true });
  const browser = await puppeteer.launch({ headless: true, executablePath: process.env.BROWSER_EXECUTABLE || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe' });
  const errors = [], report = [], requests = [];
  let role = 'USER', authenticated = true, dataMode = 'normal';
  try {
    const page = await browser.newPage();
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if(message.type() === 'error') console.log('Browser console:', message.text()); });
    await page.setRequestInterception(true);
    page.on('request', async request => {
      const url = new URL(request.url());
      if (!url.pathname.startsWith('/api/')) return request.continue();
      requests.push({ method: request.method(), path: url.pathname });
      const user = { id: 42, email: 'review@example.test', displayName: 'MyLife review', fullName: 'MyLife review', role, roles: [role], isActive: true, avatarUrl: null, authProvider: 0, loginProviders: { local: true, google: false } };
      let body = {}, status = 200;
      const envelope = data => ({ success: true, data });
      if (url.pathname === '/api/me') { body = user; if (!authenticated) status = 401; }
      else if (url.pathname === '/api/login') { authenticated = true; body = { success: true, user }; }
      else if (url.pathname.includes('logout')) { authenticated = false; body = { success: true }; }
      else if (url.pathname.includes('refresh')) { status = 401; }
      else if (url.pathname === '/api/family-tree') { body = envelope(dataMode === 'empty' ? [] : members); if (dataMode === 'error') status = 500; }
      else if (url.pathname === '/api/family-tree/timeline') body = envelope(dataMode === 'empty' ? [] : timeline);
      else if (url.pathname.startsWith('/api/family-tree/anniversaries')) body = envelope(anniversaries);
      else if (url.pathname === '/api/library/overview') body = { categories: [], albums: [{ id: 1, name: 'Family album', description: 'Shared memories', photos: [], photoCount: 0, coverPhotoUrl: null, createdAt: stamp, updatedAt: stamp }] };
      else if (url.pathname === '/api/family-tree/map') body = envelope({ totalMembers: 5, locatedMembers: 0, unlocatedMembers: 5, pendingGeocodingMembers: 0, noAddressMembers: 5, failedGeocodingMembers: 0, locations: [], members });
      else if (/\/api\/family-tree\/\d+\/profile/.test(url.pathname)) body = envelope({ member: members[0], relatives: members.slice(1), timeline, anniversaries, libraryMemberLinkAvailable: false });
      else if (url.pathname === '/api/admin/stats') body = { totalUsers: 2, totalActive: 2, totalLocked: 0, last7Days: { successLogins: 12, failedLogins: 1, newRegistrations: 1 } };
      else if (url.pathname === '/api/admin/users') body = [user, { ...user, id: 43, email: 'member@example.test', role: 'USER' }];
      else if (url.pathname === '/api/admin/logs') body = [{ id: 1, attemptEmail: user.email, status: 'SUCCESS', ipAddress: '127.0.0.1', createdAt: stamp }];
      else if (url.pathname.includes('generation')) body = envelope([{ id: 1, name: '1' }, { id: 2, name: '2' }, { id: 3, name: '3' }]);
      await request.respond({ status, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': request.headers().origin || base, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': request.headers()['access-control-request-headers'] || 'content-type, x-requested-with, x-csrf-token', 'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', 'Access-Control-Allow-Private-Network': 'true' }, body: JSON.stringify(body) });
    });
    await page.evaluateOnNewDocument(() => { localStorage.setItem('app_language', 'en'); localStorage.setItem('portfolio-theme-preference', 'light'); });
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    const routes = ['/mylife', '/familytree', '/timeline', '/anniversaries', '/library', '/map'];
    const viewports = process.env.MYLIFE_UI_INTERACTIONS_ONLY === '1' ? [] : [[1366,768],[1440,900],[1920,1080],[820,1180],[390,844]];
    const goto = async route => { console.log('Review', role, route, page.viewport()); await page.goto(base + route, { waitUntil: 'networkidle0' }); try { await page.waitForSelector('.app-shell', {timeout:10000}); } catch(error) { console.error('UI failure',page.url(),errors,requests,await page.$eval('body',el=>el.innerText.slice(0,1600))); await page.screenshot({path:path.join(artifacts,'failure.png')}); throw error; } };
    const clickText = async (tag, text) => { const done = await page.evaluate(({tag,text}) => { const el = [...document.querySelectorAll(tag)].find(el => el.textContent.toLocaleLowerCase().includes(text.toLocaleLowerCase())); el?.click(); return !!el; }, {tag,text}); assert.ok(done, `Missing ${tag}: ${text}`); };
    for (const theme of ['light','dark']) for (const [width,height] of viewports) {
      await page.setViewport({ width, height });
      for (const route of routes) {
        await goto(route);
        await page.select('select[aria-label="Appearance"]', theme);
        const metrics = await page.evaluate(() => {
          const main = document.querySelector('#app-content'), rect = main.getBoundingClientRect();
          const canvas = document.querySelector('.family-tree-view-shell, .shadcn-family-tree, .memoir-tree-poc, .family-mindmap');
          return { overflow: document.documentElement.scrollWidth > innerWidth + 1, mainOverflow: main.scrollWidth > main.clientWidth + 1, bottom: rect.bottom, height: innerHeight, shellCount: document.querySelectorAll('.app-shell').length, active: document.querySelector('.app-nav__link.is-active')?.textContent.trim(), canvasHeight: canvas?.getBoundingClientRect().height, bodyScroll: document.body.scrollHeight > innerHeight + 1 };
        });
        assert.equal(metrics.shellCount, 1, route);
        assert.equal(metrics.overflow, false, `${route} ${width} body overflow`);
        assert.equal(metrics.mainOverflow, false, `${route} ${width} main overflow`);
        assert.equal(metrics.bodyScroll, false, `${route} ${width} body scroll`);
        assert.ok(metrics.bottom <= metrics.height + 1, `${route} ${width} main extends below viewport`);
        if (route === '/familytree' && !(metrics.canvasHeight > 150)) { console.log(metrics, await page.$eval('#app-content',el=>el.innerText)); await page.screenshot({path:path.join(artifacts,'failure-tree.png')}); throw Error(`Tree canvas too short at ${width}`); }
        if (width === 1440 || (width === 390 && route === '/familytree')) await page.screenshot({ path: path.join(artifacts, `${route.slice(1)}-${theme}-${width}.png`) });
        report.push({ route, theme, width, height, ...metrics });
      }
    }
    await page.setViewport({width:1440,height:900}); await goto('/familytree');
    const scale = () => page.$eval('.family-tree-view__scene, .shadcn-family-tree__scene', el => new DOMMatrix(getComputedStyle(el).transform).a);
    const before = await scale(); console.log('Initial tree scale',before); await page.click('button[aria-label="Zoom out"]');
    await page.waitForFunction(value => new DOMMatrix(getComputedStyle(document.querySelector('.family-tree-view__scene, .shadcn-family-tree__scene')).transform).a < value, {}, before);
    const smaller = await scale(); await page.click('button[aria-label="Zoom in"]');
    await page.waitForFunction(value => new DOMMatrix(getComputedStyle(document.querySelector('.family-tree-view__scene, .shadcn-family-tree__scene')).transform).a > value, {}, smaller);
    await page.click('button[aria-label="Fit to view"]');
    const canvasSelector = '.family-tree-view__viewport, .shadcn-family-tree__viewport';
    const canvasRect = await page.$eval(canvasSelector, el => { const r=el.getBoundingClientRect(); return {x:r.x,y:r.y,width:r.width,height:r.height}; });
    const transformX = () => page.$eval('.family-tree-view__scene, .shadcn-family-tree__scene',el=>new DOMMatrix(getComputedStyle(el).transform).e);
    const originalX=await transformX(); await page.mouse.move(canvasRect.x+canvasRect.width-40, canvasRect.y+canvasRect.height-70); await page.mouse.down(); await page.mouse.move(canvasRect.x+canvasRect.width-90, canvasRect.y+canvasRect.height-90,{steps:3}); await page.mouse.up();
    await page.waitForFunction(value=>new DOMMatrix(getComputedStyle(document.querySelector('.family-tree-view__scene, .shadcn-family-tree__scene')).transform).e !== value,{},originalX);
    await page.click('button[aria-label="Fit to view"]');
    await page.click('[role="combobox"][aria-label="All generations"]'); await page.waitForSelector('[role="option"]');
    await page.$$eval('[role="option"]',els=>els[els.length-1].click());
    await page.waitForFunction(()=>document.querySelector('[role="combobox"][aria-label="All generations"]').textContent.includes('3'));
    await page.goto(base+'/familytree',{waitUntil:'networkidle0'});
    await page.type('input[type="search"]', 'no-such-person'); await page.waitForFunction(() => !document.querySelector('.family-tree-view-shell, .shadcn-family-tree'));
    await page.$eval('input[type="search"]', el => { const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; setter.call(el,''); el.dispatchEvent(new Event('input',{bubbles:true})); });
    await goto('/familytree'); await clickText('button','Add member'); await page.waitForSelector('[role="dialog"]');
    await page.keyboard.press('Escape'); await page.waitForFunction(() => !document.querySelector('[role="dialog"]'));
    await page.click('button[title="Table view"]'); await page.waitForSelector('.ds-table-shell table');
    await page.click('button[aria-label="Open account menu"]'); await clickText('[data-user-menu] button','Personal Information'); await page.waitForSelector('[role="dialog"]');
    await page.waitForFunction(()=>Number(getComputedStyle(document.querySelector('[role="dialog"]')).opacity) > .999);
    await page.screenshot({path:path.join(artifacts,'profile-light-1440.png')});
    await page.keyboard.press('Escape'); await page.waitForFunction(() => !document.querySelector('[role="dialog"]'));
    await page.select('select[aria-label="Language"]','vi'); assert.ok(await page.$eval('.app-nav', el => el.textContent.includes('Gia đình')));
    await page.select('select[aria-label="Giao diện"]','system'); assert.equal(await page.evaluate(() => localStorage.getItem('portfolio-theme-preference')), 'system');
    await page.setViewport({width:390,height:844}); await page.click('button[aria-label="Mở điều hướng"]'); await page.waitForSelector('.ds-drawer');
    await page.keyboard.press('Tab'); assert.ok(await page.evaluate(() => document.querySelector('.ds-drawer').contains(document.activeElement)));
    await page.keyboard.press('Escape'); await page.waitForFunction(() => !document.querySelector('.ds-drawer'));
    await page.goto(base+'/Home/Admin', {waitUntil:'networkidle0'}); assert.ok(page.url().endsWith('/403'), 'USER cannot open ADMIN route');
    role='ADMIN'; await goto('/Home/Admin'); console.log('Admin labels',await page.$$eval('.ds-segments button',els=>els.map(el=>el.textContent))); await page.click('.ds-segments button:nth-child(2)'); await page.waitForSelector('.ds-table-shell table');
    assert.ok(await page.$('.app-nav a[href="/Home/Admin"]'), 'ADMIN navigation must be visible');
    await page.click('.ds-segments button:nth-child(3)'); assert.equal(await page.$$eval('.ds-table-shell tbody tr',rows=>rows.length),1);
    await page.screenshot({path:path.join(artifacts,'admin-light-390.png')});
    dataMode='empty'; role='USER'; await goto('/familytree'); assert.ok(await page.$('.ds-feedback') || await page.$('.border-dashed'));
    dataMode='error'; await goto('/familytree'); assert.ok(await page.$('[role="alert"]'));
    await page.goto(base+'/dev/design-system',{waitUntil:'networkidle0'}); assert.ok(await page.$('h1'));
    dataMode='normal'; await page.setViewport({width:1440,height:900}); await goto('/familytree'); await page.click('button[aria-label="Open account menu"]'); await clickText('[data-user-menu] button','Log Out');
    await page.waitForFunction(()=>!document.querySelector('.app-shell'));
    assert.ok(requests.some(r=>r.path==='/api/logout' && r.method==='POST'));
    await page.waitForFunction(()=>[...document.querySelectorAll('button')].some(el=>/log\s*in/.test(el.textContent.toLowerCase())));
    await clickText('button','Log in'); await page.waitForSelector('input[type="password"]');
    await page.type('input[type="email"]','review@example.test'); await page.type('input[type="password"]','fixture-password-only');
    await page.click('form button[type="submit"]'); await page.waitForFunction(()=>!document.querySelector('input[type="password"]'));
    await goto('/familytree'); assert.ok(await page.$('.app-shell'));
    assert.ok(requests.some(r=>r.path==='/api/login' && r.method==='POST'));
    assert.deepEqual(errors,[], 'No uncaught browser errors');
    assert.ok(requests.every(r=>r.method==='GET' || r.method==='OPTIONS' || ['/api/login','/api/logout'].includes(r.path)), 'Smoke checks must not submit feature mutations');
    if(report.length) fs.writeFileSync(path.join(artifacts,'qa-results.json'),JSON.stringify({mode:'intercepted fixtures; no live backend',checks:report,errors,requests},null,2));
    console.log(`PASS: ${report.length} route/theme/viewport checks, controls, Profile, drawer, roles, empty/error states. Screenshots: ${artifacts}`);
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode=1; });
