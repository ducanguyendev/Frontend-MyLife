// Isolated browser session: every API request is fulfilled with a local fixture.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const puppeteer = require('../scratch_puppeteer/node_modules/puppeteer');
const { loadTreeModule } = require('./helpers/load-tree-module.cjs');
const tree = path.resolve('src/features/admin/components/family-tree');
const { buildFamilyRelationshipGraph, getAncestralLineageHighlight } = loadTreeModule(path.join(tree, 'familyTreeHighlight.ts'));
const stamp = '2026-01-01T00:00:00Z';
const member = (id, fullName, generation, extra = {}) => ({ id, fullName, generation, gender: id % 2 ? 'Nam' : 'Nữ', role: 'Thành viên', lifeStatus: 'LIVING', childIds: [], createdAt: stamp, updatedAt: stamp, ...extra });
const members = [
  member(1, 'Nguyễn Văn An', 1, { spouseId: 2 }), member(2, 'Trần Thị Mai', 1),
  member(3, 'Nguyễn Minh', 2, { fatherId: 1, motherId: 2, spouseId: 4 }), member(4, 'Phạm Thanh', 2), member(5, 'Lê Thu Hà', 2),
  member(6, 'Nguyễn Huỳnh Minh Đức', 3, { fatherId: 3, motherId: 4, spouseId: 10 }),
  member(7, 'Nguyễn Huỳnh Quốc Bảo', 3, { fatherId: 3, motherId: 4, spouseId: 11 }),
  member(8, 'Nguyễn Lan', 3, { fatherId: 3, motherId: 5 }), member(9, 'Nguyễn Bình', 3, { fatherId: 3 }),
  member(10, 'Đỗ Mai', 3), member(11, 'Vũ Thu', 3),
  member(12, 'Nguyễn Anh', 4, { fatherId: 6, motherId: 10 }),
  member(13, 'Nguyễn Yến', 4, { fatherId: 7, motherId: 11 }),
  member(14, 'Nguyễn Châu', 5, { fatherId: 12 }), member(15, 'Lê Bình', 3),
];
const graph = buildFamilyRelationshipGraph(members);
const artifacts = path.resolve('docs/review-w52');
const report = [];
async function main() {
  fs.mkdirSync(artifacts, { recursive: true });
  console.log('Launching isolated Edge browser');
  const browser = await puppeteer.launch({ headless: true, executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', args: ['--no-first-run', '--disable-extensions'] });
  let debugPage;
  try {
    for (const [renderer, base] of [['shadcn', 'http://127.0.0.1:7002'], ['stable', 'http://127.0.0.1:7003']]) {
      console.log('Reviewing', renderer);
      const page = await browser.newPage();
      debugPage = page;
      page.setDefaultTimeout(15000);
      const errors = []; const requests = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.setRequestInterception(true);
      page.on('request', request => {
        const url = new URL(request.url());
        if (!url.pathname.startsWith('/api/')) return request.continue();
        requests.push({ method: request.method(), path: url.pathname });
        let body = { success: true, data: [] };
        if (url.pathname === '/api/me') body = { id: 42, email: 'review@example.test', displayName: 'Tree review', role: 'USER', roles: ['USER'], isActive: true };
        if (url.pathname === '/api/family-tree') body.data = members;
        if (url.pathname === '/api/family-tree/generations') body.data = [1, 2, 3, 4, 5].map(id => ({ id, name: String(id) }));
        return request.respond({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': request.headers().origin || '*', 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': request.headers()['access-control-request-headers'] || 'content-type,x-requested-with', 'Access-Control-Allow-Methods': 'GET,OPTIONS' }, body: JSON.stringify(body) });
      });
      await page.evaluateOnNewDocument(() => { localStorage.setItem('app_language', 'vi'); if (!localStorage.getItem('portfolio-theme-preference')) localStorage.setItem('portfolio-theme-preference', 'light'); });
      await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
      const card = renderer === 'shadcn' ? '.shadcn-family-tree__person' : '.family-person-card';
      const scene = renderer === 'shadcn' ? '.shadcn-family-tree__scene' : '.family-tree-view__scene';
      const viewport = renderer === 'shadcn' ? '.shadcn-family-tree__viewport' : '.family-tree-view__viewport';
      const shell = renderer === 'shadcn' ? '.shadcn-family-tree' : '.family-tree-view-shell';
      const matrix = () => page.$eval(scene, element => { const m = new DOMMatrix(getComputedStyle(element).transform); return { x: m.e, y: m.f, scale: m.a }; });
      const choose = id => page.$eval(`${card}[data-member-id="${id}"]`, element => element.click());
      const clear = async () => { await page.$eval(viewport, element => element.focus()); await page.keyboard.press('Escape'); await page.waitForFunction(card => !document.querySelector(card + '.is-focused'), {}, card); };
      const verify = async id => {
        const expected = getAncestralLineageHighlight(graph, id);
        const snapshot = await page.evaluate(card => ({
          nodes: [...document.querySelectorAll(card + '.is-related')].map(e => Number(e.dataset.memberId)).sort((a, b) => a - b),
          segments: [...document.querySelectorAll('[data-segment-id]')].map(e => ({ active: e.classList.contains('is-related'), edges: e.dataset.semanticEdges.split(' ').filter(Boolean) })),
        }), card);
        assert.deepEqual(snapshot.nodes, [...expected.highlightedNodeIds].sort((a, b) => a - b));
        for (const segment of snapshot.segments) assert.equal(segment.active, segment.edges.some(edge => expected.highlightedSemanticEdgeIds.has(edge)));
      };
      const appearance = async theme => {
        if (await page.evaluate(() => document.documentElement.dataset.theme) === theme) return;
        const trigger = await page.$('[data-preference-trigger="theme"]');
        if (trigger) {
          await trigger.click(); await page.waitForSelector('[data-preference-popover="theme"] [role=option]');
          await page.evaluate(theme => [...document.querySelectorAll('[data-preference-popover="theme"] [role=option]')].find(e => e.textContent.includes(theme === 'dark' ? 'Tối' : 'Sáng'))?.click(), theme);
        } else {
          // Mobile preference controls live in the account panel. Reload only the isolated test session.
          await page.evaluate(theme => localStorage.setItem('portfolio-theme-preference', theme), theme); await page.reload({ waitUntil: 'domcontentloaded' }); await page.waitForSelector(card);
        }
        await page.waitForFunction(theme => document.documentElement.dataset.theme === theme, {}, theme);
      };
      for (const [width, height] of [[1920, 1080], [1440, 900], [1366, 768], [820, 1180], [390, 844]]) {
        console.log('Viewport', renderer, width);
        await page.setViewport({ width, height, isMobile: width === 390, hasTouch: width <= 820 });
        await page.goto(base + '/familytree', { waitUntil: 'domcontentloaded' }); console.log('Loaded', page.url()); await page.waitForSelector(card);
        assert.equal(await page.$$eval(card, elements => elements.length), members.length);
        for (const theme of ['light', 'dark']) {
          await appearance(theme); await clear();
          await page.screenshot({ path: path.join(artifacts, `${renderer}-${theme}-${width}-overview.png`) });
          const original = await matrix();
          await page.hover(`${card}[data-member-id="6"]`);
          assert.equal(await page.$$eval(card + '.is-related', elements => elements.length), 0, 'hover does not create persistent lineage classes');
          assert.equal(await page.$$eval('[data-segment-id].is-related', elements => elements.length), 0, 'hover does not activate connectors');
          assert.deepEqual(await matrix(), original, 'hover does not move the camera');
          await choose(6); await verify(6);
          await page.mouse.move(8, 8); await verify(6);
          await page.screenshot({ path: path.join(artifacts, `${renderer}-${theme}-${width}-selected.png`) });
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, 'page has no horizontal overflow');
          assert.equal(await page.$eval('.family-tree-archive', element => getComputedStyle(element).pointerEvents), 'none');
          assert.equal(await page.$eval('.family-tree-archive', element => getComputedStyle(element).transform), 'none', 'atmosphere stays outside the transformed scene');
          await clear(); assert.deepEqual(await matrix(), original, 'clearing retains the camera');
          if (width === 390) {
            const touch = await page.createCDPSession();
            const rect = await page.$eval(viewport, element => { const r = element.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; });
            const x = Math.round(rect.x + rect.width - 45), y = Math.round(rect.y + rect.height - 120);
            const before = await matrix();
            await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] });
            await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x - 35, y: y - 20, id: 1 }] });
            await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
            await page.waitForFunction(({ scene, x }) => new DOMMatrix(getComputedStyle(document.querySelector(scene)).transform).e !== x, {}, { scene, x: before.x });
            await touch.detach();
          }
          report.push({ renderer, theme, width, height, selection: 'pass', overflow: false });
        }
      }
      await page.setViewport({ width: 1440, height: 900 });
      await page.goto(base + '/familytree', { waitUntil: 'domcontentloaded' }); await page.waitForSelector(card);
      for (const id of [6, 3, 7, 12, 15, 6, 1, 6]) { await choose(id); await verify(id); }
      await clear();
      const search = await page.$('input[type=search]'); await search.type('Minh Đức');
      await page.waitForSelector(card + '[data-member-id="6"].is-focused'); await verify(6);
      await page.click('button[aria-label="Xóa tìm kiếm"]'); await page.waitForFunction(card => !document.querySelector(card + '.is-focused'), {}, card);
      const beforeZoom = await matrix();
      await page.click('button[aria-label="Phóng to"]');
      await page.waitForFunction(({ scene, scale }) => new DOMMatrix(getComputedStyle(document.querySelector(scene)).transform).a > scale, {}, { scene, scale: beforeZoom.scale });
      const zoomed = await matrix(); await page.click('button[aria-label="Thu nhỏ"]');
      await page.waitForFunction(({ scene, scale }) => new DOMMatrix(getComputedStyle(document.querySelector(scene)).transform).a < scale, {}, { scene, scale: zoomed.scale });
      const rect = await page.$eval(viewport, e => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; });
      const beforePan = await matrix();
      await page.mouse.move(rect.x + rect.width - 35, rect.y + rect.height - 70); await page.mouse.down(); await page.mouse.move(rect.x + rect.width - 95, rect.y + rect.height - 100, { steps: 3 }); await page.mouse.up();
      assert.notEqual((await matrix()).x, beforePan.x);
      const beforeFullscreen = await matrix();
      await page.click('button[aria-label="Toàn màn hình"]'); await page.waitForFunction(() => !!document.fullscreenElement);
      assert.equal((await matrix()).scale, beforeFullscreen.scale);
      await page.screenshot({ path: path.join(artifacts, `${renderer}-fullscreen.png`) });
      await page.$eval(shell + ' button:has(svg.lucide-shrink)', element => element.click()); await page.waitForFunction(() => !document.fullscreenElement);
      assert.equal((await matrix()).scale, beforeFullscreen.scale);
      // Keep explicit branch focus separate from ordinary selection.
      const menu = renderer === 'shadcn' ? '.shadcn-family-tree__action-menu' : '.family-person-card__action-trigger';
      await page.$eval(`${card}[data-member-id="6"] ${menu}`, element => element.click());
      await page.waitForSelector('[role=menu]');
      await page.evaluate(() => [...document.querySelectorAll('[role=menuitem]')].find(e => /nhánh/i.test(e.textContent)).click());
      await page.waitForFunction(card => document.querySelectorAll(card).length < 15, {}, card);
      const overview = renderer === 'shadcn' ? '.shadcn-family-tree__back' : '.family-tree-view__overview';
      await page.click(overview); await page.waitForFunction(card => document.querySelectorAll(card).length === 15, {}, card);
      await clear();
      const downloads = path.join(artifacts, 'downloads', renderer); fs.mkdirSync(downloads, { recursive: true });
      const cdp = await page.createCDPSession();
      await cdp.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: downloads, eventsEnabled: true });
      const downloaded = new Promise((resolve, reject) => { const timeout = setTimeout(() => reject(Error('PNG export timeout')), 30000); cdp.on('Browser.downloadProgress', event => { if (event.state === 'completed') { clearTimeout(timeout); resolve(); } }); });
      const beforeExport = await matrix();
      await page.click('button[aria-label="Xuất PNG"]');
      await page.waitForFunction(shell => document.querySelector(shell).classList.contains('is-exporting'), {}, shell);
      const exportedLine = await page.evaluate(shell => {
        const root = document.querySelector(shell).getBoundingClientRect();
        const line = document.querySelector('[data-segment-id].family-tree-link--family-child path, [data-segment-id].shadcn-family-tree__link--family-child path');
        const rect = line.getBoundingClientRect();
        const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1;
        const context = canvas.getContext('2d'); context.fillStyle = getComputedStyle(line).stroke; context.fillRect(0, 0, 1, 1);
        return { x: (rect.left + rect.right) / 2 - root.left, y: (rect.top + rect.bottom) / 2 - root.top, color: [...context.getImageData(0, 0, 1, 1).data].slice(0, 3) };
      }, shell);
      await downloaded;
      await page.waitForFunction(shell => !document.querySelector(shell).classList.contains('is-exporting'), {}, shell);
      assert.deepEqual(await matrix(), beforeExport, 'export restores the camera');
      assert.equal(await page.$$eval('[data-segment-id] path[style]', elements => elements.length), 0, 'temporary export styles are restored');
      const png = fs.readFileSync(path.join(downloads, fs.readdirSync(downloads).find(file => file.endsWith('.png'))));
      assert.equal(png.subarray(1, 4).toString(), 'PNG');
      assert.ok(png.readUInt32BE(16) > 1000 && png.readUInt32BE(20) > 500, 'export retains full resolution');
      const exportedStrokePresent = await page.evaluate(async ({ data, line }) => {
        const image = new Image(); image.src = 'data:image/png;base64,' + data; await image.decode();
        const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
        const context = canvas.getContext('2d'); context.drawImage(image, 0, 0);
        const pixels = context.getImageData(Math.round(line.x * 2) - 2, Math.round(line.y * 2) - 2, 5, 5).data;
        for (let i = 0; i < pixels.length; i += 4) if (line.color.every((value, index) => Math.abs(value - pixels[i + index]) < 18)) return true;
        return false;
      }, { data: png.toString('base64'), line: exportedLine });
      assert.ok(exportedStrokePresent, 'PNG contains the actual connector stroke, not only cards');
      assert.deepEqual(errors, []);
      assert.ok(requests.every(request => ['GET', 'OPTIONS'].includes(request.method)), 'no API writes');
      report.push({ renderer, rapidSelection: 'pass', search: 'pass', pan: 'pass', zoom: 'pass', fullscreen: 'pass', branch: 'pass', png: 'pass', consoleErrors: errors });
      await page.close();
    }
    fs.writeFileSync(path.join(artifacts, 'results.json'), JSON.stringify(report, null, 2));
    console.log('PASS: both renderers, 20 theme/viewport cases, selection routes, camera, branch and PNG.');
  } catch (error) {
    if (debugPage) { console.log('Failure page', debugPage.url(), await debugPage.evaluate(() => document.body.innerText.slice(0, 1200))); await debugPage.screenshot({ path: path.join(artifacts, 'failure.png') }); }
    throw error;
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
