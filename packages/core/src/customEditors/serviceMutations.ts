import type { UpdateCustomEditorInput, CustomEditorRecord } from "../shared/types.js";
import type { CustomEditorConflictCandidate } from "./shared.js";
import {
  listStoredCustomEditors,
  runCustomEditorStoreMutation,
  toConflictCandidates,
  updateStoredCustomEditorRecord,
  writeStoredCustomEditors
} from "./store.js";
import { CUSTOM_EDITOR_STORE_ERROR_CODE, CustomEditorStoreError, normalizeCustomEditorInput } from "./shared.js";
import { appendCustomEditor, initializeCustomEditorStorage, listCustomEditors } from "./service.js";

async function loadConflictCandidates(ignoredId?: string): Promise<CustomEditorConflictCandidate[]> {
  return toConflictCandidates(await listCustomEditors(), ignoredId);
}

async function assertNoEditorConflict(params: {
  input: ReturnType<typeof normalizeCustomEditorInput>;
  ignoredId?: string;
  reservedEditors?: CustomEditorConflictCandidate[];
}): Promise<void> {
  const { findConflict } = await import("./shared.js");
  const storedEditors = await loadConflictCandidates(params.ignoredId);
  const conflict = findConflict(params.input, [...storedEditors, ...(params.reservedEditors ?? [])], params.ignoredId);

  if (conflict) {
    throw new CustomEditorStoreError(CUSTOM_EDITOR_STORE_ERROR_CODE.ALREADY_EXISTS, "A matching editor configuration already exists.", {
      conflict
    });
  }
}

export async function updateCustomEditor(
  input: UpdateCustomEditorInput,
  options?: { reservedEditors?: CustomEditorConflictCandidate[] }
): Promise<CustomEditorRecord> {
  await initializeCustomEditorStorage();

  return runCustomEditorStoreMutation(async () => {
    const editors = await listStoredCustomEditors();
    const existing = editors.find((editor) => editor.id === input.id);

    if (!existing) {
      throw new CustomEditorStoreError(CUSTOM_EDITOR_STORE_ERROR_CODE.NOT_FOUND, `Custom editor ${input.id} not found.`);
    }

    const normalized = normalizeCustomEditorInput(input);
    await assertNoEditorConflict({
      input: normalized,
      ignoredId: input.id,
      reservedEditors: options?.reservedEditors
    });

    const record = updateStoredCustomEditorRecord(existing, normalized);
    await writeStoredCustomEditors(editors.map((editor) => (editor.id === input.id ? record : editor)));
    return record;
  });
}

export async function removeCustomEditor(id: string): Promise<CustomEditorRecord> {
  await initializeCustomEditorStorage();

  return runCustomEditorStoreMutation(async () => {
    const editors = await listStoredCustomEditors();
    const existing = editors.find((editor) => editor.id === id);

    if (!existing) {
      throw new CustomEditorStoreError(CUSTOM_EDITOR_STORE_ERROR_CODE.NOT_FOUND, `Custom editor ${id} not found.`);
    }

    await writeStoredCustomEditors(editors.filter((editor) => editor.id !== id));
    return existing;
  });
}

export async function findCustomEditorByIdOrSlug(identifier: string): Promise<CustomEditorRecord | undefined> {
  await initializeCustomEditorStorage();

  const editors = await listStoredCustomEditors();
  return editors.find((editor) => editor.id === identifier || editor.slug === identifier);
}

export { appendCustomEditor };
