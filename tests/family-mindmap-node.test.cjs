const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const source = readFileSync(join(__dirname, '../src/features/admin/components/family-tree/MemberMindmapNode.tsx'), 'utf8');
const css = readFileSync(join(__dirname, '../src/features/admin/components/family-tree/FamilyMindmap.css'), 'utf8');

test('portrait node renders avatar, name, role, generation and a subtle deceased marker', () => {
  assert.match(source, /MemberAvatarImage/);
  assert.match(source, /family-mindmap-card__name/);
  assert.match(source, /family-mindmap-card__role/);
  assert.match(source, /mindmap_generation/);
  assert.match(source, /family-mindmap-card__memorial/);
  assert.match(css, /family-mindmap-card__avatar-wrap[\s\S]*?width:\s*54px/);
});

test('member actions remain available and are visually hidden until hover or keyboard focus', () => {
  assert.match(source, /onView\(member\)/);
  assert.match(source, /onEdit\(member\)/);
  assert.match(source, /onDelete\(member\)/);
  assert.match(source, /aria-haspopup="menu"/);
  assert.match(css, /\.family-mindmap-card:hover \.family-mindmap-card__actions/);
  assert.match(css, /\.family-mindmap-card:focus-within \.family-mindmap-card__actions/);
});

test('member detail and action menu work with keyboard focus', () => {
  assert.match(source, /<button type="button" className="family-mindmap-card__main"/);
  assert.match(source, /role="menuitem"/);
  assert.match(source, /event\.key === "Escape"/);
  assert.match(css, /\.family-mindmap-card__main:focus-visible/);
});
