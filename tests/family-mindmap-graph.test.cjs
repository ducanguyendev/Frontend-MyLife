const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const source = readFileSync(join(__dirname, '../src/features/admin/components/family-tree/familyMindmapGraph.ts'), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: {
  module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true,
} });
const graphExports = {};
new vm.Script(outputText).runInNewContext({ exports: graphExports });
const { buildFamilyMindmapGraph, layoutFamilyMindmapGraph, MEMBER_NODE_WIDTH, MEMBER_NODE_HEIGHT } = graphExports;

function member(id, values = {}) {
  return { id, fullName: `Member ${id}`, generation: 1, createdAt: '', updatedAt: '', ...values };
}

function edgesOf(graph, relationType) {
  return graph.edges.filter(edge => edge.data?.relationType === relationType);
}

function nodeOf(graph, id) {
  return graph.nodes.find(node => node.id === id);
}

function positionedMembers(graph) {
  return new Map(graph.nodes.filter(node => node.type === 'member').map(node => [Number(node.id), node.position]));
}

function family(children = [3, 4, 5], values = {}) {
  return [
    member(1, { generation: 1, spouseId: 2, ...values.father }),
    member(2, { generation: 1, spouseId: 1, ...values.mother }),
    ...children.map(id => member(id, { generation: 2, fatherId: 1, motherId: 2, ...(values.children?.[id] ?? {}) })),
  ];
}

test('spouses render one straight edge and keep their compact card gap', () => {
  const people = [member(1, { spouseId: 2 }), member(2, { spouseId: 1 }), member(3)];
  const graph = buildFamilyMindmapGraph(people);
  const layout = layoutFamilyMindmapGraph(graph.nodes, graph.edges);
  const positions = positionedMembers(layout);
  const coupleGap = positions.get(2).x - (positions.get(1).x + MEMBER_NODE_WIDTH);
  assert.equal(coupleGap, 20);
  assert.equal(edgesOf(graph, 'spouse').length, 1);
  assert.equal(edgesOf(graph, 'spouse')[0].sourceHandle, 'spouse-right');
  assert.equal(edgesOf(graph, 'spouse')[0].targetHandle, 'spouse-left');
});

test('couple midpoint, family union and sibling bar share exact geometry', () => {
  const graph = buildFamilyMindmapGraph(family());
  const layout = layoutFamilyMindmapGraph(graph.nodes, graph.edges, 'TB');
  const positions = positionedMembers(layout);
  const union = layout.nodes.find(node => node.type === 'familyUnion');
  const branch = layout.nodes.find(node => node.type === 'familyBranch');
  const parentsMidpoint = (positions.get(1).x + MEMBER_NODE_WIDTH + positions.get(2).x) / 2;
  const childCenters = [3, 4, 5].map(id => positions.get(id).x + MEMBER_NODE_WIDTH / 2);
  const firstCenter = Math.min(...childCenters);
  const lastCenter = Math.max(...childCenters);

  assert.equal(union.position.x + union.width / 2, parentsMidpoint);
  assert.equal(branch.position.x, firstCenter);
  assert.equal(branch.width, lastCenter - firstCenter);
  assert.equal(branch.position.x + branch.width, lastCenter);
  assert.equal(branch.position.y + branch.height, positions.get(3).y - 38);
  assert.equal(union.position.y, positions.get(1).y + MEMBER_NODE_HEIGHT + 32);
  assert.ok(Math.abs(branch.position.x + branch.width / 2 - parentsMidpoint) < 1);

  const anchor = nodeOf(layout, union.data.anchorId);
  assert.equal(anchor.position.x + anchor.width / 2, parentsMidpoint);
  assert.equal(anchor.position.y + anchor.height, positions.get(1).y + MEMBER_NODE_HEIGHT / 2);
});

test('branch child handles use measured child card centers, including uneven spouse-unit spacing', () => {
  const people = family([3, 4, 5], { children: { 3: { spouseId: 6 } } });
  people.push(member(6, { generation: 2, spouseId: 3 }));
  const graph = buildFamilyMindmapGraph(people);
  const layout = layoutFamilyMindmapGraph(graph.nodes, graph.edges, 'TB');
  const positions = positionedMembers(layout);
  const branch = layout.nodes.find(node => node.type === 'familyBranch');
  const offsets = new Map(branch.data.childOffsets.map(item => [item.id, item.offset]));

  for (const childId of branch.data.childIds) {
    assert.equal(offsets.get(childId), positions.get(childId).x + MEMBER_NODE_WIDTH / 2 - branch.position.x);
  }
  assert.notEqual(offsets.get(4) / branch.data.span, 0.5, 'middle child handle should follow its card, not its array index');
});

