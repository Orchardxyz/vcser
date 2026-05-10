# DESIGN.md

## 1. Visual Theme & Atmosphere

This is a typical light-first, system-driven UI language. The overall look aligns with a shadcn / Radix style: white canvas, deep slate typography, blue primary action color, red destructive color, restrained shadows, and an 8px base radius.

Mood keywords: clean, neutral, product UI, high legibility, low noise. This is not a branding-heavy marketing style. It is a robust interface language for admin surfaces, forms, settings, and data-oriented screens.

Visual hierarchy rule: establish structure with contrast and whitespace first, then reinforce interaction with color, and only then use deeper shadows. Avoid relying on large gradients, heavy borders, or strong skeuomorphic effects.

## 2. Color Palette & Roles

Recommended normalized CSS variables from the Figma theme tokens:

```css
:root {
  --background: #ffffff;
  --foreground: #020618;

  --card: #ffffff;
  --card-foreground: #020618;
  --popover: #ffffff;
  --popover-foreground: #020618;

  --primary: #155dfc;
  --primary-foreground: #f8fafc;
  --secondary: #f1f5f9;
  --secondary-foreground: #0f172b;
  --accent: #f1f5f9;
  --accent-foreground: #0f172b;
  --destructive: #e7000b;
  --destructive-foreground: #f8fafc;

  --muted: #f1f5f9;
  --muted-foreground: #62748e;
  --border: #e2e8f0;
  --input: #e2e8f0;
  --ring: #020618;

  --radius: 8px;
}
```

Semantic roles:

- `--background` / `--foreground` define the primary page contrast pair.
- `--card` / `--card-foreground` stay close to the base canvas, with hierarchy coming from border and shadow rather than tinted fills.
- `--primary` is the single high-emphasis action color for primary buttons, selected states, key links, and major CTAs.
- `--secondary` and `--accent` are light slate surfaces for secondary actions, chips, hover surfaces, and subtle emphasis.
- `--destructive` is reserved for dangerous and irreversible actions only.
- `--muted-foreground` is the preferred color for helper text, annotations, placeholders, and weak labels.

Extended palette:

- Chart sequence: `#E76E50`, `#2A9D90`, `#274754`, `#E8C468`, `#F4A462`.
- Sidebar tokens keep the same slate semantics: background around `slate/50`, text around `slate/700`, deeper active foreground, and primary-aligned ring behavior.

## 3. Typography Rules

Primary typeface is Inter, spanning full weight coverage from 100 to 900. Technical labels, token names, and shortcut-like metadata should use a Menlo-style monospace face. Typography intent is clear: maximize readability in body copy and keep heading scale clean and systematic rather than highly expressive.

Recommended hierarchy:

| Role              | Size | Line Height | Weight  |
| ----------------- | ---- | ----------- | ------- |
| Caption / Token   | 12px | 16px        | 400-500 |
| Small UI text     | 14px | 20px        | 400-500 |
| Body              | 16px | 24px        | 400-500 |
| Emphasis body     | 18px | 28px        | 500-600 |
| Section title     | 20px | 28px        | 600     |
| Card title        | 24px | 32px        | 600-700 |
| Page title        | 30px | 36px        | 700     |
| Hero / major stat | 36px | 40px        | 700-800 |
| Display           | 48px | 48px        | 700-900 |

Typography constraints:

- Default tracking should stay at 0.
- Prefer `--muted-foreground` for helper/secondary copy instead of reducing opacity on primary text.
- Use 14px or 16px for interactive control labels; avoid 12px for primary control text.
- Use monospace for values, code-like snippets, and design tokens to improve scanability in configuration-heavy UI.

## 4. Component Stylings

### Buttons

Button language: 8px radius, clear foreground contrast, low-noise shadows, and state shifts driven by color and elevation rather than dramatic shape transformation.

Primary button:

- Background `--primary`
- Text `--primary-foreground`
- Radius `--radius`
- Default elevation `shadow-xs` or `shadow-sm`

Secondary button:

- Background `--secondary`
- Text `--secondary-foreground`
- Optional border `1px solid var(--border)`
- Must remain visually lighter than primary

5-state button specification:

| State            | Visual Rule                                                                                                                               |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Default          | `background: var(--primary)`, `color: var(--primary-foreground)`, use `shadow-xs`, clean edge, no extra stroke                            |
| Hover            | Keep same hue family, shift perceived brightness by ~4% to ~8%, raise to `shadow-sm`, avoid exaggerated movement                          |
| Active / Pressed | Slightly darker than hover, reduce to `shadow-2xs` or use subtle `inset-shadow-2xs` for a pressed feel                                    |
| Focus Visible    | Add a 2px to 3px outer focus ring using `--ring`, ideally with small ring offset to avoid visual collision with fill color                |
| Disabled         | Move surface toward `--secondary` or reduce primary strength to ~40% to ~50%, text uses `--muted-foreground`, no hover/elevation feedback |

