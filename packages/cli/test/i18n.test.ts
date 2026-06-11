import { describe, expect, it } from "vitest";
import { APP_LOCALE } from "@vcser/core/i18n";
import { createCliI18n, resolveCliLocale } from "../src/locales/i18n";

describe("resolveCliLocale", () => {
  it("prefers the explicit --locale flag", () => {
    const locale = resolveCliLocale({
      argv: ["node", "vcser", "--locale", "zh-CN"],
      env: {
        VCSER_LOCALE: "en"
      },
      systemLocale: "en-US"
    });

    expect(locale).toBe(APP_LOCALE.ZH_CN);
  });

  it("falls back to VCSER_LOCALE when no flag is provided", () => {
    const locale = resolveCliLocale({
      argv: ["node", "vcser"],
      env: {
        VCSER_LOCALE: "zh"
      },
      systemLocale: "en-US"
    });

    expect(locale).toBe(APP_LOCALE.ZH_CN);
  });

  it("uses the system locale when neither argv nor env provides a locale", () => {
    const locale = resolveCliLocale({
      argv: ["node", "vcser"],
      env: {},
      systemLocale: "zh-SG"
    });

    expect(locale).toBe(APP_LOCALE.ZH_CN);
  });
});

describe("createCliI18n", () => {
  it("formats dynamic English messages", () => {
    const i18n = createCliI18n(APP_LOCALE.EN);

    expect(
      i18n.t("wizard.confirmSync", {
        count: 2,
        source: "Visual Studio Code",
        target: "Cursor"
      })
    ).toBe("Sync 2 extensions from Visual Studio Code to Cursor?");
  });

  it("returns Chinese translations for localized help text", () => {
    const i18n = createCliI18n(APP_LOCALE.ZH_CN);

    expect(i18n.t("cli.command.syncDescription")).toBe("启动交互式扩展同步向导");
  });
});
