const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const puppeteer = require('../scratch_puppeteer/node_modules/puppeteer');
const { createReviewPage, ready } = require('./helpers/global-polish-browser.cjs');
const before = process.argv.includes('--before');
const authOnly = process.argv.includes('--auth-only');
const artifacts = path.resolve('docs/review-w9', before ? 'before' : authOnly ? 'after-auth' : 'after');
const typography = ['.app-nav__link', '.app-nav__sub-link', '.ds-page-header__description', '.admin-kpi__label', '.admin-recent-copy time', '.admin-log-summary dt', '.admin-cell-label', '.timeline-event__date', '.memory-album__copy > small', '.family-map-location__body > strong', '.family-gallery-card__role', '.user-profile__metadata-row'];
async function inspect(page) {
  return page.evaluate(selectors => {
    const visible = el => !!el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden';
    const root = document.querySelector('#app-content');
    const dialog = document.querySelector('[role=dialog]');
    const r = dialog?.getBoundingClientRect();
    return {
      bodyOverflow: document.documentElement.scrollWidth > innerWidth + 1,
      mainOverflow: !!root && root.scrollWidth > root.clientWidth + 1,
      dialogOutside: !!r && (r.x < -1 || r.y < -1 || r.right > innerWidth + 1 || r.bottom > innerHeight + 1 || dialog.scrollWidth > dialog.clientWidth + 1),
      clippedHeading: [...document.querySelectorAll('.ds-page-header h1')].filter(visible).some(el => el.scrollWidth > el.clientWidth + 1),
      typography: Object.fromEntries(selectors.map(selector => {
        const el = [...document.querySelectorAll(selector)].find(visible);
        if (!el) return [selector, null];
        const style = getComputedStyle(el); return [selector, { size: parseFloat(style.fontSize), lineHeight: style.lineHeight, color: style.color }];
      }).filter(([, value]) => value)),
    };
  }, typography);
}
async function tokenContrast(page) {
  return page.evaluate(() => {
    const rgb = token => {
      const probe = document.createElement('span');
      probe.style.setProperty('color', `var(${token})`, 'important');
      probe.style.setProperty('transition', 'none', 'important');
      document.body.append(probe);
      const color = getComputedStyle(probe).color;
      probe.remove();
      return color.match(/[\d.]+/g).slice(0, 3).map(Number);
    };
    const luminance = color => color.map(value => { const v = value / 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }).reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
    const pairs = [
      ['--text-secondary', '--surface-primary', 4.5], ['--text-muted', '--surface-secondary', 4.5], ['--text-muted', '--bg-subtle', 4.5],
      ['--brand-primary', '--brand-primary-soft', 4.5], ['--state-success', '--state-success-soft', 4.5], ['--state-danger', '--state-danger-soft', 4.5], ['--state-warning', '--state-warning-soft', 4.5], ['--state-info', '--state-info-soft', 4.5],
      ['--accent-timeline', '--accent-timeline-soft', 4.5], ['--accent-anniversary', '--accent-anniversary-soft', 4.5], ['--accent-library', '--accent-library-soft', 4.5], ['--accent-map', '--accent-map-soft', 4.5],
      ['--field-border', '--field-bg', 3], ['--field-focus-border', '--field-bg', 3], ['--field-placeholder', '--field-bg', 4.5],
    ];
    const result = pairs.map(([foreground, background, minimum]) => { const a = luminance(rgb(foreground)), b = luminance(rgb(background)); return { foreground, background, minimum, ratio: +((Math.max(a, b) + .05) / (Math.min(a, b) + .05)).toFixed(3) }; });
    return result;
  });
}
async function main() {
  fs.mkdirSync(artifacts, { recursive: true });
  const browser = await puppeteer.launch({ headless: true, pipe: true, timeout: 20000 });
  const results = [], contrast = []; let current;
  const cases = before ? [[1440,900,'light','vi'], [390,844,'dark','en']] : [[1920,1080], [1440,900], [820,1180], [390,844]].flatMap(([w,h]) => ['light','dark'].flatMap(theme => ['vi','en'].map(language => [w,h,theme,language])));
  try {
    for (const [width,height,theme,language] of cases) {
      const { page, state, go } = await createReviewPage(browser, { width,height,theme,language }); current = page;
      const name = `${language}-${theme}-${width}`; console.log('Global polish', before ? 'before' : 'after', name);
      async function review(view, selector, capture = true) {
        await ready(page, selector);
        const metrics = await inspect(page);
        const record = { case: name, view, ...metrics }; results.push(record);
        fs.writeFileSync(path.join(artifacts, 'results.json'), JSON.stringify(results, null, 2));
        if (!before) {
          assert.equal(metrics.bodyOverflow, false, `${name} ${view} page overflow`);
          assert.equal(metrics.mainOverflow, false, `${name} ${view} content overflow`);
          assert.equal(metrics.dialogOutside, false, `${name} ${view} dialog bounds`);
          assert.equal(metrics.clippedHeading, false, `${name} ${view} heading clipped`);
        }
        const representative = width === 1440 && theme === 'light' && language === 'vi' || width === 390 && theme === 'dark' && language === 'en' && (authOnly || ['timeline','library','map','admin-logs','profile','login'].includes(view));
        if (capture && representative) await page.screenshot({ path: path.join(artifacts, `${name}-${view}.png`) });
      }
      if (authOnly) {
        state.anonymous = true;
        await go('/Register'); await review('register','form input[name=email]');
        if (width<640) assert.equal(await page.$eval('.auth-register__utilities',el=>el.getBoundingClientRect().bottom<=el.nextElementSibling.getBoundingClientRect().top),true,'Register utilities fit above header');
        await page.click('a[href="/"]'); await ready(page,'.mylife-landing');
        await page.evaluate(()=>window.dispatchEvent(new CustomEvent('ui:openLogin')));
        await review('login','.auth-login input[autocomplete=username]');
        assert.deepEqual(state.errors,[]);
        await page.close(); continue;
      }
      await go('/mylife'); await review('hub', '.my-life-hub');
      contrast.push({ theme, case: name, pairs: await tokenContrast(page) });
      if (!before) for (const pair of contrast.at(-1).pairs) assert.ok(pair.ratio >= pair.minimum, `${theme} ${pair.foreground}/${pair.background}: ${pair.ratio}`);
      await page.click('.app-shell__utilities button'); await page.waitForSelector('[data-user-menu]');
      await page.click('[data-user-menu] button:has(svg.lucide-user)'); await review('profile', '.user-profile__facts');
      await page.keyboard.press('Escape'); await page.waitForFunction(() => !document.querySelector('[role=dialog]'));
      await go('/familytree'); await ready(page, '.family-manager__viewport');
      await page.waitForFunction(() => !document.querySelector('.family-loading'));
      await review('family-tree', '.family-manager__viewport', false);
      await page.click('.family-toolbar .ds-segments button:nth-child(2)'); await review('family-cards', '.family-gallery-card');
      await page.click('.family-toolbar .ds-segments button:nth-child(3)'); await review('family-list', width < 768 ? '.family-member-mobile' : '.family-member-table', false);
      await go('/mylife/family/member/1'); await review('member', '.family-profile__hero');
      await go('/timeline'); await review('timeline', '.timeline-event');
      await go('/anniversaries'); await review('anniversaries', '.anniversary-event');
      await go('/library'); await review('library', '.memory-album');
      await go('/map'); await review('map', '.family-map-location');
      state.role = 'ADMIN'; await go('/Home/Admin'); await review('admin-overview', '.admin-kpi');
      await page.click('.admin-console__tabs button:nth-child(2)'); await review('admin-users', '[data-admin-user]');
      await page.click('.admin-console__tabs button:nth-child(3)'); await review('admin-logs', '[data-admin-log]');
      state.anonymous = true; await go('/Register'); await review('register', 'form input[name=email]');
      await page.click('a[href="/"]'); await ready(page, '.mylife-landing');
      await page.evaluate(() => window.dispatchEvent(new CustomEvent('ui:openLogin')));
      await review('login', 'input[autocomplete=username]');
      assert.deepEqual(state.errors, []);
      assert.ok(state.writes.every(write => ['/api/refresh-token', '/api/logout'].includes(write.route)), 'No record mutations during visual QA: ' + JSON.stringify(state.writes));
      await page.close();
    }
    fs.writeFileSync(path.join(artifacts, 'contrast.json'), JSON.stringify(contrast, null, 2));
    console.log(`PASS: ${results.length} rendered views across ${cases.length} viewport/theme/language cases.`);
  } catch (error) {
    fs.writeFileSync(path.join(artifacts, 'contrast.json'), JSON.stringify(contrast, null, 2));
    if (current && !current.isClosed()) await current.screenshot({ path: path.join(artifacts, 'failure.png') }).catch(() => {});
    throw error;
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error.stack); process.exitCode = 1; });
