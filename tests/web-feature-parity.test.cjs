const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const family = 'src/features/admin/components/family-tree/';
function loader(mocks = {}) {
  const cache = new Map();
  const load = file => {
    if (cache.has(file)) return cache.get(file);
    const exports = {};
    cache.set(file, exports);
    const compiled = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), { fileName: file, compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
    } }).outputText;
    new vm.Script(compiled, { filename: file }).runInNewContext({ exports, File, Blob, FormData, console, require: name => {
      if (name in mocks) return mocks[name];
      if (name.startsWith('.')) return load(path.posix.normalize(path.posix.join(path.posix.dirname(file), name)) + '.ts');
      throw Error(`Unexpected import: ${name}`);
    } });
    return exports;
  };
  return load;
}
const load = loader();
const { selectTimelineEvents } = load('src/features/my-life/components/timeline/types.ts');
const { isValidMemberAvatar, MAX_MEMBER_AVATAR_BYTES } = load(family + 'memberAvatar.ts');
const { classifyMemberRelations } = load(family + 'memberProfileRelations.ts');
const plain = value => JSON.parse(JSON.stringify(value));
const member = (id, patch = {}) => ({ id, fullName: `Member ${id}`, generation: 1, createdAt: '', updatedAt: '', ...patch });
const groups = (current, relatives) => Object.fromEntries(classifyMemberRelations(current, relatives).map(group => [group.key, group.rows]));

test('timeline search combines Vietnamese titles/content, type and exact/approximate/unknown year', () => {
  const events = [
    { id: 1, title: 'Đám cưới', description: 'Tại Đà Lạt', eventType: 'MARRIAGE', eventDate: '2000-06-01', eventYear: 1999 },
    { id: 2, title: 'Kỷ niệm', description: 'ĐÁM CƯỚI ở Huế', eventType: 'MEMORY', eventDate: null, eventYear: 2000 },
    { id: 3, title: 'Đám cưới', description: null, eventType: 'MARRIAGE', eventDate: null, eventYear: null },
  ];
  const ids = (...args) => Array.from(selectTimelineEvents(events, ...args), event => event.id);
  assert.deepEqual(ids('MARRIAGE', '  dam cuoi  ', '2000'), [1]);
  assert.deepEqual(ids('MEMORY', 'đám cưới', '2000'), [2]);
  assert.deepEqual(ids('MARRIAGE', 'ĐÁM', 'unknown'), [3]);
  assert.deepEqual(ids('ALL', 'da lat'), [1]);
  assert.deepEqual(ids('ALL', 'absent'), []);
  assert.deepEqual(ids('ALL', '', 'all'), [1, 2, 3]);
  assert.equal(events[0].eventYear, 1999);
});

test('timeline search includes localized derived titles and preserves year boundaries', () => {
  const events = [{ title: 'Birth of An', description: null, eventType: 'BIRTH', eventDate: '0900-01-01', eventYear: 900 }];
  assert.equal(selectTimelineEvents(events, 'BIRTH', 'chao doi', '900', () => 'An chào đời').length, 1);
  assert.equal(selectTimelineEvents(events, 'BIRTH', '', '901').length, 0);
});

test('member avatar validation enforces backend MIME types and the inclusive 5 MiB limit', () => {
  for (const type of ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']) {
    assert.equal(isValidMemberAvatar({ type, size: 1 }), true);
    assert.equal(isValidMemberAvatar({ type, size: MAX_MEMBER_AVATAR_BYTES }), true);
    assert.equal(isValidMemberAvatar({ type, size: MAX_MEMBER_AVATAR_BYTES + 1 }), false);
    assert.equal(isValidMemberAvatar({ type, size: 0 }), false);
  }
  for (const type of ['', 'image/svg+xml', 'text/html', 'image/heic']) assert.equal(isValidMemberAvatar({ type, size: 10 }), false);
});

