const { test } = require('node:test');
const assert = require('node:assert/strict');
const { join } = require('node:path');
const { loadTreeModule } = require('./helpers/load-tree-module.cjs');
const base = join(__dirname, '../src/features/admin/components/family-tree');
const { buildFamilyRelationshipGraph, getAncestralLineageHighlight, getFamilyRenderSegments, getBranchSemanticEdgeIds } = loadTreeModule(join(base, 'familyTreeHighlight.ts'));
const renderers = [loadTreeModule(join(base, 'family-view/familyTreeLayout.ts')).layoutFamilyView, loadTreeModule(join(base, 'shadcnFamilyTreeLayout.ts')).layoutShadcnFamilyTree];
const person = (id, generation, extra = {}) => ({ id, fullName: `Member ${id}`, generation, createdAt: '', updatedAt: '', ...extra });
const fixture = () => [
  person(1, 1, { spouseId: 2 }), person(2, 1),
  person(3, 2, { fatherId: 1, motherId: 2, spouseId: 4 }), person(4, 2), person(5, 2),
  person(6, 3, { fatherId: 3, motherId: 4, spouseId: 10 }), // selected
  person(7, 3, { fatherId: 3, motherId: 4, spouseId: 11 }), // same two parents
  person(8, 3, { fatherId: 3, motherId: 5 }), // one shared, known different second parent
  person(9, 3, { fatherId: 3 }), // one known parent, unknown completeness
  person(10, 3), person(11, 3),
  person(12, 4, { fatherId: 6, motherId: 10 }), // direct child
  person(13, 4, { fatherId: 7, motherId: 11 }), // sibling's child
  person(14, 5, { fatherId: 12 }), // grandchild
  person(15, 3), // disconnected
  person(16, 3, { fatherId: 5 }), // shares only the half-sibling's other parent
];
const ids = set => [...set].sort((a, b) => a - b);

test('ancestral focus includes every verified ancestor and biological sibling, excluding spouse and descendants', () => {
  const result = getAncestralLineageHighlight(buildFamilyRelationshipGraph(fixture()), 6);
  assert.equal(result.selectedNodeId, 6);
  assert.deepEqual(ids(result.highlightedNodeIds), [1, 2, 3, 4, 6, 7, 8, 9]);
  assert.deepEqual([...result.highlightedSemanticEdgeIds].sort(), [
    'parent:1:3', 'parent:2:3', 'parent:3:6', 'parent:4:6', 'parent:3:7', 'parent:4:7', 'parent:3:8', 'parent:3:9',
  ].sort());
  assert.equal(result.siblings.get(7), 'same-recorded-parents');
  assert.equal(result.siblings.get(8), 'different-recorded-parents');
  assert.equal(result.siblings.get(9), 'shared-parent-unknown');
  assert.ok(!result.siblings.has(6));
});

test('ancestral focus walks every recorded parent path and highlights shared-parent siblings only', () => {
  const members = fixture(); const graph = buildFamilyRelationshipGraph(members);
  const result = getAncestralLineageHighlight(graph, 6);
  assert.deepEqual(ids(result.highlightedNodeIds), [1, 2, 3, 4, 6, 7, 8, 9]);
  assert.deepEqual([...result.highlightedSemanticEdgeIds].sort(), [
    'parent:1:3', 'parent:2:3', 'parent:3:6', 'parent:4:6',
    'parent:3:7', 'parent:4:7', 'parent:3:8', 'parent:3:9',
  ].sort());
  assert.equal(result.siblings.get(7), 'same-recorded-parents');
  assert.equal(result.siblings.get(8), 'different-recorded-parents');
  assert.equal(result.siblings.get(9), 'shared-parent-unknown');
  for (const excluded of [5, 10, 11, 12, 13, 14, 15, 16]) assert.ok(!result.highlightedNodeIds.has(excluded), `does not include unrelated member ${excluded}`);
  for (const edge of ['parent:6:12', 'parent:7:13', 'parent:5:8', 'spouse:6:10']) assert.ok(!result.highlightedSemanticEdgeIds.has(edge));
});

