import {
  appendCustomEditor,
  CustomEditorStoreError,
  findCustomEditorByIdOrSlug,
  initializeCustomEditorStorage,
  listCustomEditors,
  removeCustomEditor,
  updateCustomEditor
} from "@vcser/core/customEditors";

let ensureInitializedPromise: Promise<void> | null = null;

async function ensureDesktopCustomEditorsInitialized(): Promise<void> {
  if (ensureInitializedPromise) {
    return ensureInitializedPromise;
  }

  ensureInitializedPromise = initializeCustomEditorStorage();

  try {
    await ensureInitializedPromise;
  } catch (error) {
    ensureInitializedPromise = null;
    throw error;
  }
}

export { CustomEditorStoreError, findCustomEditorByIdOrSlug };

export async function listDesktopCustomEditors() {
  await ensureDesktopCustomEditorsInitialized();
  return listCustomEditors();
}

export async function appendDesktopCustomEditor(...args: Parameters<typeof appendCustomEditor>) {
  await ensureDesktopCustomEditorsInitialized();
  return appendCustomEditor(...args);
}

export async function updateDesktopCustomEditor(...args: Parameters<typeof updateCustomEditor>) {
  await ensureDesktopCustomEditorsInitialized();
  return updateCustomEditor(...args);
}

export async function removeDesktopCustomEditor(...args: Parameters<typeof removeCustomEditor>) {
  await ensureDesktopCustomEditorsInitialized();
  return removeCustomEditor(...args);
}
