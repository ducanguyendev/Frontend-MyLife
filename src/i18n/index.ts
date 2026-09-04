import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import navVi from '../locales/vi/navigation.json';
import navEn from '../locales/en/navigation.json';
import homeVi from '../locales/vi/home.json';
import homeEn from '../locales/en/home.json';
import aboutVi from '../locales/vi/about.json';
import aboutEn from '../locales/en/about.json';
import skillsVi from '../locales/vi/skills.json';
import skillsEn from '../locales/en/skills.json';
import projectsVi from '../locales/vi/projects.json';
import projectsEn from '../locales/en/projects.json';
import expVi from '../locales/vi/experience.json';
import expEn from '../locales/en/experience.json';
import contactVi from '../locales/vi/contact.json';
import contactEn from '../locales/en/contact.json';
import footerVi from '../locales/vi/footer.json';
import footerEn from '../locales/en/footer.json';
import commonVi from '../locales/vi/common.json';
import commonEn from '../locales/en/common.json';

const resources = {
  vi: {
    translation: {
      navigation: navVi,
      home: homeVi,
      about: aboutVi,
      skills: skillsVi,
      projects: projectsVi,
      experience: expVi,
      contact: contactVi,
      footer: footerVi,
      common: commonVi,
    }
  },
  en: {
    translation: {
      navigation: navEn,
      home: homeEn,
      about: aboutEn,
      skills: skillsEn,
      projects: projectsEn,
      experience: expEn,
      contact: contactEn,
      footer: footerEn,
      common: commonEn,
    }
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    // Default language is Vietnamese
    lng: localStorage.getItem('i18nextLng') || 'vi',
    defaultNS: 'translation',
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
