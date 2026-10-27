const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync, readdirSync } = require('node:fs');
const { join } = require('node:path');

const read = path => readFileSync(join(__dirname, '..', path), 'utf8');
const select = read('src/shared/components/ui/Select.tsx');
const memberForm = read('src/features/admin/components/family-tree/MemberFormModal.tsx');
const manager = read('src/features/admin/components/FamilyTreeManager.tsx');

test('shared Select exposes floating labels and preserves Radix Portal without clear-button API', () => {
  assert.match(select, /@radix-ui\/react-select/);
  assert.match(select, /floatingLabel\?: boolean/);
  assert.match(select, /isOpen \|\| isFocused \|\| Boolean\(currentValue\)/);
  assert.match(select, /<SelectPrimitive\.Value[\s\S]*placeholder=\{floatingLabel \? ''/);
  assert.match(select, /SelectPrimitive\.Portal/);
  assert.match(select, /top-2 text-\[11px\] font-semibold/);
  assert.doesNotMatch(select, /clearable|onClear|clearLabel|<X\b/);
  assert.match(select, /variant === 'compact'[\s\S]*'h-10/);
  assert.match(select, /min-h-\[58px\]/);
  assert.match(select, /appearance\?: 'default' \| 'simple'/);
  assert.match(select, /data-ui-control/);
  assert.match(select, /focus-visible:border-\[var\(--field-focus-border\)\]/);
  assert.match(select, /focus-visible:ring-2/);
  assert.match(select, /data-\[state=checked\]:bg-primary-bg/);
  assert.match(select, /<SelectPrimitive\.ItemIndicator[\s\S]*?<Check size=\{16\}/);
  assert.match(select, /shadow-\[0_4px_16px_rgb\(0_0_0\/0\.08\)\]/);
  assert.match(select, /outline-none ring-0 ring-offset-0/);
  assert.match(select, /motion-reduce:animate-none/);
});

test('MyLife Selects use the simple appearance without changing custom relation semantics', () => {
  const library = read('src/features/admin/components/family-tree/LibraryTab.tsx');
  const upload = read('src/features/admin/components/family-tree/LibraryUploadModal.tsx');
  const anniversary = read('src/features/admin/components/family-tree/FamilyAnniversaryModal.tsx');
  const relation = read('src/features/admin/components/family-tree/FamilyRelationSelect.tsx');
  assert.match(library, /appearance="simple"[\s\S]*?variant="compact"/);
  assert.match(upload, /LibrarySelectField[\s\S]*?appearance="simple"/);
  assert.equal((anniversary.match(/appearance="simple"/g) || []).length, 2);
  assert.doesNotMatch(memberForm, /appearance="simple"[\s\S]{0,120}clearable/);
  assert.match(memberForm, /appearance="simple"[\s\S]*?floatingLabel/);
  assert.match(relation, /toggleFamilyRelationSelection/);
  assert.match(relation, /createPortal/);
  assert.doesNotMatch(library, /category|categories/i);
});

test('generation starts empty, uses dynamic options, floats its label, and validates before submit', () => {
  assert.match(manager, /generation: undefined/);
  assert.match(memberForm, /label=\{t\("admin\.field_generation"/);
  assert.match(memberForm, /floatingLabel/);
  assert.doesNotMatch(memberForm, /clearable|onClear|clearLabel/);
  assert.match(memberForm, /generations\.map\(\(g\)/);
  assert.match(memberForm, /newErrors\.generation = 'admin\.select_generation_error'/);
  assert.match(memberForm, /value=\{editingMember\.generation == null \? undefined : String\(editingMember\.generation\)\}/);
  assert.match(memberForm, /value=\{editingMember\.gender \|\| undefined\}/);
  assert.match(memberForm, /onValueChange=\{\(value\) => onChange\(\{ \.\.\.editingMember, gender: value \}\)\}/);
  assert.match(memberForm, /SelectItem value="Nam"/);
  assert.match(memberForm, /SelectItem value="Nữ"/);
  assert.match(memberForm, /SelectItem value="Khác"/);
  assert.match(manager, /gender: undefined/);
  assert.match(manager, /value=\{generationFilter\}/);
  assert.match(manager, /<SelectItem value="all">/);
  assert.match(memberForm, /<FamilyRelationSelect/);
  assert.doesNotMatch(memberForm, /NO_RELATION_VALUE/);
});

test('generation and optional relation labels are translated in Vietnamese and English', () => {
  for (const [locale, expected] of [['vi', ['Chọn thế hệ', 'Vui lòng chọn thế hệ.']], ['en', ['Select generation', 'Please select a generation.']]]) {
    const admin = JSON.parse(readFileSync(join(__dirname, `../src/shared/locales/${locale}/admin.json`), 'utf8'));
    const common = JSON.parse(readFileSync(join(__dirname, `../src/shared/locales/${locale}/common.json`), 'utf8'));
    assert.deepEqual([admin.select_generation, admin.select_generation_error, admin.generation_option.includes('{{generation}}'), admin.select_father, admin.select_mother, admin.select_spouse, Object.hasOwn(admin, 'no_father'), Object.hasOwn(admin, 'no_mother'), Object.hasOwn(admin, 'no_spouse')], [expected[0], expected[1], true, locale === 'vi' ? 'Chọn cha' : 'Select father', locale === 'vi' ? 'Chọn mẹ' : 'Select mother', locale === 'vi' ? 'Chọn vợ/chồng' : 'Select spouse', false, false, false]);
    assert.equal(Object.hasOwn(common, 'clear_selection'), false);
    assert.equal(admin.field_generation.includes('*'), false);
  }
});

test('application source contains no native select or option elements', () => {
  const collect = dir => readdirSync(join(__dirname, '..', dir), { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? collect(path) : /\.(tsx?|jsx?)$/.test(entry.name) ? [{ path, content: read(path) }] : [];
  });
  const source = collect('src');
  const nativeTags = source.filter(file => /<(?:select|option)\b/.test(file.content)).map(file => file.path);
  assert.deepEqual(nativeTags, []);
});
