const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const i18next = require('i18next');

const folder = 'src/features/admin/components/family-tree/';
function load(file, mocks, globals = {}) {
  const source = readFileSync(join(__dirname, '..', folder, file), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
  } });
  const exports = {};
  new vm.Script(outputText, { filename: file }).runInNewContext({ exports, require: name => {
    assert.ok(name in mocks, `Unexpected import ${name}`); return mocks[name];
  }, Intl, ...globals });
  return exports;
}
async function setup() {
  const i18n = i18next.createInstance();
  const resources = Object.fromEntries(['vi', 'en'].map(lang => [lang, { translation: {
    admin: JSON.parse(readFileSync(join(__dirname, `../src/shared/locales/${lang}/admin.json`), 'utf8')),
  } }]));
  await i18n.init({ lng: 'vi', fallbackLng: false, resources });
  const state = []; const effects = []; let cursor = 0; let pending = [];
  const hooks = {
    useState(initial) {
      const index = cursor++;
      if (!(index in state)) state[index] = typeof initial === 'function' ? initial() : initial;
      return [state[index], next => { state[index] = typeof next === 'function' ? next(state[index]) : next; }];
    },
    useRef(initial) { const index = cursor++; return state[index] ??= { current: initial }; },
    useEffect(callback, deps) {
      const index = cursor++;
      if (!effects[index] || deps.some((dep, position) => !Object.is(dep, effects[index].deps[position]))) {
        pending.push(() => { effects[index]?.cleanup?.(); effects[index] = { deps, cleanup: callback() }; });
      }
    },
  };
  const jsx = (type, props, key) => ({ type, props, key });
  const mocks = {
    react: hooks, 'react/jsx-runtime': { jsx, jsxs: jsx },
    'lucide-react': new Proxy({}, { get: (_, key) => key }),
    '@/shared/hooks/useLanguage': { useLanguage: () => ({ t: i18n.t.bind(i18n), language: i18n.language }) },
    '@/shared/components/ui': { Button: 'Button', Modal: 'Modal' },
    '../../services/featureMessages': { getFeatureErrorKey: () => 'admin.library_ui.upload_failed' },
  };
  const fields = load('LibraryPhotoFormFields.tsx', mocks);
  mocks['./LibraryPhotoFormFields'] = fields;
  return { i18n, fields, mocks,
    render(component, props) { cursor = 0; const tree = component(props); const tasks = pending; pending = []; tasks.forEach(task => task()); return tree; },
    unmount() { effects.forEach(effect => effect?.cleanup?.()); },
  };
}
function nodes(tree) {
  if (!tree || typeof tree !== 'object') return [];
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  return [tree, ...nodes(tree.props?.children)];
}
function find(tree, type, predicate = () => true) {
  const node = nodes(tree).find(node => node.type === type && predicate(node.props));
  assert.ok(node, `Missing ${typeof type === 'string' ? type : type.name}`); return node.props;
}
const event = { preventDefault() {} };
const categories = [ { id: 1, slug: 'photos', name: 'Ảnh tư liệu', isDefault: true },
  { id: 5, slug: 'du-lich', name: 'Du lịch', isDefault: false } ];
const file = (name, type = 'image/jpeg', size = 1024) => ({ name, type, size });

test('album/category blank names stay open, make no request, and errors follow a locale switch', async () => {
  for (const [componentFile, componentName, key] of [
    ['LibraryAlbumModal.tsx', 'LibraryAlbumModal', 'name_required'],
    ['LibraryCategoryModal.tsx', 'LibraryCategoryModal', 'category_name_required'],
  ]) {
    const h = await setup(); let requests = 0; let closed = 0;
    const Component = load(componentFile, h.mocks)[componentName];
    const render = () => h.render(Component, { onSubmit: async () => requests++, onClose: () => closed++, album: null });
    let tree = render();
    assert.equal(find(tree, 'form').noValidate, true);
    const field = find(tree, h.fields.LibraryTextField);
    assert.equal(field.required, undefined); assert.ok(!field.label.includes('*'));
    for (const name of ['', '   ']) {
      find(tree, h.fields.LibraryTextField).onChange({ target: { value: name } }); tree = render();
      await find(tree, 'form').onSubmit(event); tree = render();
      assert.equal(find(tree, 'p', props => props.role === 'alert').children, h.i18n.t(`admin.library_ui.${key}`));
    }
    await h.i18n.changeLanguage('en'); tree = render();
    assert.equal(find(tree, 'p', props => props.role === 'alert').children, h.i18n.t(`admin.library_ui.${key}`));
    assert.equal(requests, 0); assert.equal(closed, 0);
    assert.ok(!h.i18n.t('admin.library_ui.create_album').includes('+'));
  }
});