Note: These 5 states are not frame-by-frame copied from Figma. They are a stable implementation contract derived from the Figma token system (`primary`, `secondary`, `ring`, `shadow`, etc.).

### Cards

Cards should float from the page using white surface + subtle border + light elevation, not a gray fill block:

- Background `--card`
- Text `--card-foreground`
- Border `1px solid var(--border)`
- Radius `--radius`
- Default shadow `shadow-sm`

Card elevation guidance:

- Standard info card: `shadow-xs` or `shadow-sm`
- Hoverable/clickable card: raise to `shadow-md` on hover
- Popover/menu/dropdown: `shadow-lg`
- Modal/command palette: `shadow-xl`
- Avoid `shadow-2xl` on routine content cards; reserve for high-priority overlays

### Inputs

- Input fields should stay close to white by default.
- Border uses `--input`.
- Focus should be expressed by ring treatment, not by dramatically thicker borders.
- Placeholder and helper text should prefer `--muted-foreground`.

## 5. Layout Principles

The system clearly follows a Tailwind-style spacing scale. Core rhythm is stepped, not continuous: 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, then extending to 56, 64, 80, 96, 112, 128, 144, 160, 176, 192, 208, 224, 240, 256, 288, 320, 384.

Layout recommendations:

- Use 24px or 32px as default page and section spacing anchors.
- Use 16px or 24px as typical card padding.
- Dense form rows should use 12px to 16px spacing; module-to-module spacing should be at least 24px.
- `--radius: 8px` is the default corner standard; larger radii (`rounded-xl`, `rounded-2xl`) should be limited to large containers, overlays, or hero-like blocks.

Max-width and grid behavior also follows Tailwind conventions. Prefer named container widths over arbitrary hard-coded values.

## 6. Depth & Elevation

The shadow system is one of the highest-value assets in this design because it is both precise and clearly tiered.

```css
--shadow-2xs: 0 1px 0 rgba(0, 0, 0, 0.05);
--shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
--shadow-md:
  0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
--shadow-lg:
  0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
--shadow-xl:
  0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
--shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);

--inset-shadow-2xs: inset 0 1px 0 rgba(0, 0, 0, 0.05);
--inset-shadow-xs: inset 0 1px 1px rgba(0, 0, 0, 0.05);
--inset-shadow-sm: inset 0 2px 4px rgba(0, 0, 0, 0.05);
```

Usage principles:

- Base page surfaces should not cast shadows.
- Cards should default to `shadow-sm` or below.
- Hover/floating feedback should move up by one shadow level, not jump multiple levels.
- Pressed/selected/embedded surfaces should prefer inset shadows over stacking deeper outer shadows.

## 7. Do's and Don'ts

Do:

- Keep high readability with white surfaces and deep slate text.
- Reserve strong semantic emphasis for `primary` and `destructive`.
- Keep a consistent 8px base radius across buttons, inputs, and cards.
- Let shadow and spacing carry hierarchy, not heavy borders and noisy color blocks.

Don't:

- Do not turn the UI into a large gray "pseudo-admin" canvas.
- Do not use `shadow-xl` or `shadow-2xl` on ordinary content cards.
- Do not add primary-blue outlines to neutral secondary buttons.
- Do not introduce many saturated action colors competing with primary.
- Do not rely only on browser-default outlines for focus states; keep focus in the token system.

## 8. Responsive Behavior

Use the design-system breakpoints directly:

- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

Responsive strategy:

- Below `sm`, prioritize single-column stacking over compressed multi-column cards.
- Expand to two-column and sidebar-oriented form layouts at `md` and above.
- Keep the same corner-language for cards, inputs, and buttons on mobile, but reduce horizontal padding.
- On small screens, prefer full-width sheets or bottom drawers over tiny popovers.

## 9. Agent Prompt Guide

Quick prompt lines:

- Build a light, slate-based product UI with white cards, 8px radius, blue primary actions, and restrained shadows.
- Use Inter for all UI copy and Menlo for technical labels, shortcuts, and token values.
- Keep cards white with a subtle border and `shadow-sm`; reserve `shadow-lg+` for popovers and modals.
- Buttons must follow a 5-state system: default, hover, active, focus-visible, disabled.

Minimal constraints for coding agents:

```text
Use a light shadcn-style design language.
Background is white, text is deep slate, primary is #155DFC, destructive is #E7000B.
Use 8px base radius, white cards, border #E2E8F0, and subtle Tailwind-like shadows.
Primary buttons need 5 states: default, hover, active, focus-visible ring, disabled.
Prefer clean product UI over decorative marketing visuals.
```
