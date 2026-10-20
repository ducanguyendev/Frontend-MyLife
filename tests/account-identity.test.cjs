const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const source = read('src/shared/utils/userDisplayName.ts');
const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const displayNames = {};
new vm.Script(output).runInNewContext({ exports: displayNames });

test('default display name keeps accents and composes first plus last word', () => {
  for (const [fullName, expected] of [
    ['Nguyễn Huỳnh Minh Đức', 'Nguyễn Đức'],
    ['Trần Ngọc Mai', 'Trần Mai'],
    ['Lê Minh', 'Lê Minh'],
    ['Duca', 'Duca'],
    ['  Nguyễn   Văn   An ', 'Nguyễn An'],
  ]) assert.equal(displayNames.generateDefaultDisplayName(fullName), expected);
});

test('display name resolution preserves customization and never uses email as the normal fallback', () => {
  assert.equal(displayNames.getUserDisplayName({ displayName: 'Duca', fullName: 'Nguyễn Huỳnh Minh Đức' }), 'Duca');
  assert.equal(displayNames.getUserDisplayName({ fullName: 'Nguyễn Huỳnh Minh Đức' }), 'Nguyễn Đức');
  assert.equal(displayNames.getUserDisplayName({ email: 'name@example.com' }, 'Account'), 'Account');
});

test('profile updates only displayName, uses the shared calendar and refreshes auth context', () => {
  const profile = read('src/features/profile/components/UserProfileModal.tsx');
  const service = read('src/features/auth/services/authService.ts');
  const auth = read('src/features/auth/context/AuthContext.tsx');
  assert.match(profile, /displayName:\s*trimmedDisplayName/);
  assert.doesNotMatch(profile, /fullName:\s*trimmedDisplayName/);
  assert.match(profile, /updateUser\(response\.user\)/);
  assert.match(profile, /<DateInput[\s\S]*?value=\{dateOfBirth\}/);
  assert.doesNotMatch(profile, /type=["']date["']/i);
  assert.match(service, /updateProfile\(data: \{ displayName: string/);
  assert.match(auth, /user\.displayName\?\.trim\(\)\s*\|\|\s*generateDefaultDisplayName\(fullName\)/);
});

test('profile identity separates DisplayName from FullName and removes the duplicate top email', () => {
  const profile = read('src/features/profile/components/UserProfileModal.tsx');
  const headerStart = profile.indexOf('{/* Profile Info Summary */}');
  const tabsStart = profile.indexOf('{/* Navigation Tabs */}', headerStart);
  const summary = profile.slice(headerStart, tabsStart);
  assert.match(summary, /\{userDisplayName\}/);
  assert.doesNotMatch(summary, /user\.email/);
  assert.match(profile, /common\.userProfile\.fullName[\s\S]*?\{fullName/);
  assert.match(profile, /<span className="font-semibold text-primary-text">\{user\.email\}<\/span>/);
});

test('home and workspace account chips use the shared display-name helper', () => {
  const menu = read('src/features/auth/components/UserMenu.tsx');
  const header = read('src/shared/layouts/Header.tsx');
  assert.match(menu, /getUserDisplayName\(user/);
  assert.match(menu, /max-w-\[180px\] truncate[\s\S]*?\{userDisplayName\}/);
  assert.match(header, /getUserDisplayName\(user/);
  assert.match(header, /<p className="text-sm font-bold truncate">\{userDisplayName\}<\/p>/);
});

test('profile identity strings are localized in Vietnamese and English', () => {
  const vi = JSON.parse(read('src/shared/locales/vi/common.json')).userProfile;
  const en = JSON.parse(read('src/shared/locales/en/common.json')).userProfile;
  assert.equal(vi.fullName, 'Họ và tên');
  assert.equal(vi.displayName, 'Tên hiển thị');
  assert.equal(vi.displayNameHelper, 'Tên này được hiển thị trên giao diện và có thể thay đổi.');
  assert.equal(en.fullName, 'Full name');
  assert.equal(en.displayName, 'Display name');
  assert.equal(en.displayNameHelper, 'This name is shown in the interface and can be changed.');
});
