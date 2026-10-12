const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const root = path.join(__dirname, '..');
function loadTs(file, mocks = {}, globals = {}) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  new vm.Script(js, { filename: file }).runInNewContext({ exports, require: name => { assert.ok(name in mocks, `Unexpected import ${name}`); return mocks[name]; }, ...globals });
  return exports;
}
const member = (id, fields = {}) => ({ id, fullName: `Member ${id}`, generation: 1, ...fields });

test('scroll locks are reference counted, restore original inline styles and tolerate repeated release', () => {
  const body = { style: { overflow: 'clip', paddingRight: '3px' } };
  const html = { style: { overflow: 'auto' }, clientWidth: 980 };
  const document = { body, documentElement: html };
  const window = { innerWidth: 1000, getComputedStyle: () => ({ paddingRight: '3px' }) };
  const locks = loadTs('src/shared/utils/bodyScrollLock.ts', {}, { document, window });
  const unlockA = locks.acquireBodyScrollLock();
  assert.equal(body.style.overflow, 'hidden'); assert.equal(html.style.overflow, 'hidden');
  assert.equal(body.style.paddingRight, '23px');
  const unlockB = locks.acquireBodyScrollLock();
  unlockA();
  assert.equal(locks.getBodyScrollLockCount(), 1); assert.equal(body.style.overflow, 'hidden');
  unlockA(); assert.equal(locks.getBodyScrollLockCount(), 1);
  unlockB();
  assert.equal(locks.getBodyScrollLockCount(), 0);
  assert.equal(body.style.overflow, 'clip'); assert.equal(html.style.overflow, 'auto'); assert.equal(body.style.paddingRight, '3px');
});

test('biological siblings share at least one known parent; explicit cousins are suppressed for them', () => {
  const s = loadTs('src/features/admin/components/family-tree/siblingRelations.ts');
  const a = member(1, { fatherId: 10, motherId: 20 });
  const full = member(2, { fatherId: 10, motherId: 20 });
  const half = member(3, { fatherId: 10, motherId: 21 });
  const unrelated = member(4, { fatherId: 11, motherId: 22 });
  assert.equal(s.isBiologicalSibling(a, full), true);
  assert.equal(s.isBiologicalSibling(a, half), true);
  assert.equal(s.isBiologicalSibling(member(5, { fatherId: 10 }), member(6, { fatherId: 10 })), true);
  assert.equal(s.isBiologicalSibling(member(5, { motherId: 20 }), member(6, { motherId: 20 })), true);
  assert.equal(s.isBiologicalSibling(member(5), member(6)), false);
  assert.equal(s.getSiblingKind(a, half), 'biological');
  half.horizontalRelations = [{ memberId: a.id, relationType: ' SIBLING ' }];
  assert.equal(s.hasExplicitSiblingRelation(a, half), true);
  assert.equal(s.getSiblingKind(a, half), 'biological');
  unrelated.horizontalRelations = [{ memberId: a.id, relationType: 'SIBLING' }];
  assert.equal(s.getSiblingKind(a, unrelated), 'cousin');
  full.horizontalRelations = [{ memberId: a.id, relationType: 'sibling' }];
  assert.equal(s.getSiblingKind(a, full), 'biological');
});

test('sibling seniority uses DOB and gender and stays neutral for ambiguous dates', () => {
  const s = loadTs('src/features/admin/components/family-tree/siblingRelations.ts');
  const current = member(1, { dateOfBirth: '2000-05-10' });
  assert.equal(s.getSiblingSeniority(current, member(2, { dateOfBirth: '1990-01-01', gender: 'Nam' })), 'older-brother');
  assert.equal(s.getSiblingSeniority(current, member(3, { dateOfBirth: '1990-01-01', gender: 'N\u1eef' })), 'older-sister');
  assert.equal(s.getSiblingSeniority(current, member(4, { dateOfBirth: '2010-01-01', gender: 'Female' })), 'younger-sister');
  assert.equal(s.getSiblingSeniority(current, member(5, { dateOfBirth: '2010-01-01', gender: 'Other' })), 'younger-unknown');
  assert.equal(s.getSiblingSeniority(current, member(6, { dateOfBirth: '2000-05-10', gender: 'Nam' })), 'unknown');
  assert.equal(s.getSiblingSeniority(current, member(7, { dateOfBirth: 'invalid' })), 'unknown');
  assert.equal(s.getSiblingSeniority(current, member(9, { dateOfBirth: '2000-02-30', gender: 'Nam' })), 'unknown');
  assert.equal(s.getSiblingSeniority(current, member(10, { dateOfBirth: '2000-05-10T19:00:00Z', gender: 'Nam' })), 'unknown');
  assert.equal(s.getSiblingSeniority(current, member(8, {})), 'unknown');
  assert.equal(s.getSiblingDisplayLabelKey('biological', 'unknown'), 'sibling_neutral_biological');
});

