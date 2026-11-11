const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const profile = fs.readFileSync('src/features/profile/components/UserProfileModal.tsx', 'utf8');

test('profile edit keeps FullName read-only and DisplayName independently editable', () => {
  assert.match(profile, /label=\{t\('common\.userProfile\.fullName'[^}]*\}\)\}[\s\S]*?value=\{fullName\}[\s\S]*?readOnly/);
  assert.match(profile, /label=\{t\('common\.userProfile\.displayName'[^}]*\}\)\}[\s\S]*?value=\{displayName\}[\s\S]*?setDisplayName\(e\.target\.value\)/);
  assert.match(profile, /authService\.updateProfile\(\{\s*displayName:\s*trimmedDisplayName/);
  assert.doesNotMatch(profile, /authService\.updateProfile\(\{[^}]*fullName\s*:/s);
});

test('profile gender uses the shared Select and DateInput controls', () => {
  assert.match(profile, /DateInput, Input, PasswordInput, Select, SelectItem/);
  assert.match(profile, /<Select[\s\S]*?label=\{t\('common\.userProfile\.gender'[\s\S]*?floatingLabel[\s\S]*?<SelectItem value="Nam">[\s\S]*?<SelectItem value="Nữ">[\s\S]*?<SelectItem value="Khác">/);
  assert.doesNotMatch(profile, /grid-cols-3 gap-2[\s\S]*?gender === opt\.val/);
});
