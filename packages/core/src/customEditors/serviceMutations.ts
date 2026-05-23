import type { UpdateCustomEditorInput, CustomEditorRecord } from "../shared/types.js";
import type { CustomEditorConflictCandidate } from "./shared.js";
import { CustomEditorStoreError, normalizeCustomEditorInput, toCustomEditorRecord } from "./shared.js";
import { appendCustomEditor, initializeCustomEditorStorage, listCustomEditors } from "./service.js";
import { getPrismaClient } from "../db.js";

function requirePrismaClient() {
  const prisma = getPrismaClient();

  if (!prisma) {
    throw new CustomEditorStoreError("custom_editor_store_unavailable", "Custom editor storage is unavailable.");
  }

  return prisma;
}

async function loadConflictCandidates(ignoredId?: string): Promise<CustomEditorConflictCandidate[]> {
  const editors = await listCustomEditors();
  return editors
    .filter((editor) => !ignoredId || editor.id !== ignoredId)
    .map((editor) => ({
      id: editor.id,
      slug: editor.slug,
      name: editor.name,
      displayName: editor.displayName,
      extensionsPath: editor.extensionsPath,
      settingsPath: editor.settingsPath
    }));
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
    throw new CustomEditorStoreError("custom_editor_already_exists", "A matching editor configuration already exists.", {
      conflict
    });
  }
}

export async function updateCustomEditor(
  input: UpdateCustomEditorInput,
  options?: { reservedEditors?: CustomEditorConflictCandidate[] }
): Promise<CustomEditorRecord> {
  const prisma = requirePrismaClient();

  await initializeCustomEditorStorage();

  const existing = await prisma.customEditor.findUnique({
    where: {
      id: input.id
    }
  });

  if (!existing) {
    throw new CustomEditorStoreError("custom_editor_not_found", `Custom editor ${input.id} not found.`);
  }

  const normalized = normalizeCustomEditorInput(input);
  await assertNoEditorConflict({
    input: normalized,
    ignoredId: input.id,
    reservedEditors: options?.reservedEditors
  });

  const record = await prisma.customEditor.update({
    where: {
      id: input.id
    },
    data: normalized
  });

  return toCustomEditorRecord(record);
}

export async function removeCustomEditor(id: string): Promise<CustomEditorRecord> {
  const prisma = requirePrismaClient();

  await initializeCustomEditorStorage();

  const existing = await prisma.customEditor.findUnique({
    where: {
      id
    }
  });

  if (!existing) {
    throw new CustomEditorStoreError("custom_editor_not_found", `Custom editor ${id} not found.`);
  }

  const record = await prisma.customEditor.delete({
    where: {
      id
    }
  });

  return toCustomEditorRecord(record);
}

export async function findCustomEditorByIdOrSlug(identifier: string): Promise<CustomEditorRecord | undefined> {
  const prisma = requirePrismaClient();

  await initializeCustomEditorStorage();

  const editor = await prisma.customEditor.findFirst({
    where: {
      OR: [{ id: identifier }, { slug: identifier }]
    }
  });

  return editor ? toCustomEditorRecord(editor) : undefined;
}

export { appendCustomEditor };
