const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('relationship UI uses the authenticated server relationship graph and displays its path', () => {
  const service = read('src/features/admin/services/familyV2Service.ts');
  const explorer = read('src/features/admin/components/family-tree/RelationshipExplorer.tsx');
  const routes = read('src/App.tsx');
  assert.match(service, /\/api\/family-tree\/relationship\?fromMemberId=/);
  assert.match(explorer, /fetchRelationship\(Number\(fromId\), Number\(toId\)\)/);
  assert.match(explorer, /result\.path\.map/);
  assert.match(explorer, /navigate\(`\/mylife\/family\/member\/\$\{node\.memberId\}`\)/);
  assert.match(routes, /path="\/mylife\/family\/member\/:id"/);
});

test('family timeline UI exposes source data, safe event CRUD and useful filters', () => {
  const service = read('src/features/admin/services/familyV2Service.ts');
  const page = read('src/features/my-life/pages/FamilyTimelinePage.tsx');
  const card = read('src/features/my-life/components/timeline/TimelineEventCard.tsx');
  const groups = read('src/features/my-life/components/timeline/timelineUtils.ts');
  const routes = read('src/App.tsx');
  assert.match(service, /\/api\/family-tree\/timeline/);
  assert.match(service, /saveFamilyTimelineEvent/);
  assert.match(service, /deleteFamilyTimelineEvent/);
  assert.match(page, /fetchFamilyTimeline/);
  assert.match(page, /event\.isDerived/);
  assert.match(page, /FILTER_TYPES/);
  assert.match(card, /event\.latitude !== null && event\.longitude !== null/);
  assert.match(page, /groupTimelineEventsByYear\(filtered\)/);
  assert.match(groups, /event\.eventDate[\s\S]*event\.eventYear/);
  assert.match(routes, /path="\/timeline"/);
});

