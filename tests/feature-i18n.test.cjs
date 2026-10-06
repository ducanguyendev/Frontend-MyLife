const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const i18next = require('i18next');

function load(path, mocks = {}) {
  const source = readFileSync(join(__dirname, '..', path), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
  } });
  const exports = {};
  new vm.Script(outputText, { filename: path }).runInNewContext({ exports, require: name => {
    assert.ok(name in mocks, `Unexpected import ${name}`); return mocks[name];
  }, AbortController, console: { log() {} }, document: { addEventListener() {}, removeEventListener() {} } });
  return exports;
}
const messages = load('src/features/admin/services/featureMessages.ts');
async function translator(locale) {
  const i18n = i18next.createInstance();
  const resources = Object.fromEntries(['vi', 'en'].map(language => [language, { translation: {
    admin: JSON.parse(readFileSync(join(__dirname, `../src/shared/locales/${language}/admin.json`), 'utf8')),
    common: JSON.parse(readFileSync(join(__dirname, `../src/shared/locales/${language}/common.json`), 'utf8')),
  } }]));
  await i18n.init({ lng: locale, fallbackLng: false, resources, interpolation: { escapeValue: false } });
  return i18n;
}
function harness() {
  const states = []; const effects = []; let index = 0;
  const hooks = {
    useState: initial => {
      const position = index++;
      if (!(position in states)) states[position] = typeof initial === 'function' ? initial() : initial;
      return [states[position], next => { states[position] = typeof next === 'function' ? next(states[position]) : next; }];
    },
    useEffect: effect => { effects.push(effect); }, useCallback: callback => callback, useMemo: callback => callback(), forwardRef: callback => callback,
  };
  const jsx = (type, props) => ({ type, props });
  return { hooks, jsx, render: (component, props) => { index = 0; return component(props); },
    mount: async () => { effects.splice(0).forEach(effect => effect()); await flush(); } };
}
const flush = () => new Promise(resolve => setImmediate(resolve));
function nodes(tree) {
  if (!tree || typeof tree !== 'object') return [];
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  return [tree, ...nodes(tree.props?.children)];
}
const find = (tree, type, condition = () => true) => {
  const node = nodes(tree).find(node => node.type === type && condition(node.props));
  assert.ok(node, `Missing ${type}`); return node.props;
};
const stubNames = ['MemberCard', 'MemberListItem', 'MemberDetailModal', 'MemberFormModal', 'DeleteConfirmModal',
  'AnniversaryTab', 'LibraryTab', 'FamilyMapTab', 'FamilyMindmap'];

async function familySetup(locale, response = { success: true, message: 'Family member deleted.' }) {
  const i18n = await translator(locale); const t = i18n.t.bind(i18n); const hooks = harness(); const toasts = [];
  const member = { id: 15, fullName: 'Nguyễn Văn An', generation: 1, gender: 'Nam' };
  const calls = [];
  const apiClient = { requestRaw: async (path, options = {}) => {
    calls.push({ path, method: options.method });
    return new Response(JSON.stringify(options.method ? response : { data: [member] }), {
      status: response.success === false && options.method ? 404 : 200, headers: { 'Content-Type': 'application/json' },
    });
  } };
  const { FamilyTreeManager } = load('src/features/admin/components/FamilyTreeManager.tsx', {
    react: { ...hooks.hooks, default: hooks.hooks }, 'react/jsx-runtime': { jsx: hooks.jsx, jsxs: hooks.jsx },
    'lucide-react': new Proxy({}, { get: (_, key) => key }), '@/shared/hooks/useLanguage': { useLanguage: () => ({ t, language: i18n.language }) },
    '@/shared/components/ui': { Button: 'Button' }, '@/shared/api/apiClient': { apiClient }, '../services/featureMessages': messages,
    './family-tree': { ...Object.fromEntries(stubNames.map(name => [name, name])), removeVietnameseTones: name => name },
  });
  const render = () => hooks.render(FamilyTreeManager, { showToast: (text, ok) => toasts.push({ text, ok }) });
  render(); await hooks.mount();
  return { render, toasts, member, calls, t };
}

