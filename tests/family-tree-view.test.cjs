const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const source = readFileSync(join(__dirname, '../src/features/admin/components/family-tree/family-view/familyTreeLayout.ts'), 'utf8');
const styles = readFileSync(join(__dirname, '../src/features/admin/components/family-tree/family-view/FamilyTreeView.css'), 'utf8');
const cardSource = readFileSync(join(__dirname, '../src/features/admin/components/family-tree/family-view/FamilyPersonCard.tsx'), 'utf8');
const viewSource = readFileSync(join(__dirname, '../src/features/admin/components/family-tree/family-view/FamilyTreeView.tsx'), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } });
const layoutModule = {};
new vm.Script(outputText).runInNewContext({ exports: layoutModule });
const { layoutFamilyView, FAMILY_CARD_WIDTH, FAMILY_CARD_HEIGHT } = layoutModule;
const person = (id, values = {}) => ({ id, fullName: `Member ${id}`, generation: 1, createdAt: '', updatedAt: '', ...values });

test('spouses form an adjacent household and use one compact heart connector', () => {
  const layout = layoutFamilyView([person(1, { spouseId: 2 }), person(2, { spouseId: 1 })]);
  const first = layout.nodes.find(node => node.member.id === 1);
  const second = layout.nodes.find(node => node.member.id === 2);
  assert.equal(second.x - (first.x + FAMILY_CARD_WIDTH), 18);
  assert.equal(layout.links.filter(link => link.kind === 'spouse').length, 1);
  assert.ok(layout.links.find(link => link.kind === 'spouse').labelX);
});

test('shared parent pair produces one family trunk and a local sibling rail', () => {
  const layout = layoutFamilyView([
    person(1, { spouseId: 2, generation: 1 }), person(2, { spouseId: 1, generation: 1 }),
    person(3, { fatherId: 1, motherId: 2, generation: 2 }), person(4, { fatherId: 1, motherId: 2, generation: 2 }), person(5, { fatherId: 1, motherId: 2, generation: 2 }),
  ]);
  const familyLinks = layout.links.filter(link => link.kind === 'family');
  assert.equal(familyLinks.length, 1);
  assert.deepEqual(Array.from(familyLinks[0].memberIds).sort((a, b) => a - b), [1, 2]);
  const childLinks = layout.links.filter(link => link.kind === 'family-child');
  assert.equal(childLinks.length, 3);
  assert.deepEqual(Array.from(childLinks, link => link.memberIds[0]).sort((a, b) => a - b), [3, 4, 5]);
  const parentA = layout.nodes.find(node => node.member.id === 1);
  const parentB = layout.nodes.find(node => node.member.id === 2);
  const childCenters = [3, 4, 5].map(id => layout.nodes.find(node => node.member.id === id).x + FAMILY_CARD_WIDTH / 2);
  const midpoint = (parentA.x + FAMILY_CARD_WIDTH / 2 + parentB.x + FAMILY_CARD_WIDTH / 2) / 2;
  assert.ok(Math.abs(midpoint - (parentA.x + FAMILY_CARD_WIDTH + parentB.x) / 2) < 1);
  assert.match(familyLinks[0].path, new RegExp(`M ${midpoint}`));
  assert.equal(new Set(childCenters).size, 3);
});

test('numeric person ids keep sibling order stable for the focused family row', () => {
  const layout = layoutFamilyView([
    person(9, { generation: 2, fatherId: 1, motherId: 2 }),
    person(10, { generation: 2, fatherId: 1, motherId: 2 }),
    person(11, { generation: 2, fatherId: 1, motherId: 2 }),
    person(1, { generation: 1 }), person(2, { generation: 1 }),
  ]);
  const xs = layout.nodes.filter(node => [9, 10, 11].includes(node.member.id)).sort((a, b) => a.x - b.x).map(node => node.member.id);
  assert.deepEqual(Array.from(xs), [9, 10, 11]);
});

test('single-parent family keeps a valid shared child origin', () => {
  const layout = layoutFamilyView([
    person(1, { generation: 1 }), person(2, { motherId: 1, generation: 2 }), person(3, { motherId: 1, generation: 2 }),
  ]);
  assert.equal(layout.links.filter(link => link.kind === 'family').length, 1);
  assert.equal(layout.links.filter(link => link.kind === 'family-child').length, 2);
  assert.deepEqual(Array.from(layout.links.find(link => link.kind === 'family').memberIds), [1]);
});

test('parent childIds can anchor a local connector without manufacturing an additional parent', () => {
  const layout = layoutFamilyView([
    person(1, { generation: 1, childIds: [3] }), person(2, { generation: 1 }),
    person(3, { generation: 2 }),
  ]);
  const trunk = layout.links.find(link => link.kind === 'family');
  assert.ok(trunk);
  assert.deepEqual(Array.from(trunk.memberIds), [1, 3]);
  assert.equal(layout.links.filter(link => link.kind === 'family').length, 1);
});

