const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const modal = read('src/features/admin/components/family-tree/MemberDetailModal.tsx');
const siblingLogic = read('src/features/admin/components/family-tree/siblingRelations.ts');

test('profile dialog uses the member name as its title without the old generic title or footer', () => {
  assert.match(modal, /ariaLabel=\{formatName\(member\.fullName\)/);
  assert.match(modal, /<h2[\s\S]*?formatName\(member\.fullName\)/);
  assert.doesNotMatch(modal, /member_detail_title/);
  assert.doesNotMatch(modal, /footer=\{/);
});

test('compact profile header has a smaller avatar and top edit and close actions', () => {
  assert.match(modal, /h-\[72px\] w-\[72px\].*sm:h-20 sm:w-20/);
  assert.match(modal, /onClick=\{\(\) => \{ onClose\(\); onEdit\(member\); \}\}/);
  assert.match(modal, /aria-label=\{t\("admin\.close"/);
});

test('desktop layout has family relationships beside biography and contact', () => {
  assert.match(modal, /lg:grid-cols-\[minmax\(0,1\.2fr\)_minmax\(280px,0\.8fr\)\]/);
  assert.match(modal, /profile_family/);
  assert.match(modal, /profile_contact/);
  assert.match(modal, /member\.biography\?\.trim\(\)/);
  assert.match(modal, /member\.phoneNumber/);
  assert.match(modal, /member\.facebookUrl/);
  assert.match(modal, /member\.address/);
});

test('parents, spouse, children, both sibling groups, and relation navigation remain available', () => {
  assert.match(modal, /member\.fatherId/);
  assert.match(modal, /member\.motherId/);
  assert.match(modal, /member\.spouseId/);
  assert.match(modal, /const children = members\.filter/);
  assert.match(modal, /ruotSiblings/);
  assert.match(modal, /hoSiblings/);
  assert.match(modal, /onView\(related\)/);
  assert.match(modal, /getSiblingDisplayLabelKey/);
  assert.match(modal, /getSiblingKind/);
  assert.match(modal, /getSiblingSeniority/);
  assert.match(modal, /isBiologicalSibling/);
  assert.match(siblingLogic, /export function isBiologicalSibling|export const isBiologicalSibling/);
});

test('empty biography and contact fields use compact localized copy and allow safe scrolling', () => {
  assert.match(modal, /profile_no_information/);
  assert.match(modal, /className="!max-h-\[calc\(100vh-24px\)\] sm:!max-h-\[calc\(100vh-40px\)\]"/);
  assert.match(read('src/shared/components/ui/Modal.tsx'), /overflow-y-auto/);
});

test('Vietnamese and English profile copy is provided', () => {
  const vi = JSON.parse(read('src/shared/locales/vi/admin.json'));
  const en = JSON.parse(read('src/shared/locales/en/admin.json'));
  for (const key of ['profile_family', 'profile_contact', 'profile_no_information', 'quick_preview', 'member_card_summary', 'view_profile', 'flip_back']) {
    assert.ok(vi[key], `vi.admin.${key}`);
    assert.ok(en[key], `en.admin.${key}`);
  }
});
