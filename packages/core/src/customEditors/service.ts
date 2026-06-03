import type { CustomEditorInput, CustomEditorRecord } from "../shared/types.js";
import {
  createStoredCustomEditorRecord,
  listStoredCustomEditors,
  runCustomEditorStoreMutation,
  toConflictCandidates,
  writeStoredCustomEditors
} from "./store.js";
import {
  createUniqueCustomSlug,
  CUSTOM_EDITOR_STORE_ERROR_CODE,
  CustomEditorStoreError,
  type CustomEditorConflictCandidate,
  type CustomEditorSeedInput,
  findConflict,
  type InitializeCustomEditorStorageOptions,
  normalizeCustomEditorInput,
  normalizeSeedEditor,
  type NormalizedCustomEditorInput
} from "./shared.js";

async function loadConflictCandidates(ignoredId?: string): Promise<CustomEditorConflictCandidate[]> {
  return toConflictCandidates(await listStoredCustomEditors(), ignoredId);
}

async function assertNoEditorConflict(params: {
  input: NormalizedCustomEditorInput;
  ignoredId?: string;
  reservedEditors?: CustomEditorConflictCandidate[];
}): Promise<void> {
  const storedEditors = await loadConflictCandidates(params.ignoredId);
  const conflict = findConflict(params.input, [...storedEditors, ...(params.reservedEditors ?? [])], params.ignoredId);

  if (!conflict) {
    return;
  }

  throw new CustomEditorStoreError(CUSTOM_EDITOR_STORE_ERROR_CODE.ALREADY_EXISTS, "A matching editor configuration already exists.", {
    conflict
  });
}

export async function initializeCustomEditorStorage(options?: InitializeCustomEditorStorageOptions): Promise<void> {
  const seedEditors = (options?.seedEditors ?? []).map(normalizeSeedEditor);

  if (seedEditors.length === 0) {
    return;
  }

  await runCustomEditorStoreMutation(async () => {
    const editors = await listStoredCustomEditors();
    const reservedSlugs = new Set(editors.map((editor) => editor.slug));
    let nextEditors = editors;

    for (const seed of seedEditors) {
      if (reservedSlugs.has(seed.slug)) {
        continue;
      }

      const normalized = normalizeCustomEditorInput(seed);
      const conflict = findConflict(normalized, toConflictCandidates(nextEditors));

      if (conflict) {
        continue;
      }

      nextEditors = [
        ...nextEditors,
        createStoredCustomEditorRecord(
          {
            ...normalized,
            displayName: seed.displayName
          },
          seed.slug
        )
      ];
      reservedSlugs.add(seed.slug);
    }

    if (nextEditors !== editors) {
      await writeStoredCustomEditors(nextEditors);
    }
  });
}

export async function listCustomEditors(): Promise<CustomEditorRecord[]> {
  return listStoredCustomEditors();
}

export async function appendCustomEditor(
  input: CustomEditorInput,
  options?: { reservedEditors?: CustomEditorConflictCandidate[]; reservedSlugs?: Iterable<string> }
): Promise<CustomEditorRecord> {
  return runCustomEditorStoreMutation(async () => {
    const normalized = normalizeCustomEditorInput(input);
    const existing = await listStoredCustomEditors();

    await assertNoEditorConflict({
      input: normalized,
      reservedEditors: options?.reservedEditors
    });

    const slug = createUniqueCustomSlug(normalized.name, [...(options?.reservedSlugs ?? []), ...existing.map((editor) => editor.slug)]);
    const record = createStoredCustomEditorRecord(normalized, slug);

    await writeStoredCustomEditors([...existing, record]);
    return record;
  });
}
