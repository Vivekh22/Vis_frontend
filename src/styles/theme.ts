/**
 * theme.ts — styles/
 *
 * Purpose:
 *   Light / Dark / System theme system, driven entirely by CSS custom
 *   properties. A theme switch updates the entire app instantly — every
 *   Shadow-isolated component reads the same root variables — without a
 *   re-render or reload.
 *
 * Architecture:
 *   - tokens.ts defines SEMANTIC color names + structural scale (no color values).
 *   - THIS file defines lightPalette / darkPalette: actual color values per theme.
 *   - applyTheme() writes every semantic color as a CSS custom property onto
 *     document.documentElement.style, which cascades through Shadow DOM.
 *   - ThemeStore (built on platform/state/Store.ts) holds { mode, resolvedTheme }.
 *   - initThemeSystem() reads localStorage, resolves 'system' against
 *     prefers-color-scheme, applies, and attaches a live media-query listener.
 *   - setThemeMode() updates the store, persists, re-applies, and manages the
 *     media-query listener.
 *
 * Storage distinction (documented):
 *   Theme preference is NOT auth-sensitive — it's a cosmetic user preference.
 *   Plain localStorage is acceptable here, unlike TokenStorage's stricter
 *   handling of auth tokens. This is an intentional, documented distinction:
 *   TokenStorage exists because auth tokens are security-sensitive credentials
 *   that must never be accessible to JavaScript in a production httpOnly-cookie
 *   model. Theme preference has no security implication and localStorage is
 *   the appropriate, simple mechanism for it.
 *
 * System Default:
 *   'system' mode respects the OS-level prefers-color-scheme media query and
 *   updates LIVE if the OS setting changes mid-session (an active media-query
 *   listener), not just read once at load.
 */
import { Store } from '../platform/state/Store';
import { SEMANTIC_COLOR_CSS_VARS } from './tokens';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

/**
 * Light palette — deliberate, premium-feeling color choices.
 * Primary: deep indigo (#4f46e5) — confident, modern, not generic Bootstrap blue.
 * Surfaces: warm-tinted neutrals (slate) for depth without coldness.
 * Text: near-black slate for high contrast and readability.
 */
export const lightPalette: Readonly<Record<string, string>> = {
  colorPrimary: '#4f46e5',
  colorPrimaryForeground: '#ffffff',
  colorAccent: '#6366f1',
  colorBg: '#ffffff',
  colorSurface: '#f8fafc',
  colorSurface2: '#f1f5f9',
  colorTextPrimary: '#0f172a',
  colorTextMuted: '#64748b',
  colorBorder: '#e2e8f0',
  colorDanger: '#dc2626',
  colorDangerForeground: '#ffffff',
  colorSuccess: '#16a34a',
  colorWarning: '#d97706',
};

/**
 * Dark palette — deep blue-black surfaces with adjusted contrast.
 * Primary: lighter indigo (#818cf8) for visibility on dark backgrounds.
 * Surfaces: layered blue-grays (#0b1120 → #1e293b) for spatial depth.
 * Text: soft slate (#e2e8f0) to reduce eye strain in low light.
 */
export const darkPalette: Readonly<Record<string, string>> = {
  colorPrimary: '#818cf8',
  colorPrimaryForeground: '#0b1120',
  colorAccent: '#a5b4fc',
  colorBg: '#0b1120',
  colorSurface: '#111827',
  colorSurface2: '#1e293b',
  colorTextPrimary: '#e2e8f0',
  colorTextMuted: '#94a3b8',
  colorBorder: '#1e293b',
  colorDanger: '#ef4444',
  colorDangerForeground: '#ffffff',
  colorSuccess: '#22c55e',
  colorWarning: '#f59e0b',
};

// ---------------------------------------------------------------------------
// ThemeStore — built on platform/state/Store.ts, consistent with AuthStore etc.
// ---------------------------------------------------------------------------

interface ThemeState {
  mode: ThemeMode;
  resolvedTheme: ResolvedTheme;
}

