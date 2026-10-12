const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const i18next = require('i18next');

function loadService(apiClient) {
  const source = readFileSync(join(__dirname, '../src/features/admin/services/anniversaryService.ts'), 'utf8');
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  new vm.Script(output).runInNewContext({ exports, require: name => {
    assert.equal(name, '@/shared/api/apiClient');
    return { apiClient };
  }, URLSearchParams });
  return exports.anniversaryService;
}

test('anniversary service uses authenticated CRUD and lunar conversion routes', async () => {
  const calls = [];
  const data = { id: 12, title: 'Ngày giỗ', daysUntil: 0 };
  const apiClient = Object.fromEntries(['get', 'post', 'put', 'delete'].map(method => [method, async (path, body) => {
    calls.push({ method, path, body });
    return method === 'delete' ? undefined : { data: path.endsWith('lunar-to-solar?day=1&month=1&year=2025&isLeapMonth=false') ? { solarDate: '2025-01-29' } : method === 'get' && path === '/api/family-tree/anniversaries' ? [data] : data };
  }]));
  const service = loadService(apiClient);
  const signal = new AbortController().signal;
  assert.deepEqual(await service.getAnniversaries(signal), [data]);
  assert.equal(calls[0].path, '/api/family-tree/anniversaries');
  assert.equal(calls[0].body.signal, signal);
  assert.deepEqual(await service.createAnniversary({ title: 'Ngày giỗ' }), data);
  assert.deepEqual(await service.updateAnniversary(12, { title: 'Ngày giỗ sửa' }), data);
  await service.deleteAnniversary(12);
  assert.equal((await service.convertLunarToSolar(1, 1, 2025, false)).solarDate, '2025-01-29');
  assert.deepEqual(calls.slice(1, 4).map(call => [call.method, call.path]), [
    ['post', '/api/family-tree/anniversaries'], ['put', '/api/family-tree/anniversaries/12'], ['delete', '/api/family-tree/anniversaries/12'],
  ]);
  assert.equal(calls.at(-1).path, '/api/family-tree/anniversaries/lunar-to-solar?day=1&month=1&year=2025&isLeapMonth=false');
});

test('Anniversary tab is data-backed and exposes loading, error, search, empty, edit, and delete states', () => {
  const source = readFileSync(join(__dirname, '../src/features/admin/components/family-tree/AnniversaryTab.tsx'), 'utf8');
  assert.match(source, /anniversaryService\.getAnniversaries/);
  assert.doesNotMatch(source, /defaultAnniversaries|anni-[1-9]/);
  for (const state of ['loading', 'loadError', 'no_results', 'empty_desc', 'delete_confirm']) assert.ok(source.includes(state), `Missing UI state: ${state}`);
  for (const operation of ['createAnniversary', 'updateAnniversary', 'deleteAnniversary']) assert.ok(source.includes(operation));
  assert.match(source, /removeVietnameseTones/);
});

test('anniversary controls and status text are translated in Vietnamese and English', async () => {
  for (const lng of ['vi', 'en']) {
    const resources = JSON.parse(readFileSync(join(__dirname, `../src/shared/locales/${lng}/admin.json`), 'utf8'));
    const i18n = i18next.createInstance();
    await i18n.init({ lng, fallbackLng: false, resources: { [lng]: { translation: { admin: resources } }, }, interpolation: { escapeValue: false } });
  for (const key of ['banner_title', 'banner_desc', 'banner_upcoming', 'banner_today', 'banner_empty', 'add', 'edit_title', 'delete_confirm', 'event_type', 'lunar_day', 'leap_month', 'loading', 'load_failed', 'empty', 'invalid_lunar_date', 'save_failed', 'created', 'updated', 'deleted']) {
      const translation = i18n.t(`admin.anniversary_ui.${key}`, { title: 'event' });
      assert.notEqual(translation, `admin.anniversary_ui.${key}`);
      assert.ok(translation.length > 0);
    }
  }
});

test('related-member empty option uses a floated label and anniversary search uses shared SearchBar', () => {
  const select = readFileSync(join(__dirname, '../src/shared/components/ui/Select.tsx'), 'utf8');
  const modal = readFileSync(join(__dirname, '../src/features/admin/components/family-tree/FamilyAnniversaryModal.tsx'), 'utf8');
  const tab = readFileSync(join(__dirname, '../src/features/admin/components/family-tree/AnniversaryTab.tsx'), 'utf8');
  assert.match(select, /\|\| Boolean\(currentLabel\)/);
  assert.match(modal, /includeEmptyOption=\{false\}/);
  assert.match(tab, /import \{ SearchBar \} from ['"]@\/shared\/components\/SearchBar['"]/);
  assert.match(tab, /<SearchBar\b[^>]*ariaLabel=/);
  assert.doesNotMatch(tab, /admin\.anniversary_title|admin\.anniversary_desc/);
});
