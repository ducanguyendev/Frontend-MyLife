const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const compile = source => {
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = {};
  new vm.Script(output).runInNewContext({ exports: module });
  return module;
};
const adapterSource = readFileSync(join(__dirname, '../src/features/admin/components/family-tree/shadcnFamilyTreeAdapter.ts'), 'utf8');
const adapter = compile(adapterSource);
const layoutSource = readFileSync(join(__dirname, '../src/features/admin/components/family-tree/family-view/familyTreeLayout.ts'), 'utf8');
const layout = compile(layoutSource);
const shadcnLayoutSource = readFileSync(join(__dirname, '../src/features/admin/components/family-tree/shadcnFamilyTreeLayout.ts'), 'utf8');
const shadcnLayoutModule = {};
new vm.Script(ts.transpileModule(shadcnLayoutSource, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText)
  .runInNewContext({ exports: shadcnLayoutModule, require: () => layout });
const configSource = readFileSync(join(__dirname, '../src/features/admin/components/family-tree/familyTreeRendererConfig.ts'), 'utf8');
const config = compile(`${configSource.slice(0, configSource.indexOf('const requestedRenderer'))}\nexports.resolve = resolveFamilyTreeRenderer;`);
const person = (id, fullName = `Person ${id}`, values = {}) => ({ id, fullName, generation: 1, createdAt: '', updatedAt: '', ...values });

test('maps MyLife parents and spouse into flat IDs without mutating source records', () => {
  const members = [person(1, 'Father', { spouseId: 2 }), person(2, 'Mother'), person(3, 'Child', { fatherId: 1, motherId: 2, generation: 2 })];
  const result = adapter.adaptMembersToShadcnFamilyTree(members);
  assert.deepEqual(Array.from(result.people.find(item => item.id === '3').parentIds), ['1', '2']);
  assert.deepEqual(Array.from(result.people.find(item => item.id === '1').partnerIds), ['2']);
  assert.deepEqual(Array.from(result.people.find(item => item.id === '2').partnerIds), ['1']);
  assert.equal(members[1].spouseId, undefined);
  assert.equal(result.people.find(item => item.id === '3').generation, 2);
});

test('drops dangling and self relationships and keeps a valid single-parent union', () => {
  const members = [person(1, 'Parent', { fatherId: 1, motherId: 900, spouseId: 1, childIds: [2, 2, 1, 900] }), person(2, 'Child', { fatherId: 1 })];
  const result = adapter.adaptMembersToShadcnFamilyTree(members);
  assert.deepEqual(Array.from(result.people.find(item => item.id === '2').parentIds), ['1']);
  assert.deepEqual(Array.from(result.people.find(item => item.id === '1').partnerIds), []);
  assert.equal(result.unions.length, 1);
  assert.equal(result.unions[0].id, 'union-1');
  assert.deepEqual(Array.from(result.unions[0].partnerIds), ['1']);
  assert.deepEqual(Array.from(result.unions[0].childIds), ['2']);
});

test('Mai Thu and Nguyễn Bửu share one deterministic parent union for their three children', () => {
  const members = [
    person(1, 'Mai Thu', { spouseId: 2 }), person(2, 'Nguyễn Bửu'),
    person(3, 'Nguyễn Mai Anh', { generation: 2, fatherId: 1, motherId: 2 }),
    person(4, 'Nguyễn Mai Sơn', { generation: 2, fatherId: 1, motherId: 2 }),
    person(5, 'Nguyễn Mai Hồng Sơn', { generation: 2, fatherId: 1, motherId: 2, spouseId: 6 }),
  ];
  const result = adapter.adaptMembersToShadcnFamilyTree(members);
  assert.deepEqual(Array.from(result.unions.find(union => union.id === 'union-1-2').childIds), ['3', '4', '5']);
  assert.ok(result.people.filter(item => ['3', '4', '5'].includes(item.id)).every(item => item.parentIds.join(':') === '1:2'));
});

test('Hồng Sơn and Hồng Nhung form one union above Hoàng Minh and Hoàng Anh', () => {
  const members = [
    person(5, 'Nguyễn Mai Hồng Sơn', { gender: 'Nam', generation: 2, spouseId: 6 }),
    person(6, 'Nguyễn Thị Hồng Nhung', { gender: 'Nữ', generation: 2 }),
    person(7, 'Nguyễn Hoàng Minh', { generation: 3, fatherId: 5, motherId: 6 }),
    person(8, 'Nguyễn Hoàng Anh', { generation: 3, fatherId: 5, motherId: 6 }),
  ];
  const result = adapter.adaptMembersToShadcnFamilyTree(members);
  assert.deepEqual(Array.from(result.people.find(item => item.id === '5').partnerIds), ['6']);
  assert.deepEqual(Array.from(result.people.find(item => item.id === '6').partnerIds), ['5']);
  assert.deepEqual(Array.from(result.unions.find(union => union.id === 'union-5-6').childIds), ['7', '8']);
  const rendered = shadcnLayoutModule.layoutShadcnFamilyTree(members);
  const trunk = rendered.links.find(link => link.id.startsWith('family-5:6:'));
  assert.ok(trunk, 'one child trunk originates at the shared couple midpoint');
  assert.equal(rendered.links.filter(link => link.id.startsWith('family-child-5:6:')).length, 2);
  const parents = [5, 6].map(id => rendered.nodes.find(node => node.member.id === id));
  const children = [7, 8].map(id => rendered.nodes.find(node => node.member.id === id));
  const coupleCenter = parents.reduce((sum, node) => sum + node.x + node.width / 2, 0) / parents.length;
  const siblingCenter = children.reduce((sum, node) => sum + node.x + node.width / 2, 0) / children.length;
  assert.ok(Math.abs(coupleCenter - siblingCenter) < 1, 'the couple midpoint is centered over the sibling rail');
});

test('half siblings keep their separate parent unions', () => {
  const result = adapter.adaptMembersToShadcnFamilyTree([
    person(1), person(2), person(3), person(4),
    person(5, 'Sibling A', { fatherId: 1, motherId: 2 }), person(6, 'Sibling B', { fatherId: 1, motherId: 3 }),
  ]);
  assert.ok(result.unions.some(union => union.id === 'union-1-2' && union.childIds.includes('5')));
  assert.ok(result.unions.some(union => union.id === 'union-1-3' && union.childIds.includes('6')));
  assert.notEqual(result.unions.find(union => union.childIds.includes('5')).id, result.unions.find(union => union.childIds.includes('6')).id);
});

test('same generation members share a horizontal lane with stable card sizing', () => {
  const members = [person(1, 'Parent A', { generation: 1 }), person(2, 'Parent B', { generation: 1 }), person(3, 'Child A', { generation: 2, fatherId: 1, motherId: 2 }), person(4, 'Child B', { generation: 2, fatherId: 1, motherId: 2 }), person(5, 'Grandchild', { generation: 3, fatherId: 3, motherId: 4 })];
  const result = shadcnLayoutModule.layoutShadcnFamilyTree(members);
  for (const generation of [1, 2, 3]) assert.equal(new Set(result.nodes.filter(node => node.generation === generation).map(node => node.y)).size, 1);
});

test('generation lanes remain finite and non-overlapping for family sizes from 13 to 200 people', () => {
  for (const size of [13, 30, 50, 100, 200]) {
    const members = Array.from({ length: size }, (_, index) => {
      const id = index + 1;
      const generation = Math.floor(index / 13) + 1;
      const parentId = generation > 1 ? Math.floor((index % 13) / 2) * 2 + 1 : undefined;
      return person(id, `Member ${id}`, { generation, fatherId: parentId, motherId: parentId == null ? undefined : parentId + 1 });
    });
    const result = shadcnLayoutModule.layoutShadcnFamilyTree(members);
    assert.equal(result.nodes.length, size);
    assert.ok(result.nodes.every(node => Number.isFinite(node.x) && Number.isFinite(node.y)));
    for (const generation of new Set(members.map(member => member.generation))) {
      const row = result.nodes.filter(node => node.generation === generation).sort((a, b) => a.x - b.x);
      assert.equal(new Set(row.map(node => node.y)).size, 1);
      assert.ok(row.slice(1).every((node, index) => row[index].x + row[index].width <= node.x), `generation ${generation} cards do not overlap at size ${size}`);
    }
  }
});

test('single child connector uses a clean orthogonal route from the parent union', () => {
  const members = [person(1, 'Parent A', { generation: 1 }), person(2, 'Parent B', { generation: 1 }), person(3, 'Child', { generation: 2, fatherId: 1, motherId: 2, spouseId: 4 }), person(4, 'Child spouse', { generation: 2, spouseId: 3 })];
  const result = shadcnLayoutModule.layoutShadcnFamilyTree(members);
  const union = result.links.find(link => link.id.startsWith('family-1:2:'));
  assert.ok(union);
  assert.match(union.path, /^M [-\d.]+ [-\d.]+ L [-\d.]+ [-\d.]+(?: L [-\d.]+ [-\d.]+ L [-\d.]+ [-\d.]+)?$/);
  assert.doesNotMatch(union.path, / C /);
});

test('shadcn-family-tree is an explicit development POC and production stays on family-view', () => {
  assert.equal(config.resolve(true), 'family-view');
  assert.equal(config.resolve(true, 'shadcn-family-tree'), 'shadcn-family-tree');
  assert.equal(config.resolve(false, 'shadcn-family-tree'), 'family-view');
  assert.equal(config.resolve(true, 'invalid'), 'family-view');
  assert.equal(config.resolve(true, 'memoir'), 'memoir');
  assert.equal(config.resolve(true, 'family-chart'), 'family-chart');
});

test('Manager lazy-loads the POC and renderer errors fall back to FamilyTreeView', () => {
  const manager = readFileSync(join(__dirname, '../src/features/admin/components/FamilyTreeManager.tsx'), 'utf8');
  const boundary = readFileSync(join(__dirname, '../src/features/admin/components/family-tree/FamilyTreeRendererErrorBoundary.tsx'), 'utf8');
  const view = readFileSync(join(__dirname, '../src/features/admin/components/family-tree/ShadcnFamilyTreeView.tsx'), 'utf8');
  assert.match(manager, /IS_SHADCN_FAMILY_TREE_DEV_POC \? lazy\(\(\) => import\('\.\/family-tree\/ShadcnFamilyTreeView'/);
  assert.match(manager, /<FamilyTreeRendererErrorBoundary[\s\S]*?<FamilyTreeView/);
  assert.match(boundary, /getDerivedStateFromError/);
  assert.match(view, /data-renderer="shadcn-family-tree"/);
  assert.match(view, /onView=\{onView\} onEdit=\{onEdit\} onDelete=\{onDelete\}/);
  assert.match(view, /searchFocusMemberId/);
  assert.match(view, /toPng\(/);
});
