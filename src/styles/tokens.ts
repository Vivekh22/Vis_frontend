/**
 * tokens.ts — styles/
 *
 * Purpose:
 *   The single source of truth for design tokens. Every color, spacing value,
 *   font size, and border radius used anywhere in the app references a token
 *   defined here — never a hardcoded magic value in a component file.
 *
 * Structure:
 *   tokens.color    — SEMANTIC color names mapped to CSS variable references.
 *                     The actual color VALUES per theme live in theme.ts
 *                     (lightPalette / darkPalette). tokens.ts does NOT contain
 *                     light/dark-specific color values — only the semantic
 *                     names and the structural scale.
 *   tokens.spacing  — 4px base unit scale (4, 8, 12, 16, 24, 32, 48, 64).
 *   tokens.typography — font families, sizes, weights, line heights.
 *   tokens.radius   — border radius scale.
 *   tokens.shadow   — box shadow scale (structural, theme-independent).
 *
 * SEMANTIC_COLOR_CSS_VARS:
 *   Maps camelCase semantic names to their CSS custom property names.
 *   theme.ts uses this to iterate and apply color values per palette.
 *
 * TOKEN_CSS_TEXT:
 *   Structural tokens (spacing, typography, radius, shadow) as a :root CSS
 *   block. Injected at document level via main.ts for light-DOM consumers,
 *   and as a fallback in ShadowRoots via injectGlobalTokens(). Color values
 *   are NOT here — they are set by applyTheme() on document.documentElement.style
 *   and cascade through Shadow DOM via CSS custom property inheritance.
 */
export const SEMANTIC_COLOR_CSS_VARS: Readonly<Record<string, string>> = {
  colorPrimary: '--color-primary',
  colorPrimaryForeground: '--color-primary-foreground',
  colorAccent: '--color-accent',
  colorBg: '--color-bg',
  colorSurface: '--color-surface',
  colorSurface2: '--color-surface-2',
  colorTextPrimary: '--color-text-primary',
  colorTextMuted: '--color-text-muted',
  colorBorder: '--color-border',
  colorDanger: '--color-danger',
  colorDangerForeground: '--color-danger-foreground',
  colorSuccess: '--color-success',
  colorWarning: '--color-warning',
  colorWarningBg: '--color-warning-bg',
  colorWarningBorder: '--color-warning-border',
  colorWarningText: '--color-warning-text',
};

export const tokens = {
  color: {
    primary: 'var(--color-primary)',
    primaryForeground: 'var(--color-primary-foreground)',
    accent: 'var(--color-accent)',
    bg: 'var(--color-bg)',
    surface: 'var(--color-surface)',
    surface2: 'var(--color-surface-2)',
    textPrimary: 'var(--color-text-primary)',
    textMuted: 'var(--color-text-muted)',
    border: 'var(--color-border)',
    danger: 'var(--color-danger)',
    dangerForeground: 'var(--color-danger-foreground)',
    success: 'var(--color-success)',
    warning: 'var(--color-warning)',
    warningBg: 'var(--color-warning-bg)',
    warningBorder: 'var(--color-warning-border)',
    warningText: 'var(--color-warning-text)',
  },
  spacing: {
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    8: '2rem',
    10: '2.5rem',
    12: '3rem',
    16: '4rem',
  },
  typography: {
    fontBody: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    fontHeading: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    fontMono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    sizeXs: '0.75rem',
    sizeSm: '0.875rem',
    sizeBase: '1rem',
    sizeLg: '1.125rem',
    sizeXl: '1.25rem',
    size2xl: '1.5rem',
    sizeDisplay: '3rem',
    weightNormal: '400',
    weightMedium: '500',
    weightSemibold: '600',
    weightBold: '700',
    lineHeightTight: '1.2',
    lineHeightNormal: '1.5',
  },
  radius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    full: '9999px',
  },
  shadow: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  },
} as const;

/**
 * CSS custom properties for :root. Structural tokens only (spacing, typography,
 * radius, shadow). Color values are set by applyTheme() on documentElement.style.
 *
 * Injected at document level via main.ts, and as a fallback in ShadowRoots
 * via injectGlobalTokens(). CSS custom properties inherit through Shadow DOM
 * boundaries by design, so the root values cascade into every component.
 */
export const TOKEN_CSS_TEXT = `
:root {
  /* Spacing scale (rem) */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-10: 2.5rem;
  --space-12: 3rem;
  --space-16: 4rem;

  /* Typography */
  --font-body: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --font-heading: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-display: 3rem;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  --line-height-tight: 1.2;
  --line-height-normal: 1.5;

  /* Radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}
`;