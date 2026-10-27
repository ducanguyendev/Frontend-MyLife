const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const read = path => readFileSync(join(__dirname, '..', path), 'utf8');

test('shared web form controls use the same shell, states, and feedback semantics', () => {
  const shell = read('src/shared/components/ui/FormFieldShell.tsx');
  const input = read('src/shared/components/ui/Input.tsx');
  const select = read('src/shared/components/ui/Select.tsx');
  const date = read('src/shared/components/ui/DateInput.tsx');
  const textarea = read('src/shared/components/ui/Textarea.tsx');

  for (const source of [input, select, textarea]) assert.match(source, /FormFieldShell/);
  assert.match(input, /rounded-2xl/);
  assert.match(input, /min-h-\[58px\]/);
  assert.match(input, /floatingLabel\?: boolean/);
  assert.match(input, /isFocused \|\| hasValue \|\| Boolean\(error\)/);
  assert.match(input, /top-1\/2 -translate-y-1\/2/);
  assert.match(input, /transition-all duration-200/);
  assert.match(input, /floatingLabel && !shouldFloat \? '' : placeholder/);
  assert.match(select, /min-h-\[58px\].*rounded-2xl/);
  assert.match(date, /import \{ Input, type InputProps \} from '\.\/Input'/);
  assert.match(textarea, /min-h-\[112px\].*resize-y/);
  assert.match(shell, /text-xs font-semibold text-\[var\(--field-label\)\]/);
  assert.match(shell, /role="alert"/);
  assert.match(shell, /helperText/);
  assert.match(input, /aria-invalid=\{error \? true/);
  assert.match(select, /aria-invalid=\{error \? true/);
  assert.match(textarea, /aria-invalid=\{error \? true/);
  for (const source of [input, select, textarea]) {
    assert.match(source, /disabled:bg-\[var\(--field-disabled-bg\)\]|bg-\[var\(--field-disabled-bg\)\]/);
    assert.match(source, /field-error/);
    assert.match(source, /field-focus-ring/);
  }
});

test('DateInput forwards dynamic floating labels and required labels avoid duplicated asterisks', () => {
  const date = read('src/shared/components/ui/DateInput.tsx');
  const input = read('src/shared/components/ui/Input.tsx');
  const shell = read('src/shared/components/ui/FormFieldShell.tsx');
  assert.match(date, /extends Omit<InputProps, 'type' \| 'inputMode'>/);
  assert.match(date, /<Input[\s\S]*?\.\.\.props/);
  assert.match(input, /normalizeRequiredLabel\(label, Boolean\(required\)\)/);
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
  const css = read('src/index.css');
  const root = css.match(/:root\s*\{([\s\S]*?)\n\s*\}/)?.[1] ?? '';
  const dark = css.match(/\.dark\s*\{([\s\S]*?)\n\s*\}/)?.[1] ?? '';
  const tokens = ['bg', 'border', 'text', 'label', 'placeholder', 'focus-border', 'focus-ring', 'error', 'disabled-bg'];
  for (const token of tokens) {
    assert.match(root, new RegExp(`--field-${token}:\\s*[^;]+;`), `light theme is missing --field-${token}`);
    assert.match(dark, new RegExp(`--field-${token}:\\s*[^;]+;`), `dark theme is missing --field-${token}`);
  }
  assert.match(root, /--field-bg:\s*#ffffff;/);
  assert.match(dark, /--field-bg:\s*#111111;/);
});

test('Anniversary remains on shared fields and retains the original submit contract', () => {
  const modal = read('src/features/admin/components/family-tree/FamilyAnniversaryModal.tsx');
  for (const component of ['<Input', '<Select', '<DateInput', '<Textarea']) assert.ok(modal.includes(component), `Anniversary modal should use ${component}`);
  assert.match(modal, /lunarDay: isDeathAnniversary \? day : null/);
  assert.match(modal, /lunarMonth: isDeathAnniversary \? month : null/);
  assert.match(modal, /originalSolarDate: hasSolar \? solarDateValue : null/);
});
