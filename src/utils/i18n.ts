import i18n from "i18next";
import {initReactI18next} from "react-i18next";
import Backend from "i18next-http-backend";

const LANG_STORE = 'ex_LANG_STORE'

// @ts-ignore
var userLang = navigator.language || navigator.userLanguage;

let lang = localStorage.getItem(LANG_STORE);
let newLang = lang;
if (!newLang && userLang.match('en')) newLang = 'en';
if (!newLang && userLang.match('ru')) newLang = 'ru';

i18n
    .use(Backend)
    .use(initReactI18next)
    .init({
        lng: lang || '', // Default language
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false,
        },
        react: {
            useSuspense: true
        },
        backend: {
            loadPath: '/locales/{{lng}}.json'
        }
    })

export default i18n
