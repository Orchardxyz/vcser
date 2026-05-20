import { resolveDemoResponse } from "./ipc.demo";

type InvokePayload = unknown;

export async function invoke<T>(command: string, payload?: InvokePayload): Promise<T> {
  if (window.electronAPI?.invoke) {
    try {
      return (await window.electronAPI.invoke(command, payload ?? {})) as T;
    } catch {
      // fall through to demo responses on error
    }
  }

  return resolveDemoResponse<T>(command, payload) as T;
}
