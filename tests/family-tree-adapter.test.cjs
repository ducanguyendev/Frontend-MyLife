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

test('large family view starts at focus context and expands descendants by one branch level', () => {
  const people = [
    person(1, { generation: 1, spouseId: 2 }), person(2, { generation: 1, spouseId: 1 }),
    person(3, { generation: 2, fatherId: 1, motherId: 2, childIds: [5, 6] }),
    person(4, { generation: 2, fatherId: 1, motherId: 2, spouseId: 7 }),
    person(5, { generation: 3, fatherId: 3 }), person(6, { generation: 3, motherId: 3 }),
    person(7, { generation: 2, spouseId: 4 }),
    person(8, { generation: 4, fatherId: 5 }),
    ...Array.from({ length: 12 }, (_, index) => person(index + 9, { generation: 4 })),
  ];
  const index = buildFamilyTreeIndex(people);
  const visible = getVisibleFamilyMembers(people, 3, new Set(), false, index);
  const ids = new Set(visible.map(member => member.id));
  assert.ok([1, 2, 3, 4, 5, 6].every(id => ids.has(id)), 'focus, parents, sibling and children provide context');
  assert.ok(!ids.has(8), 'distant descendants stay collapsed');
  assert.equal(getHiddenDescendantCount(people[2], index, ids), 1, 'hidden descendants are counted');
  const expanded = getVisibleFamilyMembers(people, 3, new Set([5]), false, index);
  assert.ok(expanded.some(member => member.id === 8), 'expanding a child reveals the next descendant generation');
});

test('hover focus highlights the immediate household, grandparents, siblings and their partners', () => {
  const people = [
    person(1, { generation: 1 }), person(2, { generation: 1 }),
    person(3, { generation: 2, fatherId: 1, motherId: 2 }), person(4, { generation: 2, fatherId: 1, motherId: 2 }),
    person(5, { generation: 3, fatherId: 3, motherId: 4, childIds: [8] }),
    person(6, { generation: 3, fatherId: 3, motherId: 4, spouseId: 7 }), person(7, { generation: 3, spouseId: 6 }),
    person(8, { generation: 4, fatherId: 5, spouseId: 9 }), person(9, { generation: 4, spouseId: 8 }), person(10),
    person(11, { horizontalRelations: [{ memberId: 5, relationType: 'cousin' }] }),
  ];
  const focused = getRelatedFamilyMemberIds(people, 5);
  for (const id of [1, 2, 3, 4, 5, 6, 7, 8, 9]) assert.ok(focused.has(id), `member ${id} belongs to the visible family context`);
  assert.ok(!focused.has(10));
  assert.ok(!focused.has(11));
  assert.ok(getRelatedFamilyMemberIds(people, 5, true).has(11));
});
