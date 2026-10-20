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
  const hooks = [];
  let cursor = 0;
  const reactRuntime = {
    forwardRef: render => (props, ref) => { cursor = 0; return render(props, ref); },
    useState(initial) {
      const index = cursor++;
      if (!(index in hooks)) hooks[index] = typeof initial === 'function' ? initial() : initial;
      return [hooks[index], value => { hooks[index] = typeof value === 'function' ? value(hooks[index]) : value; }];
    },
    useRef(initial) { const index = cursor++; return hooks[index] ?? (hooks[index] = { current: initial }); },
    useCallback(callback) { cursor++; return callback; },
    useEffect() { cursor++; },
  };
  const react = Object.assign(reactRuntime, { default: reactRuntime });
  const jsx = (type, props) => ({ type, props });
  new vm.Script(outputText).runInNewContext({ exports, document: { body: {} }, requestAnimationFrame: callback => { callback(); return 1; }, require: name => {
    if (name === 'react') return react;
    if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
    if (name === 'react-dom') return { createPortal: node => node };
    if (name === 'react-day-picker') return { DayPicker: 'DayPicker' };
    if (name === 'date-fns') return { format: date => date.toLocaleDateString('en-US', { month: 'short', weekday: 'short' }) };
    if (name === 'date-fns/locale') return { enUS: {}, vi: {} };
    if (name === 'lucide-react') return { Calendar: 'Calendar', ChevronLeft: 'ChevronLeft', ChevronRight: 'ChevronRight' };
    if (name === './Input') return { Input: 'Input' };
    if (name === '@/shared/hooks/useLanguage') return { useLanguage: () => ({ language: 'en', t: (_key, options) => options.defaultValue }) };
    throw new Error(`Unexpected import: ${name}`);
  } });
  return { ...exports, source, rerender: props => exports.DateInput(props, null) };
}
function nodes(tree) {
  if (!tree || typeof tree !== 'object') return [];
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  return [tree, ...nodes(tree.props?.children), ...nodes(tree.props?.rightIcon)];
}

test('date typing formatter preserves DD/MM/YYYY entry and conversion helpers', () => {
  const { formatDateInput, formatDobToBackend, formatBackendToDob } = loadDateInput();
  assert.equal(formatDateInput('09'), '09/');
  assert.equal(formatDateInput('091'), '09/1');
  assert.equal(formatDateInput('0910'), '09/10/');
  assert.equal(formatDateInput('09102026'), '09/10/2026');
  assert.equal(formatDateInput('09ab@10-2026'), '09/10/2026');
  assert.equal(formatDobToBackend('16/12/2005'), '2005-12-16');
  assert.equal(formatBackendToDob('2005-12-16T00:00:00Z'), '16/12/2005');
});

