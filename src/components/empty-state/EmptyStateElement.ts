/**
 * EmptyStateElement.ts — components/empty-state/
 *
 * Purpose:
 *   Reusable empty-state component for when a data-driven view has no data.
 *   Token-styled (not a bare text message) per the premium-UI requirement.
 *
 *   Public setters: message, iconName (optional), actionLabel (optional).
 *   Emits 'action-clicked' when the action button is clicked (e.g. "Invite
 *   Team Member" style calls-to-action within an empty state).
 *
 *   Visually neutral (uses muted/secondary tokens) — distinguished from
 *   ErrorStateElement which uses danger/warning tokens.
 */
import { BaseComponent } from '../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString } from '../../platform/rendering/SafeHtml';

const STYLES = `
  :host { display: block; font-family: var(--font-body); }
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--space-10) var(--space-4);
    text-align: center;
  }
  .empty-icon {
    font-size: var(--font-size-2xl);
    color: var(--color-text-muted);
    margin-bottom: var(--space-3);
    line-height: 1;
  }
  .empty-message {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    margin: 0 0 var(--space-4);
  }
  .empty-action {
    padding: var(--space-2) var(--space-4);
    background: var(--color-primary);
    color: var(--color-primary-foreground);
    border: none;
    border-radius: var(--radius-md);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    cursor: pointer;
    font-family: var(--font-body);
  }
  .empty-action:hover { opacity: 0.9; }
`;

class EmptyStateElement extends BaseComponent {
  private _message = 'No data available';
  private _iconName: string | null = null;
  private _actionLabel: string | null = null;

  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
  }

  public set message(value: string) {
    this._message = value;
    this.rerender();
  }

  public set iconName(value: string | null) {
    this._iconName = value;
    this.rerender();
  }

  public set actionLabel(value: string | null) {
    this._actionLabel = value;
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
    if (target.closest('[data-action="empty-action"]')) {
      this.emit('action-clicked', undefined);
    }
  };

  protected renderTemplate(): string {
    const iconHtml = this._iconName
      ? html`<div class="empty-icon">${this._iconName}</div>`
      : '';
    const actionHtml = this._actionLabel
      ? html`<button class="empty-action" data-action="empty-action" type="button">${this._actionLabel}</button>`
      : '';

    return html`
      <div class="empty-state">
        ${SafeHtmlString.trusted(iconHtml)}
        <p class="empty-message">${this._message}</p>
        ${SafeHtmlString.trusted(actionHtml)}
      </div>
    `;
  }
}

ComponentRegistry.register('empty-state', EmptyStateElement);
export { EmptyStateElement };