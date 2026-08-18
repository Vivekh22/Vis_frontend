/**
 * AlertBannerElement.ts — components/alert-banner/
 *
 * Purpose:
 *   A reusable styled custom element for system notices (e.g. low-network warnings,
 *   info messages, success messages).
 */
import { BaseComponent } from '../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString } from '../../platform/rendering/SafeHtml';

export type AlertVariant = 'info' | 'warning' | 'success' | 'danger';

const STYLES = `
  :host { display: block; font-family: var(--font-body); }
  .alert-banner {
    display: flex;
    align-items: center;
    padding: var(--space-3) var(--space-4);
    border-radius: var(--radius-md);
    font-size: var(--font-size-sm);
    margin-bottom: var(--space-4);
  }
  .alert-banner.info {
    background: var(--color-surface-2);
    border: 1px solid var(--color-border);
    color: var(--color-text-primary);
  }
  .alert-banner.warning {
    background: var(--color-warning-bg);
    border: 1px solid var(--color-warning-border);
    color: var(--color-warning-text);
  }
  .alert-banner.success {
    background: rgba(34, 197, 94, 0.1);
    border: 1px solid var(--color-success);
    color: var(--color-success);
  }
  .alert-banner.danger {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid var(--color-danger);
    color: var(--color-danger-foreground);
  }
`;

class AlertBannerElement extends BaseComponent {
  private _variant: AlertVariant = 'info';

  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
  }

  public set variant(value: AlertVariant) {
    this._variant = value;
    this.rerender();
  }

  public get variant(): AlertVariant {
    return this._variant;
  }
  
  static get observedAttributes() {
    return ['variant'];
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (name === 'variant' && ['info', 'warning', 'success', 'danger'].includes(newValue)) {
      this._variant = newValue as AlertVariant;
      this.rerender();
    }
  }

  protected renderTemplate(): string {
    return html`
      <div class="alert-banner ${this._variant}">
        <slot></slot>
      </div>
    `;
  }
}

ComponentRegistry.register('alert-banner', AlertBannerElement);
export { AlertBannerElement };
