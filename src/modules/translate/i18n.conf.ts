import i18n from 'i18next';
import path from 'path';
import { logger } from '../../utils/logger';
import { makeZodI18nMap, zodI18nMap } from "zod-i18n-map"
import { z } from 'zod';
import zodEn from "../../locales/en/zod.json";
import zodRu from "../../locales/ru/zod.json";
import zodEs from "../../locales/es/zod.json";
import errRu from "../../locales/ru/errors.json"
import errEn from "../../locales/en/errors.json"
import errEs from "../../locales/es/errors.json"

i18n
  .init({
    fallbackLng: 'en',
    fallbackNS: 'common',
    preload: ['en', 'ru', 'es'],
    resources: {
      en: {
        zod: zodEn,
        errors: errEn
      },
      ru: {
        zod: zodRu,
        errors: errRu
      },
      es: {
        zod: zodEs,
        errors: errEs,
      }
    }
  }, (err, t) => {
    if (err) return logger.error(`i18n Something went wrong while loading i18next ${err}`);
    logger.debug('i18n Translator i18next is initialized');
  });

z.setErrorMap(makeZodI18nMap({
  ns: ["zod", "errors"],
}))

export default i18n;