for (const locale of ['vi', 'en']) {
  test(`${locale}: actual FamilyTree delete ignores backend English success and interpolates member name`, async () => {
    const setup = await familySetup(locale);
    find(setup.render(), 'MemberCard').onDelete(setup.member);
    await find(setup.render(), 'DeleteConfirmModal').onConfirm();
    assert.deepEqual(setup.toasts.at(-1), { text: locale === 'vi' ? 'Đã xóa thành viên Nguyễn Văn An thành công.' : 'Member Nguyễn Văn An was deleted successfully.', ok: true });
    assert.ok(!setup.toasts.at(-1).text.includes('Family member deleted'));
    assert.equal(setup.calls.at(-1).method, 'DELETE');
  });
  test(`${locale}: actual FamilyTree create/update success use separate localized actions`, async () => {
    const setup = await familySetup(locale, { success: true, message: 'English created/updated.' });
    find(setup.render(), 'Button', props => props.title === setup.t('admin.add_member')).onClick();
    await find(setup.render(), 'MemberFormModal').onSubmit({ preventDefault() {} });
    assert.equal(setup.toasts.at(-1).text, setup.t('admin.member_create_success'));
    await flush();
    find(setup.render(), 'MemberCard').onEdit(setup.member);
    await find(setup.render(), 'MemberFormModal').onSubmit({ preventDefault() {} });
    assert.equal(setup.toasts.at(-1).text, setup.t('admin.member_update_success'));
  });
}

test('actual FamilyTree error code translates; raw backend message is never shown', async () => {
  const setup = await familySetup('vi', { success: false, code: 'FAMILY_MEMBER_NOT_FOUND', message: 'Family member not found.' });
  find(setup.render(), 'MemberCard').onDelete(setup.member);
  await find(setup.render(), 'DeleteConfirmModal').onConfirm();
  assert.deepEqual(setup.toasts.at(-1), { text: 'Không tìm thấy thành viên.', ok: false });
});

for (const locale of ['vi', 'en']) {
  test(`${locale}: actual Library callbacks localize album/photo CRUD and upload success`, async () => {
    const i18n = await translator(locale); const t = i18n.t.bind(i18n); const h = harness(); const toasts = [];
    const album = { id: 1, name: 'Family', photos: [] }; const photo = { id: 15, albumId: 1, title: 'Photo', category: 'photos' };
    const libraryService = { getCategories: async () => [{ id: 1, name: 'Photos', slug: 'photos', isDefault: true }],
      createCategory: async () => ({ id: 5, name: 'Du lịch', slug: 'du-lich', isDefault: false }), deleteCategory: async () => {},
      getAlbums: async () => [album], getAlbum: async () => album,
      createAlbum: async () => album, updateAlbum: async () => album, deleteAlbum: async () => {},
      uploadPhotos: async () => [], updatePhoto: async () => {}, deletePhoto: async () => {} };
    const { LibraryTab } = load('src/features/admin/components/family-tree/LibraryTab.tsx', {
      react: { ...h.hooks, default: h.hooks }, 'react/jsx-runtime': { jsx: h.jsx, jsxs: h.jsx },
      'lucide-react': new Proxy({}, { get: (_, key) => key }), '@/shared/hooks/useLanguage': { useLanguage: () => ({ t }) },
      '@/shared/components/ui': { Button: 'Button', Modal: 'Modal' }, '../../services/featureMessages': messages,
      '../../services/libraryService': { libraryService }, './PhotoLightboxModal': { PhotoLightboxModal: 'Lightbox' },
      './LibraryAlbumModal': { LibraryAlbumModal: 'AlbumModal' }, './LibraryUploadModal': { LibraryUploadModal: 'UploadModal' },
      './LibraryPhotoEditModal': { LibraryPhotoEditModal: 'PhotoModal' },
      './LibraryCategoryModal': { LibraryCategoryModal: 'CategoryModal' }, './LibraryImage': { LibraryImage: 'LibraryImage' },
      './LibraryPhotoFormFields': { libraryFieldClass: '', libraryCategoryLabel: category => category.name },
    });
    const render = () => h.render(LibraryTab, { showToast: text => toasts.push(text) });
    render(); await h.mount();
    find(render(), 'Button', props => props.children === t('admin.library_ui.create_album')).onClick();
    await find(render(), 'AlbumModal').onSubmit({ name: 'Family' });
    assert.equal(toasts.at(-1), t('admin.library_ui.album_created'));
    find(render(), 'button', props => props['aria-label'] === t('admin.library_ui.edit_album')).onClick();
    await find(render(), 'AlbumModal').onSubmit({ name: 'Renamed' });
    assert.equal(toasts.at(-1), t('admin.library_ui.album_updated'));
    find(render(), 'Button', props => props.children === t('admin.library_ui.upload')).onClick();
    await find(render(), 'UploadModal').onSubmit(1, [], { category: 'photos' });
    assert.equal(toasts.at(-1), t('admin.library_ui.photo_uploaded'));
    find(render(), 'Lightbox').onEdit(photo); await find(render(), 'PhotoModal').onSubmit({ category: 'photos' });
    assert.equal(toasts.at(-1), t('admin.library_ui.photo_updated'));
    find(render(), 'Lightbox').onDelete(photo);
    find(render(), 'Button', props => props.variant === 'danger').onClick(); await flush();
    assert.equal(toasts.at(-1), t('admin.library_ui.photo_deleted'));
    find(render(), 'button', props => props['aria-label'] === t('admin.library_ui.delete_album')).onClick();
    find(render(), 'Button', props => props.variant === 'danger').onClick(); await flush();
    assert.equal(toasts.at(-1), t('admin.library_ui.album_deleted'));
    find(render(), 'Button', props => props.children === t('admin.library_ui.create_category')).onClick();
    await find(render(), 'CategoryModal').onSubmit('Du lịch');
    assert.equal(toasts.at(-1), t('admin.library_ui.category_created'));
    find(render(), 'button', props => props['aria-label'] === t('admin.library_ui.delete_category')).onClick();
    find(render(), 'Button', props => props.variant === 'danger').onClick(); await flush();
    assert.equal(toasts.at(-1), t('admin.library_ui.category_deleted'));
  });
}

