const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function loadAddressInput() {
  const source = readFileSync(join(__dirname, '../src/shared/components/AddressInput.tsx'), 'utf8');
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  new vm.Script(output).runInNewContext({
    exports: module.exports,
    module,
    require: name => name === 'react/jsx-runtime'
      ? { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) }
      : name === '@/shared/components/ui/Input'
        ? { Input: 'Input' }
        : {},
  });
  return module.exports.AddressInput;
}

test('AddressInput renders a regular free-form input with caller text and attributes', () => {
  const AddressInput = loadAddressInput();
  const onChange = value => value;
  const rendered = AddressInput({ value: 'Gò Vấp, TP.HCM', onChange, label: 'Address', placeholder: 'Enter an address', id: 'address', name: 'address' });
  assert.equal(rendered.type, 'Input');
  assert.equal(rendered.props.value, 'Gò Vấp, TP.HCM');
  assert.equal(rendered.props.id, 'address');
  assert.equal(rendered.props.name, 'address');
  assert.equal(rendered.props.placeholder, 'Enter an address');
  assert.equal(rendered.props.onChange({ target: { value: '12 Nguyễn Văn Bảo' } }), '12 Nguyễn Văn Bảo');
});

test('address form state and save payload do not depend on browser geocoding', () => {
  const modal = readFileSync(join(__dirname, '../src/features/admin/components/family-tree/MemberFormModal.tsx'), 'utf8');
  const manager = readFileSync(join(__dirname, '../src/features/admin/components/FamilyTreeManager.tsx'), 'utf8');
  const input = readFileSync(join(__dirname, '../src/shared/components/AddressInput.tsx'), 'utf8');
  assert.match(modal, /value=\{editingMember\.address \|\| ""\}/);
  assert.match(modal, /onChange=\{\(address\) => onChange\(\{ \.\.\.editingMember, address \}\)\}/);
  assert.match(manager, /const payload = \{\s*\.\.\.editingMember/);
  assert.match(manager, /address:/);
  assert.doesNotMatch(input, /fetch\(|nominatim|google\.maps/i);
});

test('family map still uses Leaflet and OpenStreetMap tiles', () => {
  const map = readFileSync(join(__dirname, '../src/features/admin/components/family-tree/FamilyMapTab.tsx'), 'utf8');
  assert.match(map, /react-leaflet/);
  assert.match(map, /tile\.openstreetmap\.org/);
});

test('Google Maps Places loader and ambient types are removed while Google OAuth remains', () => {
  const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf8'));
  const packageLock = JSON.parse(readFileSync(join(__dirname, '../package-lock.json'), 'utf8'));
  const tsconfig = readFileSync(join(__dirname, '../tsconfig.app.json'), 'utf8');
  const login = readFileSync(join(__dirname, '../src/features/auth/components/LoginModal.tsx'), 'utf8');
  assert.equal(packageJson.devDependencies['@types/google.maps'], undefined);
  assert.equal(packageLock.packages['node_modules/@types/google.maps'], undefined);
  assert.doesNotMatch(tsconfig, /google\.maps/);
  assert.match(login, /VITE_GOOGLE_CLIENT_ID/);
  for (const path of [
    '../src/shared/components/GoogleAddressAutocomplete.tsx',
    '../src/shared/components/googleAddressAutocompleteEvents.ts',
    '../src/shared/lib/googleMapsLoader.ts',
    '../src/shared/lib/googleMapsLoaderCore.ts',
  ]) assert.throws(() => readFileSync(join(__dirname, path), 'utf8'));
});
