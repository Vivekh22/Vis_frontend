/**
 * theme.ts — styles/
 *
 * Purpose:
 *   Manages the platform's single Light theme.
 *   - The landing page handles its own dark theme completely separately.
 *   - The authenticated platform is permanently locked to Light mode.
 */
import { Store } from '../platform/state/Store';

export const lightPalette: Readonly<Record<string, string>> = {
  // Core Brand
  colorPrimary: '#4f46e5',
  colorPrimaryHover: '#4338ca',
  colorAccent: '#0ea5e9',
  
  // Backgrounds & Surfaces
  colorBg: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', // Subtle gradient for glass texture
  colorSurface: '#ffffff',
  colorSurface2: '#f1f5f9',
  
  // Glassmorphism System
  colorGlassSurface: 'rgba(255, 255, 255, 0.7)',
  colorGlassBorder: 'rgba(255, 255, 255, 0.4)',
  shadowGlass: '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
  blurSurface: 'blur(12px)',
  gradientPrimaryAccent: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)',
  
  // Borders
  colorBorder: '#e2e8f0',
  colorBorderHover: '#cbd5e1',
  
  // Typography
  colorTextPrimary: '#0f172a',
  colorTextSecondary: '#334155',
  colorTextMuted: '#64748b',
  
  // Semantic / Feedback
  colorSuccess: '#10b981',
  colorWarningBg: '#fffbeb',
  colorWarningBorder: '#fcd34d',
  colorWarningText: '#b45309',
  colorDanger: '#ef4444',
  colorDangerHover: '#dc2626',
  
  // Foreground overrides (text on top of solid brand/semantic colors)
  colorPrimaryForeground: '#ffffff',
  colorDangerForeground: '#ffffff',
};

// ThemeStore remains to hold the state, but is now static
export type ThemeMode = 'light';
export type ResolvedTheme = 'light';

export interface ThemeState {
  mode: ThemeMode;
  resolvedTheme: ResolvedTheme;
}

const INITIAL_STATE: ThemeState = {
  mode: 'light',
  resolvedTheme: 'light',
};

class ThemeStoreImpl {
  private readonly store: Store<ThemeState> = new Store<ThemeState>(INITIAL_STATE);

  public getState(): ThemeState {
    return this.store.getState();
  }

  public subscribe(callback: (newState: ThemeState, previousState: ThemeState) => void): () => void {
    return this.store.subscribe(callback);
  }
}

export const themeStore = new ThemeStoreImpl();

/**
 * Applies the single light theme by setting the data-theme attribute on <html>
 * and injecting all lightPalette values as CSS variables.
 */
export function applyTheme(): void {
  const root = document.documentElement;
  
  // 1. Inject variables
  for (const [key, value] of Object.entries(lightPalette)) {
    const cssVarName = '--' + key.replace(/([A-Z])/g, '-$1').toLowerCase();
    root.style.setProperty(cssVarName, value);
  }
  
  // 2. Set root attribute (can be used by generic CSS if needed)
  root.setAttribute('data-theme', 'light');
}

/**
 * Initializes the theme system. Called exactly once at bootstrap.
 */
export function initThemeSystem(): void {
  applyTheme();
}