test('avatar service uses existing API transport, multipart file field and authoritative member response', async () => {
  const calls = [];
  const updated = member(7, { hasManagedAvatar: true, updatedAt: '2026-11-20T01:00:00Z' });
  const service = loader({ '@/shared/api/apiClient': { apiClient: {
    post: async (...args) => { calls.push(args); return { success: true, data: updated }; },
    delete: async (...args) => { calls.push(args); return { success: true, data: member(7, { hasManagedAvatar: false }) }; },
  } } })('src/features/admin/services/familyV2Service.ts');
  const file = new File(['image'], 'avatar.png', { type: 'image/png' });
  assert.equal(await service.uploadMemberAvatar(7, file), updated);
  assert.equal(calls[0][0], '/api/family-tree/7/avatar');
  assert.ok(calls[0][1] instanceof FormData);
  assert.equal(calls[0][1].get('file'), file);
  assert.equal(calls[0].length, 2, 'transport must choose the multipart boundary and authentication');
  assert.equal((await service.deleteMemberAvatar(7)).hasManagedAvatar, false);
  assert.deepEqual(calls[1], ['/api/family-tree/7/avatar']);
});

test('avatar service rejects failed envelopes and mismatched member identity', async () => {
  let response = { success: false, data: member(7) };
  const service = loader({ '@/shared/api/apiClient': { apiClient: { delete: async () => response } } })('src/features/admin/services/familyV2Service.ts');
  await assert.rejects(service.deleteMemberAvatar(7), /FAMILY_INVALID_RESPONSE/);
  response = { success: true, data: member(8) };
  await assert.rejects(service.deleteMemberAvatar(7), /FAMILY_INVALID_RESPONSE/);
});

test('relationship classification separates explicit and inferred links across multiple generations', () => {
  const current = member(4, { generation: 3, fatherId: 2, motherId: 3, spouseId: 5, childIds: [8], dateOfBirth: '1980-01-01', horizontalRelations: [{ memberId: 6, relationType: 'SIBLING' }, { memberId: 7, relationType: 'cousin' }, { memberId: 9, relationType: 'legacy_custom' }] });
  const relatives = [member(1, { generation: 1 }), member(2, { fatherId: 1 }), member(3), member(5), member(6), member(7), member(8, { generation: 4, fatherId: 4 }), member(9), member(10, { fatherId: 2, dateOfBirth: '1970-01-01', gender: 'Nữ' }), member(11)];
  const before = JSON.stringify([current, relatives]);
  const result = groups(current, relatives);
  assert.deepEqual(plain(result.parents.map(row => row.memberId)), [2, 3]);
  assert.deepEqual(plain(result.spouse.map(row => row.memberId)), [5]);
  assert.deepEqual(plain(result.children.map(row => row.memberId)), [8]);
  assert.deepEqual(plain(result.recorded.map(row => row.memberId)), [6, 7, 9]);
  assert.equal(result.recorded[0].labelKey, 'family.relations.recordedSibling');
  assert.equal(result.recorded[2].recordedType, 'legacy_custom');
  assert.deepEqual(plain(result.inferred), [{ memberId: 10, labelKey: 'admin.sibling_biological_older_sister' }]);
  assert.equal(JSON.stringify([current, relatives]), before);
});

test('relationship classification never guesses from missing parents, gender, generation or recorded sibling alone', () => {
  assert.equal(groups(member(1), [member(2), member(3)]).inferred.length, 0);
  const current = member(1, { fatherId: 9, dateOfBirth: '1980-01-01' });
  const result = groups(current, [member(2, { fatherId: 9, gender: 'nu', dateOfBirth: '1970-01-01' }), member(3, { fatherId: 9, gender: 'male' }), member(4, { horizontalRelations: [{ memberId: 1, relationType: 'sibling' }] }), member(5, { horizontalRelations: [{ memberId: 1, relationType: 'mentor' }] })]);
  assert.equal(result.inferred[0].labelKey, 'admin.sibling_biological_older_unknown');
  assert.equal(result.inferred[1].labelKey, 'admin.sibling_neutral_biological');
  assert.deepEqual(plain(result.recorded.map(row => row.memberId)), [4]);
  assert.equal(groups(member(1, { fatherId: 99 }), []).parents[0].memberId, 99);
});

