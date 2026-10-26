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
  const vi = JSON.parse(read('src/shared/locales/vi/admin.json')).family_v2;
  const en = JSON.parse(read('src/shared/locales/en/admin.json')).family_v2;
  const required = ['relationship', 'view_relationship', 'relationship_error', 'family_relations', 'member_timeline', 'timeline', 'add_event', 'edit_event', 'delete_event', 'approximate_date', 'location', 'view_on_map', 'library_not_linked'];
  for (const locale of [vi, en]) for (const key of required) assert.equal(typeof locale[key], 'string', `missing ${key}`);
});