test('upload previews use object URLs and revoke all URLs on replace, remove and unmount', async () => {
  const h = await setup(); const created = []; const revoked = []; let uploaded;
  const { LibraryUploadModal } = load('LibraryUploadModal.tsx', h.mocks, { URL: {
    createObjectURL: file => { const url = `blob:${created.length}`; created.push({ file, url }); return url; },
    revokeObjectURL: url => revoked.push(url),
  } });
  const render = () => h.render(LibraryUploadModal, { albums: [{ id: 1 }], categories, initialAlbumId: 1,
    initialCategory: 'du-lich', onClose() { h.unmount(); }, onSubmit: async (_, files) => { uploaded = files; } });
  let tree = render(); tree = render();
  const selected = [file('A.jpg'), file('B.png', 'image/png'), file('Dog.webp', 'image/webp'), file('C.gif', 'image/gif')];
  find(tree, 'input').onChange({ target: { files: selected, value: '' } }); render(); tree = render();
  assert.equal(nodes(tree).filter(node => node.type === 'img').length, 4);
  assert.deepEqual(created.map(entry => entry.file.name), selected.map(file => file.name));
  assert.equal(find(tree, h.fields.LibraryPhotoFormFields).value.category, 'du-lich');
  find(tree, 'button', props => props['aria-label'].includes('B.png')).onClick(); render(); tree = render();
  assert.deepEqual(revoked, ['blob:0', 'blob:1', 'blob:2', 'blob:3']);
  assert.equal(nodes(tree).filter(node => node.type === 'img').length, 3);
  await find(tree, 'form').onSubmit(event);
  assert.deepEqual(Array.from(uploaded, file => file.name), ['A.jpg', 'Dog.webp', 'C.gif']);
  tree = render(); find(tree, 'input').onChange({ target: { files: [file('Replacement.png', 'image/png')], value: '' } });
  render(); tree = render();
  assert.equal(revoked.length, 7);
  find(tree, 'Modal').onClose(); assert.equal(revoked.length, created.length);
  assert.equal(new Set(revoked).size, revoked.length);
});

test('upload rejects empty/21/zero-byte/oversize/MIME files and accepts exact limits, with translated errors', async () => {
  for (const [selected, key] of [
    [[], 'images_required'], [Array.from({ length: 21 }, (_, i) => file(`${i}.jpg`)), 'file_count'],
    [[file('empty.jpg', 'image/jpeg', 0)], 'file_size'], [[file('big.jpg', 'image/jpeg', 5 * 1024 * 1024 + 1)], 'file_size'],
    [[file('wrong.svg', 'image/svg+xml')], 'file_invalid'], [Array.from({ length: 20 }, (_, i) => file(`${i}.gif`, 'image/gif', 5 * 1024 * 1024)), null],
  ]) {
    const h = await setup(); let requests = 0;
    const Component = load('LibraryUploadModal.tsx', h.mocks, { URL: { createObjectURL: () => 'blob:x', revokeObjectURL() {} } }).LibraryUploadModal;
    const render = () => h.render(Component, { albums: [{ id: 1 }], categories, initialAlbumId: 1, initialCategory: 'all', onClose() {}, onSubmit: async () => requests++ });
    let tree = render(); find(tree, 'input').onChange({ target: { files: selected, value: '' } }); tree = render();
    assert.equal(find(tree, h.fields.LibraryPhotoFormFields).value.category, 'photos');
    await find(tree, 'form').onSubmit(event); tree = render();
    if (key) {
      assert.equal(requests, 0); assert.equal(find(tree, 'p', props => props.role === 'alert').children, h.i18n.t(`admin.library_ui.${key}`));
      await h.i18n.changeLanguage('en'); tree = render();
      assert.equal(find(tree, 'p', props => props.role === 'alert').children, h.i18n.t(`admin.library_ui.${key}`));
    } else assert.equal(requests, 1);
    h.unmount();
  }
});