test('DateInput keeps numeric typing and paste formatting with no native picker dependency', () => {
  const { DateInput, source, rerender } = loadDateInput(); let changed;
  const props = { value: '', onValueChange: value => { changed = value; }, label: 'Display date' };
  let tree = rerender(props);
  const textInput = nodes(tree).find(node => node.type === 'Input').props;
  assert.equal(textInput.type, 'text');
  assert.equal(textInput.inputMode, 'numeric');
  assert.equal(textInput.maxLength, 10);
  let prevented = false;
  textInput.onKeyDown({ key: 'a', preventDefault: () => { prevented = true; } });
  assert.equal(prevented, true);
  textInput.onPaste({ preventDefault() {}, clipboardData: { getData: () => '09102026' }, target: { value: '' } });
  assert.equal(changed, '09/10/2026');
  assert.doesNotMatch(source, /type=["']date["']|showPicker\s*\(/);
  assert.match(source, /react-day-picker/);
});

test('calendar opens from a keyboard-focusable button, selects a date, and closes', () => {
  const { rerender } = loadDateInput(); let changed; let changeEvent;
  const props = { value: '', name: 'birthDate', onValueChange: value => { changed = value; }, onChange: event => { changeEvent = event; } };
  let tree = rerender(props);
  const calendarButton = nodes(tree).find(node => node.type === 'button' && node.props['aria-haspopup'] === 'dialog');
  assert.ok(calendarButton);
  assert.equal(calendarButton.props.tabIndex, undefined);
  calendarButton.props.onClick({ preventDefault() {}, stopPropagation() {} });
  tree = rerender(props);
  const picker = nodes(tree).find(node => node.type === 'DayPicker');
  assert.ok(picker);
  assert.equal(picker.props.captionLayout, 'dropdown');
  assert.equal(picker.props.weekStartsOn, 1);
  assert.equal(picker.props.selected, undefined);
  picker.props.onSelect(new Date(2005, 11, 16));
  assert.equal(changed, '16/12/2005');
  assert.equal(changeEvent.target.value, '16/12/2005');
  assert.equal(changeEvent.target.name, 'birthDate');
  tree = rerender({ ...props, value: changed });
  assert.equal(nodes(tree).some(node => node.type === 'DayPicker'), false);
});

test('calendar initializes from a valid current date and safely falls back for partial input', () => {
  const valid = loadDateInput();
  const parsed = valid.parseDateInput('16/12/2005');
  assert.deepEqual([parsed.getFullYear(), parsed.getMonth(), parsed.getDate()], [2005, 11, 16]);
  assert.equal(valid.parseDateInput('16/12/'), undefined);
  assert.equal(valid.parseDateInput('31/02/2025'), undefined);
  let tree = valid.rerender({ value: '16/12/2005' });
  const trigger = nodes(tree).find(node => node.type === 'button' && node.props['aria-haspopup'] === 'dialog');
  trigger.props.onClick({ preventDefault() {}, stopPropagation() {} });
  tree = valid.rerender({ value: '16/12/2005' });
  const picker = nodes(tree).find(node => node.type === 'DayPicker');
  assert.deepEqual([picker.props.selected.getFullYear(), picker.props.selected.getMonth(), picker.props.selected.getDate()], [2005, 11, 16]);
});

test('future limits are opt-in and retain existing DOB and Library validation rules', () => {
  const { rerender, validateCalendarDate, validateDob, source } = loadDateInput();
  rerender({ value: '', disableFuture: true });
  const dateInput = readFileSync(join(__dirname, '../src/features/admin/components/family-tree/LibraryPhotoFormFields.tsx'), 'utf8');
  const memberForm = readFileSync(join(__dirname, '../src/features/admin/components/family-tree/MemberFormModal.tsx'), 'utf8');
  const register = readFileSync(join(__dirname, '../src/features/auth/pages/Register.tsx'), 'utf8');
  assert.match(source, /disabled=\{disableFuture \? \{ after: today \} : undefined\}/);
  assert.match(dateInput, /DateInput disableFuture/);
  assert.match(memberForm, /<DateInput\s+disableFuture/);
  assert.match(register, /<DateInput\s+disableFuture/);
  assert.equal(validateCalendarDate('31/12/9999', { allowFuture: false }).error, 'future');
  assert.equal(validateCalendarDate('31/12/9999', { allowFuture: true }).valid, true);
  assert.equal(validateDob('09/10/2005', 0, 200).valid, true);
});

test('calendar locale, localized controls, portal stacking, and dismissal are configured', () => {
  const { source } = loadDateInput();
  assert.match(source, /language === 'vi' \? vi : enUS/);
  assert.match(source, /\['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'\]/);
  assert.match(source, /Tháng \$\{date\.getMonth\(\) \+ 1\}/);
  assert.match(source, /createPortal\([\s\S]*document\.body/);
  assert.match(source, /zIndex: 60/);
  assert.match(source, /document\.addEventListener\('pointerdown'/);
  assert.match(source, /event\.key !== 'Escape'/);
});

test('generic calendar validation handles real dates, leap years, format, optional blank and future rules', () => {
  const { validateCalendarDate } = loadDateInput();
  assert.equal(validateCalendarDate('', { required: false, allowFuture: false }).valid, true);
  assert.equal(validateCalendarDate('09/10/2026', { allowFuture: false }).valid, true);
  assert.equal(validateCalendarDate('29/02/2024', { allowFuture: false }).valid, true);
  assert.equal(validateCalendarDate('09/10/2026', { allowFuture: false }).backendDate, '2026-10-09');
  for (const value of ['31/02/2026', '29/02/2025', '32/10/2026', '09/13/2026'])
    assert.equal(validateCalendarDate(value, { allowFuture: false }).valid, false, value);
  assert.equal(validateCalendarDate('09/10/26', { allowFuture: false }).error, 'format');
  assert.equal(validateCalendarDate('', { required: true }).error, 'required');
});
