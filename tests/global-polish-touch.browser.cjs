const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const puppeteer = require('puppeteer');
const { createReviewPage, ready } = require('./helpers/global-polish-browser.cjs');
const output = path.resolve(process.env.MYLIFE_REVIEW_DIR || 'docs/review-w9/touch');

async function main() {
  fs.mkdirSync(output, { recursive: true });
  const browser = await puppeteer.launch({ headless: true, pipe: true, timeout: 20000 });
  const results = [];
  try {
    for (const theme of ['light', 'dark']) {
      const { page, state, go } = await createReviewPage(browser, { width: 390, height: 844, theme, touch: true });
      await go('/dev/design-system');
      await ready(page, '[data-ui-button]');
      assert.equal(await page.evaluate(() => matchMedia('(pointer: coarse)').matches), true);
      const inspectTargets = () => page.$$eval('.ds-icon-button, [data-ui-button]', elements => elements.filter(el => el.getClientRects().length).map(el => {
        const rect = el.getBoundingClientRect();
        return { icon: el.classList.contains('ds-icon-button'), width: rect.width, height: rect.height };
      }));
      const targets = await inspectTargets();
      await go('/mylife');
      await ready(page, '.ds-icon-button');
      targets.push(...await inspectTargets());
      assert.ok(targets.length > 0);
      assert.ok(targets.some(target => target.icon));
      assert.ok(targets.every(target => target.height >= 44 && (!target.icon || target.width >= 44)), 'Shared buttons meet touch sizing');
      await page.tap('.app-shell__menu-toggle');
      await ready(page, '.ds-drawer');
      assert.equal(await page.$eval('.ds-drawer', el => el.contains(document.activeElement)), true);
      await page.tap('.ds-drawer a[href="/timeline"]');
      await ready(page, '.timeline-event');
      await page.waitForFunction(() => !document.querySelector('.ds-drawer'));
      state.anonymous = true;
      await go('/');
      await ready(page, '.mylife-landing');
      await page.evaluate(() => window.dispatchEvent(new CustomEvent('ui:openLogin')));
      await ready(page, '.auth-login');
      await page.tap('.auth-login input[type=checkbox]');
      assert.equal(await page.$eval('.auth-login input[type=checkbox]', el => el.checked), true);
      await page.tap('.auth-login button[type=submit]');
      await ready(page, '.auth-login [role=alert]');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
      await page.screenshot({ path: path.join(output, `${theme}-390-login-validation.png`) });
      await page.tap('.auth-login .auth-close');
      await page.waitForFunction(() => !document.querySelector('.auth-login'));
      assert.deepEqual(state.errors, []);
      assert.ok(state.writes.every(write => ['/api/refresh-token', '/api/logout'].includes(write.route)));
      results.push({ theme, width: 390, coarsePointer: true, targets, mobileDrawerNavigation: true, loginTapValidationAndClose: true });
      console.log('PASS: touch controls and login', theme);
      await page.close();
    }
    fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify(results, null, 2));
  } finally {
    await browser.close();
  }
}
main().catch(error => { console.error(error.stack); process.exitCode = 1; });