test('category/date controls share sizing and dynamic custom names retain their original language', async () => {
  const h = await setup(); const f = h.fields;
  const text = f.LibraryTextField({ label: 'Date' }); const select = f.LibrarySelectField({ label: 'Category' });
  assert.equal(find(text, 'input').className, find(select, 'select').className);
  assert.ok(f.libraryFieldClass.includes('min-h-[56px]')); assert.ok(f.libraryFieldClass.includes('rounded-2xl'));
  await h.i18n.changeLanguage('en');
  assert.equal(f.libraryCategoryLabel(categories[1], h.i18n.t.bind(h.i18n)), 'Du lịch');
  assert.equal(f.libraryCategoryLabel(categories[0], h.i18n.t.bind(h.i18n)), h.i18n.t('admin.cat_photos'));
});

test('upload requires an accessible album/category and falls back to the first dynamic category', async () => {
  for (const [albumId, registry, expected] of [
    [undefined, categories, 'album_required'], [99, categories, 'album_required'], [1, [], 'category_required'],
  ]) {
    const h = await setup(); let requests = 0;
    const Component = load('LibraryUploadModal.tsx', h.mocks, { URL: { createObjectURL: () => 'blob:x', revokeObjectURL() {} } }).LibraryUploadModal;
    const render = () => h.render(Component, { albums: [{ id: 1 }], categories: registry, initialAlbumId: albumId,
      initialCategory: 'all', onClose() {}, onSubmit: async () => requests++ });
    await find(render(), 'form').onSubmit(event);
    assert.equal(find(render(), 'p', props => props.role === 'alert').children, h.i18n.t(`admin.library_ui.${expected}`));
    assert.equal(requests, 0); h.unmount();
  }
  const h = await setup();
  const Component = load('LibraryUploadModal.tsx', h.mocks, { URL: { createObjectURL() {}, revokeObjectURL() {} } }).LibraryUploadModal;
  const tree = h.render(Component, { albums: [{ id: 1 }], categories: [categories[1]], initialAlbumId: 1,
    initialCategory: 'all', onClose() {}, onSubmit: async () => {} });
  assert.equal(find(tree, h.fields.LibraryPhotoFormFields).value.category, 'du-lich'); h.unmount();
});

test('image tries primary then unique Drive thumbnail once, ignores stale errors, then renders translated placeholder', async () => {
  const h = await setup(); const images = load('LibraryImage.tsx', h.mocks);
  const wrapper = images.LibraryImage({ url: 'https://example.com/image', driveFileId: 'drive-id', alt: 'Dog', className: 'object-cover' });
  const render = () => h.render(wrapper.type, wrapper.props);
  let tree = render(); assert.equal(tree.props.src, 'https://example.com/image');
  const firstError = tree.props.onError; firstError(); tree = render();
  assert.equal(tree.props.src, 'https://drive.google.com/thumbnail?id=drive-id&sz=w1600');
  firstError(); assert.equal(render().props.src, tree.props.src);
  tree.props.onError(); tree = render(); assert.equal(tree.type, 'div'); assert.equal(tree.props.role, 'img');
  assert.equal(nodes(tree).filter(node => node.type === 'img').length, 0);
  await h.i18n.changeLanguage('en'); assert.ok(render().props['aria-label'].includes('Unable to load image'));
  assert.equal(images.libraryImageCandidates('https://drive.google.com/thumbnail?id=drive-id&sz=w1600', 'drive-id').length, 1);
  assert.equal(images.libraryImageCandidates(null, null).length, 0);
  assert.notEqual(images.LibraryImage({ url: 'https://example.com/new' }).key, wrapper.key);
  assert.equal(images.libraryOriginalUrl('legacy', 'drive-id'), 'https://drive.google.com/file/d/drive-id/view');
  assert.equal(images.libraryOriginalUrl('legacy', ''), 'legacy');
});