test('family timeline uses the shared floating add button and shared modal for create and edit', () => {
  const page = read('src/features/my-life/pages/FamilyTimelinePage.tsx');
  const modal = read('src/features/my-life/components/TimelineEventModal.tsx');
  const card = read('src/features/my-life/components/timeline/TimelineEventCard.tsx');
  assert.match(page, /FloatingAddButton ariaLabel=\{t\('admin\.family_v2\.add_event'\)\} tooltip=\{t\('admin\.family_v2\.add_event'\)\}/);
  assert.match(page, /onClick=\{openCreateModal\}/);
  assert.match(page, /onEdit=\{beginEdit\}/);
  assert.match(page, /TimelineYearSection/);
  assert.match(page, /<TimelineEventModal isOpen form=\{form\}/);
  assert.doesNotMatch(page, /\{form && <form/);
  assert.match(modal, /<Modal[\s\S]*?ariaLabel=\{title\}/);
  assert.match(modal, /editing \? 'admin\.family_v2\.edit_event' : 'admin\.family_v2\.add_event'/);
  assert.match(modal, /<Select[\s\S]*?<SelectItem/);
  assert.match(modal, /<Textarea/);
  assert.match(card, /!event\.isDerived/);
});

test('timeline modal renders type-specific semantic forms with shared controls and marriage validation', () => {
  const modal = read('src/features/my-life/components/TimelineEventModal.tsx');
  const vi = JSON.parse(read('src/shared/locales/vi/admin.json')).family_v2;
  const en = JSON.parse(read('src/shared/locales/en/admin.json')).family_v2;
  for (const token of ['default: return <>', 'case \'MEMORY\'', 'case \'ADDRESS_CHANGE\'', 'case \'MARRIAGE\'', 'case \'CHILD_BIRTH\'']) assert.ok(modal.includes(token), `missing ${token} form`);
  for (const token of ['memory_title', 'memory_content', 'moved_member', 'new_address', 'marriage_person_one', 'marriage_person_two', 'child_member', 'birth_date']) assert.ok(modal.includes(token), `missing ${token} semantic field`);
  assert.match(modal, /form\.memberId === form\.relatedMemberId/);
  assert.match(modal, /same_marriage_member_error/);
  assert.match(modal, /<Input/);
  assert.match(modal, /<Select/);
  assert.match(modal, /<Modal/);
  assert.match(modal, /<Textarea/);
  assert.match(modal, /buildTimelineEventSuggestedTitle/);
  assert.equal(vi.marriage_person_one, 'Ng\u01b0\u1eddi th\u1ee9 nh\u1ea5t');
  assert.equal(vi.new_address, '\u0110\u1ecba ch\u1ec9 m\u1edbi');
  assert.equal(vi.memory_content, 'N\u1ed9i dung k\u00fd \u1ee9c');
  for (const key of ['marriage_person_one', 'new_address', 'memory_content', 'same_marriage_member_error']) assert.equal(typeof en[key], 'string');
});

test('timeline event badges map every known type and unknown types to translated labels', () => {
  const card = read('src/features/my-life/components/timeline/TimelineEventCard.tsx');
  const mapping = read('src/features/my-life/components/timeline/eventTypeTranslation.ts');
  const vi = JSON.parse(read('src/shared/locales/vi/admin.json')).family_v2;
  const en = JSON.parse(read('src/shared/locales/en/admin.json')).family_v2;
  assert.match(card, /translate\(getTimelineEventTypeTranslationKey\(event\.eventType\)\)/);
  assert.doesNotMatch(card, /type_\$\{event\.eventType\.toLowerCase\(\)\}/);
  for (const type of ['BIRTH', 'DEATH', 'MARRIAGE', 'CHILD_BIRTH', 'ADDRESS_CHANGE', 'ANNIVERSARY', 'MEMORY', 'CUSTOM']) {
    assert.match(mapping, new RegExp(`${type}: 'admin\\.family_v2\\.type_`));
  }
  assert.match(mapping, /\?\? 'admin\.family_v2\.type_event'/);
  assert.deepEqual(['birth', 'death', 'marriage', 'child_birth', 'address_change', 'anniversary', 'memory', 'custom'].map(key => vi[`type_${key}`]),
    ['Sinh', 'Mất', 'Kết hôn', 'Con chào đời', 'Chuyển nơi ở', 'Kỷ niệm', 'Ký ức', 'Sự kiện gia đình']);
  assert.deepEqual(['birth', 'death', 'marriage', 'child_birth', 'address_change', 'anniversary', 'memory', 'custom'].map(key => en[`type_${key}`]),
    ['Birth', 'Death', 'Marriage', 'Child birth', 'Address change', 'Anniversary', 'Memory', 'Family event']);
  assert.equal(vi.type_event, 'Sự kiện');
  assert.equal(en.type_event, 'Event');
});

test('member profile connects family, anniversaries, timeline, avatar and map without guessing library matches', () => {
  const service = read('src/features/admin/services/familyV2Service.ts');
  const page = read('src/features/my-life/pages/FamilyMemberProfilePage.tsx');
  const modal = read('src/features/admin/components/family-tree/MemberDetailModal.tsx');
  assert.match(service, /\/profile/);
  assert.match(page, /MemberAvatarImage/);
  assert.match(page, /RelationshipExplorer/);
  assert.match(page, /profile\.anniversaries/);
  assert.match(page, /profile\.timeline/);
  assert.match(page, /MapContainer/);
  assert.match(page, /libraryMemberLinkAvailable/);
  assert.match(page, /library_not_linked/);
  assert.match(modal, /onOpenProfile/);
});

test('English and Vietnamese locales include V2 page, relationship and event keys', () => {
  const viAdmin = JSON.parse(read('src/shared/locales/vi/admin.json'));
  const vi = viAdmin.family_v2;
  const en = JSON.parse(read('src/shared/locales/en/admin.json')).family_v2;
  const required = ['relationship', 'view_relationship', 'relationship_error', 'family_relations', 'member_timeline', 'timeline', 'add_event', 'edit_event', 'delete_event', 'approximate_date', 'location', 'view_on_map', 'library_not_linked'];
  for (const locale of [vi, en]) for (const key of required) assert.equal(typeof locale[key], 'string', `missing ${key}`);

  assert.equal(vi.timeline, 'Dòng thời gian gia đình');
  assert.equal(vi.add_event, 'Thêm sự kiện');
  assert.equal(vi.relationship, 'Tra cứu quan hệ');
  assert.equal(vi.edit_member, 'Chỉnh sửa thành viên');
  assert.equal(vi.location, 'Địa điểm');

  const viMyLife = JSON.parse(read('src/shared/locales/vi/myLife.json'));
  assert.deepEqual(viMyLife.modules.timeline, {
    title: 'Dòng thời gian gia đình',
    description: 'Lưu giữ các dấu mốc và ký ức của gia đình qua nhiều thế hệ.',
    open: 'Mở dòng thời gian',
  });
});