test('all success/error/validation keys including category translations exist in VI and EN', async () => {
  const vi = await translator('vi'); const en = await translator('en');
  const keys = [...Object.values(messages.featureSuccessKeys), 'admin.library_ui.name_required', 'admin.library_ui.category_name_required',
    'admin.library_ui.album_required', 'admin.library_ui.images_required', 'admin.library_ui.file_size', 'admin.library_ui.file_invalid', 'admin.library_ui.file_count'];
  for (const key of keys) { assert.ok(vi.exists(key), key); assert.ok(en.exists(key), key); assert.notEqual(vi.t(key), en.t(key)); }
  assert.equal(vi.t(messages.featureSuccessKeys.categoryCreate), 'Tạo danh mục thành công.');
  assert.equal(vi.t(messages.featureSuccessKeys.categoryDelete), 'Đã xóa danh mục thành công.');
});

test('known codes, old status-only responses and unknown errors never expose raw English', async () => {
  const i18n = await translator('vi');
  for (const [error, action, expected] of [
    [{ payload: { code: 'LIBRARY_CATEGORY_IN_USE', message: 'English raw' }, status: 400 }, 'album_delete', 'admin.library_ui.category_in_use'],
    [{ payload: { code: 'LIBRARY_INVALID_IMAGE' }, status: 400 }, 'photo_upload', 'admin.library_ui.file_invalid'],
    [{ status: 0, message: 'Failed to fetch' }, 'member_load', 'admin.notifications.connection_failed'],
    [{ status: 404, payload: { message: 'Album not found.' } }, 'album_delete', 'admin.library_ui.album_not_found'],
    [{ status: 502, payload: { message: 'Drive delete failed.' } }, 'photo_delete', 'admin.library_ui.photo_delete_failed'],
    [{ payload: { code: 'LIBRARY_STORAGE_FAILED', message: 'Drive failed' } }, 'photo_upload', 'admin.library_ui.upload_failed'],
    [{ payload: { code: 'LIBRARY_NOT_FOUND' } }, 'photo_save', 'admin.library_ui.photo_not_found'],
    [{ status: 400, errors: { Name: ['English validation'] } }, 'album_save', 'admin.library_ui.validation'],
    [{ payload: { code: 'UNKNOWN_NEW_CODE', message: 'Raw new error' } }, 'photo_save', 'admin.library_ui.photo_save_failed'],
  ]) {
    const key = messages.getFeatureErrorKey(error, action); assert.equal(key, expected); assert.ok(i18n.exists(key));
    assert.notEqual(i18n.t(key), error.message ?? error.payload?.message);
  }
});

