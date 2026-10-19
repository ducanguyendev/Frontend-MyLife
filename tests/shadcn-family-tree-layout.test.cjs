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
    assert.equal(commands[1][1], nodeFor(result, childIds[0]).y - 30, 'trunk reaches rail height');
    assert.equal(commands.at(-1)[1], commands[1][1], 'junction reaches sibling rail at rail height');
    for (const childId of childIds) {
      const drop = result.links.find(link => link.id.startsWith(`family-child-${parentId}:`) && link.id.endsWith(`-${childId}`));
      assert.ok(drop, `child ${childId} has a drop`);
      assert.deepEqual(Array.from(drop.memberIds).sort((a, b) => a - b), [parentId, ...childIds].sort((a, b) => a - b), 'all family drops share highlight state with the parent rail');
      assert.match(drop.path, new RegExp(`^M ${center(nodeFor(result, childId))} ${nodeFor(result, childId).y - 30} L ${center(nodeFor(result, childId))} ${nodeFor(result, childId).y}$`));
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

test('union anchor uses a registered couple midpoint and never averages unrelated parents', () => {
  const parents = [{ id: 2, x: 400, width: 232 }, { id: 1, x: 0, width: 232 }];
  assert.equal(familyLayout.getUnionAnchorX(parents, new Set(['1:2'])), 316);
  assert.equal(familyLayout.getUnionAnchorX(parents, new Set()), 116, 'unrelated parent nodes do not shift the anchor away from either parent');
});
