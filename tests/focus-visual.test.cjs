const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const srcDir = path.join(__dirname, '..', 'src');
const read = (relativePath) => fs.readFileSync(path.join(srcDir, relativePath), 'utf8');

test('global focus delegates semantic colors to W9 theme tokens', () => {
  const css = read('index.css');
  const tokens = read('design-system/tokens/tokens.css');
  assert.match(tokens, /--focus-border:\s*var\(--brand-primary\)/);
  assert.match(tokens, /--field-focus-border:\s*var\(--brand-primary\)/);
  assert.match(tokens, /\.dark[\s\S]*--brand-primary:/);
  assert.match(css, /box-shadow:\s*inset 0 0 0 1px var\(--focus-border\)/);
  assert.doesNotMatch(css, /outline:\s*2px solid var\(--color-accent/);
  assert.match(css, /:focus-visible/);
});

test('shared fields and FamilyRelationSelect avoid hard focus rings', () => {
  const source = [
    'shared/components/ui/Input.tsx',
    'shared/components/ui/Textarea.tsx',
    'features/admin/components/family-tree/FamilyRelationSelect.tsx',
  ].map(read).join('\n');
  assert.doesNotMatch(source, /focus(?:-visible)?:ring-/);
  assert.doesNotMatch(source, /focus-visible:outline-(?:\d+|offset-)/);
  const forms = read('design-system/forms.css');
  assert.match(forms, /\[data-field-shell\]:not\(\[data-disabled\]\):focus-within/);
  assert.match(forms, /box-shadow:0 0 0 2px var\(--field-focus-ring\)/);
  assert.match(forms, /\[data-ui-control\][^{]*\{[^}]*outline:none/);
});

test('shared field shells use the focus token while preserving error borders', () => {
  for (const file of ['shared/components/ui/Input.tsx', 'shared/components/ui/Textarea.tsx']) {
    const source = read(file);
    assert.match(source, /<FloatingField[\s\S]*error=\{error\}/);
    assert.match(source, /aria-invalid=/);
    assert.doesNotMatch(source, /ring-[12] ring-(?:accent|error)/);
  }
  assert.match(read('design-system/forms.css'), /\.ds-field\[data-error\]\s*\{[^}]*border-color:var\(--field-error\)/);
});

test('theme switch and module navigation replace external outlines with subtle focus cues', () => {
  const source = read('shared/components/ThemeSwitch.css') + read('features/my-life/components/MyLifeModuleNav.css');
  assert.doesNotMatch(source, /outline:\s*2px solid|outline-offset:/);
  assert.match(source, /border-color:\s*var\(--focus-border\)/);
  assert.match(source, /filter:\s*brightness\(0\.94\)/);
});
