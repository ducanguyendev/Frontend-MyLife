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

function positionedMembers(graph) {
  return new Map(graph.nodes.filter(node => node.type === 'member').map(node => [Number(node.id), node.position]));
}

test('spouses form a close visual unit with a gap smaller than the family group gap', () => {
  const people = [member(1, { spouseId: 2 }), member(2, { spouseId: 1 }), member(3)];
  const graph = buildFamilyMindmapGraph(people);
  const layout = layoutFamilyMindmapGraph(graph.nodes, graph.edges);
  const positions = positionedMembers(layout);
  const coupleGap = positions.get(2).x - (positions.get(1).x + MEMBER_NODE_WIDTH);
  const separateFamilyGap = positions.get(3).x - (positions.get(2).x + MEMBER_NODE_WIDTH);
  assert.equal(coupleGap, 20);
  assert.ok(separateFamilyGap > coupleGap);
  assert.equal(edgesOf(graph, 'spouse').length, 1);
});

test('siblings share one family hub and a horizontal branch with children below it', () => {
  const people = [
    member(1, { generation: 1, spouseId: 2 }), member(2, { generation: 1, spouseId: 1 }),
    member(3, { generation: 2, fatherId: 1, motherId: 2 }),
    member(4, { generation: 2, fatherId: 1, motherId: 2 }),
    member(5, { generation: 2, fatherId: 1, motherId: 2 }),
  ];
  const graph = buildFamilyMindmapGraph(people);
  const hubs = graph.nodes.filter(node => node.type === 'familyUnion');
  const branches = graph.nodes.filter(node => node.type === 'familyBranch');
  assert.equal(hubs.length, 1);
  assert.deepEqual(Array.from(hubs[0].data.childIds), [3, 4, 5]);
  assert.equal(branches.length, 1);
  assert.equal(edgesOf(graph, 'parentChild').filter(edge => edge.target === branches[0].id).length, 1);
  assert.equal(edgesOf(graph, 'parentChild').filter(edge => edge.source === branches[0].id).length, 3);
  const layout = layoutFamilyMindmapGraph(graph.nodes, graph.edges);
  const positions = positionedMembers(layout);
  assert.ok(positions.get(3).y > positions.get(1).y);
  assert.ok(layout.nodes.find(node => node.id === branches[0].id).width > MEMBER_NODE_WIDTH);
});

test('one child connects through its parent couple midpoint without an unnecessary sibling branch', () => {
  const graph = buildFamilyMindmapGraph([
    member(1, { generation: 1 }), member(2, { generation: 1 }),
    member(3, { generation: 2, fatherId: 1, motherId: 2 }),
  ]);
  assert.equal(graph.nodes.filter(node => node.type === 'familyUnion').length, 1);
  assert.equal(graph.nodes.filter(node => node.type === 'familyBranch').length, 0);
  assert.equal(edgesOf(graph, 'parentChild').length, 3);
});

test('single-parent ancestry uses a family hub without inventing a spouse', () => {
  const graph = buildFamilyMindmapGraph([
    member(1, { generation: 1 }), member(2, { generation: 2, motherId: 1 }),
  ]);
  assert.equal(edgesOf(graph, 'spouse').length, 0);
  assert.equal(graph.nodes.filter(node => node.type === 'familyUnion').length, 1);
  assert.equal(edgesOf(graph, 'parentChild').length, 2);
});

test('generation ranks are ordered in both top-to-bottom and left-to-right layouts', () => {
  const people = [
    member(1, { generation: 1, spouseId: 2 }), member(2, { generation: 1, spouseId: 1 }),
    member(3, { generation: 2, fatherId: 1, motherId: 2, spouseId: 4 }), member(4, { generation: 2, spouseId: 3 }),
    member(5, { generation: 3, fatherId: 3, motherId: 4 }),
  ];
  const graph = buildFamilyMindmapGraph(people);
  for (const direction of ['TB', 'LR']) {
    const layout = layoutFamilyMindmapGraph(graph.nodes, graph.edges, direction);
    const positions = positionedMembers(layout);
    const cross = direction === 'TB' ? 'y' : 'x';
    assert.equal(positions.get(1)[cross], positions.get(2)[cross]);
    assert.equal(positions.get(3)[cross], positions.get(4)[cross]);
    assert.ok(positions.get(1)[cross] < positions.get(3)[cross]);
    assert.ok(positions.get(3)[cross] < positions.get(5)[cross]);
    const labels = layout.nodes.filter(node => node.type === 'generationLabel');
    assert.deepEqual(Array.from(labels, node => node.data.generation), [1, 2, 3]);
  }
  const tb = layoutFamilyMindmapGraph(graph.nodes, graph.edges, 'TB');
  const positions = positionedMembers(tb);
  const parentsCenter = ((positions.get(3).x + MEMBER_NODE_WIDTH / 2) + (positions.get(4).x + MEMBER_NODE_WIDTH / 2)) / 2;
  assert.equal(positions.get(5).x + MEMBER_NODE_WIDTH / 2, parentsCenter, 'grandchild family should stay centered beneath its parents');
});

