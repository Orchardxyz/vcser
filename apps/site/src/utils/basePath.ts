export function resolveBaseHref(path = ""): string {
  const baseHref = typeof import.meta.env.BASE_URL === "string" ? import.meta.env.BASE_URL : "/";
  const normalizedBaseHref = baseHref.endsWith("/") ? baseHref : `${baseHref}/`;
  const normalizedPath = path.replace(/^\//u, "");

  return normalizedPath.length === 0 ? normalizedBaseHref : new URL(normalizedPath, `https://vcser.local${normalizedBaseHref}`).pathname;
}
