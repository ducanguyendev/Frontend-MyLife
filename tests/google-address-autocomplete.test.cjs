const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function compile(relativePath) {
  const source = readFileSync(join(__dirname, '..', relativePath), 'utf8');
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  new vm.Script(output).runInNewContext({ exports: module.exports, module });
  return module.exports;
}

const events = compile('src/shared/components/googleAddressAutocompleteEvents.ts');
const loaderCore = compile('src/shared/lib/googleMapsLoaderCore.ts');
const makePlaceEvent = place => ({ placePrediction: { toPlace: () => place } });

test('selection maps only formattedAddress and requests no Google coordinates', async () => {
  const calls = [];
  const place = {
    formattedAddress: '333 Đường Lê Văn Sĩ, Thành phố Hồ Chí Minh, Việt Nam',
    fetchFields: async fields => calls.push(fields),
  };
  const address = await events.readSelectedGoogleAddress(makePlaceEvent(place));
  assert.equal(address, place.formattedAddress);
  assert.deepEqual(Array.from(calls[0].fields), ['formattedAddress']);
  assert.ok(address.length < 255, 'representative Vietnamese formatted address fits the existing varchar(255) column');
});

test('missing formattedAddress and Place Details errors preserve manual text', async () => {
  const missing = await events.readSelectedGoogleAddress(makePlaceEvent({ fetchFields: async () => {} }));
  const failed = await events.readSelectedGoogleAddress(makePlaceEvent({ fetchFields: async () => { throw new Error('offline'); } }));
  assert.equal(missing, null);
  assert.equal(failed, null);
});

test('manual widget input is copied to form state and can supersede an in-flight selection', async () => {
  const listeners = new Map();
  const element = {
    value: '',
    addEventListener(type, listener) { listeners.set(type, listener); },
    removeEventListener(type) { listeners.delete(type); },
  };
  const changes = [];
  events.subscribeToGoogleAddressAutocomplete(element, value => changes.push(value), () => {});
  element.value = 'Hẻm 281/17 Lê Văn Sĩ';
  listeners.get('input')();
  assert.equal(changes.at(-1), 'Hẻm 281/17 Lê Văn Sĩ');

  let finishFetch;
  const fetchFields = () => new Promise(resolve => { finishFetch = resolve; });
  listeners.get('gmp-select')(makePlaceEvent({ formattedAddress: 'Google address', fetchFields }));
  element.value = 'Google address bổ sung bằng tay';
  listeners.get('input')();
  finishFetch();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(changes.at(-1), 'Google address bổ sung bằng tay');
  assert.ok(!changes.includes('Google address'), 'stale async selection never replaces a later manual edit');
});

test('event cleanup removes input, selection and error listeners', () => {
  const listeners = new Map();
  const element = {
    value: '',
    addEventListener(type, listener) { listeners.set(type, listener); },
    removeEventListener(type) { listeners.delete(type); },
  };
  const changes = [];
  const errors = [];
  const cleanup = events.subscribeToGoogleAddressAutocomplete(element, value => changes.push(value), () => errors.push(true));
  cleanup();
  assert.deepEqual(Array.from(listeners.keys()), []);
  assert.deepEqual(changes, []);
  assert.deepEqual(errors, []);
});

test('missing API key rejects cleanly and leaves the component to its manual Input fallback', async () => {
  let scriptCount = 0;
  const loader = loaderCore.createGooglePlacesLoader({ apiKey: ' ', getRuntime: () => null, document: { createElement: () => { scriptCount++; return {}; }, head: { appendChild() {} } } });
  await assert.rejects(loader(), /API key is missing/);
  assert.equal(scriptCount, 0);
  const component = readFileSync(join(__dirname, '../src/shared/components/GoogleAddressAutocomplete.tsx'), 'utf8');
  assert.match(component, /showManualInput/);
  assert.match(component, /<Input/);
  assert.match(component, /onChange=\{event => onChange\(event\.target\.value\)\}/);
});

