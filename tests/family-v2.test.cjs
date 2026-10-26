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
  const routes = read('src/App.tsx');
  assert.match(service, /\/api\/family-tree\/timeline/);
  assert.match(service, /saveFamilyTimelineEvent/);
  assert.match(service, /deleteFamilyTimelineEvent/);
  assert.match(page, /fetchFamilyTimeline/);
  assert.match(page, /event\.isDerived/);
  assert.match(page, /FILTER_TYPES/);
  assert.match(page, /event\.latitude !== null && event\.longitude !== null/);
  assert.match(routes, /path="\/timeline"/);
});

test('family timeline uses the shared floating add button and shared modal for create and edit', () => {
  const page = read('src/features/my-life/pages/FamilyTimelinePage.tsx');
  const modal = read('src/features/my-life/components/TimelineEventModal.tsx');
  assert.match(page, /FloatingAddButton ariaLabel=\{t\('admin\.family_v2\.add_event'\)\} tooltip=\{t\('admin\.family_v2\.add_event'\)\}/);
  assert.match(page, /onClick=\{openCreateModal\}/);
  assert.match(page, /beginEdit\(event\)/);
  assert.match(page, /<TimelineEventModal isOpen form=\{form\}/);
  assert.doesNotMatch(page, /\{form && <form/);
  assert.match(modal, /<Modal[\s\S]*?ariaLabel=\{title\}/);
  assert.match(modal, /editing \? 'admin\.family_v2\.edit_event' : 'admin\.family_v2\.add_event'/);
  assert.match(modal, /<Select[\s\S]*?<SelectItem/);
  assert.match(modal, /<Textarea/);
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
