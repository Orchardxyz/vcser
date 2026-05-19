import { readFile } from "node:fs/promises";
import { join, resolve, sep } from "node:path";
import type { PrismaClient } from "../generated/prisma";
import { isRecord } from "../typeGuards";
import { findExtensionDir } from "./extensionFs";
import { namespaceOf } from "./settings";
import { mimeTypeForPath } from "./utils";

type NamespaceCacheRow = {
  extensionId: string;
  namespace: string;
};

interface ExtensionPackageContrib {
  contributes?: {
    configuration?: { properties?: Record<string, unknown> } | Array<{ properties?: Record<string, unknown> }>;
  };
  icon?: string;
}

function isExtensionPackage(value: unknown): value is ExtensionPackageContrib {
  return isRecord(value);
}

function extractConfigNamespaces(pkg: ExtensionPackageContrib): string[] {
  const contrib = pkg.contributes?.configuration;
  if (!contrib) return [];

  const entries = Array.isArray(contrib) ? contrib : [contrib];
  const namespaces = new Set<string>();

  for (const section of entries) {
    const props = section.properties ?? {};
    for (const key of Object.keys(props)) {
      namespaces.add(namespaceOf(key));
    }
  }

  return Array.from(namespaces);
}

async function readExtensionNamespaces(extensionsPath: string, extensionId: string): Promise<string[]> {
  try {
    const extensionDir = await findExtensionDir(extensionsPath, extensionId);
    if (!extensionDir) return [];

    const raw = await readFile(join(extensionDir, "package.json"), "utf-8");
    const parsed: unknown = JSON.parse(raw);
    if (!isExtensionPackage(parsed)) return [];

    return extractConfigNamespaces(parsed);
  } catch {
    return [];
  }
}

async function readExtensionIconDataUrl(extensionsPath: string, extensionId: string): Promise<string | undefined> {
  try {
    const extensionDir = await findExtensionDir(extensionsPath, extensionId);
    if (!extensionDir) return undefined;

    const raw = await readFile(join(extensionDir, "package.json"), "utf-8");
    const parsed: unknown = JSON.parse(raw);
    if (!isExtensionPackage(parsed) || !parsed.icon) return undefined;

    const iconPath = resolve(extensionDir, parsed.icon);
    if (iconPath !== extensionDir && !iconPath.startsWith(`${extensionDir}${sep}`)) {
      return undefined;
    }

    const mimeType = mimeTypeForPath(iconPath);
    if (!mimeType) return undefined;

    const iconBuffer = await readFile(iconPath);
    return `data:${mimeType};base64,${iconBuffer.toString("base64")}`;
  } catch {
    return undefined;
  }
}

export interface ResolvedNamespaceMap {
  /** namespace → extensionId */
  namespaceToExtension: Map<string, string>;
  /** extensionId → icon data URL */
  extensionIcons: Map<string, string>;
}

function deduplicateNamespaceRows(rows: NamespaceCacheRow[]): NamespaceCacheRow[] {
  const seen = new Set<string>();
  return rows.filter(({ extensionId, namespace }) => {
    const key = `${extensionId}::${namespace}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function collectNamespaceRows(opts: { extensionIds: string[]; extensionsPaths: string[] }): Promise<NamespaceCacheRow[]> {
  const { extensionIds, extensionsPaths } = opts;
  const rows: NamespaceCacheRow[] = [];

  await Promise.allSettled(
    extensionIds.map(async (extensionId) => {
      for (const extensionsPath of extensionsPaths) {
        const namespaces = await readExtensionNamespaces(extensionsPath, extensionId);
        if (namespaces.length === 0) continue;

        for (const namespace of namespaces) {
          rows.push({ extensionId, namespace });
        }
        break;
      }
    })
  );

  return deduplicateNamespaceRows(rows);
}

async function readCachedNamespaceRows(prisma: PrismaClient | undefined, extensionIds: string[]): Promise<NamespaceCacheRow[]> {
  if (!prisma || extensionIds.length === 0) {
    return [];
  }

  try {
    return await prisma.extensionNamespaceCache.findMany({
      where: { extensionId: { in: extensionIds } }
    });
  } catch {
    return [];
  }
}

async function writeCachedNamespaceRows(prisma: PrismaClient | undefined, rows: NamespaceCacheRow[]): Promise<void> {
  if (!prisma || rows.length === 0) {
    return;
  }

  try {
    await prisma.extensionNamespaceCache.createMany({
      data: deduplicateNamespaceRows(rows)
    });
  } catch {
    // Namespace resolution must still work without a writable cache.
  }
}

export async function resolveNamespacesToExtensions(opts: {
  extensionIds: string[];
  extensionsPaths: string[];
  prisma?: PrismaClient;
}): Promise<ResolvedNamespaceMap> {
  const { extensionIds, extensionsPaths, prisma } = opts;

  const firstBatch = await readCachedNamespaceRows(prisma, extensionIds);

  const cachedIds = new Set(firstBatch.map((r) => r.extensionId));
  const uncachedIds = extensionIds.filter((id) => !cachedIds.has(id));
  const secondBatch = await collectNamespaceRows({
    extensionIds: uncachedIds,
    extensionsPaths
  });

  await writeCachedNamespaceRows(prisma, secondBatch);

  const allRows = [...firstBatch, ...secondBatch];

  const namespaceToExtension = new Map<string, string>();
  for (const row of allRows) {
    if (!namespaceToExtension.has(row.namespace)) {
      namespaceToExtension.set(row.namespace, row.extensionId);
    }
  }

  const extensionIcons = new Map<string, string>();
  const resolvedExtensionIds = Array.from(new Set(namespaceToExtension.values()));

  await Promise.allSettled(
    resolvedExtensionIds.map(async (extensionId) => {
      for (const extensionsPath of extensionsPaths) {
        const iconDataUrl = await readExtensionIconDataUrl(extensionsPath, extensionId);
        if (iconDataUrl) {
          extensionIcons.set(extensionId, iconDataUrl);
          break;
        }
      }
    })
  );

  return { namespaceToExtension, extensionIcons };
}
