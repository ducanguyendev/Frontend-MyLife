const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const assert = require('node:assert/strict');

const source = fs.readFileSync(path.join(__dirname, '../src/features/admin/components/family-tree/MemberDetailModal.tsx'), 'utf8');

test('all relation members use one accessible, clickable chip renderer', () => {
  assert.match(source, /const renderRelationMember = \(related: FamilyMember, roleLabel\?: string\)/);
  assert.match(source, /onClick=\{\(\) => onView\(related\)\}/);
  assert.match(source, /type="button"/);
  assert.match(source, /aria-label=\{roleLabel \? `\$\{roleLabel\}: \$\{formatName\(related\.fullName\)\}` : formatName\(related\.fullName\)\}/);
  assert.match(source, /bg-secondary-bg px-2\.5 py-1/);
  assert.match(source, /rounded-lg border border-custom-border/);
  assert.match(source, /transition-colors hover:border-accent\/40 hover:bg-primary-bg/);
  assert.match(source, /text-xs font-semibold text-primary-text/);

  for (const expectedUse of [
    'related.map((item) => renderRelationMember(item))',
    'renderRelationGroup(t("admin.field_spouse", { defaultValue: "Vợ/Chồng" }), spouse ? [spouse] : [])',
    'renderRelationGroup(t("admin.children", { defaultValue: "Con cái" }).replace(/ liên kết:$/, ""), children)',
    "renderRelationMember(s, getSiblingLabel(s, 'biological'))",
    "renderRelationMember(s, getSiblingLabel(s, 'cousin'))",
  ]) {
    assert.ok(source.includes(expectedUse), `expected shared chip use: ${expectedUse}`);
  }
});
