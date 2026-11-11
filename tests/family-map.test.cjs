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
  assert.equal((component.match(/<FamilyMapControls\b/g) || []).length, 2, 'one shared toolbar for main map and one for editor');
  assert.match(resize, /L\.DomEvent\.disableClickPropagation/);
  assert.match(resize, /<Focus size=\{17\}/);
  assert.doesNotMatch(resize, /<Layers3/);
  assert.match(css, /family-map-canvas[^}]*isolation:isolate/);
  assert.match(css, /family-location-modal__map[^}]*contain:layout paint size/);
  assert.match(read('src/features/admin/components/family-tree/FamilyMapSurface.css'), /family-map-controls button:focus-visible/);
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
  assert.match(map, /<FamilyMapControls/);
  assert.match(page, /zoomControl=\{false\}/);
  assert.doesNotMatch(page, /TileLayer|openstreetmap\.org/);
});

test('map visibility resize cancels pending frames, observers and listeners after unmount', () => {
  const ts = require('typescript');
  const vm = require('node:vm');
  const effects = [], frames = new Map(), listeners = new Map();
  let nextFrame = 0, invalidations = 0, disconnected = false, observed;
  const map = { getContainer: () => ({ isConnected: true }), invalidateSize: () => invalidations++ };
  const compiled = ts.transpileModule(read('src/features/admin/components/family-tree/FamilyLocationMap.tsx'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  const mocks = { react: { useEffect: effect => effects.push(effect) }, 'react/jsx-runtime': {}, 'react-leaflet': { useMap: () => map }, leaflet: {}, 'lucide-react': {}, '@/shared/hooks/useLanguage': {}, './VietMapBaseLayer': {} };
  vm.runInNewContext(compiled, { exports: module.exports, require: name => mocks[name],
    requestAnimationFrame: callback => { frames.set(++nextFrame, callback); return nextFrame; }, cancelAnimationFrame: id => frames.delete(id),
    ResizeObserver: class { constructor(callback) { observed = callback; } observe() {} disconnect() { disconnected = true; } },
    window: { addEventListener: (type, callback) => listeners.set(type, callback), removeEventListener: type => listeners.delete(type) },
  });
  module.exports.MapVisibilityResize();
  const cleanup = effects[0]();
  const flush = () => { const pending = [...frames.values()]; frames.clear(); pending.forEach(callback => callback()); };
  flush(); flush(); assert.equal(invalidations, 1, 'visible map is resized after mounting');
  observed(); cleanup(); flush();
  assert.equal(invalidations, 1, 'queued resize cannot run on a removed map');
  assert.equal(disconnected, true); assert.equal(listeners.size, 0); assert.equal(frames.size, 0);
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