function avatarUI(api) {
  const states = [], refs = [], cleanups = [];
  let cursor = 0, refCursor = 0, mounted = false;
  const jsx = (type, props) => ({ type, props });
  const changes = [], toasts = [];
  const hooks = {
    useState(initial) { const index = cursor++; if (!(index in states)) states[index] = initial; return [states[index], value => { states[index] = value; }]; },
    useRef(value) { const index = refCursor++; return refs[index] ??= { current: value }; },
    useEffect(callback) { if (!mounted) cleanups.push(callback()); },
  };
  const { MemberAvatarActions } = loader({
    react: hooks, 'react/jsx-runtime': { jsx, jsxs: jsx }, 'lucide-react': { ImagePlus: 'ImagePlus', Trash2: 'Trash2' },
    '@/shared/components/ui': { Button: 'Button', ConfirmDialog: 'ConfirmDialog' },
    '@/shared/hooks/useLanguage': { useLanguage: () => ({ t: key => key }) },
    '@/shared/hooks/useWorkspaceToast': { useWorkspaceToast: () => (...args) => toasts.push(args) },
    '../../services/familyV2Service': api,
  })(family + 'MemberAvatarActions.tsx');
  const render = () => { cursor = 0; refCursor = 0; const tree = MemberAvatarActions({ member: member(7, { hasManagedAvatar: true }), onChanged: value => changes.push(value) }); mounted = true; return tree; };
  const choose = file => render().props.children[0].props.children[0].props.onChange({ currentTarget: { files: [file], value: 'selected' } });
  return { render, choose, changes, toasts, unmount: () => cleanups.forEach(cleanup => cleanup?.()) };
}
const flush = () => new Promise(resolve => setImmediate(resolve));

test('avatar actions block duplicate submissions, retain old data on failure and apply successful response', async () => {
  let resolve, reject, calls = 0;
  const ui = avatarUI({ uploadMemberAvatar: () => { calls++; return new Promise((done, fail) => { resolve = done; reject = fail; }); } });
  const file = new File(['image'], 'photo.png', { type: 'image/png' });
  ui.choose(new File(['svg'], 'photo.svg', { type: 'image/svg+xml' }));
  assert.equal(calls, 0);
  ui.choose(file); ui.choose(file);
  assert.equal(calls, 1); assert.equal(ui.render().props['aria-busy'], true);
  reject(Error('network')); await flush();
  assert.equal(ui.changes.length, 0); assert.equal(ui.render().props['aria-busy'], false);
  ui.choose(file); resolve(member(7, { updatedAt: 'new revision' })); await flush();
  assert.equal(ui.changes[0].updatedAt, 'new revision');
  assert.deepEqual(ui.toasts.at(-1), ['family.avatar.saved', true]);
});

test('avatar actions discard late results after leaving a member profile', async () => {
  let finish;
  const ui = avatarUI({ uploadMemberAvatar: () => new Promise(resolve => { finish = resolve; }) });
  ui.choose(new File(['image'], 'photo.png', { type: 'image/png' }));
  ui.unmount(); finish(member(7)); await flush();
  assert.equal(ui.changes.length, 0); assert.equal(ui.toasts.length, 0);
});

test('new avatar, timeline and relationship labels resolve in Vietnamese and English', () => {
  const keys = object => Object.keys(object).sort();
  const dictionaries = {};
  for (const language of ['vi', 'en']) {
    const familyCopy = JSON.parse(fs.readFileSync(path.join(root, `src/shared/locales/${language}/family.json`), 'utf8'));
    const memories = JSON.parse(fs.readFileSync(path.join(root, `src/shared/locales/${language}/memories.json`), 'utf8'));
    dictionaries[language] = familyCopy;
    for (const section of ['avatar', 'relations']) for (const value of Object.values(familyCopy[section])) assert.ok(typeof value === 'string' && value.trim());
    for (const key of ['searchTimeline', 'timelineSearchHint', 'allYears', 'clearTimelineFilters']) assert.ok(memories[key]);
  }
  assert.deepEqual(keys(dictionaries.vi.avatar), keys(dictionaries.en.avatar));
  assert.deepEqual(keys(dictionaries.vi.relations), keys(dictionaries.en.relations));
});
