import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import uz from './locales/uz.json';
import ru from './locales/ru.json';
import en from './locales/en.json';

const LANG_KEY = '@savdo_lang';

const resources = {
  uz: { translation: uz },
  ru: { translation: ru },
  en: { translation: en },
};

const initI18n = async () => {
  let savedLang = await AsyncStorage.getItem(LANG_KEY);

  i18n.use(initReactI18next).init({
    resources,
    lng: savedLang || 'uz',
    fallbackLng: 'uz',
    interpolation: {
      escapeValue: false,
    },
  });
};

export const changeLanguage = async (lang) => {
  await i18n.changeLanguage(lang);
  await AsyncStorage.setItem(LANG_KEY, lang);
};

export const getSavedLanguage = async () => {
  return AsyncStorage.getItem(LANG_KEY);
};

initI18n();

export default i18n;
