import { APP_LOCALE, type AppLocale } from "@vcser/core/i18n";
import { enCatalog, type CliCatalogShape } from "./en";
import { zhCnCatalog } from "./zh-CN";

type CliCatalog = CliCatalogShape;

export type CliMessageKey = keyof CliCatalog;

type CliMessageKeyWithParams = {
  [K in CliMessageKey]: CliCatalog[K] extends (params: infer _Params) => string ? K : never;
}[CliMessageKey];

type CliMessageKeyWithoutParams = Exclude<CliMessageKey, CliMessageKeyWithParams>;
type CliMessageParams<K extends CliMessageKeyWithParams> = CliCatalog[K] extends (params: infer P) => string ? P : never;

export interface CliI18n {
  locale: AppLocale;
  t<K extends CliMessageKeyWithoutParams>(key: K): string;
  t<K extends CliMessageKeyWithParams>(key: K, params: CliMessageParams<K>): string;
}

const catalogs: Record<AppLocale, CliCatalog> = {
  [APP_LOCALE.EN]: enCatalog,
  [APP_LOCALE.ZH_CN]: zhCnCatalog
};

function resolveAppLocale(locale: string | null | undefined): AppLocale {
  const normalized = locale?.trim().toLowerCase() ?? "";

  if (normalized.startsWith("zh")) {
    return APP_LOCALE.ZH_CN;
  }

  return APP_LOCALE.EN;
}

function readOptionValue(argv: readonly string[], flagName: string): string | undefined {
  const flagIndex = argv.findIndex((value) => value === flagName);
  if (flagIndex >= 0) {
    const nextValue = argv[flagIndex + 1];
    return nextValue && !nextValue.startsWith("-") ? nextValue : undefined;
  }

  const prefixedFlag = `${flagName}=`;
  const inlineMatch = argv.find((value) => value.startsWith(prefixedFlag));
  return inlineMatch ? inlineMatch.slice(prefixedFlag.length) : undefined;
}

export function resolveCliLocale(params?: {
  argv?: readonly string[];
  env?: NodeJS.ProcessEnv;
  systemLocale?: string | null | undefined;
}): AppLocale {
  const argv = params?.argv ?? process.argv;
  const env = params?.env ?? process.env;
  const explicitLocale = readOptionValue(argv, "--locale");

  if (explicitLocale) {
    return resolveAppLocale(explicitLocale);
  }

  const envLocale = env.VCSER_LOCALE ?? env.LC_ALL ?? env.LC_MESSAGES ?? env.LANG;
  if (envLocale) {
    return resolveAppLocale(envLocale);
  }

  const systemLocale = params?.systemLocale ?? Intl.DateTimeFormat().resolvedOptions().locale;
  return resolveAppLocale(systemLocale);
}

export function createCliI18n(locale: AppLocale): CliI18n {
  const catalog = catalogs[locale] ?? catalogs[APP_LOCALE.EN];

  function formatDynamicMessage<K extends CliMessageKeyWithParams>(key: K, params: CliMessageParams<K>): string {
    const message = catalog[key] as (value: CliMessageParams<K>) => string;
    return message(params);
  }

  function t<K extends CliMessageKeyWithoutParams>(key: K): string;
  function t<K extends CliMessageKeyWithParams>(key: K, params: CliMessageParams<K>): string;
  function t(key: CliMessageKey, params?: unknown): string {
    const message = catalog[key];

    if (typeof message === "function") {
      return formatDynamicMessage(key as CliMessageKeyWithParams, params as never);
    }

    return message;
  }

  return {
    locale,
    t
  };
}
