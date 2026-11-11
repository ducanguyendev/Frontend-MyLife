const fs=require('fs');
let f='tests/family-member-picker.test.cjs',s=fs.readFileSync(f,'utf8').replace('  assert.match(picker, /<span className="min-w-0 flex-1 truncate">\\{placeholder\\}<\\/span>/);','  assert.match(picker, /<FloatingField label=\\{placeholder\\}/);\n  assert.match(picker, /MemberAvatarImage/);\n  assert.doesNotMatch(picker, /\\{option\\.generation\\}/);');fs.writeFileSync(f,s);
f='tests/family-relation-select.test.cjs';s=fs.readFileSync(f,'utf8').replace("  'react/jsx-runtime':", "  '@/shared/utils/normalizeDisplayText': { normalizeDisplayText: value => value?.normalize('NFC') ?? '' },\n  'react/jsx-runtime':");s=s.replace('generation display is optional and defaults to the current parent relation label','relation labels normalize Vietnamese without exposing generation metadata').replace("assert.equal(format(option, 'Đời'), 'Nguyễn Bửu (Đời 1)');","assert.equal(format(option, 'Đời'), 'Nguyễn Bửu');\n  assert.equal(format({ ...option, fullName: option.fullName.normalize('NFD') }, 'Đời', true), 'Nguyễn Bửu');\n  assert.equal(option.generation, 1);");fs.writeFileSync(f,s);
f='tests/member-form-layout.test.cjs';s=fs.readFileSync(f,'utf8').replaceAll('aria-expanded={openSections','expanded={openSections').replace('form sibling chips contain only member name, generation badge and explicit remove control','form sibling chips contain an avatar and name with the original remove permissions').replace('  assert.match(chip, /admin\\.generation_label/);','  assert.doesNotMatch(chip, /admin\\.generation_label|sibling\\.generation/);\n  assert.match(chip, /MemberAvatarImage/);');fs.writeFileSync(f,s);
f='tests/form-controls.test.cjs';s=fs.readFileSync(f,'utf8');let a=s.indexOf("test('shared web form controls"),b=s.indexOf("test('DateInput",a);s=s.slice(0,a)+`test('standard web controls share the Member floating frame and accessible feedback', () => {
  const shell = read('src/shared/components/ui/FormFieldShell.tsx');
  for (const name of ['Input','Select','Textarea']) {
    const source = read('src/shared/components/ui/' + name + '.tsx');
    assert.match(source, /FormFieldShell/);
    assert.match(source, /FloatingField/);
    assert.match(source, /floatingLabel = true/);
    assert.match(source, /aria-invalid=\\{error \\? true/);
    assert.match(source, /aria-describedby=/);
  }
  assert.match(shell, /role="alert"/);
  const frame = read('src/shared/components/ui/FloatingField.tsx');
  assert.match(frame, /active \\|\\| hasValue \\|\\| alwaysFloating/);
  assert.match(frame, /htmlFor=\\{fieldId\\}/);
});

`+s.slice(b);s=s.replace("  assert.match(input, /normalizeRequiredLabel\\(label, Boolean\\(required\\)\\)/);","  assert.match(read('src/shared/components/ui/FloatingField.tsx'), /normalizeRequiredLabel\\(label, Boolean\\(required\\)\\)/);");s=s.replace("  const css = read('src/index.css');", "  const css = read('src/design-system/tokens/tokens.css');");a=s.indexOf("  const root = css.match(",s.indexOf("test('web form field tokens"));b=s.indexOf('\n});',a);s=s.slice(0,a)+`  const tokens = ['bg','border','text','label','placeholder','focus-border','focus-ring','error','disabled-bg'];
  for (const token of tokens) assert.ok(css.includes('--field-' + token + ':'), token);
  assert.match(css, /:root, \\.dark/);
  assert.match(css, /--field-bg: var\\(--surface-primary\\)/);
  assert.match(css, /--field-focus-border: var\\(--brand-primary\\)/);`+s.slice(b);fs.writeFileSync(f,s);
f='tests/shared-select.test.cjs';s=fs.readFileSync(f,'utf8');a=s.indexOf("test('shared Select exposes");b=s.indexOf("test('MyLife Selects",a);s=s.slice(0,a)+`test('shared Select retains Radix keyboard/portal/selection and delegates its frame', () => {
  assert.match(select, /@radix-ui\\/react-select/);
  assert.match(select, /<FloatingField[\\s\\S]*active=\\{isOpen \\|\\| isFocused\\}/);
  assert.match(select, /hasValue=\\{Boolean\\(currentValue\\)\\}/);
  assert.match(select, /<SelectPrimitive\\.Value[\\s\\S]*placeholder=\\{usesFloatingLabel \\? ''/);
  assert.match(select, /SelectPrimitive\\.Portal/);
  assert.match(select, /density=\\{variant\\}/);
  assert.match(select, /ds-field-menu/);
  assert.match(select, /<SelectPrimitive\\.ItemIndicator[\\s\\S]*?<Check/);
  assert.doesNotMatch(select, /clearable|onClear|clearLabel|<X\\b/);
});

`+s.slice(b);s=s.replace("  assert.deepEqual(nativeTags, []);", "  assert.deepEqual(nativeTags.map(file => file.replaceAll('\\\\','/')).sort(), ['src/design-system/pages/DesignSystemPage.tsx','src/shared/components/AppearanceControls.tsx']);");fs.writeFileSync(f,s);
