import { useTranslation } from 'react-i18next';
import { normalizeSupportedLanguage, type LanguageCode } from '@/shared/i18n/languages';

export const normalizeLanguage = normalizeSupportedLanguage;

export const useLanguage = () => {
  const { t, i18n } = useTranslation();

  const currentRaw = i18n.language || localStorage.getItem('app_language') || localStorage.getItem('i18nextLng') || 'vi';
  const language = normalizeLanguage(currentRaw);

  const setLanguage = (lang: LanguageCode) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('i18nextLng', lang);
    localStorage.setItem('app_language', lang);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
  };

  // Ready for RTL languages in the future
  const isRTL = false;

  return {
    language,
    setLanguage,
    t,
    isRTL,
    i18n,
  };
};
