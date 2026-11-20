const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const read = path => readFileSync(join(__dirname, '..', path), 'utf8');

test('standard web controls share the Member floating frame and accessible feedback', () => {
  const shell = read('src/shared/components/ui/FormFieldShell.tsx');
  for (const name of ['Input','Select','Textarea']) {
    const source = read('src/shared/components/ui/' + name + '.tsx');
    assert.match(source, /FormFieldShell/);
    assert.match(source, /FloatingField/);
    assert.match(source, /floatingLabel = true/);
    assert.match(source, /aria-invalid=\{error \? true/);
    assert.match(source, /aria-describedby=/);
  }
  assert.match(shell, /role="alert"/);
  const frame = read('src/shared/components/ui/FloatingField.tsx');
  assert.match(frame, /active \|\| hasValue \|\| alwaysFloating/);
  assert.match(frame, /htmlFor=\{fieldId\}/);
});

test('DateInput forwards dynamic floating labels and required labels avoid duplicated asterisks', () => {
  const date = read('src/shared/components/ui/DateInput.tsx');
  const input = read('src/shared/components/ui/Input.tsx');
  const shell = read('src/shared/components/ui/FormFieldShell.tsx');
  assert.match(date, /extends Omit<InputProps, 'type' \| 'inputMode'>/);
  assert.match(date, /<Input[\s\S]*?\.\.\.props/);
  assert.match(read('src/shared/components/ui/FloatingField.tsx'), /normalizeRequiredLabel\(label, Boolean\(required\)\)/);
  assert.match(shell, /normalizeRequiredLabel\(label: string \| undefined, required: boolean\)/);
  const output = ts.transpileModule(shell, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
  } }).outputText;
  const exports = {};
  new vm.Script(output).runInNewContext({ exports, require: name => name === 'react'
    ? { __esModule: true, default: { useId: () => 'id' } }
    : name === 'lucide-react' ? { AlertCircle: 'AlertCircle' }
      : name === 'react/jsx-runtime' ? { jsx: () => null, jsxs: () => null }
        : (() => { throw new Error(`Unexpected import: ${name}`); })() });
  assert.equal(exports.normalizeRequiredLabel('Họ và tên *', true), 'Họ và tên');
  assert.equal(exports.normalizeRequiredLabel('Vai trò **', true), 'Vai trò');
  assert.equal(exports.normalizeRequiredLabel('Label *', false), 'Label *');
});

test('web form field tokens have matching light and dark values', () => {
  const css = read('src/design-system/tokens/tokens.css');
  const tokens = ['bg','border','text','label','placeholder','focus-border','focus-ring','error','disabled-bg'];
  for (const token of tokens) assert.ok(css.includes('--field-' + token + ':'), token);
  assert.match(css, /:root, \.dark/);
  assert.match(css, /--field-bg: var\(--surface-primary\)/);
  assert.match(css, /--field-focus-border: var\(--brand-primary\)/);
});

test('Anniversary remains on shared fields and retains the original submit contract', () => {
  const modal = read('src/features/admin/components/family-tree/FamilyAnniversaryModal.tsx');
  for (const component of ['<Input', '<Select', '<DateInput', '<Textarea']) assert.ok(modal.includes(component), `Anniversary modal should use ${component}`);
  assert.match(modal, /lunarDay: isDeathAnniversary \? day : null/);
  assert.match(modal, /lunarMonth: isDeathAnniversary \? month : null/);
  assert.match(modal, /originalSolarDate: hasSolar \? solarDateValue : null/);
});
