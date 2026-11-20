// UI regression against real routes; all API responses are local synthetic fixtures.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const puppeteer = require('../scratch_puppeteer/node_modules/puppeteer');
const base = process.env.MYLIFE_UI_URL || 'http://127.0.0.1:7002';
const artifacts = path.resolve('docs/review-global-focus');
const stamp = '2026-01-01T00:00:00Z';
const members = [
  { id: 1, fullName: 'Nguyễn Văn An', generation: 1, role: 'Thành viên', gender: 'Nam', lifeStatus: 'LIVING', address: 'Hà Nội', childIds: [3], createdAt: stamp, updatedAt: stamp },
  { id: 2, fullName: 'Mai Thu', generation: 1, role: 'Thành viên', gender: 'Nữ', lifeStatus: 'LIVING', address: 'Huế', createdAt: stamp, updatedAt: stamp },
  { id: 3, fullName: 'Nguyễn Minh', generation: 2, role: 'Thành viên', gender: 'Nam', lifeStatus: 'LIVING', fatherId: 1, createdAt: stamp, updatedAt: stamp },
];
const anniversaries = [{ id: 1, eventType: 'FAMILY_EVENT', title: 'A day with Mai', relatedMemberId: 2, relatedMemberName: 'Mai Thu', originalSolarDate: '2025-02-10', nextSolarDate: '2027-02-10', daysUntil: 60, place: 'Home', host: 'Family', notes: '', createdAt: stamp, updatedAt: stamp }];
const albums = [{ id: 1, name: 'Family album', description: 'Shared stories', photoCount: 0, coverPhotoId: null, coverPhotoUrl: null, photos: [], createdAt: stamp, updatedAt: stamp }];
async function main() {
  fs.mkdirSync(artifacts, { recursive: true });
  const browser = await puppeteer.launch({ headless: true, executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', args: ['--no-first-run', '--disable-extensions'] });
  const page = await browser.newPage(); page.setDefaultTimeout(15000);
  const errors = [], writes = [], checks = [];
  let currentRole = 'USER';
  page.on('pageerror', error => errors.push(error.message));
  await page.setRequestInterception(true);
  page.on('request', request => {
    const url = new URL(request.url()), p = url.pathname;
    if (!p.startsWith('/api/')) {
      if (/vietmap\.vn/.test(url.hostname)) return request.abort(); // This suite does not test map-provider networking.
      return request.continue();
    }
    if (!['GET', 'OPTIONS'].includes(request.method())) writes.push({ path: p, method: request.method() });
    const envelope = data => ({ success: true, data });
    let body = envelope([]);
    if (p === '/api/me') body = { id: 42, email: 'focus@example.test', displayName: 'Focus review', fullName: 'Focus Review', role: currentRole, roles: [currentRole], isActive: true };
    else if (p === '/api/family-tree') body = envelope(members);
    else if (p.endsWith('/generations')) body = envelope([1, 2].map(id => ({ id, name: String(id) })));
    else if (/\/\d+\/profile$/.test(p)) body = envelope({ member: members[0], relatives: members.slice(1), timeline: [], anniversaries: [], libraryMemberLinkAvailable: false });
    else if (p === '/api/family-tree/relationship') body = envelope({ fromMemberId: 1, toMemberId: 2, relationshipCode: 'spouse', relationshipLabel: 'Spouse', reverseRelationshipCode: 'spouse', reverseRelationshipLabel: 'Spouse', path: [{ memberId: 1, fullName: members[0].fullName }, { memberId: 2, fullName: members[1].fullName, edge: 'SPOUSE' }], distance: 1 });
    else if (p === '/api/family-tree/anniversaries') body = envelope(anniversaries);
    else if (p === '/api/library/overview') body = { categories: [], albums };
    else if (p === '/api/family-tree/map') body = envelope({ totalMembers: 3, locatedMembers: 1, unlocatedMembers: 2, pendingGeocodingMembers: 0, noAddressMembers: 2, failedGeocodingMembers: 0, members: members.map(m => ({ ...m, status: 'NO_ADDRESS' })), locations: [{ key: 'hanoi', displayName: 'Hà Nội', latitude: 21.02, longitude: 105.83, memberCount: 1, members: [members[0]] }] });
    else if (p === '/api/admin/stats') body = { totalUsers: 1, totalActive: 1, totalLocked: 0, last7Days: { successLogins: 1, failedLogins: 0 } };
    else if (p === '/api/admin/users') body = [{ id: 42, email: 'focus@example.test', role: 'ADMIN', isActive: true, createdAt: stamp }];
    else if (p === '/api/admin/logs') body = [];
    return request.respond({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': request.headers().origin || '*', 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': request.headers()['access-control-request-headers'] || 'content-type,x-requested-with', 'Access-Control-Allow-Methods': 'GET,OPTIONS' }, body: JSON.stringify(body) });
  });
  await page.evaluateOnNewDocument(() => { localStorage.setItem('app_language', 'en'); if (!localStorage.getItem('portfolio-theme-preference')) localStorage.setItem('portfolio-theme-preference', 'light'); });
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  let caseName = '';
  const go = async route => { await page.goto(base + route, { waitUntil: 'domcontentloaded' }); };
  const clickText = async (text, scope = 'button') => {
    await page.waitForFunction(({ text, scope }) => [...document.querySelectorAll(scope)].some(e => e.textContent.trim().toLowerCase() === text.toLowerCase()), {}, { text, scope });
    await page.evaluate(({ text, scope }) => [...document.querySelectorAll(scope)].find(e => e.textContent.trim().toLowerCase() === text.toLowerCase()).click(), { text, scope });
  };
  const close = async () => { await page.keyboard.press('Escape'); await page.waitForFunction(() => !document.querySelector('[role=dialog]')); };
  const clear = async selector => { await page.click(selector); await page.keyboard.down('Control'); await page.keyboard.press('A'); await page.keyboard.up('Control'); await page.keyboard.press('Backspace'); };
  const tabTo = async selector => {
    await page.$eval(selector, e => { const anchor = document.createElement('button'); anchor.type = 'button'; anchor.id = 'focus-test-anchor'; anchor.style.cssText = 'position:fixed;left:0;top:0;width:1px;height:1px'; e.before(anchor); anchor.focus(); });
    await page.keyboard.press('Tab');
    assert.equal(await page.$eval(selector, e => document.activeElement === e), true, 'Tab reaches the control');
    await page.evaluate(() => document.querySelector('#focus-test-anchor').remove());
  };
  const inspect = selector => page.$eval(selector, e => {
    const shell = e.closest('[data-field-shell]');
    if (!shell) throw Error('Missing explicit field focus owner');
    const input = getComputedStyle(e), outer = getComputedStyle(shell);
    const rect = e.getBoundingClientRect(), bounds = shell.getBoundingClientRect();
    return { innerOutline: input.outlineStyle, innerOutlineWidth: input.outlineWidth, innerShadow: input.boxShadow, innerBorder: input.borderWidth, shellShadow: outer.boxShadow, shellOutline: outer.outlineStyle, radius: outer.borderRadius, border: outer.borderColor, contained: rect.left >= bounds.left - 1 && rect.right <= bounds.right + 1, width: bounds.width, height: bounds.height };
  });
  const field = async (selector, name, { text, error = false, selection = false, dismiss = false } = {}) => {
    await page.waitForSelector(selector); await page.$eval(selector, e => { document.activeElement?.blur(); e.scrollIntoView({ block: 'center' }); });
    const before = await inspect(selector);
    await page.screenshot({ path: path.join(artifacts, `${caseName}-${name}-rest.png`) });
    await page.click(selector);
    const mouse = await inspect(selector);
    for (const snapshot of [mouse]) {
      assert.equal(snapshot.innerOutline, 'none', name + ' inner outline'); assert.equal(snapshot.innerShadow, 'none', name + ' inner shadow'); assert.equal(snapshot.innerBorder, '0px', name + ' inner border');
      assert.notEqual(snapshot.shellShadow, 'none', name + ' outer focus remains visible'); assert.equal(snapshot.shellShadow.includes('inset'), false); assert.notEqual(snapshot.radius, '0px'); assert.ok(snapshot.contained); assert.equal(snapshot.width, before.width); assert.equal(snapshot.height, before.height);
    }
    await page.screenshot({ path: path.join(artifacts, `${caseName}-${name}-focus.png`) });
    if (selection) { await page.waitForSelector('[role=option]'); await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter'); await page.waitForFunction(() => !document.querySelector('[role=listbox]')); }
    if (dismiss) { await page.keyboard.press('Escape'); await page.waitForFunction(() => !document.querySelector('[role=listbox]')); }
    if (text) { await clear(selector); await page.type(selector, text); assert.equal(await page.$eval(selector, e => e.value), text); const filled = await inspect(selector); assert.equal(filled.innerOutline, 'none'); assert.equal(filled.innerShadow, 'none'); assert.equal(filled.width, before.width); assert.equal(filled.height, before.height); await clear(selector); }
    await tabTo(selector);
    const keyboard = await inspect(selector);
    assert.equal(keyboard.innerOutline, 'none'); assert.equal(keyboard.innerShadow, 'none'); assert.notEqual(keyboard.shellShadow, 'none');
    if (error) assert.equal(await page.$eval(selector, e => { const shell = e.closest('[data-field-shell]'), probe = document.createElement('span'); probe.style.color = 'var(--field-error)'; shell.append(probe); const matches = getComputedStyle(shell).borderColor === getComputedStyle(probe).color; probe.remove(); return matches; }), true, 'focused error border remains distinct');
    checks.push({ case: caseName, name, mouse, keyboard });
  };
  try {
    for (const [width, height] of [[1440, 900], [820, 1180], [390, 844]]) for (const theme of ['light', 'dark']) {
      const onlyCase = process.argv.find(arg => arg.startsWith('--case='))?.slice(7);
      if (onlyCase && onlyCase !== `${theme}-${width}`) continue;
      caseName = `${theme}-${width}`; console.log('Focus review', caseName);
      currentRole = 'USER';
      await page.setViewport({ width, height, isMobile: width === 390, hasTouch: width <= 820 });
      await go('/familytree'); await page.waitForSelector('input[type=search]'); await page.evaluate(theme => localStorage.setItem('portfolio-theme-preference', theme), theme); await go('/familytree');
      await page.waitForFunction(theme => document.documentElement.dataset.theme === theme, {}, theme);
      await field('input[type=search]', 'family-search', { text: 'Mai' });
      for (const view of ['Cards', 'List']) { await clickText(view, '.family-toolbar button'); await field('input[type=search]', 'family-' + view.toLowerCase() + '-search', { text: 'Mai' }); }
      await clickText('Add member'); await page.waitForSelector('#familyForm');
      await field('#familyForm input:not([type=file])', 'member-name', { text: 'A New Name' });
      await field('#familyForm input[name=address]', 'member-address', { text: 'A place' });
      for (const label of ['Father', 'Mother', 'Spouse']) {
        const selector = await page.evaluate(label => { const e = [...document.querySelectorAll('#familyForm button[aria-haspopup=listbox]')].find(e => e.getAttribute('aria-label') === label || document.querySelector(`label[for="${e.id}"]`)?.textContent.includes(label)); e?.setAttribute('data-focus-member', label); return e ? `[data-focus-member="${label}"]` : null; }, label);
        assert.ok(selector, label + ' selector exists'); await field(selector, 'member-' + label.toLowerCase(), { selection: true });
      }
      await close(); await clickText('Add member'); await page.waitForSelector('#familyForm');
      // Action pickers share the field frame but intentionally remove chosen options from their list.
      for (const label of ['Select children', 'Select sibling']) {
        const selector = `#familyForm button[aria-label="${label}"]`;
        await field(selector, label === 'Select children' ? 'children-picker' : 'sibling-picker', { dismiss: true });
      }
      await close();
      await go('/map'); await field('.family-map-search input', 'map-search', { text: 'Mai' });
      await page.type('.family-map-search input', 'no-match-here'); await page.waitForSelector('.family-map-list-empty'); await clear('.family-map-search input'); await page.waitForSelector('.family-map-location');
      await go('/anniversaries'); await field('.memory-upcoming__search input', 'anniversary-search', { text: 'Mai' });
      await go('/timeline'); await clickText('Add event'); await page.waitForSelector('#familyTimelineEventForm');
      await field('#familyTimelineEventForm input:not([type=hidden])', 'timeline-dialog-title', { text: 'A memory' }); await close();
      await go('/library'); await field('.library-album-filter [role=combobox]', 'library-filter', { selection: true });
      await clickText('Create album'); await page.waitForSelector('.memory-form--library form'); await field('.memory-form--library form input', 'library-dialog-name', { text: 'New album' }); await close();
      await go('/mylife/family/member/1'); await field('#relationship-member-search:not(:disabled)', 'relationship-search');
      await page.type('#relationship-member-search', 'Mai'); await page.keyboard.press('Enter'); await page.click('.family-explorer > button'); await page.waitForSelector('.family-explorer__path');
      await page.click('#relationship-member-search'); await page.click('#relationship-member-option-2'); await page.waitForFunction(() => !document.querySelector('.family-explorer__result')); await page.keyboard.press('Tab');
      assert.equal(await page.$eval('#relationship-member-search', e => e.value), '');
      currentRole = 'ADMIN'; await go('/home/admin'); await field('input[type=search]', 'admin-search', { text: 'focus' });
      await page.click('button[aria-label="Open account menu"]'); await clickText('Personal Information', '[data-user-menu] button'); await page.waitForSelector('.ds-modal');
      await clickText('Edit profile', '.ds-modal button'); await field('.ds-modal input:not([readonly]):not([type=file])', 'profile-dialog-name', { text: 'A name' }); await close();
      await go('/dev/design-system'); await page.waitForSelector('input');
      const galleryInput = async label => page.evaluate(label => { const e = [...document.querySelectorAll('input')].find(e => document.querySelector(`label[for="${e.id}"]`)?.textContent === label); e?.setAttribute('data-focus-demo', label); return e ? `[data-focus-demo="${label}"]` : null; }, label);
      const errorSelector = await galleryInput('Invalid email'); assert.ok(errorSelector); await field(errorSelector, 'error-field', { error: true });
      assert.equal(await page.$eval(errorSelector, e => e.getAttribute('aria-invalid')), 'true'); assert.ok(await page.$('[role=alert]'));
      const disabledSelector = await galleryInput('Disabled field'); assert.ok(disabledSelector); assert.equal(await page.$eval(disabledSelector, e => e.disabled), true);
      assert.equal((await inspect(disabledSelector)).shellShadow, 'none', 'disabled field has no focus ring');
      const passwordSelector = await galleryInput('Password'); await field(passwordSelector, 'password-field', { text: 'sample-password' });
      const nativeRestBorder = await page.$eval('select', e => getComputedStyle(e).borderColor);
      await tabTo('select');
      const nativeFocus = await page.$eval('select', e => { const s = getComputedStyle(e); return { focused: e.matches(':focus-visible'), outline: s.outlineStyle, shadow: s.boxShadow, border: s.borderColor }; });
      if (!(nativeFocus.outline !== 'none' || nativeFocus.shadow !== 'none' || nativeFocus.border !== nativeRestBorder)) console.log('Native focus diagnostic', { nativeRestBorder, nativeFocus });
      assert.equal(nativeFocus.outline !== 'none' || nativeFocus.shadow !== 'none' || nativeFocus.border !== nativeRestBorder, true, 'standalone control retains its independent keyboard cue');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
    }
    assert.deepEqual(errors, []); assert.deepEqual(writes, []);
    fs.writeFileSync(path.join(artifacts, 'results.json'), JSON.stringify({ checks, errors, writes }, null, 2));
    console.log('PASS', checks.length, 'field cases across six theme/viewport combinations.');
  } catch (error) {
    console.log('Failure', caseName, page.url(), await page.evaluate(() => document.body.innerText.slice(-1600)));
    await page.screenshot({ path: path.join(artifacts, 'failure.png') }); throw error;
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