test('ancestral focus handles disconnected roots, missing parents, cycles, and invalid selection', () => {
  const graph = buildFamilyRelationshipGraph([
    person(1, 1, { childIds: [2] }), person(2, 2, { fatherId: 1, motherId: 3 }),
    person(3, 1, { childIds: [2] }), person(4, 3, { fatherId: 4 }), person(5, 3),
  ]);
  const result = getAncestralLineageHighlight(graph, 2);
  assert.deepEqual(ids(result.highlightedNodeIds), [1, 2, 3]);
  assert.deepEqual([...result.highlightedSemanticEdgeIds].sort(), ['parent:1:2', 'parent:3:2']);
  assert.equal(getAncestralLineageHighlight(graph, 4).highlightedNodeIds.has(4), true);
  assert.equal(getAncestralLineageHighlight(graph, 999).highlightedNodeIds.size, 0);
  const missingParentGraph = buildFamilyRelationshipGraph([person(6, 3, { fatherId: 900 }), person(7, 3, { fatherId: 900 })]);
  const missingParentSiblings = getAncestralLineageHighlight(missingParentGraph, 6);
  assert.deepEqual(ids(missingParentSiblings.highlightedNodeIds), [6, 7]);
  assert.equal(missingParentSiblings.highlightedSemanticEdgeIds.size, 0, 'missing parent record creates no connector');
});

test('reverse child IDs can trace an ancestor, but spouses do not enter ancestry or sibling focus', () => {
  const members = [person(1, 1, { childIds: [3, 4, 999, 1] }), person(2, 1), person(3, 2), person(4, 2), person(5, 2, { spouseId: 3 }), person(6, 2, { spouseId: 3 })];
  const result = getAncestralLineageHighlight(buildFamilyRelationshipGraph(members), 3);
  assert.deepEqual(ids(result.highlightedNodeIds), [1, 3]);
  assert.equal(result.siblings.size, 0);
});

test('missing parents, disconnected members, self and dangling IDs do not fabricate relationships', () => {
  const graph = buildFamilyRelationshipGraph([person(1, 1, { fatherId: 1, motherId: 999, spouseId: 999 }), person(2, 1)]);
  assert.deepEqual(ids(getAncestralLineageHighlight(graph, 1).highlightedNodeIds), [1]);
  for (const id of [null, 999]) {
    const result = getAncestralLineageHighlight(graph, id);
    assert.equal(result.selectedNodeId, null);
    assert.equal(result.highlightedNodeIds.size, 0);
    assert.equal(result.highlightedSemanticEdgeIds.size, 0);
    assert.equal(result.highlightedRenderSegmentIds.size, 0);
  }
});

test('generation, role, names and horizontal cousin/sibling labels do not establish shared parentage', () => {
  const members = [person(1, 1, { horizontalRelations: [{ memberId: 2, relationType: 'sibling' }] }), person(2, 1)];
  assert.deepEqual(ids(getAncestralLineageHighlight(buildFamilyRelationshipGraph(members), 1).highlightedNodeIds), [1]);
});

test('known sibling parent IDs confirm siblings; horizontal sibling labels alone do not include cousins', () => {
  const members = [
    person(1, 1), person(2, 1), person(3, 2, { fatherId: 1, motherId: 2 }),
    person(4, 2, { fatherId: 1, motherId: 2 }), person(5, 2, { fatherId: 1, motherId: 2 }), person(6, 2),
    person(7, 3, { fatherId: 5, motherId: 6 }), person(8, 3, { fatherId: 5, motherId: 6 }),
    person(9, 3, { fatherId: 3 }), person(10, 3, { fatherId: 3 }),
    person(11, 3, { fatherId: 4, motherId: 5, horizontalRelations: [{ memberId: 9, relationType: 'Sibling' }] }),
  ];
  const result = getAncestralLineageHighlight(buildFamilyRelationshipGraph(members), 9);
  assert.deepEqual(ids(result.highlightedNodeIds), [1, 2, 3, 9, 10]);
  assert.equal(result.siblings.get(10), 'shared-parent-unknown');
  assert.ok(!result.siblings.has(11));
  for (const cousinId of [4, 5, 6, 7, 8, 11]) assert.ok(!result.highlightedNodeIds.has(cousinId));
});

