const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function loadDateInput() {
  const source = readFileSync(join(__dirname, '../src/shared/components/ui/DateInput.tsx'), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
  } });
  const exports = {};
  const reactRuntime = { forwardRef: render => render, useRef: initial => ({ current: initial }) };
  const react = Object.assign(reactRuntime, { default: reactRuntime });
  let pickerCalls = 0;
  const jsx = (type, props) => {
    if (type === 'input' && props?.type === 'date' && props.ref) props.ref.current = { showPicker() { pickerCalls++; } };
    return { type, props };
  };
  new vm.Script(outputText).runInNewContext({ exports, require: name => {
    if (name === 'react') return react;
    if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
    if (name === 'lucide-react') return { Calendar: 'Calendar' };
    if (name === './Input') return { Input: 'Input' };
    throw new Error(`Unexpected import: ${name}`);
  } });
  return { ...exports, pickerCalls: () => pickerCalls };
}
function nodes(tree) {
  if (!tree || typeof tree !== 'object') return [];
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  return [tree, ...nodes(tree.props?.children)];
}

test('date typing adds separators and paste formats compact digits', () => {
  const { formatDateInput } = loadDateInput();
  assert.equal(formatDateInput('09'), '09/');
  assert.equal(formatDateInput('091'), '09/1');
  assert.equal(formatDateInput('0910'), '09/10/');
  assert.equal(formatDateInput('09102026'), '09/10/2026');
  assert.equal(formatDateInput('09ab@10-2026'), '09/10/2026');
});

test('DateInput blocks letters, caps length, and converts native picker selection', () => {
  const { DateInput, pickerCalls } = loadDateInput(); let changed;
  const tree = DateInput({ value: '', onValueChange: value => { changed = value; }, label: 'Display date' }, null);
  const textInput = nodes(tree).find(node => node.type === 'Input').props;
  assert.equal(textInput.inputMode, 'numeric');
  assert.equal(textInput.maxLength, 10);
  let prevented = false;
  textInput.onKeyDown({ key: 'a', preventDefault: () => { prevented = true; } });
  assert.equal(prevented, true);
  textInput.onPaste({ preventDefault() {}, clipboardData: { getData: () => '09102026' }, target: { value: '' } });
  assert.equal(changed, '09/10/2026');
  const picker = nodes(tree).find(node => node.type === 'input' && node.props.type === 'date').props;
  picker.onChange({ target: { value: '2026-10-09' }, currentTarget: { value: '2026-10-09' } });
  assert.equal(changed, '09/10/2026');
  textInput.rightIcon.props.onClick({ preventDefault() {}, stopPropagation() {} });
  assert.equal(pickerCalls(), 1, 'the calendar button should invoke the native date picker');
});

test('generic calendar validation handles real dates, leap years, format, optional blank and future rules', () => {
  const { validateCalendarDate, validateDob } = loadDateInput();
  assert.equal(validateCalendarDate('', { required: false, allowFuture: false }).valid, true);
  assert.equal(validateCalendarDate('09/10/2026', { allowFuture: false }).valid, true);
  assert.equal(validateCalendarDate('29/02/2024', { allowFuture: false }).valid, true);
  assert.equal(validateCalendarDate('09/10/2026', { allowFuture: false }).backendDate, '2026-10-09');
  for (const value of ['31/02/2026', '29/02/2025', '32/10/2026', '09/13/2026'])
    assert.equal(validateCalendarDate(value, { allowFuture: false }).valid, false, value);
  assert.equal(validateCalendarDate('09/10/26', { allowFuture: false }).error, 'format');
  assert.equal(validateCalendarDate('31/12/9999', { allowFuture: false }).error, 'future');
  assert.equal(validateCalendarDate('31/12/9999', { allowFuture: true }).valid, true);
  assert.equal(validateCalendarDate('', { required: true }).error, 'required');
  assert.equal(validateDob('09/10/2005', 0, 200).valid, true, 'DOB-specific age validation remains available');
});
