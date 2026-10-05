# Accounts Page Overrides

> **PROJECT:** ChatGPT2API Console
> **Generated:** 2026-10-03 13:20:16
> **Page Type:** Dashboard / Data View

> ⚠️ **IMPORTANT:** Rules in this file **override** the Master file (`design-system/MASTER.md`).
> Only deviations from the Master are documented here. For all other rules, refer to the Master.

---

## Page-Specific Rules

### Layout Overrides

- **Max Width:** 1680px (operations workspace)
- **Layout:** Full-width dashboard below a horizontal menubar
- **Sections:** Compact page header > unified status strip > filters and bulk actions > dense account table

### Spacing Overrides

- **Content Density:** High — compact operations dashboard

### Typography Overrides

- No overrides — use Master typography

### Color Overrides

- **Strategy:** Dark or neutral. Status colors (green/amber/red). Data-dense but scannable.

### Component Overrides

- Avoid: Present AI as human
- Avoid: Static output only
- Avoid: Leave UI frozen with no feedback

---

## Page-Specific Components

- No unique components for this page

---

## Recommendations

- Effects: Typing indicators (3-dot pulse), streaming text animations, pulse animations, context cards, smooth reveals
- AI Interaction: Clearly label AI generated content
- AI Interaction: Thumps up/down or 'Regenerate'
- Animation: Use skeleton screens or spinners
- CTA Placement: Primary CTA in nav + After metrics
