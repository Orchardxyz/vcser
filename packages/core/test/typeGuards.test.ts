import { describe, expect, it } from "vitest";
import { hasBooleanProperty, hasStringProperty, isRecord } from "../src/typeGuards";

describe("isRecord", () => {
  it("returns true for plain objects", () => {
    expect(isRecord({})).toBe(true);
    expect(isRecord({ a: 1, b: "two" })).toBe(true);
  });

  it("returns false for null", () => {
    expect(isRecord(null)).toBe(false);
  });

  it("returns false for arrays", () => {
    expect(isRecord([])).toBe(false);
    expect(isRecord([1, 2, 3])).toBe(false);
  });

  it("returns false for primitives", () => {
    expect(isRecord(42)).toBe(false);
    expect(isRecord("string")).toBe(false);
    expect(isRecord(true)).toBe(false);
    expect(isRecord(undefined)).toBe(false);
    expect(isRecord(Symbol("sym"))).toBe(false);
  });
});

describe("hasStringProperty", () => {
  it("accepts present string keys", () => {
    expect(hasStringProperty({ name: "Alice" }, "name")).toBe(true);
  });

  it("rejects non-string values for the target key", () => {
    expect(hasStringProperty({ name: 42 }, "name")).toBe(false);
    expect(hasStringProperty({ name: true }, "name")).toBe(false);
    expect(hasStringProperty({ name: {} }, "name")).toBe(false);
  });

  it("returns false when key is absent", () => {
    expect(hasStringProperty({}, "name")).toBe(false);
  });

  it("returns false for non-record values", () => {
    expect(hasStringProperty(null, "name")).toBe(false);
    expect(hasStringProperty([], "name")).toBe(false);
    expect(hasStringProperty("not-an-object", "name")).toBe(false);
  });
});

describe("hasBooleanProperty", () => {
  it("accepts present boolean keys", () => {
    expect(hasBooleanProperty({ active: true }, "active")).toBe(true);
    expect(hasBooleanProperty({ active: false }, "active")).toBe(true);
  });

  it("rejects non-boolean values for the target key", () => {
    expect(hasBooleanProperty({ active: 1 }, "active")).toBe(false);
    expect(hasBooleanProperty({ active: "yes" }, "active")).toBe(false);
    expect(hasBooleanProperty({ active: {} }, "active")).toBe(false);
  });

  it("returns false when key is absent", () => {
    expect(hasBooleanProperty({}, "active")).toBe(false);
  });

  it("returns false for non-record values", () => {
    expect(hasBooleanProperty(null, "active")).toBe(false);
    expect(hasBooleanProperty([], "active")).toBe(false);
  });
});