test('loader deduplicates concurrent script and Places imports', async () => {
  const scripts = [];
  const places = { PlaceAutocompleteElement: class {} };
  let runtime = null;
  const runtimeWhenLoaded = { importLibrary: async library => { assert.equal(library, 'places'); return places; } };
  const loader = loaderCore.createGooglePlacesLoader({
    apiKey: 'test-only-placeholder',
    getRuntime: () => runtime,
    document: { createElement: () => ({ async: false, src: '', onload: null, onerror: null, remove() {} }), head: { appendChild: script => scripts.push(script) } },
  });
  const first = loader();
  const second = loader();
  assert.equal(first, second);
  assert.equal(scripts.length, 1);
  assert.match(scripts[0].src, /language=vi&region=VN/);
  assert.doesNotMatch(scripts[0].src, /location|lat|lng/i);
  runtime = runtimeWhenLoaded;
  scripts[0].onload();
  assert.equal(await first, places);
});

test('failed script load falls back and can safely retry with a new script', async () => {
  const scripts = [];
  let removed = false;
  const places = { PlaceAutocompleteElement: class {} };
  let runtime = null;
  const loader = loaderCore.createGooglePlacesLoader({
    apiKey: 'test-only-placeholder',
    getRuntime: () => runtime,
    document: { createElement: () => ({ async: false, src: '', onload: null, onerror: null, remove() { removed = true; } }), head: { appendChild: script => scripts.push(script) } },
  });
  const failedAttempt = loader().catch(error => error);
  scripts[0].onerror();
  assert.match((await failedAttempt).message, /could not load/);
  assert.equal(removed, true);
  const retry = loader();
  assert.equal(scripts.length, 2);
  runtime = { importLibrary: async () => places };
  scripts[1].onload();
  assert.equal(await retry, places);
});

test('Family Tree keeps address in ordinary member form state and never adds Google metadata', () => {
  const modal = readFileSync(join(__dirname, '../src/features/admin/components/family-tree/MemberFormModal.tsx'), 'utf8');
  const manager = readFileSync(join(__dirname, '../src/features/admin/components/FamilyTreeManager.tsx'), 'utf8');
  const component = readFileSync(join(__dirname, '../src/shared/components/GoogleAddressAutocomplete.tsx'), 'utf8');
  assert.match(modal, /value=\{editingMember\.address \|\| ""\}/);
  assert.match(modal, /onChange=\{\(address\) => onChange\(\{ \.\.\.editingMember, address \}\)\}/);
  assert.match(manager, /const payload = \{\s*\.\.\.editingMember/);
  assert.match(manager, /address:/);
  assert.doesNotMatch(component, /latitude|longitude|placeId|location:/i);
});

test('Vietnamese and English address autocomplete copy both exist and no real key is embedded', () => {
  const vi = JSON.parse(readFileSync(join(__dirname, '../src/shared/locales/vi/admin.json'), 'utf8'));
  const en = JSON.parse(readFileSync(join(__dirname, '../src/shared/locales/en/admin.json'), 'utf8'));
  assert.ok(vi.address_autocomplete_placeholder && vi.address_autocomplete_unavailable);
  assert.ok(en.address_autocomplete_placeholder && en.address_autocomplete_unavailable);
  const source = [
    'src/shared/lib/googleMapsLoader.ts',
    'src/shared/lib/googleMapsLoaderCore.ts',
    'src/shared/components/GoogleAddressAutocomplete.tsx',
    'src/shared/components/googleAddressAutocompleteEvents.ts',
  ].map(path => readFileSync(join(__dirname, '..', path), 'utf8')).join('\n');
  const keyPrefix = ['AI', 'za'].join('');
  assert.doesNotMatch(source, new RegExp(`${keyPrefix}[A-Za-z0-9_-]{30,}`));
});
