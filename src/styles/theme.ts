/**
 * theme.ts — styles/
 *
 * Purpose:
 *   Light / Dark / System Default theme support, driven entirely by CSS custom
 *   properties. A theme switch updates the entire app instantly — every
 *   Shadow-isolated component reads the same root variables — without a
 *   re-render or reload.
 *
 * System Default:
 *   Respects the OS-level `prefers-color-scheme` media query and updates LIVE
 *   if the OS setting changes mid-session (an active media-query listener), not
 *   just read once at load.
 *
 * How it works with Shadow DOM:
 *   CSS custom properties (variables) inherit through Shadow DOM boundaries by
 *   design — unlike regular CSS rules. The theme sets variables at the document
 *   root (:root / [data-theme]); every component's Shadow DOM reads them via
 *   var(...). This is the mechanism that makes theming work consistently across
 *   every Shadow-isolated component without injecting a full theme stylesheet
 *   into each one.
 *
 * THEME_VARIABLE_CSS_TEXT:
 *   The theme-scoped variable overrides. Components always read var(--color-bg)
 *   etc.; this CSS maps the current theme to concrete values.
 */
export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * Theme variable CSS. The `[data-theme]` attribute on <html> selects the theme.
 * The @media block applies dark values when no explicit theme is set and the OS
 * prefers dark — this is the "System Default" behaviour.
 */
export const THEME_VARIABLE_CSS_TEXT = `
:root,
[data-theme="light"] {
  --color-bg: #ffffff;
  --color-surface: #f8fafc;
  --color-surface-2: #f1f5f9;
  --color-text-primary: #0f172a;
  --color-text-muted: #64748b;
  --color-border: #e2e8f0;
  --color-primary: #4f46e5;
  --color-primary-foreground: #ffffff;
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

[data-theme="dark"] {
  --color-bg: #0b1120;
  --color-surface: #111827;
  --color-surface-2: #1e293b;
  --color-text-primary: #e2e8f0;
  --color-text-muted: #94a3b8;
  --color-border: #1e293b;
  --color-primary: #6366f1;
  --color-primary-foreground: #ffffff;
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4);
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]):not([data-theme="dark"]) {
    --color-bg: #0b1120;
    --color-surface: #111827;
    --color-surface-2: #1e293b;
    --color-text-primary: #e2e8f0;
    --color-text-muted: #94a3b8;
    --color-border: #1e293b;
    --color-primary: #6366f1;
    --color-primary-foreground: #ffffff;
    --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
    --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4);
  }
}
`;

class ThemeManager {
  private current: ThemeMode = 'system';
  private mediaListener: (() => void) | null = null;
  private cssInjected = false;

  /** Injects the theme CSS into <head> (once) and applies the initial theme. */
  public init(initial: ThemeMode = 'system'): void {
    this.injectCss();
    this.setTheme(initial);
  }

  /**
   * Switches theme. For 'system', applies the OS preference and registers a
   * live media-query listener so OS changes mid-session update the app
   * immediately. For explicit 'light'/'dark', removes the listener.
   */
  public setTheme(mode: ThemeMode): void {
    this.current = mode;
    if (this.mediaListener) {
      this.mediaListener();
      this.mediaListener = null;
    }
    if (mode === 'system') {
      this.applySystem();
      this.watchSystem();
    } else {
      document.documentElement.setAttribute('data-theme', mode);
    }
  }

  public getTheme(): ThemeMode {
    return this.current;
  }

  private applySystem(): void {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  }

  private watchSystem(): void {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (): void => this.applySystem();
    mq.addEventListener('change', handler);
    this.mediaListener = (): void => mq.removeEventListener('change', handler);
  }

  private injectCss(): void {
    if (this.cssInjected) return;
    const style = document.createElement('style');
    style.id = 'va-theme-variables';
    style.textContent = THEME_VARIABLE_CSS_TEXT;
    document.head.appendChild(style);
    this.cssInjected = true;
  }
}

export const themeManager = new ThemeManager();