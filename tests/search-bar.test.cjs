const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const source = relativePath => fs.readFileSync(path.join(root, relativePath), 'utf8');

test('SearchBar exposes controlled, accessible UI and FamilyTree reference styling', () => {
  const component = source('src/shared/components/SearchBar.tsx');
  for (const prop of ['value: string', 'onChange: (value: string) => void', 'placeholder?: string', 'disabled?: boolean', 'className?: string', 'ariaLabel?: string']) {
    assert.ok(component.includes(prop), `SearchBar should expose ${prop}`);
  }
  assert.match(component, /onChange=\{event => onChange\(event\.target\.value\)\}/);
  assert.match(component, /aria-label=\{ariaLabel \?\? placeholder\}/);
  assert.match(component, /size=\{16\}/);
  assert.match(component, /rounded-xl border border-custom-border bg-secondary-bg py-2 pl-9 pr-4 text-sm text-primary-text/);
  assert.match(component, /focus-visible:ring-2 focus-visible:ring-accent\/30/);
  assert.match(component, /disabled=\{disabled\}/);
});

test('FamilyTree, Anniversary and Admin Dashboard use the shared SearchBar', () => {
  for (const file of [
    'src/features/admin/components/FamilyTreeManager.tsx',
    'src/features/admin/components/family-tree/AnniversaryTab.tsx',
    'src/features/admin/pages/AdminDashboard.tsx',
  ]) {
    const component = source(file);
    assert.match(component, /import \{ SearchBar \} from ['"]@\/shared\/components\/SearchBar['"]/);
    assert.match(component, /<SearchBar\b/);
  }
});

test('Library has category and album filters but no keyword search field', () => {
  const library = source('src/features/admin/components/family-tree/LibraryTab.tsx');
  assert.doesNotMatch(library, /<input\b|\bSearch\b|SearchBar/);
  assert.match(library, /<Select\b/);
});
