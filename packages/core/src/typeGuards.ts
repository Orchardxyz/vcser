export function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

export function hasStringProperty<K extends string>(value: unknown, key: K): value is Record<K, string> & Record<string, unknown> {
  return isRecord(value) && typeof value[key] === "string";
}

export function hasBooleanProperty<K extends string>(value: unknown, key: K): value is Record<K, boolean> & Record<string, unknown> {
  return isRecord(value) && typeof value[key] === "boolean";
}
