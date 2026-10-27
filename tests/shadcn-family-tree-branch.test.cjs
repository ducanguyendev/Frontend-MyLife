const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const base = join(__dirname, '../src/features/admin/components/family-tree');
const resolver = {};
const resolverSource = readFileSync(join(base, 'familyBranchResolver.ts'), 'utf8');
const resolverOutput = ts.transpileModule(resolverSource, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
new vm.Script(resolverOutput).runInNewContext({ exports: resolver, require: () => ({}) });
const layoutModule = {};
const layoutSource = readFileSync(join(base, 'shadcnFamilyTreeLayout.ts'), 'utf8');
const layoutOutput = ts.transpileModule(layoutSource, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
new vm.Script(layoutOutput).runInNewContext({ exports: layoutModule, require: () => ({}) });
const person = (id, name, generation, values = {}) => ({ id, fullName: name, generation, createdAt: '', updatedAt: '', ...values });

function branchFixture() {
  return [
    person(1, 'Grandparent 1', 1, { spouseId: 2 }), person(2, 'Grandparent 2', 1),
    person(3, 'Parent A', 2, { fatherId: 1, motherId: 2 }),
    person(4, 'Uncle B', 2, { fatherId: 1, motherId: 2 }),
    person(5, 'Selected', 3, { fatherId: 3, spouseId: 6 }), person(6, 'Selected spouse', 3),
    person(7, 'Child', 4, { fatherId: 5, motherId: 6 }),
    person(8, 'Cousin', 3, { fatherId: 4 }), person(9, 'Grandchild', 5, { fatherId: 7 }),
  ];
}

test('branch resolver keeps selected ancestry and descendants while excluding uncle and cousin branches', () => {
  const ids = resolver.getFamilyBranchMemberIds(branchFixture(), 5);
  assert.deepEqual([...ids].sort((a, b) => a - b), [1, 2, 3, 5, 6, 7, 9]);
});

test('branch edge preview highlights the ancestry rail and selected child drop, not cousin drop', () => {
  const links = [
    { id: 'family-grandparents', kind: 'family', memberIds: [1, 2, 3, 4], sourceMemberIds: [1, 2], targetMemberIds: [3, 4] },
    { id: 'family-child-parent-a', kind: 'family-child', memberIds: [1, 2, 3, 4], sourceMemberIds: [1, 2], targetMemberIds: [3] },
    { id: 'family-child-uncle', kind: 'family-child', memberIds: [1, 2, 3, 4], sourceMemberIds: [1, 2], targetMemberIds: [4] },
    { id: 'family-selected-child', kind: 'family-child', memberIds: [3, 5, 6, 7], sourceMemberIds: [5, 6], targetMemberIds: [7] },
  ];
  const branch = resolver.getFamilyBranchMemberIds(branchFixture(), 5);
  const edges = resolver.getFamilyBranchEdgeIds(branch, links);
  assert.ok(edges.has('family-grandparents'));
  assert.ok(edges.has('family-child-parent-a'));
  assert.ok(edges.has('family-selected-child'));
  assert.ok(!edges.has('family-child-uncle'));
});

test('hover preview and node click share one branch resolver; branch subset is relaid out and centered', () => {
  const component = readFileSync(join(base, 'ShadcnFamilyTreeView.tsx'), 'utf8');
  const card = readFileSync(join(base, 'ShadcnFamilyTreePersonCard.tsx'), 'utf8');
  assert.match(component, /getFamilyBranchMemberIds\(layoutMembers, activeId\)/);
  assert.match(component, /branchMemberId == null \? null : getFamilyBranchMemberIds\(layoutMembers, branchMemberId\)/);
  assert.match(component, /setBranchMemberId\(id\)/);
  assert.match(card, /onClick=\{\(\) => onViewBranch\(member\.id\)\}/);

  const branch = resolver.getFamilyBranchMemberIds(branchFixture(), 5);
  const subset = branchFixture().filter(member => branch.has(member.id));
  const result = layoutModule.layoutShadcnFamilyTree(subset);
  const positions = layout => Object.fromEntries(layout.nodes.map(node => [node.member.id, [node.x, node.y]]));
  assert.deepEqual(positions(result), positions(layoutModule.layoutShadcnFamilyTree(subset.slice().reverse())));
  assert.equal(result.nodes.length, branch.size);
  const node = id => result.nodes.find(item => item.member.id === id);
  const coupleCenter = (node(1).x + node(1).width / 2 + node(2).x + node(2).width / 2) / 2;
  const childBoundsCenter = (Math.min(...[5, 6, 7, 9].map(id => node(id).x)) + Math.max(...[5, 6, 7, 9].map(id => node(id).x + node(id).width))) / 2;
  assert.ok(Math.abs(coupleCenter - childBoundsCenter) < 1, 'ancestor household stays centered over the resolved subtree');
  assert.equal(node(5).y, node(6).y, 'spouses remain in the same generation lane');
  for (const generation of new Set(result.nodes.map(item => item.generation))) {
    const row = result.nodes.filter(item => item.generation === generation).sort((a, b) => a.x - b.x);
    assert.equal(new Set(row.map(item => item.y)).size, 1, `generation ${generation} shares a lane`);
    assert.ok(row.slice(1).every((item, index) => row[index].x + row[index].width <= item.x), `generation ${generation} cards do not overlap`);
  }
  assert.ok(result.nodes.every(item => Number.isFinite(item.x) && Number.isFinite(item.y)));
});

test('full-tree toolbar clears branch filter and Eye remains a separate detail action', () => {
  const component = readFileSync(join(base, 'ShadcnFamilyTreeView.tsx'), 'utf8');
  const card = readFileSync(join(base, 'ShadcnFamilyTreePersonCard.tsx'), 'utf8');
  assert.match(component, /setShowAll\(true\); setBranchMemberId\(null\)/);
  assert.match(card, /onClick=\{event => \{ event\.stopPropagation\(\); onView\(member\); \}\}/);
});
