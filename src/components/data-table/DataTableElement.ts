/**
 * DataTableElement.ts — components/data-table/
 *
 * Purpose:
 *   Generic, reusable sortable/paginated table component — the underlying
 *   table mechanism ActivityLogElement, ApprovalQueueElement, and many future
 *   list views can compose or use directly.
 *
 * Architectural decision — client-side sorting:
 *   Like ApprovalQueueElement's tab filtering, sorting happens client-side
 *   here for already-fully-loaded datasets. The actual sort comparison is
 *   delegated upward via a 'sort-changed' event so the parent page can
 *   re-fetch sorted data if needed. This mirrors the established pattern:
 *   the component emits intent, the parent owns the data logic.
 *
 *   For pagination, emits 'page-changed' — the parent decides whether to
 *   paginate client-side or re-fetch.
 */
import { BaseComponent } from '../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString } from '../../platform/rendering/SafeHtml';

export interface ColumnDefinition<T = Record<string, unknown>> {
  key: string;
  label: string;
  sortable: boolean;
  render?: (row: T) => string;
}

export type SortDirection = 'asc' | 'desc';

const STYLES = `
  :host { display: block; font-family: var(--font-body); }
  .table { width: 100%; border-collapse: collapse; font-size: var(--font-size-sm); }
  .table th, .table td {
    padding: var(--space-2) var(--space-3);
    border-bottom: 1px solid var(--color-border);
    text-align: left;
  }
  .table th {
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-muted);
    font-size: var(--font-size-xs);
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }
  .sort-btn {
    background: none;
    border: none;
    cursor: pointer;
    font: inherit;
    color: inherit;
    padding: 0;
    display: inline-flex;
    align-items: center;
    gap: 2px;
  }
  .sort-btn:hover { color: var(--color-primary); }
  .pagination {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--space-2);
    margin-top: var(--space-3);
  }
  .page-btn {
    padding: var(--space-1) var(--space-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-bg);
    cursor: pointer;
    font-size: var(--font-size-sm);
    font-family: var(--font-body);
  }
  .page-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .page-info { font-size: var(--font-size-sm); color: var(--color-text-muted); }
  .empty-row td { text-align: center; color: var(--color-text-muted); padding: var(--space-8); }
`;

class DataTableElement extends BaseComponent {
  private _columns: ColumnDefinition[] = [];
  private _rows: Record<string, unknown>[] = [];
  private _totalItems = 0;
  private _pageSize = 0;
  private _currentPage = 1;
  private sortColumn: string | null = null;
  private sortDirection: SortDirection = 'asc';

  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
  }

  public set columns(value: ColumnDefinition[]) {
    this._columns = value;
    this.rerender();
  }

  public set rows(value: Record<string, unknown>[]) {
    this._rows = value;
    this.rerender();
  }

  public set totalItems(value: number) {
    this._totalItems = value;
    this.rerender();
  }

  public set pageSize(value: number) {
    this._pageSize = value;
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

    const sortEl = target.closest('[data-sort-key]');
    if (sortEl) {
      const key = sortEl.getAttribute('data-sort-key');
      if (key) {
        if (this.sortColumn === key) {
          this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
          this.sortColumn = key;
          this.sortDirection = 'asc';
        }
        this.emit('sort-changed', { column: key, direction: this.sortDirection });
        this.rerender();
      }
      return;
    }

    const pageEl = target.closest('[data-page]');
    if (pageEl) {
      const action = pageEl.getAttribute('data-page');
      const totalPages = this.getTotalPages();
      if (action === 'prev' && this._currentPage > 1) {
        this._currentPage--;
        this.emit('page-changed', { page: this._currentPage });
        this.rerender();
      } else if (action === 'next' && this._currentPage < totalPages) {
        this._currentPage++;
        this.emit('page-changed', { page: this._currentPage });
        this.rerender();
      }
    }
  };

  private getTotalPages(): number {
    if (this._pageSize <= 0) return 1;
    return Math.max(1, Math.ceil(this._totalItems / this._pageSize));
  }

  protected renderTemplate(): string {
    const headers = this._columns.map((col) => {
      if (!col.sortable) {
        return html`<th>${col.label}</th>`;
      }
      const isActive = this.sortColumn === col.key;
      const arrow = isActive ? (this.sortDirection === 'asc' ? ' ↑' : ' ↓') : '';
      return html`<th>
        <button class="sort-btn" data-sort-key="${col.key}" type="button">${col.label}${arrow}</button>
      </th>`;
    }).join('');

    if (this._rows.length === 0) {
      return html`
        <table class="table">
          <thead><tr>${SafeHtmlString.trusted(headers)}</tr></thead>
          <tbody><tr class="empty-row"><td colspan="${this._columns.length}">No data</td></tr></tbody>
        </table>
      `;
    }

    const bodyRows = this._rows.map((row) => {
      const cells = this._columns.map((col) => {
        if (col.render) {
          return SafeHtmlString.trusted('<td>' + col.render(row) + '</td>');
        }
        const val = row[col.key];
        return html`<td>${val ?? ''}</td>`;
      }).join('');
      return SafeHtmlString.trusted('<tr>' + cells + '</tr>');
    }).join('');

    const showPagination = this._pageSize > 0 && this._totalItems > 0;
    const totalPages = this.getTotalPages();

    return html`
      <table class="table">
        <thead><tr>${SafeHtmlString.trusted(headers)}</tr></thead>
        <tbody>${SafeHtmlString.trusted(bodyRows)}</tbody>
      </table>
      ${showPagination ? SafeHtmlString.trusted(this.renderPagination(totalPages)) : ''}
    `;
  }

  private renderPagination(totalPages: number): string {
    const onFirst = this._currentPage <= 1;
    const onLast = this._currentPage >= totalPages;
    return html`
      <div class="pagination">
        <button class="page-btn" data-page="prev" type="button" ${onFirst ? 'disabled' : ''}>Prev</button>
        <span class="page-info">Page ${this._currentPage} of ${totalPages}</span>
        <button class="page-btn" data-page="next" type="button" ${onLast ? 'disabled' : ''}>Next</button>
      </div>
    `;
  }
}

ComponentRegistry.register('data-table', DataTableElement);
export { DataTableElement };