test('Library validation key changes language while the same form error remains visible', async () => {
  const i18n = await translator('vi'); const h = harness(); const t = i18n.t.bind(i18n);
  const { LibraryAlbumModal } = load('src/features/admin/components/family-tree/LibraryAlbumModal.tsx', {
    react: h.hooks, 'react/jsx-runtime': { jsx: h.jsx, jsxs: h.jsx }, '@/shared/hooks/useLanguage': { useLanguage: () => ({ t }) },
    '@/shared/components/ui': { Button: 'Button', Input: 'Input', Modal: 'Modal' }, '../../services/featureMessages': messages,
    './LibraryPhotoFormFields': { libraryFieldClass: '', LibraryTextField: 'Input', LibraryTextArea: 'Textarea' },
  });
  const render = () => h.render(LibraryAlbumModal, { onSubmit: () => assert.fail('invalid name submitted'), onClose() {} });
  await find(render(), 'form').onSubmit({ preventDefault() {} });
  assert.equal(find(render(), 'p', props => props.role === 'alert').children, 'Vui lòng nhập tên album.');
  await i18n.changeLanguage('en');
  assert.equal(find(render(), 'p', props => props.role === 'alert').children, 'Please enter an album name.');
});

test('Member form validations, including birth date, follow current locale without raw helper defaults', async () => {
  const i18n = await translator('vi'); const t = i18n.t.bind(i18n); const h = harness();
  const jsxMock = { jsx: h.jsx, jsxs: h.jsx };
  const dateHelpers = load('src/shared/components/ui/DateInput.tsx', {
    react: { ...h.hooks, default: h.hooks }, 'react/jsx-runtime': jsxMock,
    'lucide-react': { Calendar: 'Calendar' }, './Input': { Input: 'Input' },
  });
  const { MemberFormModal } = load('src/features/admin/components/family-tree/MemberFormModal.tsx', {
    react: { ...h.hooks, default: h.hooks }, 'react/jsx-runtime': jsxMock,
    'lucide-react': new Proxy({}, { get: (_, key) => key }),
    'framer-motion': { motion: new Proxy({}, { get: (_, key) => key }), AnimatePresence: 'AnimatePresence' },
    '@/shared/hooks/useLanguage': { useLanguage: () => ({ t, language: i18n.language }) },
    '@/shared/api/apiClient': { apiClient: {} }, './types': { removeVietnameseTones: value => value },
    '@/shared/components/ui': { ...dateHelpers, ...Object.fromEntries(['Modal', 'Button', 'Input', 'Select', 'Textarea', 'DateInput'].map(name => [name, name])) },
  });
  let member = { fullName: '', generation: 1, role: 'Tổ tiên', dateOfBirth: '' };
  const render = () => h.render(MemberFormModal, { isOpen: true, editingMember: member, members: [], isSaving: false,
    onClose() {}, onChange() {}, onSubmit: () => assert.fail('invalid member submitted') });
  find(render(), 'form').onSubmit({ preventDefault() {} });
  assert.equal(find(render(), 'Input', props => !!props.error).error, t('common.registerPage.errors.nameRequired'));
  await i18n.changeLanguage('en');
  assert.equal(find(render(), 'Input', props => !!props.error).error, 'Please enter your full name.');
  member = { ...member, fullName: 'Nguyễn Văn An', dateOfBirth: '2099-01-01' };
  find(render(), 'form').onSubmit({ preventDefault() {} });
  assert.equal(find(render(), 'DateInput').error, t('common.registerPage.dobValidation.futureDate'));
});
