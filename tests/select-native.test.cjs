const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const assert = require('node:assert/strict');

const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src/shared/components/ui/Select.tsx'), 'utf8');
const form = fs.readFileSync(path.join(root, 'src/features/admin/components/family-tree/MemberFormModal.tsx'), 'utf8');

test('shared Select uses an interactive full-field native select with label and ref', () => {
  assert.match(source, /<select[\s\S]*?ref=\{ref\}[\s\S]*?id=\{selectId\}/);
  assert.match(source, /className="absolute inset-0 z-10 h-full w-full cursor-pointer[^"]*opacity-0/);
  assert.doesNotMatch(source, /aria-hidden="true"\s*tabIndex=\{-1\}/);
  assert.match(source, /htmlFor=\{selectId\}/);
  assert.match(source, /disabled=\{disabled\}/);
  assert.match(source, /required=\{required\}/);
  assert.match(source, /onChange=\{event =>/);
  assert.match(source, /className = ''/);
  assert.match(source, /containerClassName = ''/);
  assert.match(source, /...props/);
});

test('native Select keeps controlled and uncontrolled values, defaultValue and onChange', () => {
  assert.match(source, /value=\{isControlled \? value : undefined\}/);
  assert.match(source, /defaultValue=\{isControlled \? undefined : defaultValue\}/);
  assert.match(source, /if \(!isControlled\) setInternalValue\(event\.target\.value\)/);
  assert.match(source, /onChange\?\.\(event\)/);
});

test('native Select renders options prop, option children, empty option and placeholder', () => {
  assert.match(source, /options\.map\(\(option, index\)/);
  assert.match(source, /: children;/);
  assert.match(source, /shouldRenderEmptyOption && <option value="">\{emptyLabel\}<\/option>/);
  assert.match(source, /const emptyLabel = placeholder \|\| ' '/);
  assert.match(source, /React\.Children\.toArray\(children\)/);
});

test('native Select retains rounded focus and error presentation with pointer-transparent visuals', () => {
  assert.match(source, /rounded-2xl border bg-primary-bg/);
  assert.match(source, /border-accent ring-2 ring-accent\/20/);
  assert.match(source, /border-error ring-1 ring-error\/30/);
  assert.match(source, /pointer-events-none[\s\S]*?currentLabel/);
  assert.match(source, /pointer-events-none absolute right-3\.5/);
});

test('Select production code has no portal or custom popup implementation', () => {
  assert.doesNotMatch(source, /createPortal|menuRef|getBoundingClientRect|role="listbox"|role="option"|AnimatePresence|position:\s*'fixed'/);
});

test('FamilyTree gender and relationship fields remain wired to shared native Select options', () => {
  assert.match(form, /<Select[\s\S]*?label=\{t\("admin\.field_generation"/);
  assert.match(form, /label=\{t\("admin\.field_gender"[\s\S]*?<option value="Nam">[\s\S]*?<option value="Nữ">[\s\S]*?<option value="Khác">/);
  for (const key of ['field_father', 'field_mother', 'field_spouse', 'select_cousin_sibling']) {
    assert.ok(form.includes(`admin.${key}`), `FamilyTree form retains ${key}`);
  }
  assert.match(form, /potentialFathers\.map/);
  assert.match(form, /potentialMothers\.map/);
  assert.match(form, /potentialSpouses\.map/);
  assert.match(form, /availableForSiblings\.map|availableForSiblings\.length/);
  assert.match(form, /availableForChildren\.map|availableChildren\.map|potentialChildren\.map/);
});