test('actual family fixture keeps named cousin branches out of the selected lineage', () => {
  const members = [
    person(1, 1, { fullName: 'Mai Thu', childIds: [3, 4, 5], spouseId: 2 }), person(2, 1, { fullName: 'Nguyễn Bửu', childIds: [3] }),
    person(3, 2, { fullName: 'Nguyễn Mai Anh', fatherId: 1, motherId: 2, childIds: [9, 10] }),
    person(4, 2, { fullName: 'Nguyễn Mai Sơn', fatherId: 1, motherId: 2 }),
    person(5, 2, { fullName: 'Nguyễn Mai Hồng Sơn', fatherId: 1, motherId: 2, spouseId: 6, childIds: [7, 8] }),
    person(6, 2, { fullName: 'Nguyễn Thị Hồng Nhung', childIds: [7, 8] }),
    person(7, 3, { fullName: 'Nguyễn Hoàng Minh', fatherId: 5, motherId: 6 }),
    person(8, 3, { fullName: 'Nguyễn Hoàng Anh', fatherId: 5, motherId: 6 }),
    person(9, 3, { fullName: 'Nguyễn Huỳnh Minh Đức', fatherId: 3 }),
    person(10, 3, { fullName: 'Nguyễn Huỳnh Quốc Bảo', fatherId: 3 }),
    person(11, 3, { fullName: 'Nguyễn Sơn Tùng', fatherId: 4, motherId: 5, horizontalRelations: [{ memberId: 9, relationType: 'Sibling' }] }),
    person(12, 3, { fullName: 'Nguyễn Hoàng Yến', fatherId: 5, motherId: 6 }),
  ];
  const result = getAncestralLineageHighlight(buildFamilyRelationshipGraph(members), 9);
  assert.deepEqual(ids(result.highlightedNodeIds), [1, 2, 3, 9, 10]);
  assert.deepEqual([...result.highlightedSemanticEdgeIds].sort(), ['parent:1:3', 'parent:2:3', 'parent:3:10', 'parent:3:9']);
  for (const cousinId of [4, 5, 6, 7, 8, 11, 12]) assert.ok(!result.highlightedNodeIds.has(cousinId), `cousin branch ${cousinId} remains inactive`);
});

