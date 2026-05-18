import { APP_LOCALE } from "@shared/i18n";
import { en } from "./en";
import { zhCN } from "./zh-CN";

export const resources = {
  [APP_LOCALE.EN]: {
    translation: en
  },
  [APP_LOCALE.ZH_CN]: {
    translation: zhCN
  }
} as const;
