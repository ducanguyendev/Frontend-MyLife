import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { defaultLanguage, normalizeSupportedLanguage, supportedLanguages, type LanguageCode } from './languages';

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
import adminVi from '../locales/vi/admin.json';
import adminEn from '../locales/en/admin.json';
import myLifeVi from '../locales/vi/myLife.json';
import myLifeEn from '../locales/en/myLife.json';
import appShellVi from '../locales/vi/appShell.json';
import appShellEn from '../locales/en/appShell.json';
import landingVi from '../locales/vi/landing.json';
import landingEn from '../locales/en/landing.json';
import familyVi from '../locales/vi/family.json';
import familyEn from '../locales/en/family.json';
import memoriesVi from '../locales/vi/memories.json';
import memoriesEn from '../locales/en/memories.json';

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
      admin: adminVi,
      myLife: myLifeVi,
      appShell: appShellVi,
      landing: landingVi,
      family: familyVi,
      memories: memoriesVi,
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
      admin: adminEn,
      myLife: myLifeEn,
      appShell: appShellEn,
      landing: landingEn,
      family: familyEn,
      memories: memoriesEn,
    }
  },
} satisfies Record<LanguageCode, { translation: Record<string, unknown> }>;

const getInitialLanguage = (): LanguageCode => {
  const saved = localStorage.getItem('app_language') || localStorage.getItem('i18nextLng');
  if (saved) {
    return normalizeSupportedLanguage(saved);
  }
  return defaultLanguage;
};

const initialLang = getInitialLanguage();

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: defaultLanguage,
    supportedLngs: supportedLanguages.map(language => language.code),
    load: 'languageOnly',
    lng: initialLang,
    defaultNS: 'translation',
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'app_language',
      caches: ['localStorage'],
    },
  });

// Ensure HTML lang attribute matches initial language
if (typeof document !== 'undefined') {
  document.documentElement.lang = initialLang;
}

export default i18n;
