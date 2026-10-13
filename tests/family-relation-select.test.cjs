const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const read = path => readFileSync(join(__dirname, '..', path), 'utf8');
const component = read('src/features/admin/components/family-tree/FamilyRelationSelect.tsx');
const form = read('src/features/admin/components/family-tree/MemberFormModal.tsx');

const transpiled = ts.transpileModule(component, { compilerOptions: {
  module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
} }).outputText;
const relationExports = {};
new vm.Script(transpiled).runInNewContext({ exports: relationExports, require: name => ({
  react: { default: {} }, 'react-dom': { createPortal: value => value }, 'lucide-react': { Check: 'Check', ChevronDown: 'ChevronDown' },
  'react/jsx-runtime': { jsx: () => null, jsxs: () => null },
}[name]) });

test('one relation component drives father, mother, and spouse with numeric nullable values', () => {
  assert.match(component, /export interface FamilyRelationOption/);
  assert.match(component, /value\?: number/);
  assert.match(component, /onChange: \(memberId: number \| undefined\)/);
  assert.equal((form.match(/<FamilyRelationSelect/g) ?? []).length, 3);
  for (const relation of ['father', 'mother', 'spouse']) {
    assert.match(form, new RegExp(`value=\\{editingMember\\.${relation}Id\\}`));
    assert.match(form, new RegExp(`onChange=\\{\\(${relation}Id\\) => onChange\\(\\{ \\.\\.\\.editingMember, ${relation}Id \\}\\)\\}`));
    assert.match(form, new RegExp(`placeholder=\\{t\\("admin\\.select_${relation}"\\)\\}`));
  }
});

test('relation items are selectable, checked accessibly, and selecting the selected item clears it', () => {
  assert.match(component, /role="listbox"/);
  assert.match(component, /role="option"/);
  assert.match(component, /aria-selected=\{isSelected\}/);
  assert.match(component, /onChange\(toggleFamilyRelationSelection\(value, option\.id\)\)/);
  assert.match(component, /isSelected && <Check/);
  assert.match(component, /createPortal\(/);
  assert.match(component, /ArrowDown/);
  assert.match(component, /ArrowUp/);
  assert.match(component, /event\.key === "Enter" \|\| event\.key === " "/);
  assert.match(component, /event\.key === "Escape"/);
  assert.match(component, /aria-haspopup="listbox"/);
  assert.doesNotMatch(component, /<select\b|<option\b|clear|Trash|\bX\b/);
});

test('selecting a relation replaces the current member and selecting it again clears to undefined', () => {
  const toggle = relationExports.toggleFamilyRelationSelection;
  assert.equal(toggle(undefined, 12), 12);
  assert.equal(toggle(12, 18), 18);
  assert.equal(toggle(18, 18), undefined);
  assert.equal(toggle(undefined, 25), 25);
});

test('relation choices exclude self and obsolete empty relation labels are removed in both locales', () => {
  assert.match(form, /m\.id !== editingMember\?\.id/);
  assert.doesNotMatch(form, /NO_RELATION_VALUE|no_father|no_mother|no_spouse/);
  for (const locale of ['vi', 'en']) {
    const admin = JSON.parse(read(`src/shared/locales/${locale}/admin.json`));
    assert.equal(Object.hasOwn(admin, 'no_father'), false);
    assert.equal(Object.hasOwn(admin, 'no_mother'), false);
    assert.equal(Object.hasOwn(admin, 'no_spouse'), false);
    assert.ok(admin.select_father && admin.select_mother && admin.select_spouse);
  }
});
