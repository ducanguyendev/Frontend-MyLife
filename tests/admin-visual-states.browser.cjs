const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const puppeteer = require('../scratch_puppeteer/node_modules/puppeteer');
const { adminPage, tab, directory, deferred } = require('./helpers/admin-browser.cjs');

async function main() {
  const browser = await puppeteer.launch({ headless: true, pipe: true, timeout: 20000 });
  const dir = directory(), results = [];
  try {
    for (const kind of ['loading', 'error', 'empty']) {
      const { page, state, go } = await adminPage(browser, {
        width: kind === 'empty' ? 390 : 1440, height: kind === 'empty' ? 844 : 900,
        theme: kind === 'error' ? 'dark' : 'light',
      });
      const gate = deferred();
      if (kind === 'loading') for (const key of ['stats', 'users', 'logs']) state.readGates[key] = gate.promise;
      if (kind === 'error') for (const key of ['stats', 'users', 'logs']) state.readFailures[key] = 503;
      if (kind === 'empty') { state.users = []; state.logs = []; }
      await go();
      await page.waitForSelector('.admin-console__tabs button');
      if (kind === 'loading') await page.waitForSelector('.admin-stat-skeleton');
      else await page.waitForFunction(() => !document.querySelector('.admin-console .ds-page-header button[aria-busy=true]'));
      if (kind === 'error') await page.waitForSelector('.admin-overview [role=alert]');
      await page.waitForFunction(() => {
        let element = document.querySelector('.admin-console');
        while (element) {
          if (Number(getComputedStyle(element).opacity) < 0.99) return false;
          element = element.parentElement;
        }
        return true;
      });
      await page.evaluate(async () => { await document.fonts.ready; await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))); });
      for (let index = 0; index < 3; index++) {
        await tab(page, index);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
        await page.screenshot({ path: path.join(dir, `state-${kind}-${['overview', 'users', 'logs'][index]}.png`), fullPage: true });
      }
      gate.resolve();
      assert.deepEqual(state.writes, []);
      assert.deepEqual(state.errors, []);
      results.push({ state: kind, tabs: 3, overflow: false, writes: 0, status: 'pass' });
      await page.close();
    }
    const { page, state, go } = await adminPage(browser, { width: 390, height: 844, language: 'en' });
    await go(); await page.waitForSelector('.admin-kpi');
    await page.click('.admin-recent-panel:last-child .admin-preview-link');
    await page.waitForSelector('.admin-login-logs', { visible: true });
    await tab(page, 0);
    await page.click('.admin-recent-panel:first-child .admin-preview-link');
    await page.waitForSelector('.admin-users', { visible: true });
    const client = await page.createCDPSession();
    const { nodes } = await client.send('Accessibility.getFullAXTree');
    for (const role of ['table', 'columnheader', 'cell']) assert.ok(nodes.some(node => !node.ignored && node.role?.value === role), `Mobile retains ${role} semantics`);
    await page.$eval('[data-admin-user="2"]', el => el.scrollIntoView({ block: 'start' }));
    await page.screenshot({ path: path.join(dir, 'en-light-390-user-actions.png') });
    assert.deepEqual(state.writes, []);
    results.push({ state: 'mobile-card', tableSemantics: 'pass', status: 'pass' });
    await page.close();
    fs.writeFileSync(path.join(dir, 'state-results.json'), JSON.stringify(results, null, 2));
    console.log('PASS: loading/error/empty across three tabs; mobile table accessibility semantics.');
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error.stack); process.exitCode = 1; });
