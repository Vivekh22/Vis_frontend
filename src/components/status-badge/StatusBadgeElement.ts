/**
 * StatusBadgeElement.ts — components/status-badge/
 *
 * Purpose:
 *   Renders a colored status badge (Active/Paused/Pending/Rejected/Overdue/
 *   etc.). Maps known status strings to token-based colors via a lookup.
 *   Unrecognized statuses get a neutral fallback — but ALWAYS show the raw
 *   status text, so a new status type never silently disappears from the UI.
 */
import { BaseComponent } from '../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../platform/component/ShadowRenderMixin';
import { html } from '../../platform/rendering/SafeHtml';

const STYLES = `
  :host { display: inline-flex; }
  .badge {
    display: inline-flex;
    align-items: center;
    padding: var(--space-1) var(--space-3);
    border-radius: var(--radius-full);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
    font-family: var(--font-body);
    line-height: 1;
    white-space: nowrap;
  }
  .badge--active    { background: rgba(22, 163, 74, 0.12);  color: var(--color-success); }
  .badge--paused    { background: rgba(100, 116, 139, 0.12); color: var(--color-text-muted); }
  .badge--pending   { background: rgba(217, 119, 6, 0.12);  color: var(--color-warning); }
  .badge--rejected  { background: rgba(220, 38, 38, 0.12);  color: var(--color-danger); }
  .badge--overdue   { background: rgba(220, 38, 38, 0.12);  color: var(--color-danger); }
  .badge--neutral   { background: var(--color-surface-2);   color: var(--color-text-muted); }
`;

const STATUS_CLASS_MAP: Readonly<Record<string, string>> = {
  active: 'badge--active',
  paused: 'badge--paused',
  pending: 'badge--pending',
  rejected: 'badge--rejected',
  overdue: 'badge--overdue',
};

class StatusBadgeElement extends BaseComponent {
  private _status = '';

  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
  }

  public set status(value: string) {
    this._status = value;
    this.rerender();
  }

  public get status(): string {
    return this._status;
  }

  protected renderTemplate(): string {
    const key = this._status.toLowerCase();
    const badgeClass = STATUS_CLASS_MAP[key] ?? 'badge--neutral';
    return html`<span class="badge ${badgeClass}">${this._status}</span>`;
  }
}

ComponentRegistry.register('status-badge', StatusBadgeElement);
export { StatusBadgeElement };
