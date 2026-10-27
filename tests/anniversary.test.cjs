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

test('anniversary service uses authenticated CRUD and calendar calculation routes', async () => {
  const calls = [];
  const next = { lunarDay: 1, lunarMonth: 1, isLeapMonth: false, nextLunarYear: 2026, nextSolarDate: '2026-02-17', daysUntil: 7, solarYear: 2026, isCurrentYearPassed: false };
  const data = { id: 12, title: 'Ngày giỗ', daysUntil: 0 };
  const apiClient = Object.fromEntries(['get', 'post', 'put', 'delete'].map(method => [method, async (path, body) => {
    calls.push({ method, path, body });
    return method === 'delete' ? undefined : { data: path.includes('next-occurrence?') ? next : path.endsWith('lunar-to-solar?day=1&month=1&year=2025&isLeapMonth=false') ? { solarDate: '2025-01-29' } : method === 'get' && path === '/api/family-tree/anniversaries' ? [data] : data };
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
  assert.deepEqual(await service.getNextOccurrence(1, 1, false), next);
  assert.deepEqual(calls.slice(1, 4).map(call => [call.method, call.path]), [
    ['post', '/api/family-tree/anniversaries'], ['put', '/api/family-tree/anniversaries/12'], ['delete', '/api/family-tree/anniversaries/12'],
  ]);
  assert.equal(calls.at(-2).path, '/api/family-tree/anniversaries/lunar-to-solar?day=1&month=1&year=2025&isLeapMonth=false');
  assert.equal(calls.at(-1).method, 'get');
  assert.equal(calls.at(-1).body.signal, undefined);
  assert.equal(calls.at(-1).path, '/api/family-tree/anniversaries/next-occurrence?day=1&month=1&isLeapMonth=false');
});

test('Anniversary workspace is data-backed with calendar filtering and CRUD states', () => {
  const source = readFileSync(join(__dirname, '../src/features/admin/components/family-tree/AnniversaryTab.tsx'), 'utf8');
  assert.match(source, /anniversaryService\.getAnniversaries/);
  assert.doesNotMatch(source, /defaultAnniversaries|anni-[1-9]/);
  for (const state of ['loading', 'loadError', 'no_results', 'empty_desc', 'delete_confirm']) assert.ok(source.includes(state), `Missing UI state: ${state}`);
  for (const operation of ['createAnniversary', 'updateAnniversary', 'deleteAnniversary']) assert.ok(source.includes(operation));
  assert.match(source, /removeVietnameseTones/);
  assert.match(source, /item\.nextSolarDate/);
  assert.match(source, /getAnniversaryMonthGrid\(/);
  assert.match(source, /filterDate \? textFiltered\.filter/);
  assert.match(source, /setCalendarSelectedDate\(target\.selectedDate\)/);
  assert.match(source, /setFilterDate\(null\)/);
  assert.match(source, /overflow-y-auto overscroll-contain p-3/);
  assert.match(source, /xl:grid-cols-\[minmax\(290px,0\.4fr\)_minmax\(0,0\.6fr\)\]/);
  assert.doesNotMatch(source, /banner_title|admin\.anniversary_ui\.total|admin\.anniversary_ui\.nearest/);
});

test('solar calendar utilities handle month edges, leap February, and UTC-safe ISO dates', () => {
  const source = readFileSync(join(__dirname, '../src/features/admin/components/family-tree/anniversaryCalendarUtils.ts'), 'utf8');
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  new vm.Script(output).runInNewContext({ exports, Date, Intl });
  const { getAnniversaryMonthGrid, anniversaryDateParts, anniversaryDateKey, getAnniversaryNavigationTarget } = exports;

  const december = getAnniversaryMonthGrid(2026, 11);
  assert.ok(december.some(day => day.year === 2027 && day.month === 0 && day.day === 1 && !day.inMonth));
  const january = getAnniversaryMonthGrid(2027, 0);
  assert.ok(january.some(day => day.year === 2026 && day.month === 11 && day.day === 31 && !day.inMonth));
  const leapFebruary = getAnniversaryMonthGrid(2024, 1).filter(day => day.inMonth);
  assert.equal(leapFebruary.length, 29);
  assert.equal(JSON.stringify(anniversaryDateParts('2026-10-13')), JSON.stringify({ year: 2026, month: 9, day: 13 }));
  assert.equal(anniversaryDateParts('2026-02-30'), null);
  assert.equal(anniversaryDateKey(2027, 0, 2), '2027-01-02');
  assert.deepEqual(JSON.parse(JSON.stringify(getAnniversaryNavigationTarget('2027-01-09'))), { visibleMonth: { year: 2027, month: 0 }, selectedDate: '2027-01-09' });
  assert.deepEqual(JSON.parse(JSON.stringify(getAnniversaryNavigationTarget('2027-08-19'))), { visibleMonth: { year: 2027, month: 7 }, selectedDate: '2027-08-19' });
  assert.deepEqual(JSON.parse(JSON.stringify(getAnniversaryNavigationTarget('2028-12-15'))), { visibleMonth: { year: 2028, month: 11 }, selectedDate: '2028-12-15' });
  assert.equal(getAnniversaryNavigationTarget('2028-13-45'), null);
});

test('event card selection navigates without filtering the list; actions remain separate and month picker applies', () => {
  const source = readFileSync(join(__dirname, '../src/features/admin/components/family-tree/AnniversaryTab.tsx'), 'utf8');
  assert.match(source, /const handleSelectEvent = \(item: FamilyAnniversary\)[\s\S]*setVisibleMonth\(target\.visibleMonth\)[\s\S]*setCalendarSelectedDate\(target\.selectedDate\)[\s\S]*setSelectedEventId\(item\.id\)/);
  assert.match(source, /aria-pressed=\{selectedEventId === item\.id\}/);
  assert.match(source, /onClick=\{event => \{ event\.stopPropagation\(\); void openEditor\(item\); \}\}/);
  assert.match(source, /onClick=\{event => \{ event\.stopPropagation\(\); setDeleting\(item\); \}\}/);
  assert.match(source, /setVisibleMonth\(draftMonth\);\s*setMonthPickerOpen\(false\)/);
  assert.match(source, /setCalendarSelectedDate\(todayKey\)/);
  assert.doesNotMatch(source.match(/const handleSelectEvent = \(item: FamilyAnniversary\) => \{[\s\S]*?\n  \};/)?.[0] ?? '', /setFilterDate/);
});

test('anniversary controls and status text are translated in Vietnamese and English', async () => {
  for (const lng of ['vi', 'en']) {
    const resources = JSON.parse(readFileSync(join(__dirname, `../src/shared/locales/${lng}/admin.json`), 'utf8'));
    const i18n = i18next.createInstance();
    await i18n.init({ lng, fallbackLng: false, resources: { [lng]: { translation: { admin: resources } }, }, interpolation: { escapeValue: false } });
  for (const key of ['calendar', 'month_picker', 'month', 'year', 'go_to_month', 'calendar_solar', 'previous_month', 'next_month', 'upcoming_events', 'clear_date', 'no_events_date', 'add', 'add_aria_label', 'edit_title', 'delete_confirm', 'event_type', 'event_information', 'date_of_death', 'solar_death_date', 'lunar_death_date', 'lunar_day', 'lunar_month', 'lunar_year', 'historical_lunar_year', 'lunar_recurrence_help', 'original_date_summary', 'upcoming_lunar_date', 'original_lunar_year', 'recurrence_explanation', 'leap_month', 'checking_dates', 'dates_match', 'date_mismatch', 'current_year_passed', 'current_year_upcoming', 'loading', 'load_failed', 'empty', 'invalid_lunar_date', 'save_failed', 'created', 'updated', 'deleted']) {
      const translation = i18n.t(`admin.anniversary_ui.${key}`, { title: 'event' });
      assert.notEqual(translation, `admin.anniversary_ui.${key}`);
      assert.ok(translation.length > 0);
    }
  }
});

test('related-member reset uses an explicit Radix item and anniversary search uses shared SearchBar', () => {
  const select = readFileSync(join(__dirname, '../src/shared/components/ui/Select.tsx'), 'utf8');
  const modal = readFileSync(join(__dirname, '../src/features/admin/components/family-tree/FamilyAnniversaryModal.tsx'), 'utf8');
  const tab = readFileSync(join(__dirname, '../src/features/admin/components/family-tree/AnniversaryTab.tsx'), 'utf8');
  assert.match(select, /@radix-ui\/react-select/);
  assert.match(select, /<SelectPrimitive\.Value[\s\S]*placeholder=\{floatingLabel \? ''/);
  assert.match(modal, /SelectItem value=\{NO_RELATED_MEMBER\}/);
  assert.match(modal, /value === NO_RELATED_MEMBER \? '' : value/);
  assert.doesNotMatch(modal, /clearable|onClear|clearLabel/);
  assert.match(tab, /import \{ SearchBar \} from ['"]@\/shared\/components\/SearchBar['"]/);
  assert.match(tab, /<SearchBar\b[^>]*ariaLabel=/);
  assert.doesNotMatch(tab, /admin\.anniversary_title|admin\.anniversary_desc/);
});

test('anniversary modal keeps accessible naming, original date checks, and backend preview', () => {
  const modal = readFileSync(join(__dirname, '../src/features/admin/components/family-tree/FamilyAnniversaryModal.tsx'), 'utf8');
  const tab = readFileSync(join(__dirname, '../src/features/admin/components/family-tree/AnniversaryTab.tsx'), 'utf8');
  const service = readFileSync(join(__dirname, '../src/features/admin/services/anniversaryService.ts'), 'utf8');
  const familyTree = readFileSync(join(__dirname, '../src/features/admin/components/FamilyTreeManager.tsx'), 'utf8');
  const floatingAdd = readFileSync(join(__dirname, '../src/shared/components/ui/FloatingAddButton.tsx'), 'utf8');
  assert.match(modal, /showTitle=\{false\}\s+ariaLabel=\{ariaLabel\}/);
  assert.match(modal, /<DateInput\s+label=\{t\(isDeathAnniversary \? 'admin\.anniversary_ui\.solar_death_date'/);
  assert.match(modal, /label=\{t\('admin\.anniversary_ui\.lunar_year'\)\}/);
  assert.match(modal, /type="checkbox" checked=\{isLeapMonth\}/);
  assert.match(modal, /anniversaryService\.getNextOccurrence\(day, month, isLeapMonth, controller\.signal\)/);
  assert.match(modal, /anniversaryService\.convertLunarToSolar\(day, month, year, isLeapMonth, controller\.signal\)/);
  assert.match(modal, /formatLunarYearLabel\(year\)/);
  assert.match(modal, /occurrence\.lunarYear/);
  assert.match(service, /nextLunarYear: number/);
  assert.match(modal, /dateCheck\?\.status === 'mismatch'/);
  assert.match(modal, /footer=\{/);
  assert.doesNotMatch(modal, /vietnameseToday|year \+ offset|offset <= 4/);
  assert.match(service, /next-occurrence\?/);
  assert.match(tab, /<FloatingAddButton\s+ariaLabel=\{t\('admin\.anniversary_ui\.add_aria_label'\)\}/);
  assert.match(tab, /tooltip=\{t\('admin\.anniversary_ui\.add'\)\}/);
  assert.match(tab, /onClick=\{\(\) => void openEditor\(null\)\}/);
  assert.match(tab, /\{editing !== undefined && members !== null && <FamilyAnniversaryModal/);
  assert.doesNotMatch(tab, /admin\.anniversary_ui\.add_first/);
  assert.match(familyTree, /<FloatingAddButton[\s\S]*?ariaLabel=\{t\("admin\.add_member"\)\}[\s\S]*?onClick=\{\(\) => handleOpenModal\(\)\}/);
  assert.match(floatingAdd, /className="!p-3 !rounded-full aspect-square"/);
  assert.match(floatingAdd, /<Plus size=\{20\}/);
  assert.match(floatingAdd, /aria-label=\{ariaLabel\}/);
  assert.match(floatingAdd, /title=\{tooltip\}/);
});

test('only death anniversaries render and validate lunar dates; ordinary events clear and omit lunar data', () => {
  const modal = readFileSync(join(__dirname, '../src/features/admin/components/family-tree/FamilyAnniversaryModal.tsx'), 'utf8');
  const service = readFileSync(join(__dirname, '../src/features/admin/services/anniversaryService.ts'), 'utf8');
  assert.match(modal, /const isDeathAnniversary = eventType === 'DEATH_ANNIVERSARY'/);
  assert.match(modal, /\{isDeathAnniversary && <div>/);
  assert.match(modal, /\{isDeathAnniversary && <label/);
  assert.match(modal, /!isDeathAnniversary \|\| !validLunarParts/);
  assert.match(modal, /setLunarDay\(''\); setLunarMonth\(''\); setLunarYear\(''\); setIsLeapMonth\(false\)/);
  assert.match(modal, /lunarDay: isDeathAnniversary \? day : null, lunarMonth: isDeathAnniversary \? month : null/);
  assert.match(modal, /label=\{t\(isDeathAnniversary \? 'admin\.anniversary_ui\.solar_death_date' : 'admin\.anniversary_ui\.event_date'\)\}/);
  assert.match(service, /lunarDay: number \| null/);
  assert.match(service, /lunarMonth: number \| null/);
});