for (const layout of renderers) {
  test(`${layout.name}: generation filtering retains sibling evidence from the complete graph`, () => {
    const members = fixture();
    const filtered = members.filter(member => member.generation === 3);
    const highlight = getAncestralLineageHighlight(buildFamilyRelationshipGraph(members), 6, layout(filtered).links);
    assert.ok(highlight.highlightedNodeIds.has(7));
    assert.ok(highlight.highlightedNodeIds.has(8));
    assert.ok(highlight.highlightedNodeIds.has(9));
    assert.ok(!highlight.highlightedNodeIds.has(15));
    assert.equal(highlight.highlightedRenderSegmentIds.size, 0, 'hidden parent connectors are not fabricated');
  });

  test(`${layout.name}: every active segment belongs to an explicitly included semantic relationship`, () => {
    const members = fixture(); const graph = buildFamilyRelationshipGraph(members); const { links } = layout(members);
    const segments = links.flatMap(getFamilyRenderSegments);
    assert.equal(new Set(segments.map(s => s.id)).size, segments.length);
    for (const member of members) {
      const highlight = getAncestralLineageHighlight(graph, member.id, links);
      const active = segments.filter(s => highlight.highlightedRenderSegmentIds.has(s.id));
      for (const edge of highlight.highlightedSemanticEdgeIds) {
        assert.ok(active.some(s => s.semanticEdgeIds.includes(edge)), `rendered route exists for ${edge}`);
      }
      for (const segment of segments) assert.equal(highlight.highlightedRenderSegmentIds.has(segment.id), segment.semanticEdgeIds.some(id => highlight.highlightedSemanticEdgeIds.has(id)));
    }
    const selected = getAncestralLineageHighlight(graph, 6, links);
    for (const segment of segments.filter(s => selected.highlightedRenderSegmentIds.has(s.id))) {
      assert.ok(!segment.semanticEdgeIds.every(id => ['parent:5:8', 'parent:4:16', 'parent:5:16', 'parent:7:13', 'parent:12:14', 'spouse:3:4', 'spouse:7:11'].includes(id)), segment.id);
    }
    const halfSiblingGroup = links.find(link => link.kind === 'family' && link.sourceMemberIds.includes(5) && link.targetMemberIds.includes(8));
    assert.ok(halfSiblingGroup.segments.filter(s => s.id.includes('parent-5')).every(s => !selected.highlightedRenderSegmentIds.has(s.id)), 'unrelated co-parent port remains dim');
    const unrelatedDrop = links.find(link => link.kind === 'family-child' && link.targetMemberIds.includes(16));
    assert.ok(unrelatedDrop.segments.every(s => !selected.highlightedRenderSegmentIds.has(s.id)), 'shared half-sibling junction does not activate unrelated drop');
    const activeFamilyRail = halfSiblingGroup.segments.filter(s => s.id.includes('child-rail') && selected.highlightedRenderSegmentIds.has(s.id));
    assert.ok(activeFamilyRail.every(s => s.semanticEdgeIds.includes('parent:3:8')));
  });

  test(`${layout.name}: selected ancestry activates no descendant, spouse, or cousin routes`, () => {
    const members = fixture(); const graph = buildFamilyRelationshipGraph(members); const { links } = layout(members);
    const highlight = getAncestralLineageHighlight(graph, 6, links);
    assert.ok(highlight.highlightedNodeIds.has(1));
    assert.ok(highlight.highlightedNodeIds.has(2));
    assert.ok(highlight.highlightedNodeIds.has(7));
    assert.ok(!highlight.highlightedNodeIds.has(12));
    assert.ok(!highlight.highlightedNodeIds.has(13));
    assert.ok(!highlight.highlightedNodeIds.has(10));
    assert.ok(!highlight.highlightedNodeIds.has(15));
    assert.ok(!highlight.highlightedSemanticEdgeIds.has('parent:6:12'));
    assert.ok(!highlight.highlightedSemanticEdgeIds.has('parent:7:13'));
    assert.ok(!highlight.highlightedSemanticEdgeIds.has('spouse:6:10'));
  });

  test(`${layout.name}: selection switches and clearing do not retain previous edges or mutate geometry`, () => {
    const members = fixture(); const before = JSON.stringify(members); const graph = buildFamilyRelationshipGraph(members); const { links } = layout(members); const paths = JSON.stringify(links);
    const first = getAncestralLineageHighlight(graph, 6, links);
    for (let i = 0; i < 100; i++) {
      const next = getAncestralLineageHighlight(graph, i % 2 ? 6 : 15, links);
      if (i % 2 === 0) assert.equal(next.highlightedRenderSegmentIds.size, 0);
    }
    assert.equal(first.highlightedNodeIds.has(12), false);
    assert.equal(getAncestralLineageHighlight(graph, null, links).highlightedRenderSegmentIds.size, 0);
    assert.equal(JSON.stringify(links), paths);
    assert.equal(JSON.stringify(members), before);
    const branchEdges = getBranchSemanticEdgeIds(graph, new Set(members.map(m => m.id)));
    assert.ok(branchEdges.has('parent:12:14'), 'explicit branch mode can include grandchildren');
    assert.ok(!first.highlightedSemanticEdgeIds.has('parent:12:14'));
  });

  test(`${layout.name}: each semantic parent-child route is continuous from its parent to its own child`, () => {
    const members = fixture(); const result = layout(members); const byId = new Map(result.nodes.map(node => [node.member.id, node]));
    const allSegments = result.links.flatMap(getFamilyRenderSegments);
    const graph = buildFamilyRelationshipGraph(members);
    for (const [childId, parents] of graph.parentsByChild) for (const parentId of parents) {
      const edgeId = `parent:${parentId}:${childId}`;
      const route = allSegments.filter(segment => segment.semanticEdgeIds.includes(edgeId));
      const adjacency = new Map();
      const add = (from, to) => adjacency.set(from, [...(adjacency.get(from) ?? []), to]);
      for (const segment of route) {
        const [x1, y1, x2, y2] = segment.path.match(/-?\d+(?:\.\d+)?/g).map(Number);
        const a = `${x1},${y1}`, b = `${x2},${y2}`; add(a, b); add(b, a);
      }
      const parent = byId.get(parentId), child = byId.get(childId);
      const start = `${parent.x + parent.width / 2},${parent.y + parent.height}`;
      const end = `${child.x + child.width / 2},${child.y}`;
      const visited = new Set(), queue = [start];
      while (queue.length) { const point = queue.pop(); if (visited.has(point)) continue; visited.add(point); queue.push(...(adjacency.get(point) ?? [])); }
      assert.ok(visited.has(end), `${edgeId} reaches its actual child`);
      assert.equal(visited.size, adjacency.size, `${edgeId} has no disconnected bright pieces`);
      assert.equal([...adjacency.values()].filter(neighbors => neighbors.length === 1).length, 2, `${edgeId} has no extraneous branches`);
    }
  });
}

test('shared rail is split at relevant junctions and unrelated extensions remain inactive', () => {
  const { buildParentChildLinks } = loadTreeModule(join(base, 'familyTreeConnectors.ts'));
  const node = (id, x, y) => ({ member: person(id, y ? 2 : 1), x, y, width: 100, height: 50, generation: y ? 2 : 1 });
  const links = buildParentChildLinks('test', [node(1, 150, 0), node(2, 250, 0)], [node(3, 0, 200), node(4, 200, 200), node(5, 400, 200)]);
  const highlight = new Set(['parent:1:4']);
  const segments = links.flatMap(getFamilyRenderSegments);
  const active = segments.filter(s => s.semanticEdgeIds.some(id => highlight.has(id)));
  assert.ok(active.some(s => s.id.endsWith('trunk')));
  assert.ok(!active.some(s => s.id.endsWith('parent-2')));
  assert.ok(!active.some(s => s.id.endsWith('-3') || s.id.endsWith('-5')));
  const rails = active.filter(s => s.id.includes('child-rail'));
  assert.equal(rails.length, 0, 'middle child is at sourceX: neither horizontal extension is needed');
});
