const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

test('member life status form defaults to living and conditionally edits a validated death date', () => {
  const manager = read('src/features/admin/components/FamilyTreeManager.tsx');
  const form = read('src/features/admin/components/family-tree/MemberFormModal.tsx');
  assert.match(manager, /lifeStatus:\s*"LIVING"/);
  assert.match(form, /admin\.member_life_status\.label/);
  assert.match(form, /value="DECEASED"/);
  assert.match(form, /editingMember\.lifeStatus === "DECEASED" && <DateInput/);
  assert.match(form, /deathDate:\s*lifeStatus === "LIVING"\s*\?\s*null/);
  assert.match(form, /death_date_required/);
  assert.match(form, /death_date_future/);
  assert.match(form, /death_before_birth/);
  assert.match(form, /disableFuture/);
});

test('anniversary member options follow event type and selected death dates come from the member profile', () => {
  const modal = read('src/features/admin/components/family-tree/FamilyAnniversaryModal.tsx');
  assert.match(modal, /members\.filter\(member => !isDeathAnniversary \|\| member\.lifeStatus === 'DECEASED'\)/);
  assert.match(modal, /setRelatedMemberId\(''\)/);
  assert.match(modal, /nextMember\?\.lifeStatus === 'DECEASED' && nextMember\.deathDate/);
  assert.match(modal, /disabled=\{isSaving \|\| Boolean\(linkedDeathDate\)\}/);
  assert.match(modal, /hasLinkedMemberWithoutDeathDate/);
  assert.match(modal, /admin\.anniversary_ui\.date_from_member/);
  assert.match(modal, /anniversary \? 'admin\.anniversary_ui\.save_changes' : 'admin\.anniversary_ui\.add_action'/);
  const tab = read('src/features/admin/components/family-tree/AnniversaryTab.tsx');
  assert.match(tab, /const openEditor = async/);
  assert.match(tab, /fetchFamilyMembers\(controller\.signal\)/);
});

test('life status and anniversary translations are present in both locales', () => {
  for (const locale of ['vi', 'en']) {
    const admin = JSON.parse(read(`src/shared/locales/${locale}/admin.json`));
    assert.ok(admin.member_life_status.label);
    assert.ok(admin.member_life_status.living);
    assert.ok(admin.member_life_status.deceased);
    assert.ok(admin.member_life_status.invalid_status);
    assert.ok(admin.member_life_status.death_date_required);
    assert.ok(admin.member_life_status.death_date_future);
    assert.ok(admin.member_life_status.death_before_birth);
    assert.ok(admin.anniversary_ui.add_action);
    assert.ok(admin.anniversary_ui.save_changes);
    assert.ok(admin.anniversary_ui.no_deceased_members);
    assert.ok(admin.anniversary_ui.date_from_member);
    assert.ok(admin.anniversary_ui.member_death_date_missing);
  }
});
