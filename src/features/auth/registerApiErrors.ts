export type Translate = (key: string, options?: { defaultValue?: string }) => string;

const registerErrorKeyByCode: Record<string, string> = {
  AUTH_PASSWORD_MISMATCH: 'common.registerPage.errors.authPasswordMismatch',
  AUTH_PASSWORD_TOO_LONG: 'common.registerPage.errors.authPasswordTooLong',
  AUTH_GMAIL_REQUIRED: 'common.registerPage.errors.authGmailRequired',
  AUTH_EMAIL_ALREADY_REGISTERED: 'common.registerPage.errors.authEmailAlreadyRegistered',
  AUTH_DOB_INVALID: 'common.registerPage.errors.authDobInvalid',
  AUTH_SERVICE_NOT_INITIALIZED: 'common.registerPage.errors.authServiceNotInitialized',
};

function readErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== 'object' || !('payload' in error)) return undefined;
  const payload = (error as { payload?: unknown }).payload;
  if (!payload || typeof payload !== 'object' || !('code' in payload)) return undefined;
  const code = (payload as { code?: unknown }).code;
  return typeof code === 'string' ? code : undefined;
}

export function getRegisterApiErrorMessage(error: unknown, t: Translate): string {
  const code = readErrorCode(error);
  if (code === 'RATE_LIMITED') return t('common.rate_limited');
  const key = code ? registerErrorKeyByCode[code] : undefined;
  return key
    ? t(key)
    : t('common.registerPage.errors.registerFailed', { defaultValue: 'Registration failed. Please try again.' });
}
