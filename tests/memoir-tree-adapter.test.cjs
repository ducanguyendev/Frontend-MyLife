const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const adapterPath = join(__dirname, '../src/features/admin/components/family-tree/memoirTreeAdapter.ts');
const source = readFileSync(adapterPath, 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
const adapterModule = {};
new vm.Script(outputText).runInNewContext({ exports: adapterModule });
const { adaptMembersToMemoirTree } = adapterModule;
const person = (id, fullName, fields = {}) => ({ id, fullName, generation: 1, createdAt: '', updatedAt: '', ...fields });

test('spouse pair is deterministic, symmetric in the view model, and emitted once', () => {
  const members = [person(4, 'A', { spouseId: 3 }), person(3, 'B')];
  const { graph, units } = adaptMembersToMemoirTree(members, 3);
  assert.equal(graph.subject, '3');
  assert.equal(graph.partnershipGroups.length, 1);
  assert.deepEqual(Array.from(graph.partnershipGroups[0].partners), ['3', '4']);
  assert.equal(graph.partnershipGroups[0].id, 'couple-3-4');
  assert.equal(graph.partnershipGroups[0].relation, 'spouse');
  assert.equal(units.length, 1);
  assert.equal(members[0].spouseId, 3, 'source object remains unchanged');
});
test('multiple declared partner groups for one member remain separate', () => {
  const members = [person(1, 'Member A', { spouseId: 2 }), person(2, 'Member B'), person(3, 'Member C', { spouseId: 1 })];
  const { graph } = adaptMembersToMemoirTree(members, 1);
  assert.deepEqual(Array.from(graph.partnershipGroups, group => group.id), ['couple-1-2', 'couple-1-3']);
  assert.equal(graph.partnershipGroups.length, 2);
});

test('two declared parents route all children through their shared couple unit', () => {
  const members = [
    person(1, 'Parent A'), person(2, 'Parent B'),
    person(10, 'Child A', { fatherId: 1, motherId: 2 }),
    person(11, 'Child B', { fatherId: 1, motherId: 2 }),
  ];
  const { graph, units } = adaptMembersToMemoirTree(members, 10);
  assert.equal(graph.partnershipGroups.length, 1);
  assert.equal(graph.partnershipGroups[0].id, 'couple-1-2');
  assert.deepEqual(Array.from(graph.parentChildLinks, link => [link.groupId, link.parentId, link.childId]), [
    ['couple-1-2', '1', '10'], ['couple-1-2', '2', '10'],
    ['couple-1-2', '1', '11'], ['couple-1-2', '2', '11'],
  ]);
  assert.deepEqual(Array.from(units[0].childIds), [10, 11]);
  assert.equal(graph.partnershipGroups[0].relation, 'coparent', 'parentage alone does not invent a spouse fact');
});

test('Hồng Sơn and Hồng Nhung children share one deterministic couple family unit', () => {
  const members = [
    person(1, 'Mai Thu', { spouseId: 2, childIds: [3, 4, 5] }),
    person(2, 'Nguyễn Bửu', { spouseId: 1 }),
    person(3, 'Nguyễn Mai Anh', { fatherId: 1, motherId: 2, childIds: [9, 10] }),
    person(4, 'Nguyễn Mai Sơn', { fatherId: 1, motherId: 2 }),
    person(5, 'Nguyễn Mai Hồng Sơn', { fatherId: 1, motherId: 2, spouseId: 6 }),
    person(6, 'Nguyễn Thị Hồng Nhung', { spouseId: 5, childIds: [7, 8] }),
    person(7, 'Nguyễn Hoàng Minh', { fatherId: 5, motherId: 6 }),
    person(8, 'Nguyễn Hoàng Anh', { fatherId: 5, motherId: 6 }),
    person(9, 'Nguyễn Huỳnh Minh Đức', { fatherId: 3 }),
    person(10, 'Nguyễn Huỳnh Quốc Bảo', { fatherId: 3 }),
  ];
  const { graph, units } = adaptMembersToMemoirTree(members, 7);
  const hsnLinks = graph.parentChildLinks.filter(link => ['7', '8'].includes(link.childId));
  assert.equal(new Set(hsnLinks.map(link => link.groupId)).size, 1);
  assert.equal(hsnLinks[0].groupId, 'couple-5-6');
  assert.deepEqual(Array.from(hsnLinks, link => link.parentId).sort(), ['5', '5', '6', '6']);
  const hsnUnit = units.find(unit => unit.id === 'couple-5-6');
  assert.deepEqual(Array.from(hsnUnit.childIds), [7, 8]);
  const parentsByChild = new Map(graph.parentChildLinks.map(link => [link.childId, link.groupId]));
  assert.equal(parentsByChild.get('9'), 'single-3');
  assert.equal(parentsByChild.get('10'), 'single-3');
  const maiThuLinks = graph.parentChildLinks.filter(link => ['3', '4', '5'].includes(link.childId));
  assert.ok(maiThuLinks.every(link => link.groupId === 'couple-1-2'));
});

test('Memoir layout retains a compact Hồng Sơn/Nhung union and both child placements', async () => {
  const { buildFamilyTreeLayout } = await import('@memoir/tree');
  const members = [
    person(1, 'Mai Thu', { generation: 1, spouseId: 2 }), person(2, 'Nguyễn Bửu', { generation: 1, spouseId: 1 }),
    person(3, 'Nguyễn Mai Anh', { generation: 2, fatherId: 1, motherId: 2 }),
    person(4, 'Nguyễn Mai Sơn', { generation: 2, fatherId: 1, motherId: 2 }),
    person(5, 'Nguyễn Mai Hồng Sơn', { generation: 2, fatherId: 1, motherId: 2, spouseId: 6 }),
    person(6, 'Nguyễn Thị Hồng Nhung', { generation: 2, spouseId: 5, childIds: [7, 8] }),
    person(7, 'Nguyễn Hoàng Minh', { generation: 3, fatherId: 5, motherId: 6 }),
    person(8, 'Nguyễn Hoàng Anh', { generation: 3, fatherId: 5, motherId: 6 }),
  ];
  const { graph } = adaptMembersToMemoirTree(members, 7);
  const layout = buildFamilyTreeLayout({ graph, boundsMode: 'content', layoutMode: 'compact-family', lineShape: 'orthogonal', measurements: Object.fromEntries(Object.keys(graph.people).map(id => [id, { width: 232, height: 178 }])) });
  const cards = new Set(layout.cards.map(card => card.personId));
  assert.ok(['5', '6', '7', '8'].every(id => cards.has(id)), 'parents and both children are placed in this family neighborhood');
  const spouseEdge = layout.edges.find(edge => edge.id === 'couple-5-6');
  assert.ok(spouseEdge);
  assert.deepEqual([spouseEdge.sourceId, spouseEdge.targetId], ['5', '6']);
  const childEdge = layout.edges.find(edge => edge.sourceId === 'couple-5-6');
  assert.ok(childEdge, 'the descendant trunk begins at the local couple unit');
  assert.match(childEdge.path, /^M [-\d.]+ [-\d.]+ L [-\d.]+ [-\d.]+/);
  assert.ok(layout.edges.every(edge => edge.path.startsWith('M ')), 'connector paths are continuous SVG paths');
});

test('single parent, reverse childIds, and multiple siblings use valid shared units', () => {
  const members = [person(1, 'Parent', { childIds: [3, 4, 4] }), person(3, 'Child A'), person(4, 'Child B')];
  const { graph } = adaptMembersToMemoirTree(members, 1);
  assert.equal(graph.partnershipGroups.length, 1);
  assert.deepEqual(Array.from(graph.partnershipGroups[0].partners), ['1']);
  assert.deepEqual(Array.from(graph.parentChildLinks, link => [link.groupId, link.parentId, link.childId]), [
    ['single-1', '1', '3'], ['single-1', '1', '4'],
  ]);
});

test('two sibling subfamilies keep separate child-bearing couple units', () => {
  const members = [
    person(1, 'Grandparent A'), person(2, 'Grandparent B'),
    person(3, 'Sibling A', { fatherId: 1, motherId: 2, spouseId: 5 }),
    person(4, 'Sibling B', { fatherId: 1, motherId: 2, spouseId: 6 }),
    person(5, 'Partner A'), person(6, 'Partner B'),
    person(7, 'A child', { fatherId: 3, motherId: 5 }),
    person(8, 'B child', { fatherId: 4, motherId: 6 }),
  ];
  const { graph, units } = adaptMembersToMemoirTree(members, 7);
  const familyForChild = childId => new Set(graph.parentChildLinks.filter(link => link.childId === String(childId)).map(link => link.groupId));
  assert.deepEqual(Array.from(familyForChild(7)), ['couple-3-5']);
  assert.deepEqual(Array.from(familyForChild(8)), ['couple-4-6']);
  assert.notEqual([...familyForChild(7)][0], [...familyForChild(8)][0]);
  assert.deepEqual(Array.from(units.find(unit => unit.id === 'couple-3-5').childIds), [7]);
  assert.deepEqual(Array.from(units.find(unit => unit.id === 'couple-4-6').childIds), [8]);
});

test('the real Memoir layout accepts a single parent without manufacturing a second card', async () => {
  const { buildFamilyTreeLayout } = await import('@memoir/tree');
  const members = [person(1, 'Known parent'), person(2, 'Child A', { fatherId: 1 }), person(3, 'Child B', { fatherId: 1 })];
  const { graph } = adaptMembersToMemoirTree(members, 2);
  const layout = buildFamilyTreeLayout({ graph, boundsMode: 'content', measurements: Object.fromEntries(Object.keys(graph.people).map(id => [id, { width: 232, height: 178 }])) });
  assert.deepEqual(Array.from(layout.cards, card => card.personId).sort(), ['1', '2', '3']);
  assert.deepEqual(Array.from(graph.partnershipGroups[0].partners), ['1']);
  assert.ok(layout.edges.some(edge => edge.sourceId === 'single-1'));
});

test('missing, dangling, and self relationships do not create fake people or links', () => {
  const members = [
    person(1, 'A', { fatherId: 1, motherId: 404, spouseId: 404, childIds: [1, 3, 404] }),
    person(2, 'B', { fatherId: 999, spouseId: 2 }),
    person(3, 'Child', { fatherId: 1, motherId: 404 }),
  ];
  const { graph } = adaptMembersToMemoirTree(members, 999);
  assert.deepEqual(Object.keys(graph.people).sort(), ['1', '2', '3']);
  assert.equal(graph.subject, '1', 'invalid subject falls back to a real member');
  assert.deepEqual(Array.from(graph.parentChildLinks, link => [link.parentId, link.childId]), [['1', '3']]);
  assert.ok(graph.partnershipGroups.every(group => group.partners.every(id => Object.hasOwn(graph.people, id))));
});

test('renderer flag keeps family-view as default and limits Memoir to development', () => {
  const config = readFileSync(join(__dirname, '../src/features/admin/components/family-tree/familyTreeRendererConfig.ts'), 'utf8');
  assert.match(config, /configuredRenderer === "memoir"\) return isDevelopment \? "memoir" : "family-view"/);
  assert.match(config, /requestedRenderer === "memoir"/);
  assert.match(config, /resolveFamilyTreeRenderer\(IS_DEVELOPMENT_BUILD, requestedRenderer\)/);
  assert.match(config, /return "family-view"/);
  const pureSource = `${config.slice(0, config.indexOf('const requestedRenderer'))}\nexports.resolver = resolveFamilyTreeRenderer;`;
  const compiled = ts.transpileModule(pureSource, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const configModule = {};
  new vm.Script(compiled).runInNewContext({ exports: configModule });
  assert.equal(configModule.resolver(true), 'family-view');
  assert.equal(configModule.resolver(true, 'memoir'), 'memoir');
  assert.equal(configModule.resolver(false, 'memoir'), 'family-view');
  assert.equal(configModule.resolver(true, 'invalid'), 'family-view');
  assert.equal(configModule.resolver(true, 'family-chart'), 'family-chart');
  assert.equal(configModule.resolver(true, 'react-flow'), 'react-flow');
});

test('Memoir renderer is lazy and scoped errors fall back to stable FamilyTreeView', () => {
  const manager = readFileSync(join(__dirname, '../src/features/admin/components/FamilyTreeManager.tsx'), 'utf8');
  const boundary = readFileSync(join(__dirname, '../src/features/admin/components/family-tree/FamilyTreeRendererErrorBoundary.tsx'), 'utf8');
  assert.match(manager, /IS_MEMOIR_DEV_POC \? lazy\(\(\) => import\('\.\/family-tree\/MemoirFamilyTreeView'/);
  assert.match(manager, /<FamilyTreeRendererErrorBoundary[\s\S]*?<FamilyTreeView/);
  assert.match(boundary, /getDerivedStateFromError/);
  assert.match(manager, /setMemoirTreeFailed\(true\)/);
});

test('Memoir view keeps custom React card, branch expansion, search focus, PNG and pan support', () => {
  const view = readFileSync(join(__dirname, '../src/features/admin/components/family-tree/MemoirFamilyTreeView.tsx'), 'utf8');
  const card = readFileSync(join(__dirname, '../src/features/admin/components/family-tree/MemoirFamilyPersonCard.tsx'), 'utf8');
  assert.match(view, /<FamilyTree<MemoirPerson, MemoirFamilyCardActions>/);
  assert.match(view, /interactionMode="pan"/);
  assert.match(view, /searchFocusMemberId/);
  assert.match(view, /toPng\(element/);
  assert.match(view, /setShowAll\(value => !value\)/);
  assert.match(card, /onEdit\(person\)/);
  assert.match(card, /onDelete\(person\)/);
  assert.match(card, /onExpand\(id\)/);
});
