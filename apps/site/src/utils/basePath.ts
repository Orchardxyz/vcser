type ImportMetaWithBaseUrl = ImportMeta & {
  readonly env?: {
    readonly BASE_URL?: string;
  };
};

export function resolveBaseHref(path = ""): string {
  const meta = import.meta as ImportMetaWithBaseUrl;
  const baseHref = typeof meta.env?.BASE_URL === "string" ? meta.env.BASE_URL : "/";
  const normalizedBaseHref = baseHref.endsWith("/") ? baseHref : `${baseHref}/`;
  const normalizedPath = path.replace(/^\//u, "");

  return normalizedPath.length === 0 ? normalizedBaseHref : new URL(normalizedPath, `https://vcser.local${normalizedBaseHref}`).pathname;
}
