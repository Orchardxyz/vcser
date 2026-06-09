import { describe, expect, it, vi } from "vitest";
import { createLogger } from "../src/logger";

describe("createLogger", () => {
  it("returns a CliLogger with palette", () => {
    const logger = createLogger({ colorEnabled: true, debugEnabled: false });
    expect(logger.palette).toBeDefined();
    expect(typeof logger.palette.brand).toBe("function");
  });

  it("returns identity formatters when color is disabled", () => {
    const logger = createLogger({ colorEnabled: false, debugEnabled: false });
    expect(logger.palette.brand("test")).toBe("test");
    expect(logger.palette.green("test")).toBe("test");
    expect(logger.palette.red("test")).toBe("test");
    expect(logger.palette.yellow("test")).toBe("test");
    expect(logger.palette.cyan("test")).toBe("test");
    expect(logger.palette.dim("test")).toBe("test");
  });

  it("line() outputs to stdout", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const logger = createLogger({ colorEnabled: false, debugEnabled: false });
    logger.line("hello");
    expect(spy).toHaveBeenCalledWith("hello");
    spy.mockRestore();
  });

  it("line() with no argument outputs empty string", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const logger = createLogger({ colorEnabled: false, debugEnabled: false });
    logger.line();
    expect(spy).toHaveBeenCalledWith("");
    spy.mockRestore();
  });
});

describe("debug behavior", () => {
  it("does not output when debug is disabled", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const logger = createLogger({ colorEnabled: false, debugEnabled: false });
    logger.debug("should not appear");
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("outputs to stderr when debug is enabled", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const logger = createLogger({ colorEnabled: false, debugEnabled: true });
    logger.debug("diagnostic message");
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0]?.[0]).toContain("diagnostic message");
    spy.mockRestore();
  });
});

describe("inventorySummary", () => {
  it("does not throw", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const logger = createLogger({ colorEnabled: false, debugEnabled: false });
    expect(() =>
      logger.inventorySummary({
        sourceLabel: "Visual Studio Code",
        sourceCount: 10,
        targetLabel: "Cursor",
        targetCount: 8,
        candidateCount: 12,
        missingCount: 2,
        mismatchCount: 2
      })
    ).not.toThrow();
    spy.mockRestore();
  });
});

describe("syncSummary", () => {
  it("includes failed extension details", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const logger = createLogger({ colorEnabled: false, debugEnabled: false });
    logger.syncSummary({
      selectedCount: 5,
      succeededCount: 4,
      failedCount: 1,
      failures: [{ extensionId: "bad.ext", message: "network error" }]
    });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    const calls = spy.mock.calls.map((c) => c[0]);
    expect(calls.some((line) => typeof line === "string" && line.includes("bad.ext") && line.includes("network error"))).toBe(true);
    spy.mockRestore();
  });

  it("renders a generic table with the provided columns and rows", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const logger = createLogger({ colorEnabled: false, debugEnabled: false });

    logger.table({
      columns: [
        {
          key: "sourceExtension",
          label: "Source extension",
          maxWidth: 28
        },
        {
          key: "targetExtension",
          label: "Target extension",
          maxWidth: 28
        }
      ],
      rows: [
        {
          sourceExtension: "ms-python.python@1.0.0",
          targetExtension: "ms-python.python@1.0.0"
        }
      ]
    });

    const calls = spy.mock.calls.map((call) => String(call[0] ?? ""));
    expect(calls.some((line) => line.includes("┌") && line.includes("┬") && line.includes("┐"))).toBe(true);
    expect(calls.some((line) => line.includes("├") && line.includes("┼") && line.includes("┤"))).toBe(true);
    expect(calls.some((line) => line.includes("Source extension") && line.includes("Target extension"))).toBe(true);
    expect(calls.some((line) => line.includes("ms-python.python@1.0.0"))).toBe(true);
    spy.mockRestore();
  });
});
