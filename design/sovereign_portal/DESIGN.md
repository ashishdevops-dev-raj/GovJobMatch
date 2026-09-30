---
name: Sovereign Portal
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#43474d'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#74777e'
  outline-variant: '#c3c6ce'
  surface-tint: '#49607c'
  primary: '#001428'
  on-primary: '#ffffff'
  primary-container: '#0f2942'
  on-primary-container: '#7991af'
  inverse-primary: '#b0c9e8'
  secondary: '#006c49'
  on-secondary: '#ffffff'
  secondary-container: '#6cf8bb'
  on-secondary-container: '#00714d'
  tertiary: '#1f1000'
  on-tertiary: '#ffffff'
  tertiary-container: '#3b2200'
  on-tertiary-container: '#c77f00'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d1e4ff'
  primary-fixed-dim: '#b0c9e8'
  on-primary-fixed: '#011d35'
  on-primary-fixed-variant: '#314863'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-sm: 1rem
  margin: 2rem
  margin-sm: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system establishes a high-trust, production-ready public sector search and verification environment. The interface balances statutory credibility with the precision and speed of modern edtech and fintech platforms. Designed for millions of Indian job seekers spanning diverse technical proficiencies, screen resolutions, and data constraints, the experience prioritizes clarity, calm authority, and rapid scanning.

The design movement is **Corporate Modern with High-Utility Functionalism**. It avoids visual clutter, relying instead on clean white surfaces, deep sovereign blue structures, clear typographic hierarchy, and unambiguous status tokens that communicate critical eligibility and statutory deadlines without cognitive fatigue.

## Colors

The color system delivers maximum contrast, WCAG AAA compliance, and unambiguous semantic signaling:

- **Primary (`#0F2942`)**: Deep sovereign navy blue representing institutional trust, administrative gravity, and stability. Used for primary branding, structural headers, high-emphasis action triggers, and active navigation bars.
- **Secondary (`#10B981`)**: Vivid emerald green representing "Eligible", verified criteria, match criteria success, and official qualification approvals. Paired with `#059669` for active/hover states.
- **Tertiary (`#F59E0B`)**: Alert amber for pending actions, documentation warnings, non-critical eligibility thresholds, and caution markers.
- **Neutral (`#64748B`)**: Slate neutral scale anchoring secondary information, borders, and contextual metadata. The canvas foundation uses `#F8FAFC` for off-surface contrast, with `#FFFFFF` reserved for interactive card tiers and form containers. Text hierarchy relies on `#0F172A` (900) for headline clarity and `#334155` (700) for readable body typography.
- **System Destructive (`#EF4444`)**: Urgent deadlines (e.g., "Registration closes in 4 hours"), expired listings, and direct disqualifications.

## Typography

The type system blends the geometric authority of **Plus Jakarta Sans** for structural elements and job notifications with the utilitarian, screen-optimized legibility of **Inter** for dense requirements, age matrices, and application workflows.

- **Headlines & Hero Sections**: Plus Jakarta Sans delivers contemporary polish without sacrificing formal stature. Tighter letter spacing on `headline-*` and `display-*` preserves visual compactness on multi-line government designation titles (e.g., "UPSC Combined Central Armed Police Forces Assistant Commandant").
- **Body & Tabular Data**: Inter provides clear glyph separation and open apertures to ensure numbers, percentages, and qualifications (such as "10+2", "B.Tech/BE", "Age: 21-30") remain legible at small scales on budget smartphone displays.
- **Labels & Microcopy**: Form tags, status badges, and criteria indicators use medium-to-bold weights with slight letter spacing tracking to guarantee readability under sunlit conditions.

## Layout & Spacing

This design system uses an **8-point mathematical layout grid** anchored by a structured 12-column responsive layout.

- **Desktop (>= 1280px)**: 12-column fluid grid, max-width bounded at `1440px`. Column gutter is set to `gutter` (`1.5rem`), outer boundary margin is `margin` (`2rem`). The split layout assigns 4 columns to persistent eligibility criteria inputs/filter drawers and 8 columns to matching job feeds and verification boards.
- **Tablet (768px - 1279px)**: 8-column layout with `gutter-sm` (`1rem`) and `margin` (`1.5rem`). Search refinement panels collapse into horizontal filter bars or sticky bottom trigger modals.
- **Mobile (< 768px)**: 4-column layout with `gutter-sm` (`1rem`) and `margin-sm` (`1rem`). Feed elements default to 100% viewport width less structural margins.

