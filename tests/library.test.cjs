const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function setup(failure) {
  const calls = [];
  const apiClient = Object.fromEntries(['get', 'post', 'put', 'delete'].map(method => [method,
    async (...args) => { calls.push({ method, args }); if (failure) throw failure; return []; }]));
  const source = readFileSync(join(__dirname, '../src/features/admin/services/libraryService.ts'), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  const exports = {};
  new vm.Script(outputText).runInNewContext({ exports, require: () => ({ apiClient }), FormData });
  return { libraryService: exports.libraryService, calls, categories: exports.LIBRARY_CATEGORIES };
}

test('Library service reuses apiClient and existing album/photo routes', async () => {
  const { libraryService, calls, categories } = setup();
  const signal = new AbortController().signal;
  await libraryService.getAlbums(signal);
  await libraryService.getAlbum(15, signal);
  await libraryService.createAlbum({ name: 'Family' });
  await libraryService.updateAlbum(15, { name: 'Renamed' });
  await libraryService.deleteAlbum(15);
  await libraryService.updatePhoto(101, { category: 'temple', description: 'Caption' });
  await libraryService.deletePhoto(101);
  assert.deepEqual(calls.map(call => [call.method, call.args[0]]), [
    ['get', '/api/library/albums'], ['get', '/api/library/albums/15'], ['post', '/api/library/albums'],
    ['put', '/api/library/albums/15'], ['delete', '/api/library/albums/15'],
    ['put', '/api/library/photos/101'], ['delete', '/api/library/photos/101'],
  ]);
  assert.equal(calls[0].args[1].signal, signal);
  assert.equal([...categories].join(','), 'photos,decrees,events,temple');
});

test('batch upload sends files and common metadata together, with no per-photo update step', async () => {
  const { libraryService, calls } = setup();
  const files = [new File(['A'], 'A.jpg', { type: 'image/jpeg' }), new File(['B'], 'B.webp', { type: 'image/webp' })];
  await libraryService.uploadPhotos(15, files, { title: ' Family ', category: 'events', displayDate: '2026', description: 'Description', author: 'Source' });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].args[0], '/api/library/albums/15/photos');
  const form = calls[0].args[1];
  assert.equal(form.getAll('files').length, 2);
  assert.equal(form.get('title'), 'Family');
  assert.equal(form.get('category'), 'events');
  assert.equal(form.get('displayDate'), '2026');
  assert.equal(form.get('description'), 'Description');
  assert.equal(form.get('author'), 'Source');
});

test('API failure propagates without fallback images or false success', async () => {
  const { libraryService } = setup(new Error('Storage unavailable'));
  await assert.rejects(() => libraryService.getAlbums(), /Storage unavailable/);
  await assert.rejects(() => libraryService.uploadPhotos(1, [], { category: 'photos' }), /Storage unavailable/);
  await assert.rejects(() => libraryService.updatePhoto(1, { category: 'photos' }), /Storage unavailable/);
  await assert.rejects(() => libraryService.deletePhoto(1), /Storage unavailable/);
});
