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
  }, Intl, URL, ...globals });
  return exports;
}
async function setup() {
  const i18n = i18next.createInstance();
  const resources = Object.fromEntries(['vi', 'en'].map(lang => [lang, { translation: {
    admin: JSON.parse(readFileSync(join(__dirname, `../src/shared/locales/${lang}/admin.json`), 'utf8')),
  } }]));
  await i18n.init({ lng: 'vi', fallbackLng: false, resources });
  const state = []; const memos = []; const effects = []; let cursor = 0; let pending = [];
  const hooks = {
    useState(initial) {
      const index = cursor++;
      if (!(index in state)) state[index] = typeof initial === 'function' ? initial() : initial;
      return [state[index], next => { state[index] = typeof next === 'function' ? next(state[index]) : next; }];
    },
    useMemo(callback, deps) {
      const index = cursor++;
      if (!memos[index] || deps.some((dep, position) => !Object.is(dep, memos[index].deps[position]))) memos[index] = { deps, value: callback() };
      return memos[index].value;
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
    '@/shared/api/apiClient': { apiClient: { url: path => `http://localhost:5274${path}` } },
    '@/shared/components/ui': { Button: 'Button', Modal: 'Modal' },
    '../../services/featureMessages': { getFeatureErrorKey: () => 'admin.library_ui.upload_failed' },
  };
  const dateRuntime = { forwardRef: render => render, useRef: initial => ({ current: initial }) };
  const dateHelpers = load('../../../../shared/components/ui/DateInput.tsx', {
    react: Object.assign(dateRuntime, { default: dateRuntime }), 'react/jsx-runtime': { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) },
    'lucide-react': { Calendar: 'Calendar' }, './Input': { Input: 'Input' },
  });
  mocks['@/shared/components/ui'] = { Button: 'Button', Modal: 'Modal', Select: 'Select', DateInput: 'DateInput',
    validateCalendarDate: dateHelpers.validateCalendarDate };
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

test('category/date controls keep rounded sizing and dynamic custom names retain their original language', async () => {
  const h = await setup(); const f = h.fields;
  const text = f.LibraryTextField({ label: 'Date' });
  assert.ok(find(text, 'input').className.includes('rounded-2xl'));
  assert.ok(f.libraryFieldClass.includes('min-h-[56px]')); assert.ok(f.libraryFieldClass.includes('rounded-2xl'));
  const fields = f.LibraryPhotoFormFields({ value: { category: 'photos' }, onChange() {}, disabled: false, categories });
  const date = find(fields, 'DateInput');
  assert.equal(date.label, h.i18n.t('admin.library_ui.field_date'));
  assert.equal(date.placeholder, 'DD/MM/YYYY');
  assert.equal(f.libraryDisplayDateError('31/02/2026'), 'admin.library_ui.date_invalid');
  assert.equal(f.libraryDisplayDateError('31/12/9999'), 'admin.library_ui.date_future');
  assert.equal(f.libraryDisplayDateError(''), null);
  await h.i18n.changeLanguage('en');
  assert.equal(f.libraryCategoryLabel(categories[1], h.i18n.t.bind(h.i18n)), 'Du lịch');
  assert.equal(f.libraryCategoryLabel(categories[0], h.i18n.t.bind(h.i18n)), h.i18n.t('admin.cat_photos'));
});

test('upload and photo edit both block invalid display dates before calling their handlers', async () => {
  {
    const h = await setup(); let requests = 0;
    const Component = load('LibraryUploadModal.tsx', h.mocks, { URL: { createObjectURL: () => 'blob:x', revokeObjectURL() {} } }).LibraryUploadModal;
    const render = () => h.render(Component, { albums: [{ id: 1 }], categories, initialAlbumId: 1,
      initialCategory: 'photos', onClose() {}, onSubmit: async () => requests++ });
    let tree = render(); find(tree, 'input').onChange({ target: { files: [file('a.jpg')], value: '' } }); tree = render();
    const fieldProps = find(tree, h.fields.LibraryPhotoFormFields);
    find(h.fields.LibraryPhotoFormFields(fieldProps), 'DateInput').onValueChange('31/02/2026'); tree = render();
    await find(tree, 'form').onSubmit(event); tree = render();
    assert.equal(requests, 0);
    assert.equal(find(tree, 'p', props => props.role === 'alert').children, h.i18n.t('admin.library_ui.date_invalid'));
    h.unmount();
  }
  {
    const h = await setup(); let requests = 0;
    const Component = load('LibraryPhotoEditModal.tsx', h.mocks).LibraryPhotoEditModal;
    const render = () => h.render(Component, { photo: { id: 1, title: 'Photo', category: 'photos', year: '09/10/2020' },
      categories, onClose() {}, onSubmit: async () => requests++ });
    let tree = render();
    const fieldProps = find(tree, h.fields.LibraryPhotoFormFields);
    find(h.fields.LibraryPhotoFormFields(fieldProps), 'DateInput').onValueChange('31/12/9999'); tree = render();
    await find(tree, 'form').onSubmit(event); tree = render();
    assert.equal(requests, 0);
    assert.equal(find(tree, 'p', props => props.role === 'alert').children, h.i18n.t('admin.library_ui.date_future'));
    h.unmount();
  }
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

test('managed Library image uses only the MyLife proxy and shows placeholder after one failed request', async () => {
  const h = await setup(); const images = load('LibraryImage.tsx', h.mocks);
  const wrapper = images.LibraryImage({ photoId: 12, url: 'https://lh3.googleusercontent.com/d/drive-id', driveFileId: 'drive-id', alt: 'Dog', className: 'object-cover' });
  const render = () => h.render(wrapper.type, wrapper.props);
  let tree = render(); assert.equal(tree.props.src, 'http://localhost:5274/api/library/photos/12/image');
  assert.ok(!tree.props.src.includes('lh3.googleusercontent.com'));
  assert.ok(!tree.props.src.includes('drive.google.com/thumbnail'));
  tree.props.onError(); tree = render(); assert.equal(tree.type, 'div'); assert.equal(tree.props.role, 'img');
  assert.equal(nodes(tree).filter(node => node.type === 'img').length, 0);
  await h.i18n.changeLanguage('en'); assert.ok(render().props['aria-label'].includes('Unable to load image'));
  assert.notEqual(images.LibraryImage({ photoId: 13, alt: 'Next' }).key, wrapper.key);
  assert.equal(images.libraryOriginalUrl('legacy', 'drive-id'), 'https://drive.google.com/file/d/drive-id/view');
  assert.equal(images.libraryOriginalUrl('legacy', ''), 'legacy');
});


test('category edit reuses modal with initial name, Save, custom validation and trimmed request', async () => {
  for (const locale of ['vi', 'en']) {
    const h = await setup(); await h.i18n.changeLanguage(locale); let saved; let closed = 0;
    const Component = load('LibraryCategoryModal.tsx', h.mocks).LibraryCategoryModal;
    const render = () => h.render(Component, { category: categories[1], onSubmit: async name => { saved = name; }, onClose: () => closed++ });
    let tree = render();
    assert.equal(find(tree, 'Modal').title, h.i18n.t('admin.library_ui.edit_category'));
    assert.equal(find(tree, h.fields.LibraryTextField).value, 'Du lịch');
    assert.equal(find(tree, 'Button', props => props.type === 'submit').children, h.i18n.t('admin.library_ui.save'));
    assert.equal(find(tree, 'form').noValidate, true);
    find(tree, h.fields.LibraryTextField).onChange({ target: { value: '   ' } });
    await find(render(), 'form').onSubmit(event);
    assert.equal(saved, undefined); assert.equal(closed, 0);
    assert.equal(find(render(), 'p', props => props.role === 'alert').children, h.i18n.t('admin.library_ui.category_name_required'));
    find(render(), h.fields.LibraryTextField).onChange({ target: { value: ' Du lịch gia đình ' } });
    await find(render(), 'form').onSubmit(event);
    assert.equal(saved, 'Du lịch gia đình');
  }
});

test('image uses backend URL consistently across repeated renders and lazy-loads gallery thumbnails', async () => {
  const h = await setup(); const images = load('LibraryImage.tsx', h.mocks);
  const photo = { photoId: 1, url: 'https://example.com/success.webp', driveFileId: 'success-id', variant: 'thumbnail', alt: 'Photo' };
  const wrapper = h.render(images.LibraryImage, photo);
  const first = h.render(wrapper.type, wrapper.props);
  assert.equal(first.type, 'img'); assert.equal(first.key, undefined);
  assert.equal(first.props.src, 'http://localhost:5274/api/library/photos/1/image'); assert.equal(first.props.loading, 'lazy'); assert.equal(first.props.decoding, 'async');
  for (let index = 0; index < 30; index++) {
    const rerender = h.render(images.LibraryImage, { ...photo, alt: 'Updated caption', className: 'new-class' });
    assert.equal(rerender.key, wrapper.key);
    assert.equal(h.render(rerender.type, rerender.props).props.src, 'http://localhost:5274/api/library/photos/1/image');
  }
});

test('image failure has no Google fallback or retry chain', async () => {
  const h = await setup(); const images = load('LibraryImage.tsx', h.mocks);
  const photo = { photoId: 1, url: 'https://example.com/failure.webp', driveFileId: 'failed-id', variant: 'thumbnail', alt: 'Photo' };
  const wrapper = h.render(images.LibraryImage, photo);
  const render = () => {
    const next = h.render(images.LibraryImage, { ...photo, className: 'rerender' });
    assert.equal(next.key, wrapper.key);
    return h.render(next.type, next.props);
  };
  const primary = render(); assert.equal(primary.props.src, 'http://localhost:5274/api/library/photos/1/image'); primary.props.onError();
  for (let index = 0; index < 30; index++) {
    const result = render(); assert.equal(result.type, 'div'); assert.equal(nodes(result).filter(node => node.type === 'img').length, 0);
  }
});

test('closed lightbox renders no image; an open lightbox renders one high-resolution image for the photo', async () => {
  const h = await setup();
  h.mocks['react-dom'] = { createPortal: tree => tree };
  h.mocks['@/shared/hooks/useBodyScrollLock'] = { useBodyScrollLock() {} };
  h.mocks['framer-motion'] = { motion: { div: 'motion.div' }, AnimatePresence: 'AnimatePresence' };
  h.mocks['./LibraryImage'] = { LibraryImage: 'LibraryImage', libraryOriginalUrl: url => url };
  const document = { body: { style: {} }, documentElement: { style: {} } };
  const window = { addEventListener() {}, removeEventListener() {} };
  const { PhotoLightboxModal } = load('PhotoLightboxModal.tsx', h.mocks, { document, window });
  assert.equal(h.render(PhotoLightboxModal, { photo: null, onClose() {} }), null);
  const tree = h.render(PhotoLightboxModal, { photo: { id: 7, title: 'WebP', url: 'primary', driveFileId: 'drive-id' }, onClose() {} });
  const images = nodes(tree).filter(node => node.type === 'LibraryImage');
  assert.equal(images.length, 1); assert.equal(images[0].props.variant, 'lightbox'); assert.equal(images[0].props.photoId, 7);
  assert.equal(h.render(PhotoLightboxModal, { photo: null, onClose() {} }), null);
});
