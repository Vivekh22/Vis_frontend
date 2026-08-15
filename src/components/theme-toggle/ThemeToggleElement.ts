/**
 * ThemeToggleElement.ts — components/theme-toggle/
 *
 * Purpose:
 *   Renders a three-way control (Light / Dark / System) reflecting ThemeStore's
 *   current mode. Calls setThemeMode() on selection. Mounted in each layout's
 *   topbar, replacing the "not yet wired" placeholder flagged in Part 3.
 *
 * Subscribes to themeStore so the control reflects external theme changes
 * (e.g. the media-query listener updating 'system' mode) without a page reload.
 */
import { BaseComponent } from '../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString } from '../../platform/rendering/SafeHtml';
import { themeStore, setThemeMode } from '../../styles/theme';
import type { ThemeMode } from '../../styles/theme';

const STYLES = `
  :host { display: inline-flex; font-family: var(--font-body); }
  .toggle-group {
    display: inline-flex;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-full);
    overflow: hidden;
    background: var(--color-surface);
  }
  .toggle-btn {
    padding: var(--space-1) var(--space-3);
    border: none;
    background: transparent;
    color: var(--color-text-muted);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);
    cursor: pointer;
    font-family: var(--font-body);
    transition: background 0.15s, color 0.15s;
  }
  .toggle-btn:hover { color: var(--color-text-primary); }
  .toggle-btn--active {
    background: var(--color-primary);
    color: var(--color-primary-foreground);
  }
`;

const MODES: { value: ThemeMode; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

class ThemeToggleElement extends BaseComponent {
  private currentMode: ThemeMode = 'system';
  private unsubscribe: (() => void) | null = null;

  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
  }

  protected onMount(): void {
    const state = themeStore.getState();
    this.currentMode = state.mode;
    this.rerender();
    this.unsubscribe = themeStore.subscribe((newState) => {
      this.currentMode = newState.mode;
      this.rerender();
    });
    this.shadow.addEventListener('click', this.handleClick);
  }

  protected onUnmount(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.shadow.removeEventListener('click', this.handleClick);
  }

  private handleClick = (event: Event): void => {
    const target = event.target as HTMLElement;
    const btn = target.closest('[data-mode]') as HTMLElement | null;
    if (!btn) return;
    const mode = btn.getAttribute('data-mode') as ThemeMode | null;
    if (mode && (mode === 'light' || mode === 'dark' || mode === 'system')) {
      setThemeMode(mode);
    }
  };

  protected renderTemplate(): string {
    const buttons = MODES.map((m) => {
      const isActive = this.currentMode === m.value;
      return html`
        <button
          class="toggle-btn ${isActive ? 'toggle-btn--active' : ''}"
          data-mode="${m.value}"
          type="button"
        >${m.label}</button>
      `;
    }).join('');

    return html`<div class="toggle-group">${SafeHtmlString.trusted(buttons)}</div>`;
  }
}

ComponentRegistry.register('theme-toggle', ThemeToggleElement);
export { ThemeToggleElement };