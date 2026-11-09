// Real profile route and components, isolated browser session, synthetic API responses only.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const puppeteer = require('../scratch_puppeteer/node_modules/puppeteer');
const base = process.env.MYLIFE_UI_URL || 'http://127.0.0.1:7002';
const artifacts = path.resolve(process.env.MYLIFE_REVIEW_DIR ? path.join(process.env.MYLIFE_REVIEW_DIR,'relationship-picker') : 'docs/review-relationship-picker');
const member = (id, fullName, generation = 1) => ({ id, fullName, generation, gender: 'Nam', lifeStatus: 'LIVING', createdAt: '', updatedAt: '' });
const members = [member(1, 'Nguyễn Văn An'), member(2, 'Mai Thu', 2), member(3, 'Mai Thu', 5), member(4, 'Nguyễn Huỳnh Minh Đức', 3), ...Array.from({ length: 25 }, (_, i) => member(i + 5, `Thành viên ${String(i + 5).padStart(2, '0')}`, 4))];
const input = '#relationship-member-search';
const popup = '#relationship-member-options';
const option = id => `#relationship-member-option-${id}`;
const calculate = '.family-explorer > button';
const report = [];

async function main() {
  fs.mkdirSync(artifacts, { recursive: true });
  const browser = await puppeteer.launch({ headless: true, pipe: true, timeout: 20000 });
  const page = await browser.newPage(); page.setDefaultTimeout(15000);
  const errors = [], relationships = [], writes = [];
  let delayRelationship = 0;
  page.on('pageerror', error => errors.push(error.message));
  await page.setRequestInterception(true);
  page.on('request', async request => {
    const url = new URL(request.url()), p = url.pathname;
    if (!p.startsWith('/api/')) return request.continue();
    if (!['GET', 'OPTIONS'].includes(request.method())) writes.push(p);
    let body = { success: true, data: [] };
    if (p === '/api/me') body = { id: 42, email: 'picker@example.test', displayName: 'Picker review', role: 'USER', roles: ['USER'], isActive: true };
    else if (p === '/api/family-tree') body.data = members;
    else if (/\/\d+\/profile$/.test(p)) {
      const id = Number(p.split('/')[3]);
      body.data = { member: members.find(m => m.id === id), relatives: [members.find(m => m.id !== id)], timeline: [], anniversaries: [], libraryMemberLinkAvailable: false };
    } else if (p === '/api/family-tree/relationship') {
      const from = Number(url.searchParams.get('fromMemberId')), to = Number(url.searchParams.get('toMemberId'));
      relationships.push({ from, to });
      body.data = { fromMemberId: from, toMemberId: to, relationshipCode: 'spouse', relationshipLabel: 'Vợ/chồng', reverseRelationshipCode: 'spouse', reverseRelationshipLabel: 'Vợ/chồng', distance: 1, path: [{ memberId: from, fullName: members.find(m => m.id === from).fullName }, { memberId: to, fullName: members.find(m => m.id === to).fullName, edge: 'SPOUSE' }] };
      if (delayRelationship) await new Promise(resolve => setTimeout(resolve, delayRelationship));
    }
    try {
      await request.respond({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': request.headers().origin || '*', 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': request.headers()['access-control-request-headers'] || 'content-type,x-requested-with', 'Access-Control-Allow-Methods': 'GET,OPTIONS' }, body: JSON.stringify(body) });
    } catch { /* A deliberately aborted relationship request may no longer accept a response. */ }
  });
  await page.evaluateOnNewDocument(() => { localStorage.setItem('app_language', 'vi'); if (!localStorage.getItem('portfolio-theme-preference')) localStorage.setItem('portfolio-theme-preference', 'light'); });
  const go = async () => { await page.goto(base + '/mylife/family/member/1', { waitUntil: 'domcontentloaded' }); await page.waitForSelector(input + ':not(:disabled)'); await page.$eval(input, element => element.scrollIntoView({ block: 'center' })); };
  const open = async () => { await page.click(input); await page.waitForSelector(popup); };
  const blur = async () => { await page.click('.family-explorer__description'); await page.waitForFunction(() => !document.querySelector('#relationship-member-options')); };
  const isEmpty = async () => {
    await page.waitForFunction(() => !document.querySelector('.family-explorer__picker .ds-field').hasAttribute('data-floated') && getComputedStyle(document.querySelector('.family-explorer__picker label')).fontSize === '14px');
    const state = await page.$eval(input, element => {
      const field = element.closest('.ds-field'), label = field.querySelector('label');
      const rect = field.getBoundingClientRect(), labelRect = label.getBoundingClientRect();
      return { value: element.value, placeholder: element.getAttribute('placeholder'), floated: field.hasAttribute('data-floated'), size: getComputedStyle(label).fontSize, centered: Math.abs((labelRect.top + labelRect.bottom) / 2 - (rect.top + rect.bottom) / 2) < 1 };
    });
    assert.deepEqual(state, { value: '', placeholder: null, floated: false, size: '14px', centered: true });
    assert.equal(await page.$eval(calculate, element => element.disabled), true);
  };
  try {
    for (const [width, height] of [[1440, 900], [1920, 1080], [820, 1180], [390, 844]]) for (const theme of ['light', 'dark']) {
      console.log('Review', width, theme);
      await page.setViewport({ width, height, isMobile: width === 390, hasTouch: width <= 820 });
      await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: theme === 'dark' ? 'reduce' : 'no-preference' }]);
      await go();
      await page.evaluate(theme => localStorage.setItem('portfolio-theme-preference', theme), theme); await go();
      await page.waitForFunction(theme => document.documentElement.dataset.theme === theme, {}, theme);
      await isEmpty();
      await page.screenshot({ path: path.join(artifacts, `${theme}-${width}-initial.png`) });
      await open();
      await page.waitForFunction(() => getComputedStyle(document.querySelector('.family-explorer__picker label')).fontSize === '11px');
      assert.equal(await page.$eval(input, element => element.placeholder), 'Tìm thành viên');
      assert.equal(await page.evaluate(() => document.activeElement.id), 'relationship-member-search');
      assert.equal(await page.$(option(1)), null, 'current member excluded');
      assert.equal(await page.$$eval(popup + ' [role=option]', elements => elements.length), members.length - 1, 'all generations fetched beyond profile relatives');
      assert.equal(await page.$$eval(popup + ' [role=option]', elements => elements.some(e => /\(Đời/.test(e.textContent))), false);
      const geometry = await page.evaluate(() => {
        const left = document.querySelector('.family-explorer__reference .ds-field'), right = document.querySelector('.family-explorer__picker .ds-field'), control = document.querySelector('#relationship-member-search');
        const shape = e => { const style = getComputedStyle(e); return { height: e.getBoundingClientRect().height, radius: style.borderRadius, border: style.borderWidth }; };
        const menu = document.querySelector('#relationship-member-options'), bounds = menu.getBoundingClientRect();
        return { left: shape(left), right: shape(right), inputBorder: getComputedStyle(control).borderWidth, inputShadow: getComputedStyle(control).boxShadow, portalled: menu.parentElement === document.body, popupFits: bounds.left >= 0 && bounds.right <= innerWidth + 1 && bounds.top >= 0 && bounds.bottom <= innerHeight + 1, fixed: getComputedStyle(menu).position, readonly: left.querySelector('input').readOnly };
      });
      assert.deepEqual(geometry.left, geometry.right); assert.equal(geometry.inputBorder, '0px'); assert.equal(geometry.inputShadow, 'none');
      assert.ok(geometry.portalled && geometry.popupFits && geometry.readonly); assert.equal(geometry.fixed, 'fixed');
      await page.screenshot({ path: path.join(artifacts, `${theme}-${width}-focused.png`) });
      if (width === 390) {
        const touch = await page.createCDPSession();
        const rect = await page.$eval(popup, e => { const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.bottom - 35 }; });
        await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ ...rect, id: 1 }] });
        for (const offset of [30, 70, 120]) await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: rect.x, y: rect.y - offset, id: 1 }] });
        await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        await page.waitForFunction(() => document.querySelector('#relationship-member-options').scrollTop > 0);
        await touch.detach();
      }
      await page.type(input, 'minh duc');
      assert.deepEqual(await page.$$eval(popup + ' [role=option]', elements => elements.map(e => e.id)), ['relationship-member-option-4'], 'accent-insensitive partial search includes đ');
      await page.keyboard.press('Enter'); await page.waitForFunction(() => !document.querySelector('#relationship-member-options'));
      await blur(); assert.equal(await page.$eval(input, e => e.value), members[3].fullName);
      await open(); assert.equal(await page.$eval(option(4), e => e.getAttribute('aria-selected')), 'true');
      await page.click(option(2)); await blur(); assert.equal(await page.$eval(input, e => e.value), 'Mai Thu');
      assert.equal(await page.$eval('.family-explorer__picker .ds-field', e => e.hasAttribute('data-floated')), true, 'blur with selection stays floated');
      await page.click(calculate); await page.waitForSelector('.family-explorer__result');
      assert.deepEqual(relationships.at(-1), { from: 1, to: 2 });
      await open(); assert.ok(await page.$(option(2) + ' svg.lucide-check'));
      await page.click(option(3)); await blur(); assert.equal(await page.$('.family-explorer__result'), null, 'changing IDs with the same name clears previous result');
      await page.click(calculate); await page.waitForSelector('.family-explorer__path');
      assert.deepEqual(relationships.at(-1), { from: 1, to: 3 }, 'identity is numeric ID, not duplicate display name');
      await page.screenshot({ path: path.join(artifacts, `${theme}-${width}-selected.png`) });
      await open(); assert.equal(await page.$eval(option(2), e => e.getAttribute('aria-selected')), 'false'); assert.equal(await page.$eval(option(3), e => e.getAttribute('aria-selected')), 'true');
      if (width === 390) await page.tap(option(3)); else await page.click(option(3));
      await page.waitForFunction(() => !document.querySelector('.family-explorer__result'));
      assert.ok(await page.$(popup)); assert.equal(await page.$$eval(popup + ' [aria-selected=true]', elements => elements.length), 0);
      assert.equal(await page.$eval(calculate, e => e.disabled), true);
      assert.equal(await page.$eval('.family-explorer__picker .ds-field', e => e.hasAttribute('data-floated')), true);
      await page.screenshot({ path: path.join(artifacts, `${theme}-${width}-deselected.png`) });
      await page.keyboard.press('Tab'); await isEmpty();
      await open(); await page.keyboard.press('ArrowDown'); await page.keyboard.press('ArrowUp');
      assert.ok(await page.$eval(input, e => !!document.getElementById(e.getAttribute('aria-activedescendant'))));
      await page.keyboard.press('Escape'); assert.equal(await page.$(popup), null); await blur(); await isEmpty();
      await open();
      for (let i = 0; i < 28; i++) await page.keyboard.press('ArrowDown');
      const lastActive = await page.$eval(input, e => e.getAttribute('aria-activedescendant'));
      assert.equal(await page.$eval(popup, e => e.scrollTop > 0), true, 'keyboard active option scrolls into view');
      await page.keyboard.press('Enter'); await open();
      assert.equal(await page.$eval('#' + lastActive, e => e.getAttribute('aria-selected')), 'true');
      await page.keyboard.press('Enter'); assert.ok(await page.$(popup), 'keyboard toggle keeps list open');
      assert.equal(await page.$$eval(popup + ' [aria-selected=true]', elements => elements.length), 0);
      await page.keyboard.press('Tab'); await isEmpty();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
      report.push({ width, height, theme, reducedMotion: theme === 'dark', initial: 'pass', focus: 'pass', search: 'pass', selectionById: 'pass', toggle: 'pass', staleResult: 'pass', keyboard: 'pass', geometry: 'pass' });
    }
    // A late API response must not restore a result after deselection.
    await page.setViewport({ width: 1440, height: 900 }); await go(); await open(); await page.click(option(2));
    delayRelationship = 600; const previousCount = relationships.length;
    await page.click(calculate); await page.waitForFunction(() => document.querySelector('.family-explorer > button').disabled);
    await open(); await page.click(option(2)); await blur();
    await new Promise(resolve => setTimeout(resolve, 800));
    assert.ok(relationships.length > previousCount); await isEmpty(); assert.equal(await page.$('.family-explorer__path'), null);
    delayRelationship = 0;
    await open(); await page.click(option(2)); await page.click(calculate); await page.waitForSelector('.family-explorer__path');
    await page.$eval('.family-explorer__path .list-none:last-child button', element => element.click());
    await page.waitForFunction(() => location.pathname.endsWith('/member/2') && document.querySelector('#relationship-reference-member')?.value === 'Mai Thu');
    await page.waitForSelector(input + ':not(:disabled)'); await isEmpty(); assert.equal(await page.$('.family-explorer__result'), null);
    assert.deepEqual(errors, []); assert.deepEqual(writes, []);
    fs.writeFileSync(path.join(artifacts, 'results.json'), JSON.stringify({ report, lateResponse: 'pass', routeReset: 'pass', errors, writes, relationships }, null, 2));
    console.log('PASS: 8 theme/viewport cases, keyboard, ID-based toggle, stale API response and route reset.');
  } catch (error) {
    console.log('Failure', page.url(), await page.evaluate(() => document.body.innerText.slice(-1800)));
    await page.screenshot({ path: path.join(artifacts, 'failure.png') }); throw error;
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
