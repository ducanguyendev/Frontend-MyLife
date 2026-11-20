const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { test } = require('node:test');
const assert = require('node:assert/strict');

const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src/features/auth/registerApiErrors.ts'), 'utf8');
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const moduleExports = {};
new vm.Script(js).runInNewContext({ exports: moduleExports });
const { getRegisterApiErrorMessage } = moduleExports;
const dictionaries = Object.fromEntries(['vi', 'en'].map(language => [
  language,
  JSON.parse(fs.readFileSync(path.join(root, `src/shared/locales/${language}/common.json`), 'utf8')),
]));
const translate = language => key => key.split('.').slice(1).reduce((value, part) => value?.[part], dictionaries[language]);
const apiError = (code, message = 'English backend diagnostic') => ({ payload: { code, message }, message });

test('known register error codes use the selected locale and suppress backend English', () => {
  const cases = {
    AUTH_PASSWORD_MISMATCH: ['Mật khẩu xác nhận không khớp.', 'Passwords do not match.'],
    AUTH_PASSWORD_TOO_LONG: ['Mật khẩu không được vượt quá 72 byte.', 'Password must not exceed 72 UTF-8 bytes.'],
    AUTH_GMAIL_REQUIRED: ['Chỉ hỗ trợ địa chỉ Gmail.', 'Only Gmail addresses are supported.'],
    AUTH_EMAIL_ALREADY_REGISTERED: ['Email này đã được đăng ký.', 'Email is already registered.'],
    AUTH_DOB_INVALID: ['Ngày sinh không hợp lệ.', 'Date of birth is invalid.'],
    AUTH_SERVICE_NOT_INITIALIZED: ['Dịch vụ hiện chưa sẵn sàng. Vui lòng thử lại sau.', 'The service is temporarily unavailable. Please try again later.'],
  };
  for (const [code, [vietnamese, english]] of Object.entries(cases)) {
    const error = apiError(code);
    assert.equal(getRegisterApiErrorMessage(error, translate('vi')), vietnamese, `${code} VI`);
    assert.equal(getRegisterApiErrorMessage(error, translate('en')), english, `${code} EN`);
    assert.doesNotMatch(getRegisterApiErrorMessage(error, translate('vi')), /English backend diagnostic/);
  }
});

test('rate limit and unknown errors use localized UI text instead of raw backend messages', () => {
  assert.equal(getRegisterApiErrorMessage(apiError('RATE_LIMITED'), translate('vi')), 'Bạn thao tác quá nhanh. Vui lòng thử lại sau.');
  assert.equal(getRegisterApiErrorMessage(apiError('RATE_LIMITED'), translate('en')), 'Too many requests. Please try again later.');
  assert.equal(getRegisterApiErrorMessage(apiError('UNKNOWN_CODE'), translate('vi')), 'Đăng ký thất bại. Vui lòng thử lại.');
  assert.equal(getRegisterApiErrorMessage(apiError('UNKNOWN_CODE'), translate('en')), 'Registration failed. Please try again.');
  assert.equal(getRegisterApiErrorMessage(new Error('raw English exception'), translate('vi')), 'Đăng ký thất bại. Vui lòng thử lại.');
});