const INITIAL_THEME_STATE: ThemeState = {
  mode: 'system',
  resolvedTheme: 'light',
};

class ThemeStoreImpl {
  private readonly store: Store<ThemeState> = new Store<ThemeState>(INITIAL_THEME_STATE);

  public getState(): ThemeState {
    return this.store.getState();
  }

  public subscribe(callback: (newState: ThemeState, previousState: ThemeState) => void): () => void {
    return this.store.subscribe(callback);
  }

  /** Sets the mode and resolved theme, notifying subscribers. */
  public setMode(mode: ThemeMode, resolvedTheme: ResolvedTheme): void {
    this.store.setState({ mode, resolvedTheme });
  }

  /** Updates only the resolved theme (used by the media-query listener). */
  public setResolvedTheme(resolvedTheme: ResolvedTheme): void {
    const current = this.store.getState();
    this.store.setState({ mode: current.mode, resolvedTheme });
  }
}

export const themeStore = new ThemeStoreImpl();

// ---------------------------------------------------------------------------
// Core theme functions
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'va-theme-mode';

/**
 * Writes every semantic color as a CSS custom property onto
 * document.documentElement.style. These cascade through Shadow DOM
 * boundaries by design, so every Shadow-isolated component reads them
 * via var(--color-primary) etc.
 */
export function applyTheme(resolvedTheme: ResolvedTheme): void {
  const palette = resolvedTheme === 'dark' ? darkPalette : lightPalette;
  const root = document.documentElement;
  for (const [name, value] of Object.entries(palette)) {
    const cssVar = SEMANTIC_COLOR_CSS_VARS[name];
    if (cssVar) {
      root.style.setProperty(cssVar, value);
    }
  }
  root.setAttribute('data-theme', resolvedTheme);
}

/**
 * Resolves a ThemeMode to a concrete 'light' | 'dark' value.
 * 'system' mode queries the OS-level prefers-color-scheme media query.
 */
function resolveTheme(mode: ThemeMode): ResolvedTheme {
  if (mode === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return mode;
}

// Module-level media-query listener management
let mediaListener: (() => void) | null = null;

function attachSystemListener(): void {
  detachSystemListener();
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = (): void => {
    const resolved = resolveTheme('system');
    themeStore.setResolvedTheme(resolved);
    applyTheme(resolved);
  };
  mq.addEventListener('change', handler);
  mediaListener = (): void => mq.removeEventListener('change', handler);
}

function detachSystemListener(): void {
  if (mediaListener) {
    mediaListener();
    mediaListener = null;
  }
}

/**
 * Initializes the theme system. Called once at app bootstrap (main.ts).
 *
 * 1. Reads any previously-stored theme preference from localStorage.
 * 2. Defaults to 'system' if none stored.
 * 3. Resolves 'system' against prefers-color-scheme.
 * 4. Calls applyTheme() to set CSS custom properties on documentElement.
 * 5. Attaches a live media-query listener so 'system' mode updates if the
 *    OS setting changes mid-session.
 */
export function initThemeSystem(): void {
  let storedMode: ThemeMode = 'system';
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      storedMode = stored;
    }
  } catch {
    // localStorage may be unavailable (private mode, etc.) — default to 'system'.
  }

  const resolved = resolveTheme(storedMode);
  themeStore.setMode(storedMode, resolved);
  applyTheme(resolved);

  if (storedMode === 'system') {
    attachSystemListener();
  }
}

/**
 * Sets the theme mode. Called by the theme toggle UI.
 *
 * Updates ThemeStore, persists the choice to localStorage, re-resolves/re-applies
 * the theme, and manages the media-query listener (attached for 'system',
 * detached for explicit 'light'/'dark').
 */
export function setThemeMode(mode: ThemeMode): void {
  const resolved = resolveTheme(mode);
  themeStore.setMode(mode, resolved);
  applyTheme(resolved);

  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // localStorage may be unavailable — theme still works for this session.
  }

  if (mode === 'system') {
    attachSystemListener();
  } else {
    detachSystemListener();
  }
}