const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const source = readFileSync(join(__dirname, '../src/features/admin/components/family-tree/shadcnFamilyTreeLayout.ts'), 'utf8');
const familyLayout = {};
const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
new vm.Script(output).runInNewContext({ exports: familyLayout, require: () => ({}) });

const person = (id, fullName, generation, values = {}) => ({ id, fullName, generation, createdAt: '', updatedAt: '', ...values });
const center = node => node.x + node.width / 2;
const nodeFor = (layout, id) => layout.nodes.find(node => node.member.id === id);

function maiAnhMaiSonFixture() {
  return [
    person(1, 'Mai Thu', 1, { spouseId: 2 }), person(2, 'Nguyen Buu', 1),
    person(3, 'Nguyen Mai Anh', 2, { fatherId: 1, motherId: 2 }),
    person(4, 'Nguyen Mai Son', 2, { fatherId: 1, motherId: 2 }),
    person(5, 'Nguyen Huynh Minh Duc', 3, { fatherId: 3 }),
    person(6, 'Nguyen Huynh Quoc Bao', 3, { fatherId: 3 }),
    person(7, 'Nguyen Son Tung', 3, { fatherId: 4 }),
    person(8, 'Nguyen Hoang Yen', 3, { fatherId: 4 }),
  ];
}

test('Mai Anh and Mai Son child groups stay centered as fairly as collision allows with continuous parent rails', () => {
  const result = familyLayout.layoutShadcnFamilyTree(maiAnhMaiSonFixture());
  for (const [parentId, childIds] of [[3, [5, 6]], [4, [7, 8]]]) {
    const parentX = center(nodeFor(result, parentId));
    const childCenters = childIds.map(id => center(nodeFor(result, id)));
    const childGroupCenter = (Math.min(...childCenters) + Math.max(...childCenters)) / 2;
    assert.ok(Math.abs(parentX - childGroupCenter) <= 165, `parent ${parentId} displacement stays shared under adjacent-family pressure`);
    const familyLink = result.links.find(link => link.id.startsWith(`family-${parentId}:`));
    assert.ok(familyLink, `family connector exists for parent ${parentId}`);
    assert.equal((familyLink.path.match(/M /g) ?? []).length, 1, 'family trunk and sibling rail use one continuous path');
    assert.ok(!familyLink.path.includes('NaN'));
    const commands = familyLink.path.match(/[ML] [-\d.]+ [-\d.]+/g).map(command => command.slice(2).split(' ').map(Number));
    assert.deepEqual(commands[0], [parentX, nodeFor(result, parentId).y + nodeFor(result, parentId).height]);
    assert.equal(commands[1][0], commands[0][0], 'trunk connects vertically to junction');
    const childTop = nodeFor(result, childIds[0]).y;
    const parentBottom = nodeFor(result, parentId).y + nodeFor(result, parentId).height;
    assert.equal(commands[1][1], parentBottom + (childTop - parentBottom) * .5, 'trunk reaches the midpoint rail between generations');
    assert.equal(commands.at(-1)[1], commands[1][1], 'junction reaches sibling rail at rail height');
    for (const childId of childIds) {
      const drop = result.links.find(link => link.id.startsWith(`family-child-${parentId}:`) && link.id.endsWith(`-${childId}`));
      assert.ok(drop, `child ${childId} has a drop`);
      assert.deepEqual(Array.from(drop.memberIds).sort((a, b) => a - b), [parentId, ...childIds].sort((a, b) => a - b), 'all family drops share highlight state with the parent rail');
      assert.match(drop.path, new RegExp(`^M ${center(nodeFor(result, childId))} ${commands[1][1]} L ${center(nodeFor(result, childId))} ${nodeFor(result, childId).y}$`));
    }
  }

  for (const generation of [1, 2, 3]) {
    const row = result.nodes.filter(node => node.generation === generation).sort((a, b) => a.x - b.x);
    assert.equal(new Set(row.map(node => node.y)).size, 1, `generation ${generation} stays on one lane`);
    assert.ok(row.slice(1).every((node, index) => row[index].x + row[index].width <= node.x), `generation ${generation} has no card collisions`);
  }
  const generationThree = result.nodes.filter(node => node.generation === 3).sort((a, b) => a.x - b.x);
  assert.ok(generationThree[2].x - (generationThree[1].x + generationThree[1].width) >= 84, 'unrelated sibling rails have a family gap');
});

