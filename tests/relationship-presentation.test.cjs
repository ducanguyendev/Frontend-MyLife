const { test } = require('node:test');
const assert = require('node:assert/strict');
const { join } = require('node:path');
const { loadTreeModule } = require('./helpers/load-tree-module.cjs');
const { getRelationshipPresentation, reverseRelationshipPath } = loadTreeModule(join(__dirname, '../src/features/admin/components/family-tree/relationshipPresentation.ts'));
const node = (memberId, edge = null) => ({ memberId, fullName: `Member ${memberId}`, edge });
const answer = (code, reverse, path = [node(1), node(2, 'CHILD')]) => ({ fromMemberId: 1, toMemberId: 2, relationshipCode: code, relationshipLabel: `Server ${code}`, reverseRelationshipCode: reverse, reverseRelationshipLabel: `Server ${reverse}`, distance: path.length - 1, path });

test('target-to-reference wording uses the corresponding server code in both endpoint orders', () => {
  for (const [code, reverse] of [
    ['daughter','mother'], ['son','father'], ['granddaughter','grandmother'], ['grandson','grandfather'],
    ['older_brother','younger_sister'], ['wife','husband'], ['maternal_uncle','niece'], ['paternal_aunt','nephew'], ['cousin','cousin'], ['related','related'],
  ]) {
    const result = answer(code, reverse);
    const forward = getRelationshipPresentation(result, 1, 2);
    const backward = getRelationshipPresentation(result, 2, 1);
    assert.equal(forward.code, code); assert.equal(forward.label, `Server ${code}`);
    assert.equal(backward.code, reverse); assert.equal(backward.label, `Server ${reverse}`);
    assert.deepEqual([backward.referenceId, backward.targetId], [2,1]);
  }
});

test('reversing a server path moves and inverts each incoming edge without mutating it', () => {
  const path = [node(1), node(3, 'CHILD'), node(2, 'CHILD')], original = JSON.stringify(path);
  assert.deepEqual(reverseRelationshipPath(path), [node(2), node(3, 'PARENT'), node(1, 'PARENT')]);
  assert.equal(JSON.stringify(path), original);
  const result = answer('grandson', 'grandmother', path);
  const backward = getRelationshipPresentation(result, 2, 1);
  assert.deepEqual(backward.displayPath, path, 'ancestor remains at top with child edges below, including reversed API endpoints');
  assert.equal(backward.verticalPath, true);
});

test('spouse/sibling steps stay symmetric and no people are duplicated during orientation', () => {
  const path = [node(1), node(3, 'SIBLING'), node(2, 'SPOUSE')];
  const display = getRelationshipPresentation(answer('related', 'related', path), 2, 1).displayPath;
  assert.deepEqual(display, [node(2), node(3, 'SPOUSE'), node(1, 'SIBLING')]);
  assert.equal(new Set(display.map(item => item.memberId)).size, 3);
});

test('unknown or incomplete results never acquire invented paths, gender, side, or seniority', () => {
  const result = answer('grandson', 'grandmother', [node(1), node(3, 'CHILD'), node(2, 'CHILD')]);
  assert.equal(getRelationshipPresentation(result, 1, 2).code, 'grandson', 'no local paternal/maternal inference');
  assert.equal(getRelationshipPresentation(answer('unknown','unknown', []), 1, 2).displayPath.length, 0);
  assert.equal(getRelationshipPresentation(answer('daughter','mother', [node(99),node(2,'CHILD')]), 1, 2).displayPath.length, 0);
  assert.equal(getRelationshipPresentation(result, 4, 2), null, 'reject a response for a different reference');
});

test('VI and EN resolve neutral relationship labels without implying unrecorded age or side', async () => {
  const i18next=require('i18next');
  for(const language of ['vi','en']){
    const admin=JSON.parse(require('node:fs').readFileSync(join(__dirname,`../src/shared/locales/${language}/admin.json`),'utf8'));
    const i18n=i18next.createInstance();await i18n.init({lng:language,resources:{[language]:{translation:{admin}}}});
    for(const key of ['sibling_neutral_unknown','siblings_unknown_group','family_v2.unknown_relations','family_v2.code_sibling','family_v2.code_maternal_uncle'])assert.notEqual(i18n.t('admin.'+key),'admin.'+key);
    if(language==='vi'){
      assert.equal(i18n.t('admin.family_v2.code_maternal_uncle'),'Bác/cậu bên ngoại');
      assert.equal(i18n.t('admin.family_v2.code_sibling'),'Anh/chị/em');
    }
  }
});
