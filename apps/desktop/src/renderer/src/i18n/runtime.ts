import type { TFunction } from "i18next";
import { RUNTIME_MESSAGE_KEY } from "@/types";
import i18n from "./index";
import type { RuntimeMessageKey, RuntimeMessageParams } from "@/types";

interface RuntimeMessageLike {
  errorKey?: RuntimeMessageKey;
  errorParams?: RuntimeMessageParams;
  error?: string;
}

export function translateRuntimeMessageWithT(
  t: TFunction,
  value: RuntimeMessageLike | null | undefined,
  fallbackKey: RuntimeMessageKey = RUNTIME_MESSAGE_KEY.MISSING_SYNC_RESULT
): string {
  if (value?.errorKey) {
    return t(value.errorKey, value.errorParams ?? {});
  }

  if (value?.error) {
    return value.error;
  }

  return t(fallbackKey);
}

export function translateRuntimeMessage(
  value: RuntimeMessageLike | null | undefined,
  fallbackKey: RuntimeMessageKey = RUNTIME_MESSAGE_KEY.MISSING_SYNC_RESULT
): string {
  return translateRuntimeMessageWithT(i18n.t.bind(i18n), value, fallbackKey);
}
