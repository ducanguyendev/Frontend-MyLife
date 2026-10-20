import { useTranslation } from 'react-i18next';

export const normalizeLanguage = (lang?: string | null): 'vi' | 'en' => {
  if (!lang) return 'vi';
  return lang.toLowerCase().startsWith('en') ? 'en' : 'vi';
};

export const useLanguage = () => {
  const { t, i18n } = useTranslation();

  const currentRaw = i18n.language || localStorage.getItem('app_language') || localStorage.getItem('i18nextLng') || 'vi';
  const language: 'vi' | 'en' = normalizeLanguage(currentRaw);

  const setLanguage = (lang: 'vi' | 'en') => {
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
