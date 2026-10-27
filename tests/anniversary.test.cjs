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
  assert.match(source, /filterDate \? typeFiltered\.filter/);
  assert.match(source, /setCalendarSelectedDate\(target\.selectedDate\)/);
  assert.match(source, /setFilterDate\(null\)/);
  assert.match(source, /overflow-y-auto overscroll-contain p-3/);
  assert.match(source, /xl:grid-cols-\[minmax\(300px,0\.4fr\)_minmax\(0,0\.6fr\)\]/);
  assert.match(source, /const \[eventTypeFilter, setEventTypeFilter\] = useState<EventTypeFilter>\('ALL'\)/);
  assert.match(source, /eventTypeFilter === 'ALL' \? textFiltered : textFiltered\.filter\(item => item\.eventType === eventTypeFilter\)/);
  assert.match(source, /\[items, search, eventTypeFilter, filterDate\]/);
  assert.match(source, /setEventTypeFilter\('ALL'\)/);
  assert.match(source, /event_type_filter/);
  assert.match(source, /w-full sm:w-\[20rem\] sm:max-w-\[40vw\] sm:shrink/);
  assert.match(source, /flex w-max min-w-full flex-nowrap items-center gap-1 overflow-x-auto sm:w-auto sm:min-w-0 sm:shrink-0/);
  assert.match(source, /min-h-9 shrink-0 whitespace-nowrap rounded-full border px-3 text-xs font-semibold/);
  assert.match(source, /event_count', \{ count: filtered\.length \}/);
  assert.doesNotMatch(source.match(/<header className="mb-3[\s\S]*?<\/header>/)?.[0] ?? '', /<SearchBar/);
  assert.doesNotMatch(source, /banner_title|admin\.anniversary_ui\.total|admin\.anniversary_ui\.nearest/);
});

test('solar calendar utilities handle month edges, leap February, and UTC-safe ISO dates', () => {
  const source = readFileSync(join(__dirname, '../src/features/admin/components/family-tree/anniversaryCalendarUtils.ts'), 'utf8');
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  new vm.Script(output).runInNewContext({ exports, Date, Intl });
  const { getAnniversaryMonthGrid, anniversaryDateParts, anniversaryDateKey, getAnniversaryNavigationTarget, countAnniversaryEventsInMonth, getAnniversaryOrganizationLabelKeys, getDayEventVisual } = exports;

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
  const countDates = ['2026-01-03', '2026-09-14', '2026-12-31', '2027-01-01'];
  assert.equal(countAnniversaryEventsInMonth(countDates.map(nextSolarDate => ({ nextSolarDate })), 2026, 0), 1);
  assert.equal(countAnniversaryEventsInMonth(countDates.map(nextSolarDate => ({ nextSolarDate })), 2026, 8), 1);
  assert.equal(countAnniversaryEventsInMonth(countDates.map(nextSolarDate => ({ nextSolarDate })), 2026, 11), 1);
  assert.equal(countAnniversaryEventsInMonth(countDates.map(nextSolarDate => ({ nextSolarDate })), 2026, 1), 0);
  assert.deepEqual(JSON.parse(JSON.stringify(getAnniversaryOrganizationLabelKeys('DEATH_ANNIVERSARY'))), { place: 'admin.anniversary_ui.death_place', host: 'admin.anniversary_ui.death_host' });
  assert.deepEqual(JSON.parse(JSON.stringify(getAnniversaryOrganizationLabelKeys('FAMILY_EVENT'))), { place: 'admin.anniversary_ui.place', host: 'admin.anniversary_ui.host' });
  assert.deepEqual(JSON.parse(JSON.stringify(getDayEventVisual([]))), { count: 0, type: 'none', hasDeathAnniversary: false, hasFamilyEvent: false });
  assert.deepEqual(JSON.parse(JSON.stringify(getDayEventVisual([{ eventType: 'DEATH_ANNIVERSARY' }]))), { count: 1, type: 'death-anniversary', hasDeathAnniversary: true, hasFamilyEvent: false });
  assert.deepEqual(JSON.parse(JSON.stringify(getDayEventVisual([{ eventType: 'FAMILY_EVENT' }, { eventType: 'FAMILY_EVENT' }]))), { count: 2, type: 'family-event', hasDeathAnniversary: false, hasFamilyEvent: true });
  assert.deepEqual(JSON.parse(JSON.stringify(getDayEventVisual([{ eventType: 'DEATH_ANNIVERSARY' }, { eventType: 'FAMILY_EVENT' }]))), { count: 2, type: 'mixed', hasDeathAnniversary: true, hasFamilyEvent: true });
});

test('calendar day cells distinguish event types, count badges, selected priority, and today semantics', () => {
  const source = readFileSync(join(__dirname, '../src/features/admin/components/family-tree/AnniversaryTab.tsx'), 'utf8');
  assert.match(source, /dayVisual\.type === 'death-anniversary' \? 'border-amber/);
  assert.match(source, /dayVisual\.type === 'family-event' \? 'border-teal/);
  assert.match(source, /dayVisual\.type === 'mixed' \? 'border-accent/);
  assert.match(source, /dayVisual\.count > 1/);
  assert.match(source, /aria-current=\{isToday \? 'date' : undefined\}/);
  assert.match(source, /const dayState = isSelected \? `\$\{selectedEventTone\} bg-\[var\(--calendar-selected-bg\)\] font-bold text-\[var\(--calendar-selected-text\)\] ring-2/);
  assert.match(source, /dayVisual\.type === 'death-anniversary' \? 'border-amber-500 ring-amber-500\/50 dark:border-amber-400 dark:ring-amber-400\/40'/);
  assert.match(source, /dayVisual\.type === 'family-event' \? 'border-teal-500 ring-teal-500\/50 dark:border-teal-400 dark:ring-teal-400\/40'/);
  assert.match(source, /dayVisual\.count > 0 && <span aria-hidden="true"/);
  assert.match(source, /dayVisual\.type === 'death-anniversary' \? 'bg-amber-600 dark:bg-amber-300' : dayVisual\.type === 'family-event' \? 'bg-teal-600 dark:bg-teal-300'/);
  assert.match(source, /: isToday \? 'border-accent\/70 bg-\[var\(--focus-surface\)\]/);
  assert.match(source, /aria-label=\{`\$\{fullDateFormat\.format[\s\S]*dayVisual\.count \? `, \$\{t\('admin\.anniversary_ui\.event_count'/);
});

test('calendar selected colors use light and dark semantic tokens without overriding the app accent', () => {
  const css = readFileSync(join(__dirname, '../src/index.css'), 'utf8');
  const source = readFileSync(join(__dirname, '../src/features/admin/components/family-tree/AnniversaryTab.tsx'), 'utf8');
  const root = css.match(/:root\s*\{([\s\S]*?)\n\s*\}/)?.[1] ?? '';
  const dark = css.match(/\.dark\s*\{([\s\S]*?)\n\s*\}/)?.[1] ?? '';
  for (const token of ['--calendar-selected-bg', '--calendar-selected-text', '--calendar-selected-border', '--calendar-selected-ring']) {
    assert.match(root, new RegExp(`${token}:\\s*[^;]+;`));
    assert.match(dark, new RegExp(`${token}:\\s*[^;]+;`));
  }
  assert.match(root, /--calendar-selected-bg:\s*#18181b;/);
  assert.match(dark, /--calendar-selected-bg:\s*#27272a;/);
  assert.doesNotMatch(dark, /--calendar-selected-bg:\s*#(?:fff(?:fff)?|ffffff);/i);
  assert.match(dark, /--accent-color:\s*#ffffff;/);
  assert.match(source, /aria-current=\{isToday \? 'date' : undefined\}/);
  assert.match(source, /aria-pressed=\{isSelected\}/);
});

test('month event-count badge cannot shrink or wrap and header controls keep their width', async () => {
  const source = readFileSync(join(__dirname, '../src/features/admin/components/family-tree/AnniversaryTab.tsx'), 'utf8');
  assert.match(source, /hidden shrink-0 whitespace-nowrap rounded-full bg-accent\/10 px-2 py-0\.5 text-xs font-semibold text-accent sm:inline-flex sm:items-center/);
  assert.match(source, /flex flex-wrap items-center justify-between gap-2/);
  assert.match(source, /CalendarDays size=\{18\} className="shrink-0 text-accent"/);
  assert.match(source, /className="ml-auto flex shrink-0 items-center gap-1"/);
  assert.match(source, /min-h-9 shrink-0 whitespace-nowrap px-2 text-xs/);
  for (const lng of ['vi', 'en']) {
    const resources = JSON.parse(readFileSync(join(__dirname, `../src/shared/locales/${lng}/admin.json`), 'utf8'));
    const i18n = i18next.createInstance();
    await i18n.init({ lng, fallbackLng: false, resources: { [lng]: { translation: { admin: resources } } }, interpolation: { escapeValue: false } });
    for (const count of [1, 3, 12, 99]) {
      const label = i18n.t('admin.anniversary_ui.event_count', { count });
      assert.ok(label.startsWith(String(count)));
      assert.ok(!/\r|\n/.test(label));
    }
  }
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
  for (const key of ['calendar', 'month_picker', 'month', 'year', 'go_to_month', 'calendar_solar', 'previous_month', 'next_month', 'upcoming_events', 'event_type_filter', 'death_place', 'death_host', 'place', 'host', 'clear_date', 'no_events_date', 'add', 'add_aria_label', 'edit_title', 'delete_confirm', 'event_type', 'event_information', 'date_of_death', 'solar_death_date', 'lunar_death_date', 'lunar_day', 'lunar_month', 'lunar_year', 'historical_lunar_year', 'lunar_recurrence_help', 'original_date_summary', 'upcoming_lunar_date', 'original_lunar_year', 'recurrence_explanation', 'leap_month', 'checking_dates', 'dates_match', 'date_mismatch', 'current_year_passed', 'current_year_upcoming', 'loading', 'load_failed', 'empty', 'invalid_lunar_date', 'save_failed', 'created', 'updated', 'deleted']) {
      const translation = i18n.t(`admin.anniversary_ui.${key}`, { title: 'event' });
      assert.notEqual(translation, `admin.anniversary_ui.${key}`);
      assert.ok(translation.length > 0);
    }
  }
});

test('related-member picker toggles selection and anniversary search uses shared SearchBar', () => {
  const relation = readFileSync(join(__dirname, '../src/features/admin/components/family-tree/FamilyRelationSelect.tsx'), 'utf8');
  const modal = readFileSync(join(__dirname, '../src/features/admin/components/family-tree/FamilyAnniversaryModal.tsx'), 'utf8');
  const tab = readFileSync(join(__dirname, '../src/features/admin/components/family-tree/AnniversaryTab.tsx'), 'utf8');
  assert.match(modal, /<FamilyRelationSelect[\s\S]*?showGeneration=\{false\}/);
  assert.match(modal, /onChange=\{handleRelatedMemberChange\}/);
  assert.match(relation, /toggleFamilyRelationSelection\(value, option\.id\)/);
  assert.doesNotMatch(modal, /NO_RELATED_MEMBER|<Select\s[^>]*related_member/);
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
  assert.match(modal, /maxWidth="2xl"/);
  assert.match(modal, /<FamilyRelationSelect[\s\S]*?showGeneration=\{false\}/);
  assert.doesNotMatch(modal, /NO_RELATED_MEMBER|<Select\s[\s\S]{0,180}related_member/);
  assert.match(modal, /placeholder=\{t\('admin\.anniversary_ui\.select_member'\)\}/);
  assert.match(modal, /options=\{relatedMemberOptions\}/);
  assert.match(modal, /members\.filter\(member => !isDeathAnniversary \|\| member\.lifeStatus === 'DECEASED'\)/);
  assert.match(modal, /const handleRelatedMemberChange = \(nextMemberId: number \| undefined\)/);
  assert.match(modal, /if \(dateFromMember\) setOriginalSolarDate\(''\)/);
  assert.match(modal, /nextMember\?\.lifeStatus === 'DECEASED' && nextMember\.deathDate/);
  assert.match(modal, /relatedMemberId: relatedMemberId \?\? null/);
  assert.match(modal, /setRelatedMemberId\(undefined\)/);
  assert.match(modal, /setDateFromMember\(false\)/);
  assert.match(modal, /setTitle\(`\$\{t\('admin\.anniversary_ui\.death_prefix'\)\} \$\{selectedMember\.fullName\}`\)/);
  assert.doesNotMatch(modal, /vietnameseToday|year \+ offset|offset <= 4/);
  assert.match(service, /next-occurrence\?/);
  assert.match(tab, /leftIcon=\{<Plus size=\{16\} \/>\}/);
  assert.match(tab, /t\('admin\.anniversary_ui\.add_action'\)/);
  assert.match(tab, /<SearchBar className="w-full sm:w-\[20rem\] sm:max-w-\[40vw\] sm:shrink"/);
  assert.match(tab, /role="group" aria-label=\{t\('admin\.anniversary_ui\.event_type_filter'\)\}/);
  assert.match(tab, /aria-pressed=\{eventTypeFilter === value\}/);
  assert.match(tab, /const clearAllFilters = \(\) => \{[\s\S]*setSearch\(''\);[\s\S]*setFilterDate\(null\);[\s\S]*setCalendarSelectedDate\(null\);[\s\S]*setEventTypeFilter\('ALL'\);[\s\S]*setSelectedEventId\(null\)/);
  assert.match(tab, /onClick=\{clearAllFilters\}/);
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

test('anniversary card and live form labels follow event type in Vietnamese and English', async () => {
  const tab = readFileSync(join(__dirname, '../src/features/admin/components/family-tree/AnniversaryTab.tsx'), 'utf8');
  const modal = readFileSync(join(__dirname, '../src/features/admin/components/family-tree/FamilyAnniversaryModal.tsx'), 'utf8');
  const utilsSource = readFileSync(join(__dirname, '../src/features/admin/components/family-tree/anniversaryCalendarUtils.ts'), 'utf8');
  assert.match(tab, /getAnniversaryOrganizationLabelKeys\(item\.eventType\)\.place/);
  assert.match(tab, /getAnniversaryOrganizationLabelKeys\(item\.eventType\)\.host/);
  assert.match(modal, /getAnniversaryOrganizationLabelKeys\(eventType\)\.place/);
  assert.match(modal, /getAnniversaryOrganizationLabelKeys\(eventType\)\.host/);
  assert.match(modal, /const nextEventType = value as AnniversaryEventType;[\s\S]*setEventType\(nextEventType\)/);
  assert.match(utilsSource, /eventType === 'DEATH_ANNIVERSARY'[\s\S]*death_place[\s\S]*death_host[\s\S]*anniversary_ui\.place[\s\S]*anniversary_ui\.host/);
  assert.doesNotMatch(tab, /admin\.anniversary_place|admin\.anniversary_host/);
  assert.doesNotMatch(modal, /admin\.anniversary_place|admin\.anniversary_host/);

  for (const [lng, expected] of Object.entries({
    vi: ['Nơi tổ chức giỗ', 'Chủ lễ / Trưởng chi', 'Địa điểm tổ chức', 'Người chủ trì'],
    en: ['Memorial location', 'Officiant / Family representative', 'Event location', 'Host'],
  })) {
    const resources = JSON.parse(readFileSync(join(__dirname, `../src/shared/locales/${lng}/admin.json`), 'utf8'));
    const { death_place, death_host, place, host } = resources.anniversary_ui;
    assert.deepEqual([death_place, death_host, place, host], expected);
    assert.equal(resources.anniversary_ui.select_member, lng === 'vi' ? 'Chọn thành viên' : 'Select member');
  }
});

test('anniversary event type keeps FAMILY_EVENT and presents concise translated labels', () => {
  const tab = readFileSync(join(__dirname, '../src/features/admin/components/family-tree/AnniversaryTab.tsx'), 'utf8');
  const modal = readFileSync(join(__dirname, '../src/features/admin/components/family-tree/FamilyAnniversaryModal.tsx'), 'utf8');
  const service = readFileSync(join(__dirname, '../src/features/admin/services/anniversaryService.ts'), 'utf8');
  assert.match(service, /export type AnniversaryEventType = 'DEATH_ANNIVERSARY' \| 'FAMILY_EVENT'/);
  assert.match(tab, /\['FAMILY_EVENT', 'admin\.anniversary_ui\.family_event'\]/);
  assert.match(tab, /item\.eventType === 'DEATH_ANNIVERSARY' \? 'admin\.anniversary_ui\.death_anniversary' : 'admin\.anniversary_ui\.family_event'/);
  assert.match(modal, /<SelectItem value="FAMILY_EVENT">\{t\('admin\.anniversary_ui\.family_event'\)\}<\/SelectItem>/);
  for (const [lng, expected] of [['vi', 'Sự kiện'], ['en', 'Event']]) {
    const resources = JSON.parse(readFileSync(join(__dirname, `../src/shared/locales/${lng}/admin.json`), 'utf8'));
    assert.equal(resources.anniversary_ui.family_event, expected);
  }
});
