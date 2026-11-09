/** Add a language here with its real resources in i18n/index.ts. */
export const supportedLanguages = [
  { code: 'vi', label: 'Tiếng Việt', shortLabel: 'VI' },
  { code: 'en', label: 'English', shortLabel: 'EN' },
] as const;

export type LanguageCode = typeof supportedLanguages[number]['code'];
export const defaultLanguage: LanguageCode = 'vi';

export function normalizeSupportedLanguage(value?: string | null): LanguageCode {
  const code = value?.toLowerCase().split(/[-_]/)[0];
  return supportedLanguages.find(language => language.code === code)?.code ?? defaultLanguage;
}
