/**
 * tokens.ts — styles/
 *
 * Purpose:
 *   The single source of truth for design tokens. Every color, spacing value,
 *   font size, and border radius used anywhere in the app references a token
 *   defined here — never a hardcoded magic value in a component file. This is
 *   how large platforms (Stripe, Linear, Vercel) keep 50+ pages visually
 *   consistent, and it is a maintainability requirement for this project.
 *
 * Two representations:
 *   - TOKEN_CSS_TEXT: a :root CSS block (CSS custom properties) consumed by
 *     Shadow DOM components via injectGlobalTokens(), and by the light DOM via
 *     a single <style> injected at bootstrap.
 *   - TOKENS: TS constants mirroring the CSS, for the rare case where a literal
 *     value is needed in JS (e.g. canvas drawing). Components should prefer the
 *     CSS variable (var(--token)) over the TS constant.
 *
 * Note:
 *   This file is referenced by platform/component/ShadowRenderMixin.ts, which
 *   is why it exists in Part 1. It will be expanded with the full token set in
 *   the styles/ part; the values here are the foundational subset.
 */

/** CSS custom properties for :root. Consumed by injectGlobalTokens() and at bootstrap. */
export const TOKEN_CSS_TEXT = `
:root {
  /* Color — primary palette */
  --color-primary: #4f46e5;
  --color-primary-foreground: #ffffff;
  --color-accent: #6366f1;

  /* Surfaces & text */
  --color-bg: #ffffff;
  --color-surface: #f8fafc;
  --color-surface-2: #f1f5f9;
  --color-text-primary: #0f172a;
  --color-text-muted: #64748b;
  --color-border: #e2e8f0;

  /* Status */
  --color-danger: #dc2626;
  --color-danger-foreground: #ffffff;
  --color-success: #16a34a;
  --color-warning: #d97706;

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
  --font-mono: ui-monospace, SFMono-Regular, Menlo, monospace;
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

/**
 * TS constants mirroring the CSS tokens, for unavoidable JS usage. Prefer the
 * CSS variable (var(--token-name)) in component styles.
 */
export const TOKENS = {
  colorPrimary: 'var(--color-primary)',
  colorBg: 'var(--color-bg)',
  colorTextPrimary: 'var(--color-text-primary)',
  colorTextMuted: 'var(--color-text-muted)',
  colorBorder: 'var(--color-border)',
  colorDanger: 'var(--color-danger)',
  colorSuccess: 'var(--color-success)',
  space4: 'var(--space-4)',
  radiusMd: 'var(--radius-md)',
  fontBody: 'var(--font-body)',
} as const;