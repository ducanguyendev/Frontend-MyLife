const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'); const { join } = require('node:path'); const vm = require('node:vm'); const ts = require('typescript');
const read = file => fs.readFileSync(join(__dirname, '..', file), 'utf8');
function load(file, mocks = {}, globals = {}) {
  const { outputText } = ts.transpileModule(read(file), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } });
  const exports = {}; new vm.Script(outputText, { filename: file }).runInNewContext({ exports, require: name => { assert.ok(name in mocks, name); return mocks[name]; }, AbortController, ...globals }); return exports;
}
const types = load('src/features/admin/components/family-tree/types.ts');
const search = load('src/features/admin/components/family-tree/memberSearch.ts', { './types': types });
const messages = load('src/features/admin/services/featureMessages.ts');
const fixture = { id: 1, fullName: 'Nguyễn Văn An', role: 'Trưởng tộc', phoneNumber: '0901234567', address: 'Hồ Chí Minh', generation: 3 };
test('actual member filter supports four fields, Vietnamese accents, case, trim and AND generation', () => {
  const other = { ...fixture, id: 2, generation: 2 };
  for (const query of ['nguyen', 'NGUYEN', ' truong toc ', '0901', 'ho chi minh']) {
    assert.deepEqual(Array.from(search.filterFamilyMembers([fixture, other], query, '3'), m => m.id), [1]);
    assert.equal(search.filterFamilyMembers([fixture], query, '2').length, 0);
  }
  assert.equal(search.filterFamilyMembers([fixture], 'unmatched', 'all').length, 0);
  assert.equal(search.filterFamilyMembers([fixture], '', 'all').length, 1);
  assert.equal(search.normalizeSearchText(' Đặng '), 'dang');
});
function harness() {
  let cursor = 0; const state = []; const effects = []; const cleanups = [];
  const hooks = { useState(initial) { const at = cursor++; if (!(at in state)) state[at] = typeof initial === 'function' ? initial() : initial; return [state[at], next => { state[at] = typeof next === 'function' ? next(state[at]) : next; }]; },
    useEffect: effect => effects.push(effect), useCallback: fn => fn, useMemo: fn => fn(), lazy: () => 'Mindmap', Suspense: 'Suspense' };
  const jsx = (type, props) => ({ type, props });
  return { hooks, jsx, render(Component, props) { cursor = 0; return Component(props); }, mount() { effects.splice(0).forEach(effect => cleanups.push(effect())); }, unmount() { cleanups.forEach(fn => fn?.()); } };
}
function nodes(tree) { if (!tree || typeof tree !== 'object') return []; if (Array.isArray(tree)) return tree.flatMap(nodes); return [tree, ...nodes(tree.props?.children)]; }
const find = (tree, predicate) => { const node = nodes(tree).find(predicate); assert.ok(node); return node.props; };
const flush = () => new Promise(resolve => setImmediate(resolve));
function familySetup(request) {
  const h = harness(); const toast = [];
  const names = ['MemberCard','MemberTable','MemberDetailModal','MemberFormModal','DeleteConfirmModal','AnniversaryTab','LibraryTab','FamilyMapTab'];
  const apiClient = { requestRaw: request };
  const familyMembersHook = load('src/features/admin/components/family-tree/useFamilyMembers.ts', {
    react: h.hooks, '@/shared/api/apiClient': { apiClient }, '../../services/featureMessages': messages,
  });
  const { FamilyTreeManager } = load('src/features/admin/components/FamilyTreeManager.tsx', {
    react: { ...h.hooks, default: h.hooks }, 'react/jsx-runtime': { jsx: h.jsx, jsxs: h.jsx }, 'lucide-react': new Proxy({}, { get: (_, key) => key }),
    '@/shared/hooks/useLanguage': { useLanguage: () => ({ t: key => key }) }, '@/shared/components/ui': { Button: 'Button' },
    '@/shared/components/SearchBar': { SearchBar: 'SearchBar' },
    '@/shared/api/apiClient': { apiClient }, '../services/featureMessages': messages,
    './family-tree/memberSearch': search, './family-tree': Object.fromEntries(names.map(name => [name,name])),
    './family-tree/familyTreeRendererConfig': { FAMILY_TREE_RENDERER: 'family-chart', IS_FAMILY_CHART_DEV_POC: true, IS_MEMOIR_DEV_POC: false, IS_DEVELOPMENT_BUILD: true },
    './family-tree/FamilyChartErrorBoundary': { FamilyChartErrorBoundary: 'FamilyChartErrorBoundary' },
    './family-tree/FamilyTreeRendererErrorBoundary': { FamilyTreeRendererErrorBoundary: 'FamilyTreeRendererErrorBoundary' },
    './family-tree/useFamilyMembers': familyMembersHook,
  }, { document: { addEventListener() {}, removeEventListener() {}, getElementById: () => ({ focus() {} }) } });
  const render = () => h.render(FamilyTreeManager, { showToast: value => toast.push(value) }); render(); h.mount(); return { h, render, toast };
}
test('API error differs from empty and Retry refetches without reloading the browser', async () => {
  let calls = 0; const s = familySetup(async () => { calls++; return new Response(JSON.stringify(calls === 1 ? { code: 'FAMILY_VALIDATION_FAILED' } : { data: [] }), { status: calls === 1 ? 503 : 200 }); });
  await flush(); const error = find(s.render(), n => n.props?.role === 'alert');
  assert.ok(nodes({ props: error }).some(n => n.props?.children === 'admin.member_errors.validation'));
  assert.ok(!nodes(s.render()).some(n => n.props?.children === 'admin.tree_empty'));
  find(s.render(), n => n.type === 'Button' && n.props.children === 'admin.library_ui.retry').onClick(); await flush();
  assert.equal(calls, 2); assert.ok(nodes(s.render()).some(n => n.props?.children === 'admin.tree_empty'));
  assert.ok(nodes(s.render()).some(n => n.type === 'Button' && n.props.children === 'admin.add_member')); assert.deepEqual(s.toast, []);
});
test('initial FamilyTree fetch carries AbortSignal and cancellation ignores a late response', async () => {
  let release; let signal; const s = familySetup((_, options) => { signal = options.signal; return new Promise(resolve => release = resolve); });
  assert.ok(signal); s.h.unmount(); assert.equal(signal.aborted, true);
  release(new Response(JSON.stringify({ data: [fixture] }))); await flush();
  assert.ok(!nodes(s.render()).some(n => n.type === 'MemberCard')); assert.deepEqual(s.toast, []);
});
test('member view controls retain grid/table/mindmap and family module tabs are removed', async () => {
  const s = familySetup(async () => new Response(JSON.stringify({ data: [fixture] }))); await flush();
  const initial = s.render();
  assert.ok(nodes(initial).some(node => node.type === 'MemberCard'));
  assert.ok(!nodes(initial).some(node => node.props?.role === 'tablist' || node.props?.role === 'tab'));
  find(initial, n => n.type === 'button' && n.props?.['aria-label'] === 'admin.view_table').onClick();
  assert.ok(nodes(s.render()).some(node => node.type === 'MemberTable'));
  find(s.render(), n => n.type === 'button' && n.props?.['aria-label'] === 'admin.view_mindmap').onClick();
  assert.ok(nodes(s.render()).some(node => node.type === 'Mindmap'));
});test('gallery thumbnails use the authenticated MyLife image endpoint and original opens Drive view', () => {
  const h = harness(); const images = load('src/features/admin/components/family-tree/LibraryImage.tsx', {
    react: h.hooks, 'react/jsx-runtime': { jsx: h.jsx, jsxs: h.jsx }, 'lucide-react': { ImageOff: 'ImageOff' }, '@/shared/hooks/useLanguage': { useLanguage: () => ({ t: key => key }) },
    '@/shared/api/apiClient': { apiClient: { url: path => `http://localhost:5274${path}` } },
  }, { URL });
  const wrapper = images.LibraryImage({ photoId: 45, url: 'https://lh3.googleusercontent.com/d/drive-id', driveFileId: 'drive-id', alt: 'Photo', variant: 'thumbnail' });
  const image = h.render(wrapper.type, wrapper.props); assert.equal(image.props.loading, 'lazy'); assert.equal(image.props.decoding,'async');
  assert.equal(image.props.src, 'http://localhost:5274/api/library/photos/45/image');
  assert.ok(!image.props.src.includes('googleusercontent.com'));
  assert.ok(!image.props.src.includes('drive.google.com/thumbnail'));
  assert.equal(images.libraryOriginalUrl('legacy','drive-id'),'https://drive.google.com/file/d/drive-id/view');
});
test('native cursor is used throughout the app', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  assert.ok(!read('src/App.tsx').includes('CustomCursor'));
  assert.ok(!fs.existsSync(path.join(__dirname, '..', 'src/shared/components/CustomCursor.tsx')));
  for (const sourcePath of ['src']) {
    const visit = directory => fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry =>
      entry.isDirectory() ? visit(path.join(directory, entry.name)) : [path.join(directory, entry.name)]);
    for (const file of visit(path.join(__dirname, '..', sourcePath)).filter(file => /\.(tsx?|cjs)$/.test(file))) {
      assert.ok(!fs.readFileSync(file, 'utf8').includes('data-custom-cursor'), `${file} still references a custom cursor`);
    }
  }
});
test('loading is driven by auth/import/API; critical messages exist in both locales', () => {
  const app = read('src/App.tsx'); assert.ok(!app.includes('1200')); assert.ok(app.includes('const { isLoading } = useAuth()'));
  for (const reduced of [false, true]) {
    const h = harness();
    const screen = load('src/shared/components/LoadingScreen.tsx', {
      react: { ...h.hooks, default: h.hooks }, 'react/jsx-runtime': { jsx: h.jsx, jsxs: h.jsx },
      'framer-motion': { motion: { div: 'motion.div' }, useReducedMotion: () => reduced },
      '../hooks/useLanguage': { useLanguage: () => ({ t: key => key }) },
    });
    const result = h.render(screen.LoadingScreen);
    assert.equal(result.props.role, 'status'); assert.equal(result.props['aria-label'], 'common.loading');
    const repeats = nodes(result).filter(n => n.props?.transition?.repeat !== undefined);
    assert.equal(repeats.length, 2); assert.ok(repeats.every(n => n.props.transition.repeat === (reduced ? 0 : Infinity)));
  }
  for (const locale of ['vi','en']) {
    const common = JSON.parse(read('src/shared/locales/'+locale+'/common.json')); const admin = JSON.parse(read('src/shared/locales/'+locale+'/admin.json'));
    for (const key of ['rate_limited','render_error','try_again']) assert.ok(common[key]);
    for (const key of ['my_family_tree','tree_empty','tree_empty_hint','search_member']) assert.ok(admin[key]);
  }
});
test('production manifest separates protected routes, defers Mindmap, and keeps Family Chart out of the runtime import closure', () => {
  const manifest = JSON.parse(read('dist/.vite/manifest.json'));
  const keys = Object.keys(manifest); const entry = keys.find(key => manifest[key].isEntry); const family = keys.find(key => key.endsWith('FamilyTreePage.tsx')); const admin = keys.find(key => key.endsWith('AdminDashboard.tsx')); const mindmap = keys.find(key => key.endsWith('FamilyMindmap.tsx')); const familyChart = keys.find(key => key.endsWith('FamilyChartView.tsx'));
  assert.ok(entry && family && admin && mindmap);
  assert.ok(familyChart);
  function closure(key, seen = new Set()) { if (seen.has(key)) return seen; seen.add(key); (manifest[key].imports ?? []).forEach(child => closure(child,seen)); return seen; }
  const home = closure(entry); assert.ok(!home.has(family) && !home.has(admin) && !home.has(mindmap));
  assert.ok(!closure(family).has(mindmap)); assert.ok(manifest[family].dynamicImports.includes(mindmap));
  assert.ok(!closure(family).has(familyChart));
  assert.ok(!read(join('dist', manifest[family].file)).includes('FamilyChartView'));
});
