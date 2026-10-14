const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const srcDir = path.join(__dirname, '..', 'src');
const read = (relativePath) => fs.readFileSync(path.join(srcDir, relativePath), 'utf8');

test('global focus tokens stay neutral across light and dark themes', () => {
  const css = read('index.css');
  assert.match(css, /--focus-border:\s*#a1a1aa/);
  assert.match(css, /--focus-border:\s*#71717a/);
  assert.match(css, /box-shadow:\s*inset 0 0 0 1px var\(--focus-border\)/);
  assert.doesNotMatch(css, /outline:\s*2px solid var\(--color-accent/);
  assert.doesNotMatch(css, /outline-offset:\s*3px/);
});

test('shared fields and FamilyRelationSelect avoid hard focus rings', () => {
  const source = [
    'shared/components/ui/Input.tsx',
    'shared/components/ui/Textarea.tsx',
    'features/admin/components/family-tree/FamilyRelationSelect.tsx',
  ].map(read).join('\n');
  assert.doesNotMatch(source, /focus(?:-visible)?:ring-/);
  assert.doesNotMatch(source, /focus-visible:outline-(?:\d+|offset-)/);
  assert.match(source, /focus(?:-visible)?:border-\[var\(--focus-border\)\]/);
});

test('shared field shells use the focus token while preserving error borders', () => {
  for (const file of ['shared/components/ui/Input.tsx', 'shared/components/ui/Textarea.tsx']) {
    const source = read(file);
    assert.match(source, /border-\[var\(--focus-border\)\]/);
    assert.match(source, /border-error/);
    assert.doesNotMatch(source, /ring-[12] ring-(?:accent|error)/);
  }
});

test('theme switch and module navigation replace external outlines with subtle focus cues', () => {
  const source = read('shared/components/ThemeSwitch.css') + read('features/my-life/components/MyLifeModuleNav.css');
  assert.doesNotMatch(source, /outline:\s*2px solid|outline-offset:/);
  assert.match(source, /border-color:\s*var\(--focus-border\)/);
  assert.match(source, /filter:\s*brightness\(0\.94\)/);
});
