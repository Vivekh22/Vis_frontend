/**
 * theme.test.ts — unit tests for styles/theme.ts.
 *
 * Tests applyTheme, initThemeSystem, setThemeMode, and live OS-change
 * re-application. Mocks matchMedia and localStorage to control test conditions.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  applyTheme,
  initThemeSystem,
  setThemeMode,
  themeStore,
  lightPalette,
  darkPalette,
} from '../../styles/theme';
const STORAGE_KEY = 'va-theme-mode';

function mockMatchMedia(prefersDark: boolean): {
  setPrefersDark: (v: boolean) => void;
  dispatchChange: (matches: boolean) => void;
} {
  let currentPrefersDark = prefersDark;
  const listeners: Set<(e: { matches: boolean }) => void> = new Set();

  window.matchMedia = vi.fn((query: string): MediaQueryList => {
    return {
      matches: currentPrefersDark,
      media: query,
      onchange: null,
      addEventListener: (type: string, listener: (e: { matches: boolean }) => void) => {
        if (type === 'change') listeners.add(listener);
      },
      removeEventListener: (type: string, listener: (e: { matches: boolean }) => void) => {
        if (type === 'change') listeners.delete(listener);
      },
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    } as unknown as MediaQueryList;
  }) as unknown as typeof window.matchMedia;

  return {
    setPrefersDark: (v: boolean) => {
      currentPrefersDark = v;
    },
    dispatchChange: (matches: boolean) => {
      currentPrefersDark = matches;
      listeners.forEach((l) => l({ matches }));
    },
  };
}

describe('applyTheme', () => {
  beforeEach(() => {
    document.documentElement.style.cssText = '';
    document.documentElement.removeAttribute('data-theme');
  });

  it('sets light palette CSS custom properties on documentElement for light theme', () => {
    applyTheme('light');
    expect(document.documentElement.style.getPropertyValue('--color-primary')).toBe(
      lightPalette.colorPrimary,
    );
    expect(document.documentElement.style.getPropertyValue('--color-bg')).toBe(
      lightPalette.colorBg,
    );
    expect(document.documentElement.style.getPropertyValue('--color-text-primary')).toBe(
      lightPalette.colorTextPrimary,
    );
  });

  it('sets dark palette CSS custom properties on documentElement for dark theme', () => {
    applyTheme('dark');
    expect(document.documentElement.style.getPropertyValue('--color-primary')).toBe(
      darkPalette.colorPrimary,
    );
    expect(document.documentElement.style.getPropertyValue('--color-bg')).toBe(
      darkPalette.colorBg,
    );
    expect(document.documentElement.style.getPropertyValue('--color-text-primary')).toBe(
      darkPalette.colorTextPrimary,
    );
  });

  it('sets data-theme attribute on documentElement', () => {
    applyTheme('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    applyTheme('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });
});

describe('initThemeSystem', () => {
  beforeEach(() => {
    document.documentElement.style.cssText = '';
    document.documentElement.removeAttribute('data-theme');
    localStorage.clear();
  });

  afterEach(() => {
    setThemeMode('light');
    localStorage.clear();
  });

  it('defaults to system mode when no stored preference', () => {
    mockMatchMedia(false);
    initThemeSystem();
    const state = themeStore.getState();
    expect(state.mode).toBe('system');
    expect(state.resolvedTheme).toBe('light');
  });

  it('resolves system mode against prefers-color-scheme: dark', () => {
    mockMatchMedia(true);
    initThemeSystem();
    const state = themeStore.getState();
    expect(state.mode).toBe('system');
    expect(state.resolvedTheme).toBe('dark');
    expect(document.documentElement.style.getPropertyValue('--color-bg')).toBe(
      darkPalette.colorBg,
    );
  });

  it('reads stored preference from localStorage', () => {
    mockMatchMedia(false);
    localStorage.setItem(STORAGE_KEY, 'dark');
    initThemeSystem();
    const state = themeStore.getState();
    expect(state.mode).toBe('dark');
    expect(state.resolvedTheme).toBe('dark');
  });

  it('re-applies theme when OS preference changes mid-session (live update)', () => {
    const mq = mockMatchMedia(false);
    initThemeSystem();

    // Initially light
    expect(document.documentElement.style.getPropertyValue('--color-bg')).toBe(
      lightPalette.colorBg,
    );

    // Simulate OS change to dark
    mq.dispatchChange(true);

    // Theme should re-apply without a page reload
    expect(document.documentElement.style.getPropertyValue('--color-bg')).toBe(
      darkPalette.colorBg,
    );
    expect(themeStore.getState().resolvedTheme).toBe('dark');
  });
});

describe('setThemeMode', () => {
  beforeEach(() => {
    document.documentElement.style.cssText = '';
    document.documentElement.removeAttribute('data-theme');
    localStorage.clear();
  });

  afterEach(() => {
    setThemeMode('light');
    localStorage.clear();
  });

  it('updates ThemeStore with the new mode and resolved theme', () => {
    mockMatchMedia(false);
    setThemeMode('dark');
    const state = themeStore.getState();
    expect(state.mode).toBe('dark');
    expect(state.resolvedTheme).toBe('dark');
  });

  it('persists the choice to localStorage', () => {
    mockMatchMedia(false);
    setThemeMode('dark');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('dark');
  });

  it('applies the theme to documentElement', () => {
    mockMatchMedia(false);
    setThemeMode('dark');
    expect(document.documentElement.style.getPropertyValue('--color-primary')).toBe(
      darkPalette.colorPrimary,
    );
  });

  it('resolves system mode against OS preference', () => {
    mockMatchMedia(true);
    setThemeMode('system');
    const state = themeStore.getState();
    expect(state.mode).toBe('system');
    expect(state.resolvedTheme).toBe('dark');
  });
});