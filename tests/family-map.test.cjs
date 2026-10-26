const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('Family map uses the authenticated backend distribution API and real Leaflet data', () => {
  const component = read('src/features/admin/components/family-tree/FamilyMapTab.tsx');
  const service = read('src/features/admin/services/familyMapService.ts');
  assert.match(service, /apiClient\.get<unknown>\('\/api\/family-tree\/map'/);
  assert.match(service, /return normalizeFamilyMapData\(response\.data\)/);
  assert.match(component, /Array\.isArray\(data\?\.members\)/);
  assert.match(component, /CircleMarker/);
  assert.match(component, /tile\.openstreetmap\.org/);
  assert.match(component, /OpenStreetMap contributors/);
  assert.match(component, /fitBounds/);
  assert.match(component, /center=\{\[location\.latitude, location\.longitude\]\}/);
  assert.doesNotMatch(component, /Math\.round\([^\n]*(?:latitude|longitude)/i);
  assert.match(component, /data\?\.totalMembers/);
  assert.doesNotMatch(component, /245\s*members|245\s*thành viên|142\s*members|142\s*thành viên|68\s*members|68\s*thành viên/i);
  assert.doesNotMatch(component, /const\s+regions\s*=\s*\[/);
});

test('Family map has API loading, error, empty, and no-location states without fake fallbacks', () => {
  const component = read('src/features/admin/components/family-tree/FamilyMapTab.tsx');
  assert.match(component, /role="status"/);
  assert.match(component, /role="alert"/);
  assert.match(component, /data\?\.totalMembers === 0/);
  assert.match(component, /locations\.length > 0/);
  assert.match(component, /void load\(\)/);
});

test('Family map retains its single API owner, five-second polling, viewport fitting, and Leaflet layers', () => {
  const component = read('src/features/admin/components/family-tree/FamilyMapTab.tsx');
  assert.match(component, /getFamilyMapDistribution\(signal\)/);
  assert.match(component, /setInterval\(\(\) => void load\(\), 5000\)/);
  assert.match(component, /map\.setView\(VIETNAM_CENTER, 5\)/);
  assert.match(component, /map\.setView\(\[locations\[0\]\.latitude, locations\[0\]\.longitude\], 13\)/);
  assert.match(component, /map\.fitBounds/);
  for (const layer of ['MapContainer', 'TileLayer', 'CircleMarker', 'Tooltip', 'Popup']) assert.ok(component.includes(layer));
  assert.match(component, /openstreetmap\.org\/copyright/);
  assert.match(component, /location\.members\.slice\(0, 6\)/);
  assert.match(component, /family_map\.more_members/);
});

test('Family map uses a full workspace with overlay stats and a data-backed distribution panel', () => {
  const page = read('src/features/my-life/pages/FamilyMapPage.tsx');
  const component = read('src/features/admin/components/family-tree/FamilyMapTab.tsx');
  const service = read('src/features/admin/services/familyMapService.ts');
  const css = read('src/features/admin/components/family-tree/FamilyMapTab.css');
  const modal = read('src/shared/components/ui/Modal.tsx');
  assert.match(page, /contentScroll="hidden"/);
  assert.match(page, /min-h-0/);
  assert.doesNotMatch(page, /myLife\.modules\.map\.(title|description)/);
  assert.match(component, /<h1[\s\S]*family_map\.workspace_title/);
  assert.match(component, /family-map-stats-overlay[\s\S]*aria-label/);
  assert.equal((component.match(/compact_(total|located|unlocated|regions)/g) || []).length, 4);
  assert.match(component, /setDistributionOpen\(true\)/);
  assert.match(component, /<Modal[\s\S]*family-map-distribution-panel/);
  assert.match(component, /locations\.map\(location =>/);
  assert.match(component, /location\.memberCount \/ data\.locatedMembers/);
  assert.doesNotMatch(component, /<Card>[\s\S]*family_map\.distribution/);
  assert.match(component, /family-distribution-map absolute inset-0/);
  assert.doesNotMatch(component, /h-\[420px\]|sm:h-\[520px\]/);
  assert.match(css, /min-height: min\(360px, 58dvh\)/);
  assert.match(css, /family-map-distribution-panel/);
  assert.match(component, /useReducedMotion/);
  assert.match(component, /reducedMotion=\{Boolean\(shouldReduceMotion\)\}/);
  assert.match(modal, /reducedMotion\?: boolean/);
  assert.match(modal, /reducedMotion \? \{ duration: 0\.01 \}/);
  assert.match(component, /void load\(controller\.signal\);[\s\S]*?\}, \[load\]\);/);
  assert.match(component, /\}, \[data\?\.pendingGeocodingMembers, load\]\);/);
  assert.match(service, /noAddressMembers: number/);
  assert.match(service, /failedGeocodingMembers: number/);
  assert.match(component, /no_address_status/);
  assert.match(component, /pending_status/);
  assert.match(component, /failed_status/);
});

test('Vietnamese and English family map translations include every rendered key', () => {
  const vi = JSON.parse(read('src/shared/locales/vi/admin.json')).family_map;
  const en = JSON.parse(read('src/shared/locales/en/admin.json')).family_map;
  const required = ['title', 'description', 'workspace_title', 'open_distribution', 'compact_total', 'compact_located', 'compact_unlocated', 'compact_regions', 'statistics', 'total', 'located', 'unlocated', 'regions', 'loading', 'error', 'retry', 'empty', 'no_locations', 'unknown_location', 'update_address', 'distribution', 'member_count', 'generation', 'more_members', 'view_members', 'locating', 'geocoding_status', 'no_address_status', 'pending_status', 'failed_status'];
  for (const locale of [vi, en]) for (const key of required) assert.equal(typeof locale[key], 'string', `missing ${key}`);
});

test('Family map normalization tolerates missing and empty member arrays', () => {
  const normalize = loadNormalizer();
  for (const members of [undefined, null, []]) {
    const data = normalize({
      locations: [{ key: 'one', latitude: 10, longitude: 106, memberCount: 2, members }],
    });
    assert.equal(data.locations.length, 1);
    assert.deepEqual(data.locations[0].members, []);
    assert.ok(Array.isArray(data.members));
  }
});

test('Family map normalization discards invalid coordinates and preserves valid markers', () => {
  const normalize = loadNormalizer();
  const data = normalize({
    locations: [
      { key: 'bad', latitude: null, longitude: undefined, members: [] },
      { key: 'good', latitude: '10.123', longitude: 106.456, members: [{ id: 7, fullName: 'A', generation: 2 }] },
    ],
  });
  assert.equal(data.locations.length, 1);
  assert.deepEqual([data.locations[0].latitude, data.locations[0].longitude], [10.123, 106.456]);
  assert.equal(data.locations[0].memberCount, 1);
  assert.equal(data.members[0].status, 'LOCATED');
});

function loadNormalizer() {
  const ts = require('typescript');
  const source = read('src/features/admin/services/familyMapService.ts');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const module = { exports: {} };
  const localRequire = name => {
    if (name === '@/shared/api/apiClient') return { apiClient: {} };
    throw new Error(`Unexpected import in Family Map normalizer test: ${name}`);
  };
  new Function('require', 'module', 'exports', outputText)(localRequire, module, module.exports);
  return module.exports.normalizeFamilyMapData;
}