Component density is compact yet breathable: data attributes (pay scales, quotas, age relaxation rules) utilize strict micro-multiples (`space-xs`, `space-sm`) to maximize above-the-fold information density without visual crowding.

## Elevation & Depth

Visual hierarchy is maintained through crisp surface-container distinctions, minimal tonal elevation, and tinted ambient shadows that anchor cards without muddying the neutral background.

- **Surface Level 0 (Base)**: `#F8FAFC`. The foundational canvas across all screens.
- **Surface Level 1 (Default Containers & Cards)**: `#FFFFFF` surfaced with a crisp 1px border (`#E2E8F0`). Shadow is ultra-soft: `0px 1px 3px rgba(15, 23, 42, 0.05), 0px 1px 2px rgba(15, 23, 42, 0.03)`.
- **Surface Level 2 (Interactive Hover / Highlighted Matches)**: Elevated cards utilize a navy-tinted ambient shadow: `0px 10px 15px -3px rgba(15, 41, 66, 0.07), 0px 4px 6px -4px rgba(15, 41, 66, 0.04)`, paired with a dynamic primary border transition (`#0F2942`).
- **Surface Level 3 (Sticky Action Bars & Modals)**: Floating filter controls and quick eligibility assessment sheets use `0px 20px 25px -5px rgba(15, 23, 42, 0.1), 0px 8px 10px -6px rgba(15, 23, 42, 0.06)` with clean `#CBD5E1` outlines.
- **Depth Layering Rule**: Avoid skeuomorphic gradients or noisy blurs. Contrast is achieved through crisp 1px borders and targeted status pill colors.

## Shapes

The design system enforces a **Rounded (`roundedness: 2`)** geometry, balancing the institutional solemnity of government documentation with a frictionless, consumer-grade search experience.

- Standard inputs, buttons, and status badges take a `0.5rem` (8px) radius.
- Job cards, document verification panels, and criteria matching accordions use `rounded-lg` (`1rem` / 16px).
- Modals, large summary dashboards, and profile setup shells take `rounded-xl` (`1.5rem` / 24px).
- Interactive pills and category badges use total circular capping (`rounded-full`) to contrast against rectangular data surfaces.

## Components

### Buttons
- **Primary**: Solid `#0F2942` fill, text `#FFFFFF`, font `label-lg`, height 44px (48px on mobile for touch compliance), radius 8px. Hover state: `#1E3A8A`. Focus: 2px offset with `#0F2942` ring.
- **Secondary / Ghost**: White surface, 1.5px border `#0F2942`, text `#0F2942`. Hover: `#F1F5F9`.
- **Success / Match Action**: `#10B981` fill, text `#FFFFFF`. Hover: `#059669`. Used strictly for "Direct Apply" or "Criteria Matched".
- **Critical Urgency**: `#EF4444` outline or solid pill for "Apply Before Deadline" indicators.

### Cards (Job Listing & Match Card)
- Surface `#FFFFFF`, border 1px `#E2E8F0`, radius 16px (`rounded-lg`), padding `space-lg`.
- Top header row reserves space for department crest/badge, title, and matched percentage badge.
- Middle tier highlights four structured metadata pills (Department, Qualification, Age bracket, Pay Matrix/Grade Pay) using slate tags.
- Bottom footer contains deadline countdowns paired with urgent status pills and the primary CTA.

### Status Chips & Badges
- **Matched / Eligible**: `#ECFDF5` background, `#047857` border/text, accompanied by a solid check icon.
- **Eligibility Check Needed**: `#FEF3C7` background, `#B45309` border/text, iconized with an alert circle.
- **Urgent Closing**: `#FEF2F2` background, `#B91C1C` text, paired with a countdown clock.
- **Structure**: Height 24px, radius 9999px, padding 2px 10px, typography `label-sm`.

### Form Controls & Filter Inputs
- **Inputs**: Background `#FFFFFF`, border 1.5px `#CBD5E1`, text `#0F172A`, placeholder `#94A3B8`, height 44px, radius 8px. Active/Focus: Border `#0F2942` with 3px `#E0E7FF` outer glow.
- **Checkboxes & Radios**: 18px size, radius 4px (checkbox) or 50% (radio), border 1.5px `#94A3B8`. Selected state: `#0F2942` fill with white checkmark.

### Specialized Component: Eligibility Radar Pill
- Interactive dynamic gauge on job cards that summarizes match confidence across Education, Age, Domicile, and Category (General/OBC/SC/ST/EWS). Displays a high-contrast ratio indicator (e.g., "4/4 Criteria Met") utilizing `#10B981` when completely valid, or amber `#F59E0B` when age or degree requires manual user verification.