test('one child has no sibling bar and connects directly under the parent-pair midpoint', () => {
  const graph = buildFamilyMindmapGraph(family([3]));
  const layout = layoutFamilyMindmapGraph(graph.nodes, graph.edges, 'TB');
  const positions = positionedMembers(layout);
  const union = layout.nodes.find(node => node.type === 'familyUnion');
  const parentMidpoint = (positions.get(1).x + MEMBER_NODE_WIDTH + positions.get(2).x) / 2;
  assert.equal(layout.nodes.filter(node => node.type === 'familyBranch').length, 0);
  assert.equal(union.position.x + union.width / 2, parentMidpoint);
  assert.equal(positions.get(3).x + MEMBER_NODE_WIDTH / 2, parentMidpoint);
  assert.equal(edgesOf(graph, 'familyStem').length, 1);
  assert.equal(edgesOf(graph, 'childDrop').length, 1);
});

test('each child drop belongs only to its child so hover focus stays even across siblings', () => {
  const graph = buildFamilyMindmapGraph(family([3, 4, 5]));
  const drops = edgesOf(graph, 'childDrop');
  assert.equal(drops.length, 3);
  for (const edge of drops) assert.deepEqual(Array.from(edge.data.familyIds), [Number(edge.target)]);
  assert.ok(graph.edges.every(edge => edge.style == null), 'connector stroke system is controlled by shared CSS');
});

test('single parent trunk leaves its bottom center without inventing a spouse', () => {
  const people = [member(1, { generation: 1 }), member(2, { generation: 2, motherId: 1 }), member(3, { generation: 2, motherId: 1 })];
  const graph = buildFamilyMindmapGraph(people);
  const layout = layoutFamilyMindmapGraph(graph.nodes, graph.edges, 'TB');
  const positions = positionedMembers(layout);
  const union = layout.nodes.find(node => node.type === 'familyUnion');
  const anchor = nodeOf(layout, union.data.anchorId);

  assert.equal(edgesOf(graph, 'spouse').length, 0);
  assert.equal(anchor.position.x + anchor.width / 2, positions.get(1).x + MEMBER_NODE_WIDTH / 2);
  assert.equal(anchor.position.y + anchor.height, positions.get(1).y + MEMBER_NODE_HEIGHT);
  assert.equal(union.position.x + union.width / 2, positions.get(1).x + MEMBER_NODE_WIDTH / 2);
});

test('multiple sibling groups in one generation keep independent bars and family ownership', () => {
  const people = [
    member(1, { generation: 1, spouseId: 2 }), member(2, { generation: 1, spouseId: 1 }),
    member(3, { generation: 1, spouseId: 4 }), member(4, { generation: 1, spouseId: 3 }),
    member(5, { generation: 2, fatherId: 1, motherId: 2 }), member(6, { generation: 2, fatherId: 1, motherId: 2 }),
    member(7, { generation: 2, fatherId: 3, motherId: 4 }), member(8, { generation: 2, fatherId: 3, motherId: 4 }),
  ];
  const graph = buildFamilyMindmapGraph(people);
  const layout = layoutFamilyMindmapGraph(graph.nodes, graph.edges, 'TB');
  const branches = layout.nodes.filter(node => node.type === 'familyBranch').sort((a, b) => a.position.x - b.position.x);

  assert.equal(branches.length, 2);
  assert.ok(branches[0].position.x + branches[0].width < branches[1].position.x);
  for (const branch of branches) {
    const union = nodeOf(layout, branch.data.unionId);
    assert.ok(union);
    assert.ok(branch.data.childIds.length >= 2);
    assert.deepEqual(Array.from(branch.data.familyIds), Array.from(union.data.familyIds));
    assert.ok(edgesOf(graph, 'familyStem').some(edge => edge.source === union.id && edge.target === branch.id));
  }
});

test('every family branch belongs to a union with at least two children and has no floating rail CSS', () => {
  const graph = buildFamilyMindmapGraph(family());
  const layout = layoutFamilyMindmapGraph(graph.nodes, graph.edges);
  for (const branch of layout.nodes.filter(node => node.type === 'familyBranch')) {
    const union = nodeOf(layout, branch.data.unionId);
    assert.ok(union);
    assert.ok(union.data.childIds.length >= 2);
    assert.ok(branch.data.familyIds.length >= 3);
  }
  const css = readFileSync(join(__dirname, '../src/features/admin/components/family-tree/FamilyMindmap.css'), 'utf8');
  const mindmap = readFileSync(join(__dirname, '../src/features/admin/components/family-tree/FamilyMindmap.tsx'), 'utf8');
  assert.doesNotMatch(css, /\.family-mindmap-branch::before/);
  assert.match(mindmap, /family-mindmap-branch__svg/);
  assert.doesNotMatch(css, /\.family-mindmap-generation::after|\.family-mindmap-generation--lr::after/);
});

