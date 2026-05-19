export const diffViewerStyles = {
  variables: {
    light: {
      diffViewerBackground: "#ffffff",
      diffViewerTitleBackground: "#f8fafc",
      diffViewerTitleBorderColor: "#e2e8f0",
      diffViewerTitleColor: "#64748b",
      gutterBackground: "#f8fafc",
      gutterColor: "#94a3b8",
      addedBackground: "#f0fdf4",
      addedColor: "#166534",
      removedBackground: "#fff1f2",
      removedColor: "#be123c",
      addedGutterBackground: "#dcfce7",
      removedGutterBackground: "#fecdd3",
      wordAddedBackground: "#86efac",
      wordRemovedBackground: "#fda4af",
      codeFoldBackground: "#f8fafc",
      codeFoldContentColor: "#94a3b8"
    },
    dark: {
      diffViewerBackground: "#1e293b",
      diffViewerTitleBackground: "#0f172a",
      diffViewerTitleBorderColor: "#334155",
      diffViewerTitleColor: "#94a3b8",
      gutterBackground: "#0f172a",
      gutterColor: "#475569",
      addedBackground: "rgba(34, 197, 94, 0.14)",
      addedColor: "#86efac",
      removedBackground: "rgba(244, 63, 94, 0.14)",
      removedColor: "#fda4af",
      addedGutterBackground: "rgba(74, 222, 128, 0.2)",
      removedGutterBackground: "rgba(251, 113, 133, 0.2)",
      wordAddedBackground: "rgba(74, 222, 128, 0.3)",
      wordRemovedBackground: "rgba(251, 113, 133, 0.3)",
      codeFoldBackground: "#0f172a",
      codeFoldContentColor: "#475569"
    }
  },
  diffContainer: {
    fontFamily: "var(--font-mono, 'Menlo', 'Consolas', monospace)",
    fontSize: "12px",
    minWidth: 0
  },
  titleBlock: {
    paddingLeft: "78px" // align with code content: 50px gutter + 28px marker
  }
} as const;

export const diffHeaderClass = "text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500";
