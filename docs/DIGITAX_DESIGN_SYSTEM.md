# DIGITAX — Design System

**Date:** Sat Nov 07 2026  
**Status:** COMPLETE  
**Personality:** Premium enterprise fintech + sophisticated + futuristic + confident + minimal where appropriate

---

## 1. Theme Architecture

Two complete themes are defined in `src/app/globals.css`:

- **Light theme:** Cool off-white backgrounds, white elevated surfaces, deep navy typography, restrained teal accents.
- **Dark theme:** Midnight navy backgrounds, layered charcoal surfaces, muted neutral text, refined electric teal accents.

Theme switching is handled by `ThemeProvider` (`src/lib/theme-provider.tsx`) with:
- localStorage persistence
- System preference detection (`prefers-color-scheme`)
- No flash of incorrect theme (CSS variables applied at root level)

---

## 2. Colour Palette

### Light Theme

| Token | Value | Usage |
|-------|-------|-------|
| `--color-surface` | `#FFFFFF` | Card backgrounds, modal backgrounds |
| `--color-surface-secondary` | `#F8FAFC` | Page background, section backgrounds |
| `--color-surface-tertiary` | `#F1F5F9` | Hover states, disabled states |
| `--color-border` | `#E2E8F0` | Card borders, input borders, dividers |
| `--color-border-strong` | `#CBD5E1` | Active states, focus borders |
| `--color-text-primary` | `#0F172A` | Headings, primary labels |
| `--color-text-secondary` | `#475569` | Body text, secondary labels |
| `--color-text-tertiary` | `#94A3B8` | Captions, muted text, placeholders |
| `--color-text-inverse` | `#FFFFFF` | Text on dark surfaces |
| `--color-primary-600` | `#2563EB` | Primary buttons, active states, links |
| `--color-accent-500` | `#14B8A6` | Accent buttons, highlights, AI elements |
| `--color-success-600` | `#16A34A` | Confirmed states, positive values |
| `--color-warning-600` | `#D97706` | Pending states, caution |
| `--color-error-600` | `#DC2626` | Error states, negative values, destructive |

### Dark Theme

| Token | Value | Usage |
|-------|-------|-------|
| `--color-surface` | `#0A0F1A` | Card backgrounds, modal backgrounds |
| `--color-surface-secondary` | `#111827` | Page background, section backgrounds |
| `--color-surface-tertiary` | `#1F2937` | Hover states, disabled states |
| `--color-border` | `#1F2937` | Card borders, input borders, dividers |
| `--color-border-strong` | `#374151` | Active states, focus borders |
| `--color-text-primary` | `#F8FAFC` | Headings, primary labels |
| `--color-text-secondary` | `#CBD5E1` | Body text, secondary labels |
| `--color-text-tertiary` | `#64748B` | Captions, muted text, placeholders |
| `--color-text-inverse` | `#0A0F1A` | Text on light accents |
| `--color-primary-600` | `#6366F1` | Primary buttons, active states, links |
| `--color-accent-500` | `#2DD4BF` | Accent buttons, highlights, AI elements |
| `--color-success-600` | `#4ADE80` | Confirmed states, positive values |
| `--color-warning-600` | `#FBBF24` | Pending states, caution |
| `--color-error-600` | `#F87171` | Error states, negative values, destructive |

### Semantic Colour Rules

- **Money-in (credits):** Success green (`text-success-600` / `dark:text-success-400`)
- **Money-out (debits):** Error red (`text-error-600` / `dark:text-error-400`)
- **Positive change:** Green up arrow
- **Negative change:** Red down arrow
- **Neutral/unknown:** Tertiary gray
- **Active navigation state:** Primary blue background + border accent
- **Review states:** Pending = amber, Confirmed = green, Corrected = blue, Rejected = red, Needs clarification = teal

---

## 3. Typography

### Font Stack

| Purpose | Font | Fallback |
|---------|------|----------|
| Sans-serif (UI) | Inter | system-ui, -apple-system, sans-serif |
| Indic (Hindi/Bengali/Marathi) | Noto Sans Devanagari | system-ui, sans-serif |
| Monospace (financial figures, codes) | JetBrains Mono | ui-monospace, SFMono-Regular, monospace |

### Type Scale

| Name | Size | Weight | Line Height | Usage |
|------|------|--------|-------------|-------|
| Display | 40px | 700 | 1.1 | Marketing headlines only |
| Page Title | 24px | 700 | 1.25 | `<h1>` on application pages |
| Section Heading | 20px | 600 | 1.3 | `<h2>` section titles |
| Card Heading | 18px | 600 | 1.4 | Card titles |
| Body | 14px | 400 | 1.6 | Paragraph text |
| Body Small | 13px | 400 | 1.5 | Secondary text |
| Label | 12px | 600 | 1.4 | Form labels, table headers |
| Label Small | 11px | 600 | 1.4 | Badges, captions, timestamps |
| Caption | 11px | 400 | 1.4 | Helper text, disclaimers |
| Financial Figure | 16–24px | 700 | 1.2 | Monetary amounts, tabular figures |
| Financial Figure Small | 14px | 700 | 1.2 | Small monetary values in tables |

