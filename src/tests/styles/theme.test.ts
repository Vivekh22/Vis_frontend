import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  lightPalette,
  themeStore,
  applyTheme,
  initThemeSystem,
} from '../../styles/theme';

describe('theme', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-theme');
    for (const key of Object.keys(lightPalette)) {
      const cssVarName = '--' + key.replace(/([A-Z])/g, '-$1').toLowerCase();
      document.documentElement.style.removeProperty(cssVarName);
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('applyTheme', () => {
    it('applies the light palette to documentElement and sets data-theme="light"', () => {
      applyTheme();
      
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
      
      const primaryVar = document.documentElement.style.getPropertyValue('--color-primary');
      expect(primaryVar).toBe(lightPalette.colorPrimary);
    });
  });

  describe('initThemeSystem', () => {
    it('initializes ThemeStore with mode="light" and resolvedTheme="light"', () => {
      initThemeSystem();
      
      const state = themeStore.getState();
      expect(state.mode).toBe('light');
      expect(state.resolvedTheme).toBe('light');
      
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });
  });
});