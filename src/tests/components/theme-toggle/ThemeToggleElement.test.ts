/**
 * ThemeToggleElement.test.ts — tests for the theme toggle component.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { ThemeToggleElement } from '../../../components/theme-toggle/ThemeToggleElement';
import { themeStore, setThemeMode, initThemeSystem } from '../../../styles/theme';
import '../../../components/theme-toggle/ThemeToggleElement';

describe('ThemeToggleElement', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    localStorage.clear();
    document.documentElement.style.cssText = '';
  });

  afterEach(() => {
    setThemeMode('light');
    localStorage.clear();
  });

  it('renders three buttons: Light, Dark, System', () => {
    initThemeSystem();
    const el = document.createElement('theme-toggle') as ThemeToggleElement;
    document.body.appendChild(el);
    const buttons = el.shadowRoot!.querySelectorAll('.toggle-btn');
    expect(buttons.length).toBe(3);
    expect(buttons[0]!.textContent).toBe('Light');
    expect(buttons[1]!.textContent).toBe('Dark');
    expect(buttons[2]!.textContent).toBe('System');
    document.body.removeChild(el);
  });

  it('highlights the current mode', () => {
    setThemeMode('dark');
    const el = document.createElement('theme-toggle') as ThemeToggleElement;
    document.body.appendChild(el);
    const activeBtn = el.shadowRoot!.querySelector('.toggle-btn--active');
    expect(activeBtn?.textContent).toBe('Dark');
    document.body.removeChild(el);
  });

  it('changes theme when a button is clicked', () => {
    initThemeSystem();
    const el = document.createElement('theme-toggle') as ThemeToggleElement;
    document.body.appendChild(el);

    const darkBtn = el.shadowRoot!.querySelector('[data-mode="dark"]') as HTMLButtonElement;
    darkBtn.click();

    expect(themeStore.getState().mode).toBe('dark');
    document.body.removeChild(el);
  });

  it('updates highlight when theme changes externally', () => {
    initThemeSystem();
    const el = document.createElement('theme-toggle') as ThemeToggleElement;
    document.body.appendChild(el);

    // Initially system mode
    let activeBtn = el.shadowRoot!.querySelector('.toggle-btn--active');
    expect(activeBtn?.textContent).toBe('System');

    // Change externally
    setThemeMode('light');

    activeBtn = el.shadowRoot!.querySelector('.toggle-btn--active');
    expect(activeBtn?.textContent).toBe('Light');

    document.body.removeChild(el);
  });
});