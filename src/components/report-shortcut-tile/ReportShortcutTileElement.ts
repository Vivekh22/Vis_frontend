/**
 * ReportShortcutTileElement.ts — components/report-shortcut-tile/
 *
 * Purpose:
 *   A single report shortcut tile. Clicking the tile emits a 'tile-clicked' event.
 *   When expanded, it renders a slot for the parent to inject the specific
 *   breakdown UI (Donut charts, specific tables, etc.).
 */
import { BaseComponent } from '../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString } from '../../platform/rendering/SafeHtml';

const STYLES = `
  :host { display: block; font-family: var(--font-body); }
  .tile {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    overflow: hidden;
  }
  .tile-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-3) var(--space-4);
    cursor: pointer;
    user-select: none;
  }
  .tile-header:hover { background: var(--color-surface-2); }
  .tile-label {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    margin: 0;
  }
  .tile-chevron {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    transition: transform 0.2s ease;
  }
  .tile-chevron.expanded { transform: rotate(180deg); }
  .tile-breakdown {
    padding: var(--space-4);
    border-top: 1px solid var(--color-border);
  }
`;

class ReportShortcutTileElement extends BaseComponent {
  private _label = '';
  private _expanded = false;

  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
  }

  public set label(value: string) {
    this._label = value;
    this.rerender();
  }

  public get label(): string {
    return this._label;
  }

  public set expanded(value: boolean) {
    this._expanded = value;
    this.rerender();
  }
  
  public get expanded(): boolean {
    return this._expanded;
  }

  protected onMount(): void {
    this.shadow.addEventListener('click', this.handleClick);
  }

  protected onUnmount(): void {
    this.shadow.removeEventListener('click', this.handleClick);
  }

  private handleClick = (event: Event): void => {
    const target = event.target as HTMLElement;
    if (target.closest('[data-action="toggle-tile"]')) {
      this._expanded = !this._expanded;
      this.emit('tile-clicked', { label: this._label, expanded: this._expanded });
      this.rerender();
    }
  };

  protected renderTemplate(): string {
    return html`
      <div class="tile">
        <div class="tile-header" data-action="toggle-tile">
          <p class="tile-label">${this._label}</p>
          <span class="tile-chevron ${this._expanded ? 'expanded' : ''}">▼</span>
        </div>
        ${this._expanded ? SafeHtmlString.trusted('<div class="tile-breakdown"><slot></slot></div>') : ''}
      </div>
    `;
  }
}

ComponentRegistry.register('report-shortcut-tile', ReportShortcutTileElement);
export { ReportShortcutTileElement };