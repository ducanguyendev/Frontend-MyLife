const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const dagre = require('dagre');

const source = readFileSync(join(__dirname, '../src/features/admin/components/family-tree/familyMindmapGraph.ts'), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: {
  module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true,
} });
const graphExports = {};
new vm.Script(outputText).runInNewContext({
  exports: graphExports,
  require(name) { if (name === 'dagre') return dagre; throw new Error(`Unexpected import ${name}`); },
});
const { buildFamilyMindmapGraph, layoutFamilyMindmapGraph, MEMBER_NODE_WIDTH, MEMBER_NODE_HEIGHT } = graphExports;

function member(id, values = {}) {
  return {
    id, fullName: `Member ${id}`, generation: 1, createdAt: '', updatedAt: '',
    ...values,
  };
}

function edgeByType(graph, type) {
  return graph.edges.filter(edge => edge.data?.relationType === type);
}

test('two parents share a virtual union branch while one parent-child edge remains per endpoint', () => {
  const people = [
    member(1, { generation: 1, spouseId: 2 }),
    member(2, { generation: 1, spouseId: 1 }),
    member(3, { generation: 2, fatherId: 1, motherId: 2 }),
    member(4, { generation: 2, fatherId: 1, motherId: 2 }),
  ];
  const graph = buildFamilyMindmapGraph(people);
  const unions = graph.nodes.filter(node => node.type === 'familyUnion');
  assert.equal(unions.length, 1);
  assert.deepEqual(Array.from(unions[0].data.childIds), [3, 4]);
  assert.equal(edgeByType(graph, 'spouse').length, 1);
  assert.equal(edgeByType(graph, 'parentChild').length, 4);
  assert.equal(new Set(graph.edges.map(edge => edge.id)).size, graph.edges.length);
  assert.ok(graph.edges.every(edge => edge.source !== edge.target));
});

test('one-sided and reciprocal spouse data render one undirected spouse edge', () => {
  for (const people of [
    [member(1, { spouseId: 2 }), member(2)],
    [member(1, { spouseId: 2 }), member(2, { spouseId: 1 })],
  ]) {
    const graph = buildFamilyMindmapGraph(people);
    const spouses = edgeByType(graph, 'spouse');
    assert.equal(spouses.length, 1);
    assert.equal(spouses[0].markerEnd, undefined);
    assert.equal(spouses[0].id, 'spouse-1:2');
  }
});

test('missing or filtered spouse and horizontal references do not create dangling edges', () => {
  const graph = buildFamilyMindmapGraph([
    member(1, { spouseId: 99, horizontalRelations: [{ memberId: 99, relationType: 'sibling' }] }),
  ]);
  assert.equal(graph.edges.length, 0);
  const ids = new Set(graph.nodes.map(node => node.id));
  assert.ok(graph.edges.every(edge => ids.has(edge.source) && ids.has(edge.target)));
});

test('reciprocal/multiple horizontal relationship records become one dashed edge', () => {
  const graph = buildFamilyMindmapGraph([
    member(1, { horizontalRelations: [
      { memberId: 2, relationType: ' Sibling ' },
      { memberId: 2, relationType: 'cousin' },
    ] }),
    member(2, { horizontalRelations: [{ memberId: 1, relationType: 'SIBLING' }] }),
  ]);
  const horizontal = edgeByType(graph, 'horizontal');
  assert.equal(horizontal.length, 1);
  assert.deepEqual(Array.from(horizontal[0].data.relationTypes), ['cousin', 'sibling']);
  assert.equal(horizontal[0].style.strokeDasharray, '6 5');
});

