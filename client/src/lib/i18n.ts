import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import arTranslations from '@shared/locales/ar.json';
import enTranslations from '@shared/locales/en.json';

// Configure i18next
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    debug: false,
    fallbackLng: 'ar',
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    resources: {
      ar: {
        translation: arTranslations
      },
      en: {
        translation: enTranslations
      }
    },
    react: {
      useSuspense: false,
    },
    supportedLngs: ['ar', 'en'],
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

// Handler to change the language
export const changeLanguage = (lng: string) => {
  i18n.changeLanguage(lng);
  
  // Set the RTL direction based on language
  if (lng === 'ar') {
    document.documentElement.dir = 'rtl';
    document.documentElement.lang = 'ar';
  } else {
    document.documentElement.dir = 'ltr';
    document.documentElement.lang = 'en';
  }
};

// Set initial direction based on current language
if (i18n.language === 'ar') {
  document.documentElement.dir = 'rtl';
  document.documentElement.lang = 'ar';
} else {
  document.documentElement.dir = 'ltr';
  document.documentElement.lang = 'en';
}

export default i18n;
