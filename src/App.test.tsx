import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import App from "./app";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(async (command: string) => {
    if (command === "detect_editors") {
      return [
        {
          name: "Cursor",
          slug: "cursor",
          cli: "cursor",
          badgeColor: "magenta",
          extensionsPath: "/tmp/cursor/extensions",
          settingsPath: "/tmp/cursor/settings.json",
          cliAvailable: true,
          extensionsExist: true,
          settingsExist: true,
        },
        {
          name: "Windsurf",
          slug: "windsurf",
          cli: "windsurf",
          badgeColor: "blue",
          extensionsPath: "/tmp/windsurf/extensions",
          settingsPath: "/tmp/windsurf/settings.json",
          cliAvailable: true,
          extensionsExist: true,
          settingsExist: true,
        },
      ];
    }

    if (command === "compute_extension_diff") {
      return {
        editorNames: ["Cursor", "Windsurf"],
        all: [],
        onlyDiffs: [],
      };
    }

    if (command === "compute_settings_diff") {
      return [];
    }

    if (command === "execute_sync") {
      return [];
    }

    throw new Error(`Unknown command ${command}`);
  }),
}));

describe("App", () => {
  it("renders desktop sync title", async () => {
    render(<App />);
    expect(await screen.findByText("Desktop Sync Console")).toBeInTheDocument();
    expect(await screen.findByText("Step 1 — Select Editors")).toBeInTheDocument();
  });
});