test('filtered co-parent falls back to the visible parent and unrelated members stay disconnected', () => {
  const graph = buildFamilyMindmapGraph([
    member(1, { generation: 1 }),
    member(3, { generation: 2, fatherId: 1, motherId: 2 }),
    member(4, { generation: 2 }),
  ]);
  const parentEdges = edgeByType(graph, 'parentChild');
  assert.equal(parentEdges.length, 1);
  assert.equal(parentEdges[0].source, '1');
  assert.equal(parentEdges[0].target, '3');
  assert.equal(edgeByType(graph, 'spouse').length, 0);
  const ids = new Set(graph.nodes.map(node => node.id));
  assert.ok(graph.edges.every(edge => ids.has(edge.source) && ids.has(edge.target)));
});

test('single parent is direct; no parent or relationship creates no edge', () => {
  const graph = buildFamilyMindmapGraph([
    member(1, { generation: 1 }),
    member(2, { generation: 2, motherId: 1 }),
    member(3, { generation: 2 }),
  ]);
  const parentEdges = edgeByType(graph, 'parentChild');
  assert.equal(parentEdges.length, 1);
  assert.equal(parentEdges[0].source, '1');
  assert.equal(parentEdges[0].target, '2');
});

test('vertical and horizontal layouts keep couples on a shared generation rank and children in later ranks', () => {
  const people = [
    member(1, { generation: 1, spouseId: 2 }),
    member(2, { generation: 1, spouseId: 1 }),
    member(3, { generation: 2, fatherId: 1, motherId: 2, spouseId: 4 }),
    member(4, { generation: 2, spouseId: 3 }),
    member(5, { generation: 3, fatherId: 3, motherId: 4 }),
    member(6, { generation: 4, fatherId: 5 }),
  ];
  const graph = buildFamilyMindmapGraph(people);
  const vertical = layoutFamilyMindmapGraph(graph.nodes, graph.edges, 'TB');
  const verticalById = new Map(vertical.nodes.filter(node => node.type === 'member').map(node => [node.id, node.position]));
  assert.equal(verticalById.get('1').y, verticalById.get('2').y);
  assert.equal(verticalById.get('3').y, verticalById.get('4').y);
  assert.ok(verticalById.get('3').y < verticalById.get('5').y);
  assert.ok(verticalById.get('5').y < verticalById.get('6').y);
  for (const edge of vertical.edges) assert.ok(vertical.nodes.some(node => node.id === edge.source) && vertical.nodes.some(node => node.id === edge.target));
  for (let i = 0; i < people.length; i++) {
    for (let j = i + 1; j < people.length; j++) {
      const first = verticalById.get(String(people[i].id));
      const second = verticalById.get(String(people[j].id));
      if (first.y === second.y) assert.ok(Math.abs(first.x - second.x) >= MEMBER_NODE_WIDTH, 'same-rank nodes must not overlap');
    }
  }

  const horizontal = layoutFamilyMindmapGraph(graph.nodes, graph.edges, 'LR');
  const horizontalById = new Map(horizontal.nodes.filter(node => node.type === 'member').map(node => [node.id, node.position]));
  assert.equal(horizontalById.get('1').x, horizontalById.get('2').x);
  assert.equal(horizontalById.get('3').x, horizontalById.get('4').x);
  assert.ok(horizontalById.get('3').x < horizontalById.get('5').x);
  assert.ok(horizontalById.get('5').x < horizontalById.get('6').x);
  assert.ok(horizontalById.get('1').y !== horizontalById.get('2').y);
});

test('spouse generation mismatch is visually aligned without changing member data', () => {
  const first = member(1, { generation: 2, spouseId: 2 });
  const second = member(2, { generation: 3, spouseId: 1 });
  const graph = buildFamilyMindmapGraph([first, second]);
  const layout = layoutFamilyMindmapGraph(graph.nodes, graph.edges, 'TB');
  const firstNode = layout.nodes.find(node => node.id === '1');
  const secondNode = layout.nodes.find(node => node.id === '2');
  assert.equal(firstNode.position.y, secondNode.position.y);
  assert.equal(first.generation, 2);
  assert.equal(second.generation, 3);
});
