/**
 * ActivityLogElement.ts — components/activity-log/
 *
 * Purpose:
 *   One of the two universally-shared components (the other being
 *   ApprovalQueueElement). Used across Client (own entity's history inline),
 *   Admin (filtered to allowlist), and Super Admin (fully unscoped) — the
 *   SAME component, just scoped differently by the caller.
 *
 * Architectural principle — division of responsibility:
 *   PRESENTATION and FILTER-CONTROL-RENDERING happen here.
 *   DATA-FETCHING and FILTERING LOGIC happen in services/repositories.
 *
 *   This component renders whatever entries it's given. It optionally renders
 *   filter CONTROLS (dropdowns/inputs) and emits 'filters-changed' when the
 *   user changes them — letting the parent page own the actual data-fetching
 *   and filtering logic. This component NEVER filters its own entries array
 *   client-side; that would duplicate the service-layer filtering logic and
 *   risk divergence on large datasets where filtering is server-side.
 *
 *   (Contrast with ApprovalQueueElement, which DOES filter client-side —
 *   see that component's docstring for the rationale.)
 */
import { BaseComponent } from '../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString } from '../../platform/rendering/SafeHtml';
import type { UserRole } from '../../platform/types';

export interface ActivityLogEntry {
  timestamp: Date;
  actor: string;
  actorRole: UserRole;
  client: string | null;
  module: string;
  action: string;
  details: string | null;
}

export interface ActivityLogFilters {
  client?: string;
  actor?: string;
  module?: string;
  action?: string;
}

const STYLES = `
  :host { display: block; }
  .log-table {
    width: 100%;
    border-collapse: collapse;
    font-family: var(--font-body);
    font-size: var(--font-size-sm);
  }
  .log-table th, .log-table td {
    padding: var(--space-2) var(--space-3);
    border-bottom: 1px solid var(--color-border);
    text-align: left;
  }
  .log-table th {
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-muted);
    font-size: var(--font-size-xs);
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }
  .empty-state {
    padding: var(--space-8) var(--space-4);
    text-align: center;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }
  .filters {
    display: flex;
    gap: var(--space-2);
    margin-bottom: var(--space-4);
    flex-wrap: wrap;
  }
  .filter-input {
    padding: var(--space-1) var(--space-2);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-sm);
    font-family: var(--font-body);
  }
`;

class ActivityLogElement extends BaseComponent {
  private _entries: ActivityLogEntry[] = [];
  private _emptyStateMessage = 'No activity to show';
  private _showFilters = false;
  private _filters: ActivityLogFilters = {};

  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
  }

  public set entries(value: ActivityLogEntry[]) {
    this._entries = value;
    this.rerender();
  }

  public set emptyStateMessage(value: string) {
    this._emptyStateMessage = value;
    this.rerender();
  }

  public set showFilters(value: boolean) {
    this._showFilters = value;
    this.rerender();
  }

  public set filters(value: ActivityLogFilters) {
    this._filters = value;
    this.rerender();
  }

  protected onMount(): void {
    this.shadow.addEventListener('input', this.handleFilterInput);
    this.shadow.addEventListener('change', this.handleFilterInput);
  }

  protected onUnmount(): void {
    this.shadow.removeEventListener('input', this.handleFilterInput);
    this.shadow.removeEventListener('change', this.handleFilterInput);
  }

  private handleFilterInput = (event: Event): void => {
    const target = event.target as HTMLElement;
    const field = target.getAttribute('data-filter');
    if (!field) return;
    const value = (target as HTMLInputElement).value;
    const newFilters = { ...this._filters, [field]: value };
    this._filters = newFilters;
    this.emit('filters-changed', newFilters);
  };

  private formatDate(date: Date): string {
    return date.toLocaleString();
  }

  protected renderTemplate(): string {
    if (this._entries.length === 0) {
      return html`<div class="empty-state">${this._emptyStateMessage}</div>`;
    }

    // Computed once per render — not per row — whether any entry has a client
    const showClientColumn = this._entries.some((e) => e.client !== null);

    const headerCells = [
      '<th>Timestamp</th>',
      '<th>Actor</th>',
      '<th>Role</th>',
    ];
    if (showClientColumn) headerCells.push('<th>Client</th>');
    headerCells.push('<th>Module</th>', '<th>Action</th>', '<th>Details</th>');

    const rows = this._entries.map((entry) => {
      const cells = [
        `<td>${this.formatDate(entry.timestamp)}</td>`,
        `<td>${entry.actor}</td>`,
        `<td>${entry.actorRole}</td>`,
      ];
      if (showClientColumn) cells.push(`<td>${entry.client ?? ''}</td>`);
      cells.push(
        `<td>${entry.module}</td>`,
        `<td>${entry.action}</td>`,
        `<td>${entry.details ?? ''}</td>`,
      );
      return `<tr>${cells.join('')}</tr>`;
    });

    return html`
      ${this._showFilters ? SafeHtmlString.trusted(this.renderFilters()) : ''}
      <table class="log-table">
        <thead><tr>${SafeHtmlString.trusted(headerCells.join(''))}</tr></thead>
        <tbody>${SafeHtmlString.trusted(rows.join(''))}</tbody>
      </table>
    `;
  }

  private renderFilters(): string {
    return html`
      <div class="filters">
        <input class="filter-input" data-filter="client" placeholder="Filter by client" value="${this._filters.client ?? ''}">
        <input class="filter-input" data-filter="actor" placeholder="Filter by actor" value="${this._filters.actor ?? ''}">
        <input class="filter-input" data-filter="module" placeholder="Filter by module" value="${this._filters.module ?? ''}">
        <input class="filter-input" data-filter="action" placeholder="Filter by action" value="${this._filters.action ?? ''}">
      </div>
    `;
  }
}

ComponentRegistry.register('activity-log', ActivityLogElement);
export { ActivityLogElement };
