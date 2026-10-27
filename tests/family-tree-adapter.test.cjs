const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const source = readFileSync(join(__dirname, '../src/features/admin/components/family-tree/familyTreeAdapter.ts'), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
const moduleExports = {};
new vm.Script(outputText).runInNewContext({ exports: moduleExports });
const { adaptFamilyMembers, buildFamilyTreeIndex, chooseInitialFocus, getVisibleFamilyMembers, getHiddenDescendantCount, getRelatedFamilyMemberIds } = moduleExports;

const person = (id, props = {}) => ({ id, fullName: `Member ${id}`, generation: 1, createdAt: '', updatedAt: '', ...props });

test('adapter preserves source relationships and discards self or dangling references', () => {
  const people = [
    person(1, { fatherId: 1, motherId: 99, spouseId: 2, childIds: [1, 3, 3, 99], avatarUrl: '/avatar.png', role: 'Ông', lifeStatus: 'DECEASED', deathDate: '2011-01-01' }),
    person(2, { spouseId: 1 }), person(3, { fatherId: 1, motherId: 2, generation: 2 }),
  ];
  const adapted = adaptFamilyMembers(people);
  assert.equal(adapted[0].fatherId, undefined);
  assert.equal(adapted[0].motherId, undefined);
  assert.equal(adapted[0].spouseId, 2);
  assert.deepEqual(Array.from(adapted[0].childIds), [3]);
  assert.equal(adapted[0].avatar, '/avatar.png');
  assert.equal(adapted[0].lifeStatus, 'DECEASED');
  assert.equal(adapted[0].deathDate, '2011-01-01');
  assert.equal(adapted[2].fatherId, 1);
  assert.equal(adapted[2].motherId, 2);
});

test('default focus selection is stable and chooses the latest generation', () => {
  const people = [person(9, { generation: 1 }), person(7, { generation: 3 }), person(2, { generation: 3 })];
  assert.equal(chooseInitialFocus(adaptFamilyMembers(people)), 2);
  assert.equal(chooseInitialFocus([]), null);
});

test('focused family context is the default at every size; explicit overview shows all members', () => {
  const people = Array.from({ length: 5 }, (_, index) => person(index + 1));
  assert.equal(getVisibleFamilyMembers(people, 1, new Set()).length, 1);
  const large = Array.from({ length: 20 }, (_, index) => person(index + 1));
  assert.equal(getVisibleFamilyMembers(large, 1, new Set(), true).length, large.length);
});

test('medium family view reveals one nearby descendant generation and keeps deeper descendants collapsed', () => {
  const people = [
    person(1, { generation: 1, spouseId: 2 }), person(2, { generation: 1, spouseId: 1 }),
    person(3, { generation: 2, fatherId: 1, motherId: 2, childIds: [5, 6] }),
    person(4, { generation: 2, fatherId: 1, motherId: 2, spouseId: 7 }),
    person(5, { generation: 3, fatherId: 3 }), person(6, { generation: 3, motherId: 3 }),
    person(7, { generation: 2, spouseId: 4 }),
    person(8, { generation: 4, fatherId: 5 }),
    ...Array.from({ length: 12 }, (_, index) => person(index + 9, { generation: 4 })),
    person(21, { generation: 5, fatherId: 8 }),
  ];
  const index = buildFamilyTreeIndex(people);
  const visible = getVisibleFamilyMembers(people, 3, new Set(), false, index);
  const ids = new Set(visible.map(member => member.id));
  assert.ok([1, 2, 3, 4, 5, 6].every(id => ids.has(id)), 'focus, parents, sibling and children provide context');
  assert.ok(ids.has(8), 'one nearby descendant generation is available in a medium tree');
  assert.ok(!ids.has(21), 'deeper descendants stay collapsed');
  assert.equal(getHiddenDescendantCount(people[2], index, ids), 1, 'hidden descendants are counted');
  const expanded = getVisibleFamilyMembers(people, 3, new Set([8]), false, index);
  assert.ok(expanded.some(member => member.id === 21), 'expanding a child reveals its next descendant generation');
});

test('small trees can reveal the focused descendant branch without showing unrelated members', () => {
  const people = [
    person(1, { generation: 1, childIds: [2] }), person(2, { generation: 2, fatherId: 1, childIds: [3] }),
    person(3, { generation: 3, fatherId: 2 }), person(4, { generation: 1 }), person(5, { generation: 2 }),
  ];
  const visible = new Set(getVisibleFamilyMembers(people, 1, new Set()).map(member => member.id));
  assert.deepEqual(Array.from(visible).sort((a, b) => a - b), [1, 2, 3]);
});

test('large trees keep the focused branch compact until the user expands deeper relatives', () => {
  const people = Array.from({ length: 36 }, (_, index) => {
    const id = index + 1;
    return person(id, { generation: id, fatherId: id > 1 ? id - 1 : undefined, childIds: id < 36 ? [id + 1] : [] });
  });
  const visible = new Set(getVisibleFamilyMembers(people, 1, new Set()).map(member => member.id));
  assert.ok(visible.has(2));
  assert.ok(!visible.has(3));
  const expanded = new Set(getVisibleFamilyMembers(people, 1, new Set([2])).map(member => member.id));
  assert.ok(expanded.has(3));
  assert.ok(!expanded.has(4));
});

test('large sibling groups reveal a focused neighborhood and keep the rest behind the parent branch control', () => {
  const people = [person(1, { generation: 1, childIds: Array.from({ length: 40 }, (_, index) => index + 2) })];
  people.push(...Array.from({ length: 40 }, (_, index) => person(index + 2, { generation: 2, fatherId: 1 })));
  const visible = getVisibleFamilyMembers(people, 2, new Set());
  const visibleIds = new Set(visible.map(member => member.id));
  const visibleSiblings = people.slice(1).filter(member => visibleIds.has(member.id));
  assert.equal(visibleSiblings.length, 12);
  assert.ok(getHiddenDescendantCount(people[0], buildFamilyTreeIndex(people), visibleIds) > 0);
  const expanded = getVisibleFamilyMembers(people, 2, new Set([1]));
  assert.equal(expanded.length, people.length);
});

test('hover focus highlights actual parents, spouse and children without lighting siblings or other branches', () => {
  const people = [
    person(1, { generation: 1 }), person(2, { generation: 1 }),
    person(3, { generation: 2, fatherId: 1, motherId: 2 }), person(4, { generation: 2, fatherId: 1, motherId: 2 }),
    person(5, { generation: 3, fatherId: 3, motherId: 4, spouseId: 12, childIds: [8] }),
    person(6, { generation: 3, fatherId: 3, motherId: 4, spouseId: 7 }), person(7, { generation: 3, spouseId: 6 }),
    person(8, { generation: 4, fatherId: 5, motherId: 12, spouseId: 9 }), person(9, { generation: 4, spouseId: 8 }), person(10),
    person(11, { horizontalRelations: [{ memberId: 5, relationType: 'cousin' }] }),
    person(12, { generation: 3, spouseId: 5 }),
  ];
  const focused = getRelatedFamilyMemberIds(people, 5);
  for (const id of [3, 4, 5, 8, 12]) assert.ok(focused.has(id), `member ${id} is a direct household relation`);
  for (const id of [1, 2, 6, 7, 9, 10, 11]) assert.ok(!focused.has(id), `member ${id} is outside the direct household highlight`);
  assert.ok(getRelatedFamilyMemberIds(people, 12).has(8), 'hovering either spouse highlights their child');
  assert.ok(!getRelatedFamilyMemberIds(people, 12).has(6), 'hovering a spouse does not brighten a sibling');
  assert.ok(getRelatedFamilyMemberIds(people, 5, true).has(11));
});