test('horizontal relations are off by default and become one subtle dashed edge when enabled', () => {
  const people = [
    member(1, { horizontalRelations: [{ memberId: 2, relationType: 'Sibling' }] }),
    member(2, { horizontalRelations: [{ memberId: 1, relationType: 'sibling' }, { memberId: 1, relationType: 'cousin' }] }),
  ];
  assert.equal(edgesOf(buildFamilyMindmapGraph(people), 'horizontal').length, 0);
  const graph = buildFamilyMindmapGraph(people, { showHorizontalRelations: true });
  assert.equal(edgesOf(graph, 'horizontal').length, 1);
  assert.deepEqual(Array.from(edgesOf(graph, 'horizontal')[0].data.relationTypes), ['cousin', 'sibling']);
  assert.match(edgesOf(graph, 'horizontal')[0].className, /horizontal/);
});

test('duplicate spouse and parent records do not create duplicate relationship lines', () => {
  const graph = buildFamilyMindmapGraph([
    member(1, { spouseId: 2 }), member(2, { spouseId: 1 }),
    member(3, { fatherId: 1, motherId: 1 }),
  ]);
  assert.equal(edgesOf(graph, 'spouse').length, 1);
  assert.equal(edgesOf(graph, 'parentChild').length, 2);
  assert.equal(new Set(graph.edges.map(edge => edge.id)).size, graph.edges.length);
  assert.ok(graph.edges.every(edge => edge.source !== edge.target));
});

test('filtered/missing parent and spouse references do not leave dangling edges', () => {
  const graph = buildFamilyMindmapGraph([
    member(1, { spouseId: 99 }), member(2, { generation: 2, fatherId: 1, motherId: 99 }),
  ]);
  const nodeIds = new Set(graph.nodes.map(node => node.id));
  assert.ok(graph.edges.every(edge => nodeIds.has(edge.source) && nodeIds.has(edge.target)));
  assert.equal(edgesOf(graph, 'spouse').length, 0);
  assert.equal(edgesOf(graph, 'parentChild').length, 2);
});

test('multiple spouse paths and 200 members layout without throwing or overlapping cards within a generation', () => {
  const people = Array.from({ length: 200 }, (_, index) => {
    const id = index + 1;
    return member(id, {
      generation: Math.floor(index / 40) + 1,
      spouseId: id % 2 === 1 && id < 40 ? id + 1 : id % 2 === 0 && id < 40 ? id - 1 : undefined,
      fatherId: id > 40 ? Math.floor((id - 1) / 2) : undefined,
      motherId: id > 40 ? Math.floor((id - 1) / 2) + 1 : undefined,
    });
  });
  people[0].spouseId = 3;
  people[2].spouseId = 1;
  const graph = buildFamilyMindmapGraph(people);
  assert.doesNotThrow(() => layoutFamilyMindmapGraph(graph.nodes, graph.edges, 'TB'));
  const layout = layoutFamilyMindmapGraph(graph.nodes, graph.edges, 'TB');
  assert.equal(layout.nodes.filter(node => node.type === 'member').length, 200);
  assert.ok(layout.nodes.every(node => Number.isFinite(node.position.x) && Number.isFinite(node.position.y)));
  const rows = new Map();
  for (const [id, position] of positionedMembers(layout)) {
    const row = rows.get(position.y) ?? [];
    row.push({ id, x: position.x });
    rows.set(position.y, row);
  }
  for (const row of rows.values()) {
    row.sort((a, b) => a.x - b.x);
    for (let index = 1; index < row.length; index++) {
      assert.ok(row[index - 1].x + MEMBER_NODE_WIDTH <= row[index].x, 'same-generation cards must not overlap');
    }
  }
  assert.equal(MEMBER_NODE_HEIGHT, 136);
});