test('LR rotates the same geometry: parent trunk aligns with branch and child drops hit card centers', () => {
  const graph = buildFamilyMindmapGraph(family(), { direction: 'LR' });
  const layout = layoutFamilyMindmapGraph(graph.nodes, graph.edges, 'LR');
  const positions = positionedMembers(layout);
  const union = layout.nodes.find(node => node.type === 'familyUnion');
  const branch = layout.nodes.find(node => node.type === 'familyBranch');
  const parentMidpoint = (positions.get(1).y + MEMBER_NODE_HEIGHT / 2 + positions.get(2).y + MEMBER_NODE_HEIGHT / 2) / 2;
  const childCenters = [3, 4, 5].map(id => positions.get(id).y + MEMBER_NODE_HEIGHT / 2);

  assert.equal(union.position.y + union.height / 2, parentMidpoint);
  assert.equal(branch.position.y, Math.min(...childCenters));
  assert.equal(branch.height, Math.max(...childCenters) - Math.min(...childCenters));
  assert.equal(branch.position.x + branch.width, positions.get(3).x - 38);
  assert.deepEqual(Array.from(branch.data.childOffsets.map(item => item.offset)), childCenters.map(center => center - branch.position.y));
});

test('horizontal relations remain separate, subtle, deduplicated, and off by default', () => {
  const people = [
    member(1, { spouseId: 2, horizontalRelations: [{ memberId: 2, relationType: 'sibling' }, { memberId: 3, relationType: 'Sibling' }] }),
    member(2, { spouseId: 1, horizontalRelations: [{ memberId: 3, relationType: 'cousin' }] }),
    member(3, { horizontalRelations: [{ memberId: 1, relationType: 'sibling' }, { memberId: 2, relationType: 'cousin' }] }),
  ];
  assert.equal(edgesOf(buildFamilyMindmapGraph(people), 'horizontal').length, 0);
  const graph = buildFamilyMindmapGraph(people, { showHorizontalRelations: true });
  assert.equal(edgesOf(graph, 'horizontal').length, 2);
  assert.ok(edgesOf(graph, 'horizontal').every(edge => edge.className.includes('horizontal')));
  assert.equal(edgesOf(graph, 'spouse').length, 1);
});

test('parent and spouse references deduplicate without dangling edges', () => {
  const graph = buildFamilyMindmapGraph([
    member(1, { spouseId: 2 }), member(2, { spouseId: 1 }),
    member(3, { fatherId: 1, motherId: 1 }), member(4, { generation: 2, fatherId: 1, motherId: 99, spouseId: 99 }),
  ]);
  const nodeIds = new Set(graph.nodes.map(node => node.id));
  assert.equal(edgesOf(graph, 'spouse').length, 1);
  assert.equal(new Set(graph.edges.map(edge => edge.id)).size, graph.edges.length);
  assert.ok(graph.edges.every(edge => edge.source !== edge.target && nodeIds.has(edge.source) && nodeIds.has(edge.target)));
  assert.ok(graph.nodes.filter(node => node.type === 'familyBranch').every(node => node.data.childIds.length >= 2));
  assert.ok(edgesOf(graph, 'familyStem').every(edge => edge.data.familyIds.length >= 2));
});

test('generation layout and family-aware placement work both ways without overlaps at 200 members', () => {
  const people = Array.from({ length: 200 }, (_, index) => {
    const id = index + 1;
    return member(id, {
      generation: Math.floor(index / 40) + 1,
      spouseId: id % 2 === 1 && id < 40 ? id + 1 : id % 2 === 0 && id < 40 ? id - 1 : undefined,
      fatherId: id > 40 ? Math.floor((id - 1) / 2) : undefined,
      motherId: id > 40 ? Math.floor((id - 1) / 2) + 1 : undefined,
    });
  });
  const graph = buildFamilyMindmapGraph(people);
  for (const direction of ['TB', 'LR']) {
    const layout = layoutFamilyMindmapGraph(graph.nodes, graph.edges, direction);
    assert.equal(layout.nodes.filter(node => node.type === 'member').length, 200);
    assert.ok(layout.nodes.every(node => Number.isFinite(node.position.x) && Number.isFinite(node.position.y)));
    const rows = new Map();
    for (const [id, position] of positionedMembers(layout)) {
      const row = rows.get(position[direction === 'TB' ? 'y' : 'x']) ?? [];
      row.push({ id, axis: position[direction === 'TB' ? 'x' : 'y'] });
      rows.set(position[direction === 'TB' ? 'y' : 'x'], row);
    }
    for (const row of rows.values()) {
      row.sort((a, b) => a.axis - b.axis);
      for (let index = 1; index < row.length; index++) assert.ok(row[index - 1].axis + MEMBER_NODE_WIDTH <= row[index].axis);
    }
  }
  assert.equal(MEMBER_NODE_HEIGHT, 136);
});
