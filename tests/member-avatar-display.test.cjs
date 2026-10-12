const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function createHarness() {
  let state;
  const react = { useState: initial => [state ?? (state = initial), next => { state = typeof next === 'function' ? next(state) : next; }] };
  const jsx = (type, props) => ({ type, props });
  const source = readFileSync(join(__dirname, '../src/features/admin/components/family-tree/MemberAvatarImage.tsx'), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  const exports = {};
  new vm.Script(compiled).runInContext(vm.createContext({ exports, require: name => {
    if (name === 'react') return react;
    if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
    if (name === 'lucide-react') return { UserRound: 'UserRound' };
    if (name === '@/shared/api/apiClient') return { apiClient: { url: path => `http://localhost:5274${path}` } };
    if (name === './types') return {};
    throw new Error(`Unexpected import: ${name}`);
  } }));
  return { render: exports.MemberAvatarImage, getState: () => state };
}

const member = (overrides = {}) => ({ id: 9, fullName: 'Nguyễn Huỳnh Minh Đức', updatedAt: '2026-10-12T10:00:00Z', ...overrides });

test('managed member avatars use the MyLife endpoint and never the stored Drive URL', () => {
  const { render } = createHarness();
  const image = render({ member: member({ hasManagedAvatar: true, avatarUrl: 'https://lh3.googleusercontent.com/d/drive-id' }), className: 'avatar' });
  assert.equal(image.type, 'img');
  assert.equal(image.props.src, 'http://localhost:5274/api/family-tree/9/avatar/image');
  assert.doesNotMatch(image.props.src, /googleusercontent|drive\.google/);
});

test('image errors switch once to a local initials placeholder without retrying', () => {
  const { render } = createHarness();
  const props = { member: member({ hasManagedAvatar: true }), className: 'avatar' };
  const image = render(props);
  image.props.onError();
  const fallback = render(props);
  assert.equal(fallback.type, 'div');
  assert.equal(fallback.props.role, 'img');
  assert.match(fallback.props.children.props.children, /NĐ/);
  assert.notEqual(fallback.type, 'img');
});

test('changing avatar identity allows one new candidate after a previous failure', () => {
  const { render } = createHarness();
  const first = render({ member: member({ hasManagedAvatar: true }), className: 'avatar' });
  first.props.onError();
  const next = render({ member: member({ hasManagedAvatar: true, updatedAt: '2026-10-13T10:00:00Z' }), className: 'avatar' });
  assert.equal(next.type, 'img');
});

test('legacy avatar URLs still work and a member without an avatar uses local fallback', () => {
  const { render } = createHarness();
  const legacy = render({ member: member({ avatarUrl: 'https://images.example/avatar.jpg' }), className: 'avatar' });
  assert.equal(legacy.props.src, 'https://images.example/avatar.jpg');
  const empty = render({ member: member({ avatarUrl: undefined }), className: 'avatar' });
  assert.equal(empty.type, 'div');
  assert.equal(empty.props.role, 'img');
});

test('all member avatar locations use the shared display component', () => {
  for (const file of ['MemberCard.tsx', 'MemberListItem.tsx', 'MemberDetailModal.tsx', 'MemberMindmapNode.tsx', 'MemberFormModal.tsx']) {
    const source = readFileSync(join(__dirname, `../src/features/admin/components/family-tree/${file}`), 'utf8');
    assert.match(source, /MemberAvatarImage/ , `${file} should use MemberAvatarImage`);
  }
  const form = readFileSync(join(__dirname, '../src/features/admin/components/family-tree/MemberFormModal.tsx'), 'utf8');
  assert.match(form, /sourceOverride=\{previewUrl\}/, 'pending file preview should use its local object URL');
});
