const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('Family map uses the authenticated backend distribution API and real Leaflet data', () => {
  const component = read('src/features/admin/components/family-tree/FamilyMapTab.tsx');
  const service = read('src/features/admin/services/familyMapService.ts');
  assert.match(service, /apiClient\.get<FamilyMapResponse>\('\/api\/family-tree\/map'/);
  assert.match(component, /CircleMarker/);
  assert.match(component, /tile\.openstreetmap\.org/);
  assert.match(component, /OpenStreetMap contributors/);
  assert.match(component, /fitBounds/);
  assert.match(component, /data\?\.totalMembers/);
  assert.doesNotMatch(component, /245\s*members|245\s*thành viên|142\s*members|142\s*thành viên|68\s*members|68\s*thành viên/i);
  assert.doesNotMatch(component, /const\s+regions\s*=\s*\[/);
});

test('Family map has API loading, error, empty, and no-location states without fake fallbacks', () => {
  const component = read('src/features/admin/components/family-tree/FamilyMapTab.tsx');
  assert.match(component, /role="status"/);
  assert.match(component, /role="alert"/);
  assert.match(component, /data\.totalMembers === 0/);
  assert.match(component, /locations\.length > 0/);
  assert.match(component, /void load\(\)/);
});

test('Vietnamese and English family map translations include every rendered key', () => {
  const vi = JSON.parse(read('src/shared/locales/vi/admin.json')).family_map;
  const en = JSON.parse(read('src/shared/locales/en/admin.json')).family_map;
  const required = ['title', 'description', 'statistics', 'total', 'located', 'unlocated', 'regions', 'loading', 'error', 'retry', 'empty', 'no_locations', 'unknown_location', 'update_address', 'distribution', 'member_count', 'generation', 'more_members', 'view_members', 'locating'];
  for (const locale of [vi, en]) for (const key of required) assert.equal(typeof locale[key], 'string', `missing ${key}`);
});
