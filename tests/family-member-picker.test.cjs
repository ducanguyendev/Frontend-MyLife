const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const read = path => readFileSync(join(__dirname, '..', path), 'utf8');
const picker = read('src/features/admin/components/family-tree/FamilyMemberPicker.tsx');
const form = read('src/features/admin/components/family-tree/MemberFormModal.tsx');
const details = read('src/features/admin/components/family-tree/MemberDetailModal.tsx');

test('FamilyMemberPicker is a reusable action picker with a persistent placeholder trigger', () => {
  assert.match(picker, /onSelect: \(memberId: number\) => void/);
  assert.match(picker, /onSelect\(option\.id\)/);
  assert.match(picker, /<span className="min-w-0 flex-1 truncate">\{placeholder\}<\/span>/);
  assert.match(picker, /createPortal\(/);
  assert.match(picker, /role="listbox"/);
  assert.match(picker, /role="option"/);
  assert.match(picker, /ArrowDown/);
  assert.match(picker, /ArrowUp/);
  assert.match(picker, /event\.key === "Enter" \|\| event\.key === " "/);
  assert.match(picker, /event\.key === "Escape"/);
  assert.match(picker, /closeAndMoveFocus\(event\.shiftKey\)/);
  assert.match(picker, /event\.key === "Home"/);
  assert.match(picker, /event\.key === "End"/);
  assert.doesNotMatch(picker, /<select\b|<option\b/);
});

test('children add/remove and siblings use action pickers while keeping collection state in the form', () => {
  assert.equal((form.match(/<FamilyMemberPicker/g) || []).length, 2);
  assert.match(form, /placeholder=\{t\("admin\.select_children"\)\}/);
  assert.match(form, /placeholder=\{t\("admin\.select_sibling"\)\}/);
  assert.match(form, /childIds: \[\.\.\.current, childId\]/);
  assert.match(form, /childIds: current\.filter\(\(id\) => id !== childId\)/);
  assert.match(form, /horizontalRelations: \[\.\.\.current, \{ memberId: siblingId, relationType: "sibling" \}\]/);
  assert.match(form, /current\.filter\(\(r\) => !\(r\.memberId === siblingId && r\.relationType\?\.trim\(\)\.toLowerCase\(\) === "sibling"\)\)/);
  assert.match(form, /siblings\.length\} \{t\("admin\.siblings_count"/);
  assert.match(form, /!selectedSiblingIds\.has\(m\.id\)/);
  assert.match(form, /getSiblingKind\(editingMember as FamilyMember, member\)/);
  assert.match(form, /kind === "cousin" &&/);
  assert.doesNotMatch(form, /select_children_placeholder|select_cousin_sibling|siblings_biological_group|siblings_cousin_group/);
  assert.match(details, /getSiblingKind\(member, m\)/);
});

test('picker and unified sibling labels are translated; obsolete add prompts are gone', () => {
  for (const locale of ['vi', 'en']) {
    const admin = JSON.parse(read(`src/shared/locales/${locale}/admin.json`));
    assert.equal(admin.select_children, locale === 'vi' ? 'Chọn con cái' : 'Select children');
    assert.equal(admin.siblings_group, locale === 'vi' ? 'Anh / Chị / Em' : 'Siblings');
    assert.equal(admin.select_sibling, locale === 'vi' ? 'Chọn anh / chị / em' : 'Select sibling');
    assert.ok(admin.no_more_children_available && admin.no_more_siblings_available);
    assert.equal(Object.hasOwn(admin, 'select_children_placeholder'), false);
    assert.equal(Object.hasOwn(admin, 'select_cousin_sibling'), false);
  }
});
