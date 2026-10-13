const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const read = path => readFileSync(join(__dirname, '..', path), 'utf8');
const form = read('src/features/admin/components/family-tree/MemberFormModal.tsx');
const modal = read('src/shared/components/ui/Modal.tsx');
const details = read('src/features/admin/components/family-tree/MemberDetailModal.tsx');

test('MemberForm hides only its modal title while retaining a labeled close button and footer', () => {
  const modalUse = form.slice(form.indexOf('<Modal'), form.indexOf('<form id="familyForm"'));
  assert.match(modalUse, /showTitle=\{false\}/);
  assert.match(modalUse, /ariaLabel=\{isUpdate/);
  assert.doesNotMatch(modalUse, /\btitle=/);
  assert.match(modal, /showTitle\?: boolean/);
  assert.match(modal, /showTitle = true/);
  assert.match(modal, /aria-label=\{t\('admin\.close'\)\}/);
  assert.match(modal, /showTitle \? 'justify-between px-6 py-4 sm:py-5 border-b' : 'justify-end px-4 py-2'/);
  assert.match(modalUse, /footer=\{/);
});

test('accordion DOM order starts with avatar and biography; validation still targets basic and contact', () => {
  const order = ['aria-expanded={openSections.includes("bio")}', 'aria-expanded={openSections.includes("basic")}', 'aria-expanded={openSections.includes("relations")}', 'aria-expanded={openSections.includes("contact")}'];
  const positions = order.map(marker => form.indexOf(marker));
  assert.ok(positions.every(position => position >= 0));
  assert.deepEqual(positions, [...positions].sort((a, b) => a - b));
  assert.match(form, /useState<string\[]>\(\["bio"\]\)/);
  assert.match(form, /sectionToOpen = "basic"/);
  assert.match(form, /sectionToOpen = "contact"/);
  assert.match(form, /setOpenSections\(\(prev\) => prev\.includes\("bio"\) \? prev : \[\.\.\.prev, "bio"\]\)/);
  assert.match(form, /admin\.member_avatar_errors\.invalid_file/);
});

test('form sibling chips contain only member name, generation badge and explicit remove control', () => {
  const start = form.indexOf('{siblings.map(({ member: sibling, kind }) => (');
  const end = form.indexOf('</span>\n                        ))}', start);
  assert.ok(start >= 0 && end > start);
  const chip = form.slice(start, end);
  assert.match(chip, /formatName\(sibling\.fullName\)/);
  assert.match(chip, /admin\.generation_label/);
  assert.doesNotMatch(chip, /getSiblingDisplayLabelKey|getSiblingSeniority|sibling_(?:biological|cousin)_/);
  assert.match(chip, /kind === "cousin" &&/);
  assert.match(details, /getSiblingDisplayLabelKey/);
  assert.match(details, /getSiblingKind/);
});