### Typography Rules

- **Tabular figures:** All monetary values use `font-variant-numeric: tabular-nums` for consistent digit width.
- **No ALL CAPS for long text:** Only labels and badges use uppercase with `letter-spacing: 0.05em`.
- **Heading hierarchy:** Never skip heading levels (h1 → h2 → h3).
- **Line length:** Body text max 65–75 characters for readability.

---

## 4. Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | 4px | Tight component spacing |
| `--space-2` | 8px | Component internal padding |
| `--space-3` | 12px | Small gaps |
| `--space-4` | 16px | Standard gap, card padding |
| `--space-5` | 20px | Section padding |
| `--space-6` | 24px | Card padding, section gaps |
| `--space-8` | 32px | Large section gaps |
| `--space-10` | 40px | Page-level margins |
| `--space-12` | 48px | Hero section spacing |

### Layout Rules

- **Page gutter:** 24px (sm: 16px, lg: 32px)
- **Card padding:** 24px (compact: 16px)
- **Section spacing:** 32px between major sections
- **Grid gap:** 24px (sm: 16px)
- **Component gap:** 8px–16px between related elements

---

## 5. Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 0.375rem (6px) | Small buttons, inputs, badges |
| `--radius-md` | 0.5rem (8px) | Default buttons, cards |
| `--radius-lg` | 0.75rem (12px) | Large cards, modals |
| `--radius-xl` | 1rem (16px) | Hero sections, large containers |
| `--radius-2xl` | 1.5rem (24px) | Prominent cards, dialogs |
| `--radius-full` | 9999px | Pills, avatars, circular badges |

**Rule:** No arbitrary border-radius values. Use only defined tokens.

---

