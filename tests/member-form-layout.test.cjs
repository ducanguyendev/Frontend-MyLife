const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const read = path => readFileSync(join(__dirname, '..', path), 'utf8');
const form = read('src/features/admin/components/family-tree/MemberFormModal.tsx').replace(/\r\n/g, '\n');
const modal = read('src/shared/components/ui/Modal.tsx');
const details = read('src/features/admin/components/family-tree/MemberDetailModal.tsx');

test('MemberForm uses a wide labeled dialog with a visible title and persistent footer', () => {
  const modalUse = form.slice(form.indexOf('<Modal'), form.indexOf('<form id="familyForm"'));
  assert.match(modalUse, /maxWidth="full"/);
  assert.match(modalUse, /ariaLabel=\{isUpdate/);
  assert.match(modalUse, /title=\{t\(isUpdate/);
  assert.match(modal, /showTitle\?: boolean/);
  assert.match(modal, /showTitle = true/);
  assert.match(modal, /aria-label=\{t\('admin\.close'\)\}/);
  assert.match(modal, /showTitle \? 'justify-between px-6 py-4 sm:py-5 border-b' : 'justify-end px-4 py-2'/);
  assert.match(modalUse, /footer=\{/);
});

test('desktop form order matches the two-column reading order and validation still targets the relevant section', () => {
  const order = ['expanded={openSections.includes("basic")}', 'expanded={openSections.includes("bio")}', 'expanded={openSections.includes("relations")}', 'expanded={openSections.includes("contact")}'];
  const positions = order.map(marker => form.indexOf(marker));
  assert.ok(positions.every(position => position >= 0));
  assert.deepEqual(positions, [...positions].sort((a, b) => a - b));
  assert.match(form, /useState<string\[]>\(\["basic", "relations", "contact", "bio"\]\)/);
  assert.match(form, /sectionToOpen = "basic"/);
  assert.match(form, /sectionToOpen = "contact"/);
  assert.match(form, /setOpenSections\(\(prev\) => prev\.includes\("bio"\) \? prev : \[\.\.\.prev, "bio"\]\)/);
  assert.match(form, /admin\.member_avatar_errors\.invalid_file/);
});

test('form sibling chips show avatar/name and allow removing explicit relations only', () => {
  const start = form.indexOf('{siblings.map(({ member: sibling, kind }) => (');
  const end = form.indexOf('</span>\n                        ))}', start);
  assert.ok(start >= 0 && end > start);
  const chip = form.slice(start, end);
  assert.match(chip, /formatName\(sibling\.fullName\)/);
  assert.doesNotMatch(chip, /admin\.generation_label|sibling\.generation/);
  assert.match(chip, /MemberAvatarImage/);
  assert.doesNotMatch(chip, /getSiblingDisplayLabelKey|getSiblingSeniority|sibling_(?:biological|cousin)_/);
  assert.match(chip, /kind !== "biological" &&/);
  assert.match(chip, /handleRemoveSibling\(sibling\.id\)/);
  assert.match(details, /getSiblingDisplayLabelKey/);
  assert.match(details, /getSiblingKind/);
});

test('basic information keeps birth date left, required status right and full-width conditional death date', () => {
  const start = form.indexOf('/* Họ và tên * */');
  const end = form.indexOf('</div>\n              </motion.div>', start);
  const basicGrid = form.slice(start, end);
  assert.ok(start >= 0 && end > start);
  assert.match(basicGrid, /<DateInput[\s\S]*?label=\{t\("admin\.field_dob"/);
  assert.match(basicGrid, /<Input\s+required\s+floatingLabel[\s\S]*?label=\{t\("admin\.field_fullname"/);
  assert.match(basicGrid, /<Input\s+required\s+floatingLabel[\s\S]*?label=\{t\("admin\.field_role"/);
  assert.match(basicGrid, /<DateInput\s+disableFuture\s+floatingLabel[\s\S]*?label=\{t\("admin\.field_dob"/);
  assert.match(basicGrid, /<Select[\s\S]*?label=\{t\("admin\.member_life_status\.label"\)\}[\s\S]*?floatingLabel[\s\S]*?required/);
  assert.match(basicGrid, /className="md:col-span-2"[\s\S]*?<DateInput/);
  assert.match(basicGrid, /editingMember\.lifeStatus === "DECEASED" &&/);
  assert.match(form, /deathDate:\s*lifeStatus === "LIVING"\s*\?\s*null/);
  assert.match(form, /grid-cols-1 md:grid-cols-2 gap-3\.5/);
  assert.match(form, /from "@\/shared\/components\/ui";[\s\S]*?DateInput/);
});
