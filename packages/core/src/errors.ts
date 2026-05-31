export const NODE_ERROR_CODE = {
  ENOENT: "ENOENT",
  ERR_DLOPEN_FAILED: "ERR_DLOPEN_FAILED"
} as const;

export type NodeErrorCode = (typeof NODE_ERROR_CODE)[keyof typeof NODE_ERROR_CODE];

export interface CodedError<Code extends string = string> extends Error {
  readonly code: Code;
}

export function isCodedError(error: unknown): error is CodedError {
  return error instanceof Error && typeof (error as { code?: unknown }).code === "string";
}

export function hasErrorCode<Code extends string>(error: unknown, code: Code): error is CodedError<Code> {
  return isCodedError(error) && error.code === code;
}
