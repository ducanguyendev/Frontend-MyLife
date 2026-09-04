import { useTranslation } from 'react-i18next';

export const useLanguage = () => {
  const { t, i18n } = useTranslation();

  const language = i18n.language || 'vi';

  const setLanguage = (lang: 'vi' | 'en') => {
    i18n.changeLanguage(lang);
    localStorage.setItem('i18nextLng', lang);
  };

  // Ready for RTL languages in the future
  const isRTL = language === 'ar' || language === 'he';

  return {
    language,
    setLanguage,
    t,
    isRTL,
    i18n,
  };
};
