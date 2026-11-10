// Isolated profile review: every API request, including account action smoke tests, is mocked.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const puppeteer = require('../scratch_puppeteer/node_modules/puppeteer');
const base = process.env.MYLIFE_UI_URL || 'http://127.0.0.1:7004';
const output = path.resolve(process.env.MYLIFE_REVIEW_DIR || 'docs/review-w80');
const account = {
  id: 42, email: 'a.long.account.address.for.layout.review@example.test',
  fullName: 'Nguyễn Huỳnh Minh Đức', displayName: 'Nguyễn Minh Đức', role: 'USER', roles: ['USER'],
  isActive: true, authProvider: 0, loginProviders: { local: true, google: false },
  phoneNumber: '0912345678', gender: 'Nam', dateOfBirth: '2000-05-10',
  avatarUrl: base + '/profile-review-avatar.svg',
};
async function main() {
  fs.mkdirSync(output, { recursive: true });
  const browser = await puppeteer.launch({ headless: true, pipe: true, timeout: 15000 });
  const results = [];
  try {
    for (const [width, height, language] of (process.env.PROFILE_AUDIT ? [[1440,900,'vi']] : [[1440, 900, 'vi'], [1920, 1080, 'vi'], [390, 844, 'vi'], [820, 1180, 'en'], [1440, 600, 'en']])) {
      for (const theme of ['light', 'dark']) {
        const page = await browser.newPage();
        const errors = [], writes = [];
        page.on('pageerror', error => errors.push(error.message));
        page.setDefaultTimeout(15000);
        await page.setViewport({ width, height });
        await page.setRequestInterception(true);
        page.on('request', request => {
          const url = new URL(request.url());
          if (url.pathname === '/profile-review-avatar.svg') return request.respond({ status: 200, contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect width="96" height="96" fill="#66816e"/><circle cx="48" cy="35" r="17" fill="#e7eee7"/><path d="M16 96c0-40 64-40 64 0" fill="#e7eee7"/></svg>' });
          if (!url.pathname.startsWith('/api/')) return request.continue();
          if (!['GET', 'OPTIONS'].includes(request.method())) writes.push(url.pathname);
          const body = url.pathname === '/api/me' ? account : url.pathname === '/api/avatar/upload'
            ? { success: true, message: 'ok', avatarUrl: base + '/profile-review-avatar.svg' } : { success: true, message: 'ok', data: [] };
          return request.respond({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': request.headers().origin || '*', 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': request.headers()['access-control-request-headers'] || 'content-type,x-requested-with', 'Access-Control-Allow-Methods': 'GET,OPTIONS,POST,PUT,DELETE' }, body: JSON.stringify(body) });
        });
        await page.evaluateOnNewDocument(({ theme, language }) => {
          localStorage.setItem('app_language', language);
          localStorage.setItem('portfolio-theme-preference', theme);
        }, { theme, language });
        await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
        await page.goto(base + '/familytree', { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('button[aria-label="' + (language === 'vi' ? 'Mở menu tài khoản' : 'Open account menu') + '"]');
        await page.click('button[aria-label="' + (language === 'vi' ? 'Mở menu tài khoản' : 'Open account menu') + '"]');
        await page.waitForSelector('[data-user-menu]');
        await page.evaluate(() => document.querySelector('[data-user-menu] button:has(svg.lucide-user)')?.click());
        await page.waitForSelector('.user-profile__facts');
        await page.waitForFunction(() => document.querySelector('.user-profile__facts')?.textContent.includes('0912345678'));
        await page.waitForFunction(() => +getComputedStyle(document.querySelector('.user-profile__content')).opacity === 1);
        const metrics = await page.evaluate(() => {
          const root = document.querySelector('.user-profile-modal');
          const rect = el => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom }; };
          return {
            dialog: rect(root), topGap: rect(root.querySelector('.user-profile__header')).y - rect(root).y,
            tabs: [...root.querySelectorAll('.ds-segments__item')].map(rect),
            badges: [...root.querySelectorAll('.user-profile__badge')].map(rect),
            footer: [...root.querySelectorAll('.user-profile__footer > button')].map(rect),
            bodyOverflow: root.querySelector('.custom-scrollbar').scrollWidth > root.querySelector('.custom-scrollbar').clientWidth,
            overflowingRows: [...root.querySelectorAll('.user-profile__metadata-row')].some(el => el.scrollWidth > el.clientWidth),
            scrollable: root.querySelector('.custom-scrollbar').scrollHeight > root.querySelector('.custom-scrollbar').clientHeight,
            theme: document.documentElement.dataset.theme,
          };
        });
        assert.ok(Math.abs(metrics.tabs[0].width - metrics.tabs[1].width) < 1);
        assert.equal(metrics.tabs[0].height, metrics.tabs[1].height);
        assert.equal(metrics.badges[0].height, metrics.badges[1].height);
        assert.equal(metrics.footer[0].width, metrics.footer[1].width);
        assert.equal(metrics.footer[0].height, metrics.footer[1].height);
        assert.ok(metrics.topGap <= 34, 'controlled space above identity');
        assert.equal(metrics.bodyOverflow, false); assert.equal(metrics.overflowingRows, false);
        assert.ok(metrics.dialog.y >= 0 && metrics.dialog.bottom <= height);
        assert.equal(metrics.theme, theme);
        if (height === 600) assert.equal(metrics.scrollable, true);
        await page.screenshot({ path: path.join(output, `${theme}-${width}x${height}-${language}-profile.png`) });
        if (width === 1440 && height === 900 && theme === 'light') {
          const data = await page.evaluate(() => { const canvas=document.createElement('canvas');canvas.width=canvas.height=8;canvas.getContext('2d').fillRect(0,0,8,8);return canvas.toDataURL('image/png').split(',')[1]; });
          const tempDir=fs.mkdtempSync(path.join(os.tmpdir(),'mylife-avatar-review-')), file=path.join(tempDir,'avatar.png');fs.writeFileSync(file,Buffer.from(data,'base64'));
          await (await page.$('.user-profile__avatar-wrap input[type=file]')).uploadFile(file);
          await page.waitForResponse(response=>new URL(response.url()).pathname==='/api/avatar/upload').catch(()=>{});
          await page.waitForFunction(() => document.querySelector('.user-profile__remove-avatar') && !document.querySelector('.user-profile__remove-avatar').disabled);
          await page.waitForFunction(() => document.querySelector('.user-profile-modal')?.textContent.includes('Cập nhật ảnh đại diện thành công'));
          await page.$eval('.user-profile__remove-avatar',el=>el.click());
          await page.waitForFunction(() => !document.querySelector('.user-profile__remove-avatar')).catch(async error=>{ console.log('Avatar diagnostics', writes, await page.$eval('.user-profile-modal',el=>el.innerText.slice(-600)));throw error;});
          fs.unlinkSync(file);fs.rmdirSync(tempDir);
        }
        await page.click('.user-profile__tabs button:last-child');
        await page.waitForSelector('.user-profile__security input[type=password]');
        await page.waitForFunction(() => +getComputedStyle(document.querySelector('.user-profile__security')).opacity === 1);
        await page.screenshot({ path: path.join(output, `${theme}-${width}x${height}-${language}-security.png`) });
        await page.$eval('.user-profile__security form',el=>el.requestSubmit());
        await page.waitForSelector('.user-profile__security [aria-invalid=true]');
        await page.focus('.user-profile__tabs button:last-child'); await page.keyboard.press('ArrowLeft');
        await page.waitForSelector('.user-profile__facts');
        await page.click('.user-profile__edit-button'); await page.waitForSelector('.user-profile__edit-form input[readonly]');
        assert.equal(await page.$eval('.user-profile__edit-form', el => el.scrollWidth > el.clientWidth), false);
        await page.click('.user-profile-modal > div:first-child button');
        await page.waitForFunction(() => !document.querySelector('.user-profile-modal'));
        if (width===1440 && height===900) {
          await page.click('button[aria-label="Mở menu tài khoản"]');await page.waitForSelector('[data-user-menu]');
          await page.$eval('[data-user-menu] button:has(svg.lucide-user)',el=>el.click());await page.waitForSelector('.user-profile__footer');
          await page.click('.user-profile__footer > button:'+(theme==='light'?'first':'last')+'-child');
          await page.waitForFunction(()=>location.pathname==='/' && !document.querySelector('.user-profile-modal'));
          assert.ok(writes.includes('/api/logout'));
        }
        assert.deepEqual(errors, []);
        assert.ok(writes.every(p=>['/api/avatar/upload','/api/avatar','/api/logout'].includes(p)), 'no password/profile changes submitted');
        results.push({ width, height, language, theme, ...metrics });
        await page.close();
      }
    }
    fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify(results, null, 2));
    console.log('PASS: 10 profile/security layout cases, keyboard tabs, edit entry, password validation, isolated avatar removal/upload and switch/logout actions.');
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
