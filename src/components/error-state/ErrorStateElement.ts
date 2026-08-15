/**
 * ErrorStateElement.ts — components/error-state/
 *
 * Purpose:
 *   Reusable error-state component for when a data fetch fails. Visually
 *   distinguished from EmptyStateElement: error styling uses danger/warning
 *   token colors, while empty state uses neutral muted styling. Conflating
 *   them would be a design mistake — "something went wrong" requires a
 *   different visual signal than "nothing here yet."
 *
 *   Public setters: message, retryLabel (optional).
 *   Emits 'retry-clicked' when the retry button is clicked.
 */
import { BaseComponent } from '../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString } from '../../platform/rendering/SafeHtml';

const STYLES = `
  :host { display: block; font-family: var(--font-body); }
  .error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--space-10) var(--space-4);
    text-align: center;
    border: 1px solid var(--color-danger);
    border-radius: var(--radius-md);
    background: var(--color-surface);
  }
  .error-icon {
    font-size: var(--font-size-2xl);
    color: var(--color-danger);
    margin-bottom: var(--space-3);
    line-height: 1;
  }
  .error-message {
    font-size: var(--font-size-sm);
    color: var(--color-danger);
    font-weight: var(--font-weight-medium);
    margin: 0 0 var(--space-4);
  }
  .retry-btn {
    padding: var(--space-2) var(--space-4);
    background: var(--color-danger);
    color: var(--color-danger-foreground);
    border: none;
    border-radius: var(--radius-md);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    cursor: pointer;
    font-family: var(--font-body);
  }
  .retry-btn:hover { opacity: 0.9; }
`;

class ErrorStateElement extends BaseComponent {
  private _message = 'Something went wrong';
  private _retryLabel: string | null = 'Retry';

  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
  }

  public set message(value: string) {
    this._message = value;
    this.rerender();
  }

  public set retryLabel(value: string | null) {
    this._retryLabel = value;
    this.rerender();
  }

  protected onMount(): void {
    this.shadow.addEventListener('click', this.handleClick);
  }

  protected onUnmount(): void {
    this.shadow.removeEventListener('click', this.handleClick);
  }

  private handleClick = (event: Event): void => {
    const target = event.target as HTMLElement;
    if (target.closest('[data-action="retry"]')) {
      this.emit('retry-clicked', undefined);
    }
  };

  protected renderTemplate(): string {
    const retryHtml = this._retryLabel
      ? html`<button class="retry-btn" data-action="retry" type="button">${this._retryLabel}</button>`
      : '';

    return html`
      <div class="error-state">
        <div class="error-icon">⚠</div>
        <p class="error-message">${this._message}</p>
        ${SafeHtmlString.trusted(retryHtml)}
      </div>
    `;
  }
}

ComponentRegistry.register('error-state', ErrorStateElement);
export { ErrorStateElement };