## 6. Shadows & Elevation

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-xs` | 0 1px 2px 0 rgb(0 0 0 / 0.04) | Subtle elevation |
| `--shadow-sm` | 0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04) | Card elevation |
| `--shadow-md` | 0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.06) | Elevated cards, dropdowns |
| `--shadow-lg` | 0 10px 15px -3px rgb(0 0 0 / 0.09), 0 4px 6px -4px rgb(0 0 0 / 0.06) | Modals, drawers |
| `--shadow-xl` | 0 20px 25px -5px rgb(0 0 0 / 0.08), 0 8px 10px -6px rgb(0 0 0 / 0.05) | Large overlays |

**Rule:** No heavy shadows or glow effects on application pages. Shadows are subtle and consistent.

---

## 7. Gradients

Gradients are used **sparingly and deliberately**:

| Gradient | Usage | Locations |
|----------|-------|-----------|
| Primary gradient | `linear-gradient(135deg, #2563EB 0%, #14B8A6 100%)` | Logo mark, selected nav state, primary CTA |
| Hero gradient | `linear-gradient(135deg, #0A0F1A 0%, #111827 50%, #0A0F1A 100%)` | Dashboard hero insight section |
| GNANI gradient | `linear-gradient(135deg, #0A0F1A 0%, #1E1B4B 50%, #0A0F1A 100%)` | GNANI AI workspace header |
| Surface gradient | `linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 100%)` | Card surfaces (light only) |

**Rule:** No gradients on every component. No neon borders. No excessive glow effects.

---

## 8. Component Variants

### Button

| Variant | Light | Dark | Usage |
|---------|-------|------|-------|
| Primary | `bg-primary-600 text-white` hover `bg-primary-700` | `bg-indigo-500 text-white` hover `bg-indigo-400` | Main actions |
| Secondary | `bg-surface-secondary text-text-primary` border hover `bg-surface-tertiary` | Same structure, dark values | Secondary actions |
| Ghost | `text-text-secondary` hover `bg-surface-tertiary` | Same structure, dark values | Tertiary actions, icon buttons |
| Destructive | `bg-error-600 text-white` hover `bg-error-700` | `bg-error-500 text-white` hover `bg-error-400` | Delete, remove |
| Link | `text-primary-600` hover `text-primary-500` underline | `text-indigo-400` hover `text-indigo-300` underline | Text links |

Sizes: sm (h-8 px-3), md (h-10 px-4), lg (h-12 px-6), icon (h-10 w-10), icon-sm (h-8 w-8)

### Badge

| Variant | Usage |
|---------|-------|
| Default | Neutral status |
| Primary | Active, selected |
| Success | Confirmed, paid, matched |
| Warning | Pending, needs review |
| Error | Rejected, failed, unpaid |
| Accent | AI-generated, insights |
| Outline | Subtle status |

Sizes: sm (px-2 py-0.5 text-[10px]), md (px-2.5 py-0.5 text-xs)

### Card

| Variant | Usage |
|---------|-------|
| Default | `border border-border bg-surface shadow-sm` |
| Elevated | `border border-border bg-surface shadow-md` |
| Interactive | `hover:bg-surface-secondary hover:border-border-strong transition-all` |

All cards: `rounded-2xl`, `transition-shadow duration-200`

---

## 9. Grid System

| Breakpoint | Value | Usage |
|------------|-------|-------|
| sm | 640px | Mobile landscape, small tablets |
| lg | 1024px | Tablets, small laptops |
| xl | 1280px | Desktops |

### Grid Columns

| Context | Mobile | Tablet | Desktop |
|---------|--------|--------|---------|
| KPI cards | 1 column | 2 columns | 4 columns |
| Stat cards | 1 column | 2 columns | 3–4 columns |
| Data tables | Full width scroll | Full width | Full width |
| Dashboard sections | 1 column | 2 columns | 2–3 columns |
| Forms | 1 column | 1–2 columns | 2 columns |

---

## 10. Motion Principles

| Principle | Implementation |
|-----------|---------------|
| Page transitions | None (Next.js instant navigation) |
| Sidebar collapse | 300ms ease-in-out transform |
| Card hover | 200ms transition-colors, transition-shadow |
| Button press | Active state: scale 0.98 or opacity 0.9 |
| Skeleton loading | 1.5s shimmer animation infinite |
| Toast appearance | 400ms slide-up |
| Dialog appearance | 200ms scale-in |
| Theme switch | 300ms background-color, color, border-color |
| Reduced motion | All animations disabled (`animation-duration: 0.01ms`) |

**Rule:** No constantly moving backgrounds, no distracting particle effects, no animations that delay user actions.

---

## 11. Component Inventory

### Atoms
- Button (primary, secondary, ghost, destructive, link)
- Input (text, email, password, number, select, date)
- Badge (default, primary, success, warning, error, destructive, accent, outline)
- Icon (lucide-react, consistent 16px–24px sizing)
- Text (heading, body, label, caption, financial-figure)
- Divider (1px border)

### Molecules
- StatCard (title, value, trend, icon, variant)
- FilterChip (label, value, selected state)
- SearchField (input + icon)
- DataTable (columns, rows, sorting, empty state)
- Dialog (title, description, content, close button)
- Toast (type, title, description, auto-dismiss)
- Skeleton (text, circle, rect)

### Organisms
- AppShell (sidebar, top nav, content area)
- PageHeader (title, description, breadcrumbs, action)
- BusinessSelector (dropdown, active business, switcher)
- ThemeSwitcher (dark/light/system toggle)

---

## 12. Accessibility Rules

- **Focus rings:** 2px solid primary-600, 2px offset, 0.375rem radius
- **Contrast:** WCAG 2.2 AA (4.5:1 normal text, 3:1 large text)
- **Touch targets:** Minimum 44×44px
- **Keyboard:** All interactive elements reachable via Tab
- **Screen readers:** ARIA labels on icon buttons, role="dialog" on modals, role="alert" on toasts
- **Reduced motion:** All animations disabled when `prefers-reduced-motion: reduce`
- **Language:** `lang="en"` on html, Indic language support for content

---

## 13. File Structure

```
src/app/globals.css          — Design tokens, @theme, .dark overrides
src/lib/theme-provider.tsx   — Theme context, persistence, system detection
src/components/ui/           — Atomic components (button, badge, input, card, etc.)
src/components/layout/       — Layout components (app-shell, page-header, business-selector)
src/app/*/page.tsx           — Page implementations using AppShell + design system
```

---

## 14. What Changed vs Previous Design

| Aspect | Previous | New |
|--------|----------|-----|
| Sidebar | Fixed, non-collapsible | Collapsible, icons-only state |
| Top nav | None | Refined top nav with theme switcher |
| Gradients | On every card | Only on GNANI + dashboard insights |
| Shadows | Heavy | Subtle, consistent |
| Borders | Inconsistent | Token-based, uniform |
| Typography | Mixed scales | Defined type scale with tabular figures |
| Card radius | 1rem (xl) | 1.5rem (2xl) for prominence |
| Component variants | Limited | Complete variant system |
| Dark theme | Not implemented | Complete adaptive dark theme |

---

**Next Step:** Create `docs/DIGITAX_PAGE_DESIGN_SPECIFICATION.md` with page-by-page composition specifications, then implement the redesigned application shell and pages.
