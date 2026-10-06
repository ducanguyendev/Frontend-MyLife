// Optional browser regression against the local Vite server. All API requests
// are intercepted; this never writes to the real backend or Google Drive.
const assert = require('node:assert/strict');
const { readFileSync, writeFileSync, mkdtempSync } = require('node:fs');
const { join } = require('node:path');
const { tmpdir } = require('node:os');
const puppeteer = require(process.env.PUPPETEER_MODULE || '../scratch_puppeteer/node_modules/puppeteer');

async function main() {
  const artifacts = mkdtempSync(join(tmpdir(), 'mylife-library-browser-'));
  const fixtures = JSON.parse(readFileSync(join(__dirname, '../../Backend-MyLife/Tests/fixtures/avatar-replacements.json'), 'utf8'));
  const image = `data:image/jpeg;base64,${fixtures[0].base64}`;
  const now = new Date().toISOString();
  let nextAlbum = 3;
  let nextPhoto = 100;
  let mode = 'normal';
  let deleteFails = false;
  const categories = ['photos', 'decrees', 'events', 'temple'].map((slug, index) => ({ id: index + 1, name: slug, slug, isDefault: true }));
  const errors = [];
  const calls = [];
  const albums = [
    { id: 1, name: 'Album gia đình', description: null, createdAt: now, updatedAt: now, photos: [] },
    { id: 2, name: 'Du lịch', description: null, createdAt: now, updatedAt: now, photos: [] },
  ];
  const photo = (id, title, category, extra = {}) => ({ id, title, category, displayDate: '2026', description: 'Mô tả thật từ API',
    caption: 'Mô tả thật từ API', author: 'Nguồn gia đình', fileName: 'original.jpg', contentType: 'image/jpeg', fileSize: 767,
    sortOrder: 0, takenAt: null, createdAt: now, url: image, driveFileId: '', ...extra });
  albums[0].photos = [photo(1, 'Ảnh gia đình API', 'photos'), photo(2, 'Họp mặt API', 'events')];
  const dto = album => ({ ...album, photoCount: album.photos.length, coverPhotoUrl: null });
  const browser = await puppeteer.launch({ headless: true,
    executablePath: process.env.BROWSER_EXECUTABLE || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe' });
  let page;
  try {
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    page.on('pageerror', error => errors.push(error.message));
    await page.evaluateOnNewDocument(() => {
      localStorage.setItem('app_language', 'vi'); localStorage.setItem('i18nextLng', 'vi');
      window.__previewCreated = []; window.__previewRevoked = []; window.__openedOriginal = [];
      const create = URL.createObjectURL.bind(URL); const revoke = URL.revokeObjectURL.bind(URL);
      URL.createObjectURL = file => { const url = create(file); window.__previewCreated.push(url); return url; };
      URL.revokeObjectURL = url => { window.__previewRevoked.push(url); revoke(url); };
      window.open = (...args) => { window.__openedOriginal.push(args); return null; };
      // CDP may omit multipart bodies containing disk-backed files. Inspect
      // the actual FormData at the browser fetch boundary before forwarding it.
      const originalFetch = window.fetch.bind(window);
      window.fetch = (url, options) => {
        if (String(url).includes('/api/library/') && options?.body instanceof FormData) {
          window.__libraryUpload = {
            fields: Object.fromEntries([...options.body.entries()].filter(([, value]) => typeof value === 'string')),
            files: options.body.getAll('files').map(file => ({ name: file.name, size: file.size, type: file.type })),
          };
        }
        return originalFetch(url, options);
      };
    });
    await page.setRequestInterception(true);
    page.on('request', async request => {
      const url = new URL(request.url());
      if (url.pathname === '/test-primary-image') return request.respond({ status: 404, body: '' });
      if (url.hostname === 'drive.google.com' && url.pathname === '/thumbnail') {
        return request.respond({ status: url.searchParams.get('id') === 'test-drive-id' ? 200 : 404,
          contentType: 'image/png', body: url.searchParams.get('id') === 'test-drive-id' ? Buffer.from(fixtures[2].base64, 'base64') : '' });
      }
      if (!url.pathname.startsWith('/api/')) { await request.continue(); return; }
      const path = url.pathname;
      const method = request.method();
      const raw = request.postData() || '';
      const headers = {
        'access-control-allow-origin': request.headers().origin || 'http://127.0.0.1:7001',
        'access-control-allow-credentials': 'true',
        'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'access-control-allow-headers': 'Content-Type,X-Requested-With',
      };
      if (method === 'OPTIONS') return request.respond({ status: 204, headers });
      calls.push({ method, path, contentType: request.headers()['content-type'], ajax: request.headers()['x-requested-with'] });
      const respond = (body, status = 200) => request.respond({ status, headers, contentType: 'application/json', body: status === 204 ? undefined : JSON.stringify(body) });
      if (path === '/api/me') return respond({ id: 1, email: 'library-ui@example.com', name: 'Library UI', role: 'ADMIN', isActive: true, avatarUrl: null });
      if (path === '/api/family-tree' || path.startsWith('/api/family-tree/')) return respond({ success: true, data: [] });
      if (path === '/api/library/categories' && method === 'GET') return respond(categories);
      if (path === '/api/library/categories' && method === 'POST') {
        const category = { id: categories.length + 1, name: JSON.parse(raw).name, slug: 'du-lich', isDefault: false };
        categories.push(category); return respond(category, 201);
      }
      const categoryMatch = path.match(/^\/api\/library\/categories\/(\d+)$/);
      if (categoryMatch && method === 'DELETE') {
        const category = categories.find(category => category.id === Number(categoryMatch[1]));
        if (albums.some(album => album.photos.some(photo => photo.category === category.slug)))
          return respond({ code: 'LIBRARY_CATEGORY_IN_USE', message: 'Category is in use.' }, 409);
        categories.splice(categories.indexOf(category), 1); return respond(null, 204);
      }
      if (path === '/api/library/albums' && method === 'GET') {
        if (mode === 'error') return respond({ success: false, message: 'Lỗi API kiểm thử' }, 503);
        return respond(mode === 'empty' ? [] : albums.map(dto));
      }
      if (path === '/api/library/albums' && method === 'POST') {
        const metadata = JSON.parse(raw);
        const album = { id: nextAlbum++, name: metadata.name, description: metadata.description, photos: [], createdAt: now, updatedAt: now };
        albums.push(album); return respond(dto(album), 201);
      }
      const albumMatch = path.match(/^\/api\/library\/albums\/(\d+)(\/photos)?$/);
      if (albumMatch) {
        const album = albums.find(album => album.id === Number(albumMatch[1]));
        if (!album) return respond({ success: false, message: 'Album missing' }, 404);
        if (method === 'GET') return respond(dto(album));
        if (method === 'PUT') { Object.assign(album, JSON.parse(raw)); return respond(dto(album)); }
        if (method === 'DELETE') { albums.splice(albums.indexOf(album), 1); return respond(null, 204); }
        if (method === 'POST') {
          const multipart = await page.evaluate(() => window.__libraryUpload);
          const field = name => multipart.fields[name] || '';
          const count = multipart.files.length;
          const uploaded = Array.from({ length: count }, () => photo(nextPhoto++, field('title'), field('category'), {
            displayDate: field('displayDate'), description: field('description'), author: field('author') }));
          album.photos.push(...uploaded); return respond(uploaded, 201);
        }
      }
      const photoMatch = path.match(/^\/api\/library\/photos\/(\d+)$/);
      if (photoMatch) {
        const album = albums.find(album => album.photos.some(photo => photo.id === Number(photoMatch[1])));
        const target = album?.photos.find(photo => photo.id === Number(photoMatch[1]));
        if (!target) return respond({ success: false, message: 'Photo missing' }, 404);
        if (method === 'PUT') { Object.assign(target, JSON.parse(raw)); return respond(target); }
        if (deleteFails) return respond({ success: false, message: 'Drive delete failed' }, 502);
        album.photos.splice(album.photos.indexOf(target), 1); return respond(null, 204);
      }
      return respond([]);
    });
    const click = async (text, selector = 'button') => page.evaluate((text, selector) => {
      const element = [...document.querySelectorAll(selector)].find(element => element.textContent.trim() === text || element.getAttribute('aria-label') === text);
      if (!element) throw new Error(`Missing UI control: ${text}`);
      element.click();
    }, text, selector);
    const waitText = text => page.waitForFunction(text => document.body.innerText.includes(text), {}, text);
    const dismissNotification = async () => {
      await page.evaluate(() => [...document.querySelectorAll('button')].find(button => button.textContent.trim() === 'Đóng')?.click());
      await page.waitForFunction(() => ![...document.querySelectorAll('button')].some(button => button.textContent.trim() === 'Đóng'));
    };
    const fill = async (selector, text) => {
      const element = await page.$(selector); assert.ok(element, selector); await element.focus();
      await page.keyboard.down('Control'); await page.keyboard.press('A'); await page.keyboard.up('Control');
      await page.keyboard.press('Backspace'); await element.type(text);
    };
    const openLibrary = async () => { await waitText('Thư viện gia đình'); await click('Thư viện gia đình'); };
    await page.goto(process.env.LIBRARY_UI_TEST_URL || 'http://127.0.0.1:7001/FamilyTree', { waitUntil: 'networkidle0' });
    await openLibrary(); await waitText('Ảnh gia đình API');
    assert.equal(await page.$('button[aria-label="Xóa danh mục"]'), null);
    // Real browser image error events: first URL fails, thumbnail succeeds.
    albums[0].photos[0].url = 'http://127.0.0.1:7001/test-primary-image';
    albums[0].photos[0].driveFileId = 'test-drive-id';
    albums[0].photos.push(photo(3, 'Ảnh không tải được', 'photos', { url: 'http://127.0.0.1:7001/test-primary-image', driveFileId: 'missing-id' }));
    await page.reload({ waitUntil: 'networkidle0' }); await openLibrary(); await waitText('Ảnh gia đình API');
    await page.waitForFunction(() => document.querySelector('img[alt="Ảnh gia đình API"]')?.naturalWidth > 0);
    assert.ok(await page.$('img[src*="thumbnail?id=test-drive-id"]'));
    await waitText('Không thể tải ảnh');
    await click('Ảnh gia đình API', 'h4'); await page.waitForSelector('[role="dialog"]');
    await page.waitForFunction(() => document.querySelector('[role="dialog"] img')?.naturalWidth > 0);
    await click('Mở ảnh gốc', '[role="dialog"] button');
    assert.deepEqual(await page.evaluate(() => window.__openedOriginal.at(-1)), ['https://drive.google.com/file/d/test-drive-id/view', '_blank', 'noopener,noreferrer']);
    await page.keyboard.press('Escape');
    await click('Họp mặt dòng tộc'); await waitText('Họp mặt API');
    assert.equal(await page.evaluate(() => [...document.querySelectorAll('h4')].some(element => element.textContent === 'Ảnh gia đình API')), false);
    await click('Họp mặt API', 'h4'); await page.waitForSelector('[role="dialog"]');
    await waitText('Mô tả thật từ API'); await waitText('Nguồn gia đình');
    await page.keyboard.press('Escape');
    await click('Tất cả tư liệu');
    await page.select('select[aria-label="Lọc theo album"]', '2'); await waitText('Chưa có tư liệu nào trong thư viện.');
    await click('Tạo album'); await page.waitForSelector('[role="dialog"] input');
    assert.ok(!(await page.$eval('[role="dialog"]', dialog => dialog.innerText)).includes('Tên album *'));
    await click('Lưu', '[role="dialog"] button'); await waitText('Vui lòng nhập tên album.');
    assert.equal(calls.filter(call => call.path === '/api/library/albums' && call.method === 'POST').length, 0);
    await fill('[role="dialog"] input', 'Sinh nhật'); await click('Lưu', '[role="dialog"] button');
    await page.waitForFunction(() => document.querySelector('select[aria-label="Lọc theo album"]')?.value === '3');
    await page.waitForFunction(() => !document.querySelector('[role="dialog"]'));
    await page.waitForFunction(() => !document.querySelector('[role="status"]'));
    await dismissNotification();
    await click('Tạo danh mục'); await page.waitForSelector('[role="dialog"] input');
    await fill('[role="dialog"] input', 'Du lịch'); await click('Tạo', '[role="dialog"] button');
    await page.waitForFunction(() => !document.querySelector('[role="dialog"]')); await dismissNotification();
    await click('Du lịch');
    await click('Tải lên tư liệu / ảnh'); await page.waitForSelector('[role="dialog"] input[type="file"]');
    const paths = [0, 2, 1].map((index, order) => {
      const extension = ['jpg', 'png', 'webp'][order];
      const path = join(artifacts, `image-${order}.${extension}`);
      writeFileSync(path, Buffer.from(fixtures[index].base64, 'base64')); return path;
    });
    const input = await page.$('[role="dialog"] input[type="file"]'); await input.uploadFile(...paths);
    await page.waitForFunction(() => [...document.querySelectorAll('[role="dialog"] img')].filter(image => image.src.startsWith('blob:') && image.naturalWidth > 0).length === 3);
    const sizing = await page.evaluate(() => {
      const controls = [...document.querySelectorAll('[role="dialog"] input:not([type="file"]), [role="dialog"] select')];
      return controls.map(control => { const s = getComputedStyle(control);
        return { height: Number.parseFloat(s.height), radius: s.borderRadius, padding: s.padding, font: s.fontSize }; });
    });
    assert.ok(sizing.every(control => JSON.stringify(control) === JSON.stringify(sizing[0])), JSON.stringify(sizing));
    assert.equal(sizing[0].height, 56);
    const gifPath = join(artifacts, 'C.gif'); writeFileSync(gifPath, Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
    await input.uploadFile(...paths, gifPath);
    await page.waitForFunction(() => [...document.querySelectorAll('[role="dialog"] img')].filter(image => image.src.startsWith('blob:') && image.naturalWidth > 0).length === 4);
    await click('Bỏ ảnh C.gif', '[role="dialog"] button');
    await page.waitForFunction(() => document.querySelectorAll('[role="dialog"] img').length === 3);
    await fill('[role="dialog"] input:not([type="file"])', 'Bộ ảnh mới');
    // The category select is in the metadata form; album is the first select.
    const selects = await page.$$('[role="dialog"] select'); assert.equal(await selects[1].evaluate(select => select.value), 'du-lich');
    await selects[0].select('3');
    await click('Tải lên tư liệu / ảnh', '[role="dialog"] button'); await waitText('Bộ ảnh mới');
    await dismissNotification();
    assert.equal(albums.find(album => album.id === 3).photos.length, 3);
    const sent = await page.evaluate(() => window.__libraryUpload);
    assert.equal(sent.fields.title, 'Bộ ảnh mới'); assert.equal(sent.fields.category, 'du-lich');
    const previewUrls = await page.evaluate(() => ({ created: window.__previewCreated, revoked: window.__previewRevoked }));
    assert.deepEqual([...previewUrls.created].sort(), [...previewUrls.revoked].sort());
    await click('Xóa danh mục', 'button[aria-label]'); await click('Xóa', '[role="dialog"] button');
    await waitText('Danh mục đang được sử dụng và không thể xóa.');
    assert.equal(await page.evaluate(() => document.body.innerText.includes('Category is in use.')), false);
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('[role="dialog"]'));
    assert.deepEqual(sent.files.map(file => file.type), ['image/jpeg', 'image/png', 'image/webp']);
    assert.ok(sent.files.every(file => file.size > 0));
    const uploadCall = calls.find(call => call.method === 'POST' && call.path.endsWith('/photos'));
    assert.ok(uploadCall.contentType.startsWith('multipart/form-data; boundary='));
    assert.equal(uploadCall.ajax, 'MyLife');
    await click('Bộ ảnh mới', 'h4'); await click('Sửa thông tin ảnh', '[role="dialog"] button');
    await page.waitForSelector('[role="dialog"] input'); await fill('[role="dialog"] input', 'Ảnh đã sửa');
    await click('Lưu', '[role="dialog"] button'); await waitText('Ảnh đã sửa');
    await page.waitForFunction(() => !document.querySelector('[role="dialog"]'));
    await dismissNotification();
    await click('Ảnh đã sửa', 'h4'); deleteFails = true;
    await page.waitForSelector('[role="dialog"][aria-label="Ảnh đã sửa"]');
    await click('Xóa', '[role="dialog"][aria-label="Ảnh đã sửa"] button');
    await page.waitForFunction(() => !document.querySelector('[role="dialog"][aria-label="Ảnh đã sửa"]'));
    await click('Xóa', '[role="dialog"] button'); await waitText('Không thể xóa ảnh. Vui lòng thử lại.');
    assert.equal(await page.evaluate(() => document.body.innerText.includes('Drive delete failed')), false);
    assert.ok(albums.find(album => album.id === 3).photos.some(photo => photo.title === 'Ảnh đã sửa'));
    deleteFails = false; await click('Xóa', '[role="dialog"] button');
    await page.waitForFunction(() => !document.querySelector('[role="dialog"]'));
    assert.equal(albums.find(album => album.id === 3).photos.length, 2);
    await dismissNotification();
    await click('Sửa album', 'button[aria-label]'); await page.waitForSelector('[role="dialog"] input');
    await fill('[role="dialog"] input', 'Sinh nhật cập nhật'); await click('Lưu', '[role="dialog"] button');
    await page.waitForFunction(() => !document.querySelector('[role="dialog"]'));
    await dismissNotification(); await waitText('Sinh nhật cập nhật');
    await page.setViewport({ width: 390, height: 844 });
    await page.evaluate(() => document.documentElement.classList.remove('dark'));
    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 400)));
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
    await page.screenshot({ path: join(artifacts, 'library-mobile.png'), fullPage: true });
    await click('Bộ ảnh mới', 'h4'); await page.waitForSelector('[role="dialog"]');
    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 400)));
    assert.ok(await page.evaluate(() => {
      const bounds = document.querySelector('[role="dialog"]').getBoundingClientRect();
      return bounds.top >= 0 && bounds.bottom <= window.innerHeight && bounds.left >= 0 && bounds.right <= window.innerWidth;
    }));
    await page.screenshot({ path: join(artifacts, 'lightbox-mobile.png') });
    await page.keyboard.press('Escape');
    await page.setViewport({ width: 1280, height: 900 });
    await page.evaluate(() => document.documentElement.classList.add('dark'));
    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 400)));
    await page.screenshot({ path: join(artifacts, 'library-dark.png'), fullPage: true });
    await click('Xóa album', 'button[aria-label]'); await page.waitForSelector('[role="dialog"]');
    await click('Xóa', '[role="dialog"] button');
    await page.waitForFunction(() => !document.querySelector('[role="dialog"]')); await dismissNotification();
    assert.equal(albums.some(album => album.id === 3), false);
    await click('Du lịch'); await click('Xóa danh mục', 'button[aria-label]'); await click('Xóa', '[role="dialog"] button');
    await page.waitForFunction(() => !document.querySelector('[role="dialog"]')); await dismissNotification();
    assert.equal(categories.some(category => category.slug === 'du-lich'), false);
    mode = 'error'; await page.reload({ waitUntil: 'networkidle0' }); await openLibrary(); await waitText('Không thể tải thư viện. Vui lòng thử lại.');
    assert.equal(await page.evaluate(() => document.body.innerText.includes('Lỗi API kiểm thử')), false);
    assert.equal(await page.$$eval('img[src*="unsplash"]', images => images.length), 0);
    mode = 'empty'; await click('Thử lại'); await waitText('Chưa có tư liệu nào trong thư viện.');
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ passed: true, checks: ['gallery API data', 'category/album filters', 'lightbox metadata', 'album create/edit/delete',
      'multipart upload', 'preview cleanup/remove/JPG/PNG/WebP/GIF', 'equal field dimensions', 'primary/thumbnail/placeholder/reload/original',
      'dynamic category create/preselect/filter/delete/in-use', 'photo edit', 'delete failure/retry', 'empty/error states', 'mobile/dark screenshots'], artifacts }));
  } catch (error) {
    if (page) {
      await page.screenshot({ path: join(artifacts, 'failure.png'), fullPage: true });
      console.error(JSON.stringify({ artifacts, calls, errors, url: page.url(), body: await page.evaluate(() => document.body.innerText) }));
    }
    throw error;
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
