const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const assert = require('node:assert/strict');

const source = fs.readFileSync(path.join(__dirname, '../src/features/admin/components/family-tree/MemberDetailModal.tsx'), 'utf8');

test('all relation members use one accessible, clickable chip renderer', () => {
  assert.match(source, /const renderRelationMember = \(m: FamilyMember, roleLabel\?: string\)/);
  assert.match(source, /onClick=\{\(\) => onView\(m\)\}/);
  assert.match(source, /type="button"/);
  assert.match(source, /aria-label=\{roleLabel \? `\$\{roleLabel\}: \$\{formatName\(m\.fullName\)\}` : formatName\(m\.fullName\)\}/);
  assert.match(source, /focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent/);
  assert.match(source, /bg-secondary-bg px-3 py-1\.5/);
  assert.match(source, /rounded-lg border border-custom-border/);
  assert.match(source, /shadow-sm transition-colors hover:bg-primary-bg/);
  assert.match(source, /text-xs font-medium text-secondary-text/);
  assert.match(source, /text-sm font-semibold text-primary-text/);

  for (const expectedUse of [
    'p.map((parent) => renderRelationMember(parent))',
    'renderRelationMember(spouse)',
    'children.map((c) => renderRelationMember(c))',
    "renderRelationMember(s, getSiblingLabel(s, 'biological'))",
    "renderRelationMember(s, getSiblingLabel(s, 'cousin'))",
  ]) {
    assert.ok(source.includes(expectedUse), `expected shared chip use: ${expectedUse}`);
  }
});
