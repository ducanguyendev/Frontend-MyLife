const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('Family Map uses backend coordinates and the shared VietMap GL provider', () => {
  const component = read('src/features/admin/components/family-tree/FamilyMapTab.tsx');
  const baseLayer = read('src/features/admin/components/family-tree/VietMapBaseLayer.tsx');
  const service = read('src/features/admin/services/familyMapService.ts');
  assert.match(service, /apiClient\.get<unknown>\('\/api\/family-tree\/map'/);
  assert.match(service, /return normalizeFamilyMapData\(response\.data\)/);
  assert.match(component, /CircleMarker/);
  assert.match(component, /center=\{\[location\.latitude, location\.longitude\]\}/);
  assert.match(component, /map\.fitBounds/);
  assert.match(baseLayer, /VITE_VIETMAP_TILE_KEY/);
  assert.match(baseLayer, /@vietmap\/vietmap-gl-leaflet/);
  assert.match(baseLayer, /maps\.vietmap\.vn\/maps\/styles/);
  assert.match(baseLayer, /theme === 'dark' \? 'dm' : 'lm'/);
  assert.doesNotMatch(baseLayer, /openstreetmap\.org|tileLayer\(/i);
  assert.match(baseLayer, /removeLayer\(layer\)/);
});

test('Family Map exposes API loading, error, empty, geocoding retry, and VietMap failure states', () => {
  const component = read('src/features/admin/components/family-tree/FamilyMapTab.tsx');
  const baseLayer = read('src/features/admin/components/family-tree/VietMapBaseLayer.tsx');
  const service = read('src/features/admin/services/familyMapService.ts');
  assert.match(component, /<Loading/);
  assert.match(component, /role="alert"/);
  assert.match(component, /data\?\.totalMembers === 0/);
  assert.match(component, /retryFamilyMapGeocoding\(\)/);
  assert.match(service, /apiClient\.post<unknown>\('\/api\/family-tree\/map\/retry-geocoding'/);
  assert.match(baseLayer, /family_map\.vietmap_error/);
  assert.match(baseLayer, /setAttempt\(value => value \+ 1\)/);
  assert.doesNotMatch(baseLayer, /fallback|OpenStreetMap/i);
});

test('location editor is bounded, isolated, resize-aware, and owns one map control set', () => {
  const component = read('src/features/admin/components/family-tree/FamilyMapTab.tsx');
  const css = read('src/features/admin/components/family-tree/FamilyMapTab.css');
  const resize = read('src/features/admin/components/family-tree/FamilyLocationMap.tsx');
  const modal = read('src/shared/components/ui/Modal.tsx');
  assert.match(component, /className="family-location-modal"/);
  assert.match(component, /maxWidth="full"/);
  assert.match(component, /zoomControl=\{false\}/);
  assert.equal((component.match(/<MapControls\b/g) || []).length, 2);
  assert.equal((component.match(/<LocationEditorControls\b/g) || []).length, 1);
  assert.match(component, /L\.DomEvent\.disableClickPropagation/);
  assert.match(css, /family-map-canvas[^}]*isolation:isolate/);
  assert.match(css, /family-location-modal__map[^}]*contain:layout paint size/);
  assert.match(css, /family-map-controls button:focus-visible/);
  assert.match(resize, /map\.invalidateSize/);
  assert.match(resize, /ResizeObserver/);
  assert.match(modal, /createPortal\([\s\S]*document\.body/);
});

test('member detail uses the shared VietMap layer at the stored coordinates', () => {
  const page = read('src/features/my-life/pages/FamilyMemberProfilePage.tsx');
  const map = read('src/features/admin/components/family-tree/FamilyLocationMap.tsx');
  assert.match(page, /center=\{\[member\.latitude!,member\.longitude!\]\}/);
  assert.match(page, /<FamilyLocationMap latitude=\{member\.latitude!\} longitude=\{member\.longitude!\}/);
  assert.match(map, /<VietMapBaseLayer\s*\/>/);
  assert.doesNotMatch(page, /TileLayer|openstreetmap\.org/);
});

test('Family Map normalization tolerates missing members and preserves valid coordinates', () => {
  const normalize = loadNormalizer();
  for (const members of [undefined, null, []]) {
    const data = normalize({ locations: [{ key: 'one', latitude: 10, longitude: 106, memberCount: 2, members }] });
    assert.equal(data.locations.length, 1);
    assert.deepEqual(data.locations[0].members, []);
    assert.ok(Array.isArray(data.members));
  }
  const data = normalize({ locations: [
    { key: 'bad', latitude: null, longitude: undefined, members: [] },
    { key: 'good', latitude: '10.123', longitude: 106.456, members: [{ id: 7, fullName: 'A', generation: 2 }] },
  ] });
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
