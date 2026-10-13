const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const card = read('src/features/admin/components/family-tree/MemberCard.tsx');
const css = read('src/features/admin/components/family-tree/MemberCard.css');
const manager = read('src/features/admin/components/FamilyTreeManager.tsx');

test('grid card front shows real member identity and generation metadata', () => {
  assert.match(card, /<MemberAvatarImage[\s\S]*?member=\{m\}/);
  assert.match(card, /formatName\(m\.fullName\)/);
  assert.match(card, /m\.generation/);
  assert.match(card, /gender/);
  assert.match(card, /role/);
});

test('preview back uses real birth, spouse, child, and address data and opens the existing detail callback', () => {
  assert.match(card, /m\.dateOfBirth/);
  assert.match(card, /members\.find\(candidate => candidate\.id === m\.spouseId\)/);
  assert.match(card, /childrenCount/);
  assert.match(card, /m\.address/);
  assert.match(card, /onClick=\{\(\) => onView\(m\)\}/);
});

test('preview supports touch and keyboard, keeps edit/delete menu outside the 3D scene', () => {
  assert.match(card, /React\.useState\(false\)/);
  assert.match(card, /onPointerEnter=\{event => \{ if \(event\.pointerType === "mouse"\) scheduleHoverEnter\(\); \}\}/);
  assert.match(card, /onPointerLeave=\{event => \{ if \(event\.pointerType === "mouse"\) scheduleHoverLeave\(\); \}\}/);
  assert.match(card, /const HOVER_ENTER_DELAY_MS = 200/);
  assert.match(card, /const HOVER_LEAVE_DELAY_MS = 100/);
  assert.match(card, /window\.setTimeout\([\s\S]*?HOVER_ENTER_DELAY_MS\)/);
  assert.match(card, /window\.setTimeout\([\s\S]*?HOVER_LEAVE_DELAY_MS\)/);
  assert.match(card, /hoverEnterTimerRef = React\.useRef<number \| null>\(null\)/);
  assert.match(card, /hoverLeaveTimerRef = React\.useRef<number \| null>\(null\)/);
  assert.match(card, /React\.useEffect\(\(\) => clearHoverTimers, \[clearHoverTimers\]\)/);
  assert.match(card, /window\.clearTimeout\(hoverEnterTimerRef\.current\)/);
  assert.match(card, /window\.clearTimeout\(hoverLeaveTimerRef\.current\)/);
  assert.match(card, /onClick=\{flipToBack\}/);
  assert.match(card, /const flipToBack = \(\) => \{[\s\S]*?setIsFlipped\(true\)/);
  assert.match(card, /onClick=\{flipToFront\}/);
  assert.match(card, /const flipToFront = \(\) => \{[\s\S]*?setIsFlipped\(false\)[\s\S]*?setIsPointerHovering\(false\)/);
  assert.match(card, /viewButtonRef\.current\?\.focus\(\)/);
  assert.match(card, /inert=\{!isPreviewVisible\}/);
  assert.match(card, /family-flip-card__menu absolute/);
  assert.match(card, /onEdit\(m\)/);
  assert.match(card, /onDelete\(m\)/);
  assert.match(manager, /members=\{members\}/);
});

test('flip styles are namespaced, motion-aware, and contain no repeated decorative IDs', () => {
  assert.match(css, /perspective:/);
  assert.match(css, /transform-style:\s*preserve-3d/);
  assert.match(css, /backface-visibility:\s*hidden/);
  assert.match(css, /rotateY\(180deg\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /transition:\s*transform 700ms cubic-bezier\(0\.22, 0\.61, 0\.36, 1\)/);
  assert.match(css, /transition:\s*opacity 450ms ease/);
  assert.match(css, /transition-duration:\s*0\.01ms !important/);
  assert.match(card, /transition=\{\{ duration: 0\.15 \}\}/);
  assert.doesNotMatch(`${card}\n${css}`, /id=/);
  assert.doesNotMatch(css, /\.card\b|\.front\b|\.back\b|\.title\b|\.content\b|@keyframes rotation_481/);
});

test('family member flip is used only by the grid card component', () => {
  assert.match(manager, /viewMode === "grid"[\s\S]*?<MemberCard/);
  assert.match(manager, /<MemberTable/);
  assert.match(manager, /<FamilyMindmap/);
  assert.doesNotMatch(read('src/features/admin/components/family-tree/MemberTable.tsx'), /family-flip-card/);
});
