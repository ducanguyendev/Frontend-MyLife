// Real React/browser request-count regression. Google responses are controlled:
// primary failure -> Drive thumbnail 302 -> image 429, with no backend/Drive writes.
const assert = require('node:assert/strict');
const { readFileSync, mkdtempSync, writeFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const puppeteer = require(process.env.PUPPETEER_MODULE || '../scratch_puppeteer/node_modules/puppeteer');

async function main() {
  const artifacts = mkdtempSync(join(tmpdir(), 'mylife-drive429-browser-'));
  const bytes = process.env.USER_WEBP_FIXTURE ? readFileSync(process.env.USER_WEBP_FIXTURE)
    : Buffer.from(JSON.parse(readFileSync(join(__dirname, '../../Backend-MyLife/Tests/fixtures/avatar-replacements.json'), 'utf8'))[1].base64, 'base64');
  const requests = []; const responses = []; const errors = [];
  const modes = new Map();
  let title = 'Drive 429 photo';
  const now = '2026-10-07T00:00:00Z';
  const photoDto = () => ({ id: 99, title, category: 'photos', driveFileId: 'refresh-failure',
    url: 'https://lh3.googleusercontent.com/d/refresh-failure', fileName: 'real.webp',
    contentType: 'image/webp', fileSize: bytes.length, caption: '', description: '', author: 'Fixture',
    displayDate: '', sortOrder: 0, takenAt: null, createdAt: now });
  const browser = await puppeteer.launch({ headless: true,
    executablePath: process.env.BROWSER_EXECUTABLE || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    args: process.env.LIBRARY_UI_NO_SANDBOX === '1' ? ['--no-sandbox'] : [] });
  let page;
  try {
    page = await browser.newPage(); await page.setViewport({ width: 1280, height: 900 });
    await page.setCacheEnabled(false);
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => {
      if (response.url().includes('google.com/thumbnail') || response.url().includes('/mock-redirect/'))
        responses.push({ url: response.url(), status: response.status() });
    });
    await page.evaluateOnNewDocument(() => {
      localStorage.setItem('app_language', 'vi'); localStorage.setItem('i18nextLng', 'vi');
    });
    await page.setRequestInterception(true);
    page.on('request', async request => {
      const url = new URL(request.url());
      const headers = { 'cache-control': 'no-store' };
      let id; let width; let kind;
      if (url.hostname === 'library-image.test') { id = url.searchParams.get('id'); width = 'primary'; kind = 'primary'; }
      else if (url.hostname === 'drive.google.com' && url.pathname === '/thumbnail') {
        id = url.searchParams.get('id'); width = url.searchParams.get('sz'); kind = 'fallback';
      } else if (url.hostname === 'lh3.googleusercontent.com' && url.pathname.startsWith('/d/')) {
        const match = url.pathname.slice(3).match(/^(.*?)(?:=(w\d+))?$/); id = match[1]; width = match[2]; kind = 'primary';
      } else if (url.hostname === 'lh3.googleusercontent.com' && url.pathname.startsWith('/mock-redirect/')) {
        id = url.pathname.slice('/mock-redirect/'.length); width = url.searchParams.get('sz'); kind = 'redirect';
      }
      if (id && modes.has(id)) {
        requests.push({ id, width, kind, url: request.url() });
        const mode = modes.get(id);
        if (kind === 'fallback') return request.respond({ status: 302, headers: { ...headers,
          location: 'https://lh3.googleusercontent.com/mock-redirect/' + id + '?sz=' + width } });
        const status = kind === 'primary' ? mode.primary : mode.fallback;
        return request.respond({ status, headers, contentType: status === 200 ? 'image/webp' : 'text/plain',
          body: status === 200 ? bytes : 'Too Many Requests fixture' });
      }
      if (url.pathname.startsWith('/api/')) {
        const cors = { 'access-control-allow-origin': request.headers().origin || 'http://127.0.0.1:7001',
          'access-control-allow-credentials': 'true', 'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS',
          'access-control-allow-headers': 'Content-Type,X-Requested-With' };
        if (request.method() === 'OPTIONS') return request.respond({ status: 204, headers: cors });
        let body = [];
        if (url.pathname === '/api/me') body = { id: 1, email: 'fixture@example.com', name: 'Fixture', role: 'USER', roles: ['USER'], isActive: true };
        if (url.pathname === '/api/library/categories') body = [{ id: 1, name: 'photos', slug: 'photos', isDefault: true }];
        if (url.pathname === '/api/library/albums') body = [{ id: 1, name: 'Fixture album', description: '', photoCount: 1, createdAt: now, updatedAt: now }];
        if (url.pathname === '/api/library/albums/1') body = { id: 1, name: 'Fixture album', photos: [photoDto()] };
        if (url.pathname === '/api/library/photos/99') { title = JSON.parse(request.postData()).title; body = photoDto(); }
        return request.respond({ status: 200, headers: cors, contentType: 'application/json', body: JSON.stringify(body) });
      }
      if (url.hostname === '127.0.0.1') return request.continue();
      return request.abort(); // Keep this harness entirely local.
    });
    await page.goto(process.env.LIBRARY_UI_TEST_URL || 'http://127.0.0.1:7001/Home', { waitUntil: 'networkidle0' });
    const cleanup = () => page.evaluate(() => {
      window.__imageFixture?.cleanup(); document.querySelector('[data-drive-image-test]')?.remove();
    });
    const mount = async (id, mode, primary) => {
      modes.set(id, mode);
      await page.evaluate(async ({ id, primary }) => {
        const { mountImageFixture } = await import('/tests/library-image-browser-harness.tsx');
        const element = document.createElement('div'); element.dataset.driveImageTest = 'true';
        Object.assign(element.style, { position: 'fixed', inset: '0', zIndex: '10000', overflow: 'auto', background: 'white' });
        document.body.append(element);
        window.__imageFixture = mountImageFixture(element, { id: 1, albumId: 1, driveFileId: id,
          url: primary || 'https://library-image.test/photo.webp?id=' + id, title: 'Photo', desc: '', author: '', year: '', category: 'photos' });
      }, { id, primary });
    };
    const stableRenders = () => page.evaluate(async () => {
      for (let i = 0; i < 30; i++) { window.__imageFixture.rerender(); await new Promise(requestAnimationFrame); }
    });
    const count = (id, kind, width) => requests.filter(r => r.id === id && r.kind === kind && (!width || r.width === width)).length;

    await mount('primary-success', { primary: 200, fallback: 200 });
    await page.waitForFunction(() => document.querySelector('[data-drive-image-test] img')?.naturalWidth > 0);
    await stableRenders(); assert.equal(count('primary-success', 'primary'), 1); assert.equal(count('primary-success', 'fallback'), 0);
    await cleanup();

    await mount('fallback-success', { primary: 404, fallback: 200 });
    await page.waitForFunction(() => document.querySelector('[data-drive-image-test] img')?.naturalWidth > 0);
    await stableRenders(); assert.equal(count('fallback-success', 'primary'), 1); assert.equal(count('fallback-success', 'fallback'), 1);
    assert.equal(count('fallback-success', 'redirect'), 1); await cleanup();

    await mount('both-fail', { primary: 404, fallback: 429 });
    await page.waitForSelector('[data-drive-image-test] [role="img"]');
    await stableRenders();
    assert.equal(await page.$$eval('[data-drive-image-test] img', images => images.length), 0);
    assert.equal(count('both-fail', 'primary'), 1); assert.equal(count('both-fail', 'fallback'), 1); assert.equal(count('both-fail', 'redirect'), 1);
    // The same URLs belong to a different photo now: a genuine identity change may start over.
    await page.evaluate(() => window.__imageFixture.change({ id: 2 }));
    await page.waitForFunction(() => document.querySelector('[data-drive-image-test] [role="img"]'));
    await stableRenders();
    assert.equal(count('both-fail', 'primary'), 2); assert.equal(count('both-fail', 'fallback'), 2);
    assert.ok(responses.some(r => r.status === 302)); assert.ok(responses.some(r => r.status === 429)); await cleanup();

    await mount('canonical-thumbnail', { primary: 404, fallback: 429 }, 'https://drive.google.com/thumbnail?sz=w1600&id=canonical-thumbnail');
    await page.waitForSelector('[data-drive-image-test] [role="img"]'); await stableRenders();
    assert.equal(count('canonical-thumbnail', 'fallback'), 1); assert.equal(count('canonical-thumbnail', 'redirect'), 1);
    await cleanup();

    await mount('lightbox-success', { primary: 200, fallback: 200 }, 'https://lh3.googleusercontent.com/d/lightbox-success');
    await page.waitForFunction(() => document.querySelector('[data-drive-image-test] img')?.naturalWidth > 0);
    await stableRenders(); assert.equal(count('lightbox-success', 'primary', 'w640'), 1);
    assert.equal(requests.filter(r => r.id === 'lightbox-success' && r.width === 'w1600').length, 0);
    const gallery = await page.$eval('[data-drive-image-test] img', image => ({ loading: image.loading, decoding: image.decoding }));
    assert.deepEqual(gallery, { loading: 'lazy', decoding: 'async' });
    await page.evaluate(() => window.__imageFixture.open());
    await page.waitForFunction(() => document.querySelector('[role="dialog"] img')?.naturalWidth > 0);
    await stableRenders(); assert.equal(count('lightbox-success', 'primary', 'w1600'), 1);
    await page.evaluate(() => window.__imageFixture.close()); await stableRenders();
    assert.equal(await page.$('[role="dialog"]'), null); assert.equal(count('lightbox-success', 'primary', 'w1600'), 1);
    await cleanup();

    // Actual LibraryTab refresh: edit metadata and keep the exhausted gallery instance.
    modes.set('refresh-failure', { primary: 404, fallback: 429 });
    await page.evaluate(async () => {
      const { mountLibraryFixture } = await import('/tests/library-image-browser-harness.tsx');
      const element = document.createElement('div'); element.dataset.driveImageTest = 'true';
      Object.assign(element.style, { position: 'fixed', inset: '0', zIndex: '10000', overflow: 'auto', background: 'white' });
      document.body.append(element); window.__imageFixture = mountLibraryFixture(element);
    });
    await page.waitForSelector('[data-drive-image-test] [role="img"]');
    await page.evaluate(() => { window.__galleryPlaceholder = document.querySelector('[data-drive-image-test] [role="img"]'); });
    const beforeRefresh = count('refresh-failure', 'primary', 'w640');
    assert.equal(beforeRefresh, 1); assert.equal(count('refresh-failure', 'fallback', 'w640'), 1);
    await page.$eval('[data-drive-image-test] h4', title => title.click());
    await page.waitForSelector('[role="dialog"] [role="img"]');
    const click = text => page.evaluate(text => {
      const button = [...document.querySelectorAll('[role="dialog"] button')].find(b => b.textContent.trim() === text);
      if (!button) throw new Error('Missing ' + text); button.click();
    }, text);
    await click('Sửa thông tin ảnh'); await page.waitForSelector('[role="dialog"] input');
    await page.$eval('[role="dialog"] input', input => { const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(input, 'Edited metadata'); input.dispatchEvent(new Event('input', { bubbles: true })); });
    await click('Lưu');
    await page.waitForFunction(() => document.querySelector('[data-drive-image-test] h4')?.textContent === 'Edited metadata');
    assert.equal(await page.evaluate(() => window.__galleryPlaceholder === document.querySelector('[data-drive-image-test] [role="img"]')), true);
    assert.equal(count('refresh-failure', 'primary', 'w640'), beforeRefresh); assert.equal(count('refresh-failure', 'fallback', 'w640'), 1);
    await page.screenshot({ path: join(artifacts, 'exhausted-after-refresh.png') }); await cleanup();

    assert.deepEqual(errors, []);
    const result = { passed: true, cases: ['primary success: one request', 'primary failure: one fallback',
      '302 then 429: finite placeholder', '30 repeated renders: no retries', 'photo identity reset',
      'gallery: w640 only', 'closed lightbox: no high-res', 'opened lightbox: w1600 once', 'metadata refresh: no gallery remount', 'equivalent thumbnail: one candidate'],
      requests, responses, actualWebPBytes: bytes.length, liveDriveVerified: false, artifacts };
    writeFileSync(join(artifacts, 'results.json'), JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result));
  } catch (error) {
    if (page) await page.screenshot({ path: join(artifacts, 'failure.png') });
    console.error(JSON.stringify({ artifacts, requests, responses, errors }));
    throw error;
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
