import { defineConfig, presetIcons, presetWind, transformerDirectives } from "unocss";

export default defineConfig({
  presets: [
    presetWind(),
    presetIcons({
      extraProperties: {
        display: "inline-block",
        "vertical-align": "middle",
      },
    }),
  ],
  transformers: [transformerDirectives()],
  shortcuts: {
    "panel-surface": "rounded-2xl border border-slate-200/70 bg-white/80 shadow-sm backdrop-blur",
    "btn-base": "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition",
    "btn-primary": "btn-base bg-slate-900 text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50",
    "btn-secondary": "btn-base border border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50",
    "pill": "inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold",
  },
});