test('confirmed sibling examples classify half siblings, cousins and missing-DOB members correctly', () => {
  const s = loadTs('src/features/admin/components/family-tree/siblingRelations.ts');
  const duc = member(100, { fullName: 'Nguyễn Huỳnh Minh Đức', fatherId: 1, motherId: 2, dateOfBirth: '2005-12-16', gender: 'Nam' });
  const bao = member(101, { fullName: 'Nguyễn Huỳnh Quốc Bảo', fatherId: 3, motherId: 2, dateOfBirth: '2009-03-16', gender: 'Nam' });
  assert.equal(s.getSiblingKind(duc, bao), 'biological');
  assert.equal(s.getSiblingSeniority(duc, bao), 'younger-brother');
  assert.equal(s.getSiblingDisplayLabelKey('biological', s.getSiblingSeniority(duc, bao)), 'sibling_biological_younger_brother');
  assert.equal(s.getSiblingSeniority(bao, duc), 'older-brother');

  const tung = member(102, { fullName: 'Nguyễn Sơn Tùng', fatherId: 4, motherId: 5, dateOfBirth: '1998-10-13', gender: 'Nam', horizontalRelations: [{ memberId: duc.id, relationType: 'Sibling' }] });
  assert.equal(s.getSiblingKind(duc, tung), 'cousin');
  assert.equal(s.getSiblingSeniority(duc, tung), 'older-brother');
  assert.equal(s.getSiblingDisplayLabelKey('cousin', s.getSiblingSeniority(duc, tung)), 'sibling_cousin_older_brother');

  const hoangMinh = member(103, { fullName: 'Nguyễn Hoàng Minh', horizontalRelations: [{ memberId: duc.id, relationType: 'sibling' }] });
  assert.equal(s.getSiblingKind(duc, hoangMinh), 'cousin');
  assert.equal(s.getSiblingSeniority(duc, hoangMinh), 'unknown');
  assert.equal(s.getSiblingDisplayLabelKey('cousin', s.getSiblingSeniority(duc, hoangMinh)), 'sibling_neutral_cousin');
});

test('modal and custom overlays share scroll locks; Select portals, repositions and cleans up', () => {
  const modal = fs.readFileSync(path.join(root, 'src/shared/components/ui/Modal.tsx'), 'utf8');
  const photo = fs.readFileSync(path.join(root, 'src/features/admin/components/family-tree/PhotoLightboxModal.tsx'), 'utf8');
  const project = fs.readFileSync(path.join(root, 'src/features/portfolio/components/projects/ProjectDetailModal.tsx'), 'utf8');
  const select = fs.readFileSync(path.join(root, 'src/shared/components/ui/Select.tsx'), 'utf8');
  assert.ok(modal.includes('useBodyScrollLock(isOpen)'));
  assert.ok(photo.includes('useBodyScrollLock(!!photo)'));
  assert.ok(project.includes('useBodyScrollLock(isOpen)'));
  assert.match(select, /<select[\s\S]*?absolute inset-0 z-10 h-full w-full/);
  assert.doesNotMatch(select, /createPortal|role="listbox"|getBoundingClientRect/);
  assert.ok(modal.includes('flex-1 min-h-0 overflow-y-auto'));
});

test('FamilyTree form derives full siblings and keeps cousin links explicit', () => {
  const form = fs.readFileSync(path.join(root, 'src/features/admin/components/family-tree/MemberFormModal.tsx'), 'utf8');
  const manager = fs.readFileSync(path.join(root, 'src/features/admin/components/FamilyTreeManager.tsx'), 'utf8');
  const detail = fs.readFileSync(path.join(root, 'src/features/admin/components/family-tree/MemberDetailModal.tsx'), 'utf8');
  assert.ok(form.includes('isBiologicalSibling(editingMember, member)'));
  assert.ok(form.includes('!isBiologicalSibling(editingMember || {}, m)'));
  assert.ok(form.includes('siblings_biological_group') && form.includes('siblings_cousin_group'));
  assert.ok(manager.includes('horizontalRelations: []'));
  assert.ok(manager.includes("relation.relationType?.trim().toLowerCase() === 'sibling' ? 'sibling'"));
  assert.ok(detail.includes("getSiblingKind(member, m) === 'cousin'"));
  for (const locale of ['vi', 'en']) {
    const admin = JSON.parse(fs.readFileSync(path.join(root, `src/shared/locales/${locale}/admin.json`), 'utf8'));
    assert.ok(admin.siblings_biological_group && admin.siblings_cousin_group && admin.select_cousin_sibling);
    assert.ok(admin.sibling_biological_older_brother && admin.sibling_cousin_younger_sister);
  }
});
