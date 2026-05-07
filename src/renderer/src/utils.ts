export function formatDiffValue(value: unknown): string {
  if (value === undefined) return "";
  if (typeof value === "string") return JSON.stringify(value);
  const serialized = JSON.stringify(value, null, 2);
  return serialized ?? String(value);
}