test('couple union uses spouse midpoint for one shared sibling rail', () => {
  const result = familyLayout.layoutShadcnFamilyTree([
    person(10, 'Hong Son', 1, { spouseId: 11 }), person(11, 'Hong Nhung', 1),
    person(12, 'Hoang Minh', 2, { fatherId: 10, motherId: 11 }),
    person(13, 'Hoang Anh', 2, { fatherId: 10, motherId: 11 }),
  ]);
  const parentA = nodeFor(result, 10); const parentB = nodeFor(result, 11);
  const childNodes = [nodeFor(result, 12), nodeFor(result, 13)];
  const coupleMidpoint = (center(parentA) + center(parentB)) / 2;
  const childGroupCenter = (center(childNodes[0]) + center(childNodes[1])) / 2;
  assert.ok(Math.abs(coupleMidpoint - childGroupCenter) < 1);
  const family = result.links.find(link => link.id.startsWith('family-10:11:'));
  assert.equal((family.path.match(/M /g) ?? []).length, 1);
  assert.equal(result.links.filter(link => link.id.startsWith('family-child-10:11:')).length, 2);
  const spouse = result.links.find(link => link.kind === 'spouse' && link.memberIds.includes(10));
  const source = family.path.match(/^M ([-\d.]+) ([-\d.]+)/);
  assert.deepEqual(source.slice(1).map(Number), [spouse.labelX, spouse.labelY], 'family trunk starts exactly at heart center');
});

test('three children share one couple rail with three drops', () => {
  const result = familyLayout.layoutShadcnFamilyTree([
    person(20, 'Mai Thu', 1, { spouseId: 21 }), person(21, 'Nguyen Buu', 1),
    person(22, 'Mai Anh', 2, { fatherId: 20, motherId: 21 }),
    person(23, 'Mai Son', 2, { fatherId: 20, motherId: 21 }),
    person(24, 'Hong Son', 2, { fatherId: 20, motherId: 21 }),
  ]);
  const family = result.links.find(link => link.id.startsWith('family-20:21:'));
  assert.ok(family);
  assert.equal((family.path.match(/M /g) ?? []).length, 1);
  assert.equal(result.links.filter(link => link.id.startsWith('family-child-20:21:')).length, 3);
  assert.equal(new Set(result.links.filter(link => link.id.startsWith('family-child-20:21:')).map(link => link.path.split(' ')[1])).size, 3);
});

test('row collision pooling distributes pressure, respects gaps, and stays deterministic', () => {
  const groups = [
    { key: 'a', width: 504, target: 0 },
    { key: 'b', width: 504, target: 272 },
    { key: 'c', width: 504, target: 544 },
  ];
  const first = familyLayout.resolveRowGroupPositions(groups, 84);
  const second = familyLayout.resolveRowGroupPositions(groups, 84);
  assert.deepEqual(first, second);
  assert.ok(Math.abs(first[1] - 20) < 1, 'middle family retains its ideal start when pressure is symmetric');
  assert.ok(first[1] > first[0] && first[2] > first[1]);
  for (let index = 1; index < first.length; index++) assert.ok(first[index] - (first[index - 1] + groups[index - 1].width) >= 84 - .01);
  const movement = first.map((start, index) => Math.abs(start - (groups[index].target - groups[index].width / 2)));
  assert.ok(Math.abs(movement[0] - movement[2]) < 1, 'outer family groups share symmetric collision pressure');
  assert.ok(movement.every(value => value < 320), 'collision does not push a later group arbitrarily far right');
});

test('connector geometry remains attached when parent anchor falls outside the child rail', () => {
  const geometry = familyLayout.buildFamilyConnectorGeometry(-20, 10, 100, [80, 180]);
  assert.ok(geometry);
  assert.equal(geometry.railLeft, 80);
  assert.equal(geometry.railRight, 180);
  assert.equal(geometry.junctionX, 80);
  assert.equal((geometry.path.match(/M /g) ?? []).length, 1);
  assert.equal(geometry.path, 'M -20 10 L -20 100 L 80 100 L 180 100');
  assert.equal(familyLayout.buildFamilyConnectorGeometry(2, 4, 8, []), null);
});

test('connector geometry draws the complete sibling rail when source is inside child range', () => {
  const geometry = familyLayout.buildFamilyConnectorGeometry(100, 10, 50, [40, 100, 160]);
  assert.equal(geometry.path, 'M 100 10 L 100 50 L 40 50 L 160 50');
  assert.equal(geometry.railLeft, 40);
  assert.equal(geometry.railRight, 160);
});

test('union anchor uses a registered couple midpoint and never averages unrelated parents', () => {
  const parents = [{ id: 2, x: 400, width: 232 }, { id: 1, x: 0, width: 232 }];
  assert.equal(familyLayout.getUnionAnchorX(parents, new Set(['1:2'])), 316);
  assert.equal(familyLayout.getUnionAnchorX(parents, new Set()), 116, 'unrelated parent nodes do not shift the anchor away from either parent');
});

test('two parents and three children share one trunk, sibling rail and one drop per child', () => {
  const result = familyLayout.layoutShadcnFamilyTree([
    person(30, 'Parent A', 1, { spouseId: 31 }), person(31, 'Parent B', 1),
    person(32, 'Child A', 2, { fatherId: 30, motherId: 31 }),
    person(33, 'Child B', 2, { fatherId: 30, motherId: 31 }),
    person(34, 'Child C', 2, { fatherId: 30, motherId: 31 }),
  ]);
  assert.equal(result.links.filter(link => link.id.startsWith('family-30:31:')).length, 1);
  assert.equal(result.links.filter(link => link.id.startsWith('family-child-30:31:')).length, 3);
  const trunkPath = result.links.find(link => link.id.startsWith('family-30:31:')).path;
  const railY = Number(trunkPath.match(/L [-\d.]+ ([-\d.]+) L [-\d.]+ \1/)[1]);
  assert.equal(new Set(result.links.filter(link => link.id.startsWith('family-child-30:31:')).map(link => Number(link.path.match(/M [-\d.]+ ([-\d.]+)/)[1]))).size, 1);
  assert.equal(railY, Number(result.nodes.find(node => node.member.id === 30).y + 90 + (result.nodes.find(node => node.member.id === 32).y - (result.nodes.find(node => node.member.id === 30).y + 90)) * .5));
});

