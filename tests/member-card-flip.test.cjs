const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const card = read('src/features/admin/components/family-tree/MemberCard.tsx');
const css = read('src/features/admin/components/family-tree/MemberCard.css');
const manager = read('src/features/admin/components/FamilyTreeManager.tsx');
const slots = read('src/shared/components/illustration/illustrationSlots.tsx');

test('whole member card is a keyboard-accessible control that opens the existing detail view', () => {
  assert.match(card, /<button[\s\S]*?className=\{`family-member-card__open/);
  assert.match(card, /onClick=\{\(\) => onView\(member\)\}/);
  assert.match(card, /aria-label=\{`\$\{t\("admin\.view_detail"[\s\S]*?\$\{name\}`\}/);
  assert.match(card, /<MemberAvatarImage[\s\S]*?member=\{member\}/);
  assert.match(card, /member\.generation/);
  assert.match(card, /\{gender\}/);
  assert.match(card, /\{role\}/);
  assert.match(manager, /<MemberDetailModal\s+member=\{memberToView\}/);
});

test('member card has no flip or text CTA and keeps its decorative family illustration', () => {
  assert.doesNotMatch(card, /quick_preview|flip_back|view_profile|Xem nhanh|Lật lại|Xem hồ sơ/);
  assert.doesNotMatch(card, /isFlipped|setIsFlipped|rotateY/);
  assert.match(card, /<IllustrationSlot definition=\{sharedIllustrationSlots\.memberCard\} \/>/);
  assert.match(slots, /memberCard:[\s\S]*?family-member-card__illustration/);
});

test('card interaction has visible hover and focus feedback while menu actions remain separate', () => {
  assert.match(css, /cursor:\s*pointer/);
  assert.match(css, /\.family-member-card__open:hover/);
  assert.match(css, /\.family-member-card__open:focus-visible/);
  assert.match(card, /family-flip-card__menu absolute/);
  assert.match(card, /onClick=\{event => event\.stopPropagation\(\)\}/);
  assert.match(manager, /onToggleDropdown=\{\(e\) => \{\s*e\.stopPropagation\(\)/);
  assert.match(card, /onCloseDropdown\(\); onView\(member\)/);
  assert.match(card, /onCloseDropdown\(\); onEdit\(member\)/);
  assert.match(card, /onCloseDropdown\(\); onDelete\(member\)/);
  assert.match(card, /transition=\{\{ duration: 0\.15 \}\}/);
});

test('member card remains the grid representation alongside table and mind map views', () => {
  assert.match(manager, /viewMode === "grid"[\s\S]*?<MemberCard/);
  assert.match(manager, /<MemberTable/);
  assert.match(manager, /<FamilyMindmap/);
  assert.doesNotMatch(read('src/features/admin/components/family-tree/MemberTable.tsx'), /family-flip-card/);
});