test('couple descendant trunks start at the couple midpoint and each child drop stays local', () => {
  const layout = layoutFamilyView([
    person(1, { generation: 1, spouseId: 2 }), person(2, { generation: 1, spouseId: 1 }),
    person(9, { generation: 1, spouseId: 10 }), person(10, { generation: 1, spouseId: 9 }),
    person(3, { generation: 2, fatherId: 1, motherId: 2 }), person(4, { generation: 2, fatherId: 1, motherId: 2 }),
    person(11, { generation: 2, fatherId: 9, motherId: 10 }), person(12, { generation: 2, fatherId: 9, motherId: 10 }),
  ]);
  for (const [parentIds, childIds] of [[[1, 2], [3, 4]], [[9, 10], [11, 12]]]) {
    const parents = parentIds.map(id => layout.nodes.find(node => node.member.id === id));
    const children = childIds.map(id => layout.nodes.find(node => node.member.id === id));
    const sourceX = parents.reduce((sum, node) => sum + node.x + node.width / 2, 0) / parents.length;
    const childCenter = children.reduce((sum, node) => sum + node.x + node.width / 2, 0) / children.length;
    const trunk = layout.links.find(link => link.id === `family-${parentIds.join(':')}`);
    assert.ok(trunk);
    assert.match(trunk.path, new RegExp(`^M ${sourceX} `));
    assert.ok(Math.abs(sourceX - childCenter) < 8, 'the sibling rail stays centered on its own couple');
    assert.deepEqual(Array.from(layout.links.filter(link => link.kind === 'family-child' && childIds.includes(link.memberIds[0])), link => link.memberIds[0]).sort((a, b) => a - b), childIds);
  }
});

test('two sibling branches retain separate family trunks and extended relations are optional', () => {
  const people = [
    person(1, { generation: 1 }), person(2, { generation: 2, fatherId: 1, spouseId: 3 }), person(3, { generation: 2, spouseId: 2 }),
    person(4, { generation: 2, fatherId: 1, spouseId: 5 }), person(5, { generation: 2, spouseId: 4 }),
    person(6, { generation: 3, fatherId: 2, motherId: 3 }), person(7, { generation: 3, fatherId: 4, motherId: 5 }),
  ];
  people[5].horizontalRelations = [{ memberId: 7, relationType: 'cousin' }];
  const withoutRelations = layoutFamilyView(people);
  const withRelations = layoutFamilyView(people, true);
  const familyIds = withoutRelations.links.filter(link => link.kind === 'family').map(link => link.id);
  assert.deepEqual(Array.from(familyIds).sort(), ['family-1', 'family-2:3', 'family-4:5'].sort());
  assert.equal(withoutRelations.links.filter(link => link.kind === 'extended').length, 0);
  assert.equal(withRelations.links.filter(link => link.kind === 'extended').length, 1);
});

test('large expanded datasets produce finite non-overlapping cards and connector bounds', () => {
  const people = Array.from({ length: 200 }, (_, index) => {
    const id = index + 1;
    return person(id, { generation: Math.floor(index / 50) + 1, fatherId: id > 50 ? Math.floor((id - 1) / 2) : undefined, motherId: id > 50 ? Math.floor((id - 1) / 2) + 1 : undefined });
  });
  const layout = layoutFamilyView(people);
  assert.equal(layout.nodes.length, 200);
  assert.ok(layout.nodes.every(node => Number.isFinite(node.x) && Number.isFinite(node.y)));
  assert.ok(layout.links.every(link => link.path.length > 0));
  assert.equal(layout.height, FAMILY_CARD_HEIGHT * 4 + 52 * 3 + 144);
  const rows = new Map();
  for (const node of layout.nodes) { const row = rows.get(node.y) ?? []; row.push(node); rows.set(node.y, row); }
  for (const row of rows.values()) {
    row.sort((a, b) => a.x - b.x);
    for (let index = 1; index < row.length; index++) assert.ok(row[index - 1].x + FAMILY_CARD_WIDTH <= row[index].x);
  }
});

test('React Flow remains retained as an internal rollback path', () => {
  const manager = readFileSync(join(__dirname, '../src/features/admin/components/FamilyTreeManager.tsx'), 'utf8');
  const rendererConfig = readFileSync(join(__dirname, '../src/features/admin/components/family-tree/familyTreeRendererConfig.ts'), 'utf8');
  assert.match(manager, /const FamilyMindmap = lazy/);
  assert.match(manager, /const FamilyTreeView = lazy/);
  assert.match(manager, /FAMILY_TREE_RENDERER === "react-flow" \? <FamilyMindmap/);
  assert.match(manager, /: <FamilyTreeView/);
  assert.match(rendererConfig, /configuredRenderer === "react-flow"/);
  assert.match(rendererConfig, /resolveFamilyTreeRenderer\(IS_DEVELOPMENT_BUILD, requestedRenderer\)/);
  assert.match(rendererConfig, /configuredRenderer === "memoir"\) return isDevelopment \? "memoir" : "family-view"/);
});

test('family tree uses warm connector tokens, compact progressive controls, and presence animations', () => {
  assert.match(styles, /--family-line-width:\s*1\.5px/);
  assert.match(styles, /--family-line-focus-width:\s*1\.9px/);
  assert.match(styles, /\.family-tree-link\.is-dimmed\s*\{[^}]*opacity:\s*\.3/s);
  assert.match(styles, /\.family-person-card\.is-dimmed\s*\{[^}]*saturate\(\.72\)/s);
  assert.match(viewSource, /AnimatePresence/);
  assert.match(cardSource, /`\+\$\{hiddenCount\}`/);
});