test('single-parent child is normalized into visible spouse union when non-conflicting', () => {
  const result = familyLayout.layoutShadcnFamilyTree([
    person(40, 'Father', 1, { spouseId: 41 }), person(41, 'Mother', 1),
    person(42, 'Child with one parent recorded', 2, { fatherId: 40 }),
    person(43, 'Child with both parents', 2, { fatherId: 40, motherId: 41 }),
  ]);
  const unions = result.links.filter(link => link.kind === 'family' && link.memberIds.includes(40));
  assert.equal(unions.length, 1);
  assert.deepEqual([...unions[0].memberIds].sort((a, b) => a - b), [40, 41, 42, 43]);
  assert.equal(result.links.filter(link => link.id.startsWith('family-child-40:41:')).length, 2);
});

test('conflicting explicit parent is not silently replaced by a spouse', () => {
  const result = familyLayout.layoutShadcnFamilyTree([
    person(50, 'Parent A', 1, { spouseId: 51 }), person(51, 'Spouse', 1), person(52, 'Other parent', 1),
    person(53, 'Child', 2, { fatherId: 50, motherId: 52 }),
  ]);
  const family = result.links.find(link => link.kind === 'family' && link.memberIds.includes(53));
  assert.ok(family);
  assert.ok(family.memberIds.includes(52));
  assert.ok(!family.memberIds.includes(51));
});

test('one-sided spouseId still aligns couple source to spouse connector midpoint', () => {
  const result = familyLayout.layoutShadcnFamilyTree([
    person(60, 'One-sided spouse link', 1, { spouseId: 61 }), person(61, 'No reverse spouse link', 1),
    person(62, 'Child', 2, { fatherId: 60, motherId: 61 }),
  ]);
  const spouse = result.links.find(link => link.kind === 'spouse');
  const family = result.links.find(link => link.kind === 'family' && link.memberIds.includes(62));
  assert.ok(spouse);
  assert.deepEqual(family.path.match(/^M ([-\d.]+) ([-\d.]+)/).slice(1).map(Number), [spouse.labelX, spouse.labelY]);
});

test('married child receives parent drop at household midpoint; descendant trunk starts at couple heart', () => {
  const result = familyLayout.layoutShadcnFamilyTree([
    person(70, 'Grandparent A', 1, { spouseId: 71 }), person(71, 'Grandparent B', 1),
    person(72, 'Biological child', 2, { fatherId: 70, motherId: 71, spouseId: 73 }), person(73, 'Child spouse', 2),
    person(74, 'Grandchild', 3, { fatherId: 72, motherId: 73 }),
  ]);
  const parentDrop = result.links.find(link => link.kind === 'family' && link.memberIds.includes(72) && link.memberIds.includes(70));
  assert.ok(parentDrop);
  const childHouseholdCenter = (center(nodeFor(result, 72)) + center(nodeFor(result, 73))) / 2;
  assert.match(parentDrop.path, new RegExp(`L ${childHouseholdCenter} ${nodeFor(result, 72).y}$`));
  const spouse = result.links.find(link => link.kind === 'spouse' && link.memberIds.includes(72));
  const descendantTrunk = result.links.find(link => link.kind === 'family' && link.memberIds.includes(74));
  assert.deepEqual(descendantTrunk.path.match(/^M ([-\d.]+) ([-\d.]+)/).slice(1).map(Number), [spouse.labelX, spouse.labelY]);
});

test('true single parent starts connector at bottom-center and multi-generation coordinates stay finite', () => {
  const result = familyLayout.layoutShadcnFamilyTree([
    person(80, 'Single parent', 1), person(81, 'Child', 2, { fatherId: 80 }), person(82, 'Grandchild', 3, { fatherId: 81 }),
  ]);
  const first = result.links.find(link => link.kind === 'family' && link.memberIds.includes(81));
  const parent = nodeFor(result, 80);
  assert.deepEqual(first.path.match(/^M ([-\d.]+) ([-\d.]+)/).slice(1).map(Number), [center(parent), parent.y + parent.height]);
  assert.ok(result.links.every(link => [...link.path.matchAll(/-?\d+(?:\.\d+)?/g)].every(match => Number.isFinite(Number(match[0])))));
  assert.equal(new Set(result.links.filter(link => link.kind === 'family').map(link => link.id)).size, result.links.filter(link => link.kind === 'family').length);
});
