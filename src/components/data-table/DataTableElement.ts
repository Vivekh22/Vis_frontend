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

export interface RowAction {
  id: string;
  label: string;
  icon?: string;
  type?: 'button' | 'toggle';
  // If type is toggle, which field on the row defines its checked state?
  activeField?: string;
}

const STYLES = `
  :host { display: block; font-family: var(--font-body); }
  
  /* Glassmorphism Container */
  .table-container {
    background: var(--color-glass-surface);
    border: 1px solid var(--color-glass-border);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-glass);
    backdrop-filter: var(--blur-surface);
    -webkit-backdrop-filter: var(--blur-surface);
    display: flex;
    flex-direction: column;
    overflow: visible; /* For popovers */
  }

  /* Filter Bar */
  .filter-bar {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-4);
    border-bottom: 1px solid var(--color-border);
    flex-wrap: wrap;
  }
  .filter-label {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
  }
  .search-wrapper {
    position: relative;
    max-width: 300px;
    flex: 1;
  }
  .search-icon {
    position: absolute;
    left: var(--space-3);
    top: 50%;
    transform: translateY(-50%);
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
    pointer-events: none;
  }
  .search-input {
    width: 100%;
    padding: var(--space-2) var(--space-3) var(--space-2) var(--space-8);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    font-size: var(--font-size-sm);
    font-family: var(--font-body);
    background: var(--color-bg);
  }
  .icon-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-bg);
    cursor: pointer;
    color: var(--color-text-primary);
    transition: background 0.2s ease;
  }
  .icon-btn:hover { background: var(--color-surface-2); }
  .spacer { flex: 1; }
  .btn {
    padding: var(--space-2) var(--space-4);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-bg);
    cursor: pointer;
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    transition: all 0.2s ease;
  }
  .btn:hover { background: var(--color-surface-2); }
  .btn-primary {
    background: var(--color-primary);
    color: var(--color-primary-foreground);
    border-color: var(--color-primary);
  }
  .btn-primary:hover { background: var(--color-primary-hover); border-color: var(--color-primary-hover); }

  /* Table */
  .table-wrapper {
    overflow-x: auto;
  }
  .table { width: 100%; border-collapse: collapse; font-size: var(--font-size-sm); }
  .table th, .table td {
    padding: var(--space-3) var(--space-4);
    border-bottom: 1px solid var(--color-border);
    text-align: left;
  }
  .table tbody tr {
    transition: background 0.2s ease;
  }
  .table tbody tr:hover {
    background: rgba(0, 0, 0, 0.02);
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
    gap: 4px;
  }
  .sort-btn:hover { color: var(--color-primary); }
  .empty-row td { text-align: center; color: var(--color-text-muted); padding: var(--space-8); }

  /* Popover Menu */
  .action-cell {
    position: relative;
    width: 48px;
    text-align: right;
  }
  .dots-btn {
    background: none;
    border: none;
    font-size: 1.2em;
    cursor: pointer;
    padding: var(--space-1) var(--space-2);
    border-radius: var(--radius-sm);
    color: var(--color-text-muted);
  }
  .dots-btn:hover { background: var(--color-surface-2); color: var(--color-text-primary); }
  .action-popover {
    position: absolute;
    right: 16px;
    top: 36px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-lg);
    z-index: 100;
    min-width: 160px;
    display: flex;
    flex-direction: column;
    padding: var(--space-1) 0;
  }
  .action-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-2) var(--space-4);
    cursor: pointer;
    font-size: var(--font-size-sm);
    color: var(--color-text-primary);
    background: none;
    border: none;
    text-align: left;
    width: 100%;
  }
  .action-item:hover { background: var(--color-surface-2); }
  .action-item-left { display: flex; align-items: center; gap: var(--space-2); }
  
  /* Toggle Switch in Menu */
  .menu-toggle { position: relative; width: 32px; height: 18px; pointer-events: none; }
  .menu-toggle input { opacity: 0; width: 0; height: 0; }
  .menu-toggle-slider {
    position: absolute; cursor: pointer; inset: 0;
    background: var(--color-border); border-radius: var(--radius-full);
    transition: 0.2s;
  }
  .menu-toggle-slider:before {
    content: ""; position: absolute; height: 12px; width: 12px;
    left: 3px; top: 3px; background: white; border-radius: 50%; transition: 0.2s;
  }
  .menu-toggle input:checked + .menu-toggle-slider { background: var(--color-success); }
  .menu-toggle input:checked + .menu-toggle-slider:before { transform: translateX(14px); }

  /* Pagination */
  .footer-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-3) var(--space-4);
    border-top: 1px solid var(--color-border);
  }
  .page-info { font-size: var(--font-size-sm); color: var(--color-text-muted); }
  .pagination-btns {
    display: flex;
    align-items: center;
    gap: var(--space-1);
  }
  .page-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 32px;
    height: 32px;
    padding: 0 var(--space-1);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-bg);
    cursor: pointer;
    font-size: var(--font-size-sm);
    font-family: var(--font-body);
    color: var(--color-text-primary);
    transition: all 0.2s ease;
  }
  .page-btn:hover:not(:disabled) { background: var(--color-surface-2); }
  .page-btn.active {
    background: var(--color-primary);
    color: var(--color-primary-foreground);
    border-color: var(--color-primary);
  }
  .page-btn:disabled { opacity: 0.5; cursor: not-allowed; }
`;

class DataTableElement extends BaseComponent {
  private _columns: ColumnDefinition[] = [];
  private _rows: Record<string, unknown>[] = [];
  private _totalItems = 0;
  private _pageSize = 10;
  private _currentPage = 1;
  private sortColumn: string | null = null;
  private sortDirection: SortDirection = 'asc';

  public showUploadButton = false;
  public showAddButton = false;
  public addActionText = 'Add';
  public searchPlaceholder = 'Search...';
  public rowActions: RowAction[] = [];

  private openMenuRowIndex: number | null = null;

  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
  }

  public get columns(): ColumnDefinition[] { return this._columns; }
  public set columns(value: ColumnDefinition[]) { this._columns = value; this.rerender(); }

  public get rows(): Record<string, unknown>[] { return this._rows; }
  public set rows(value: Record<string, unknown>[]) { this._rows = value; this.rerender(); }

  public get totalItems(): number { return this._totalItems; }
  public set totalItems(value: number) { this._totalItems = value; this.rerender(); }

  public get pageSize(): number { return this._pageSize; }
  public set pageSize(value: number) { this._pageSize = value; this.rerender(); }

  protected onMount(): void {
    this.shadow.addEventListener('click', this.handleClick);
    this.shadow.addEventListener('input', this.handleInput);
    // Close menu when clicking outside
    document.addEventListener('click', this.handleDocumentClick);
  }

  protected onUnmount(): void {
    this.shadow.removeEventListener('click', this.handleClick);
    this.shadow.removeEventListener('input', this.handleInput);
    document.removeEventListener('click', this.handleDocumentClick);
  }

  private handleDocumentClick = (event: MouseEvent): void => {
    if (this.openMenuRowIndex !== null) {
      const path = event.composedPath();
      if (!path.includes(this.shadow)) {
        this.openMenuRowIndex = null;
        this.rerender();
      }
    }
  };

  private handleInput = (event: Event): void => {
    const target = event.target as HTMLElement;
    if (target.classList.contains('search-input')) {
      const value = (target as HTMLInputElement).value;
      this.emit('search-changed', { value });
    }
  };

  private handleClick = (event: Event): void => {
    const target = event.target as HTMLElement;

    // Handle Add Button
    if (target.closest('.btn-primary')) {
      this.emit('add-clicked', {});
      return;
    }

    // Handle Upload Button
    if (target.closest('.upload-btn')) {
      this.emit('upload-clicked', {});
      return;
    }

    // Handle Sorting
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

    // Handle Pagination
    const pageEl = target.closest('[data-page]');
    if (pageEl) {
      const pageStr = pageEl.getAttribute('data-page');
      if (!pageStr) return;
      const totalPages = this.getTotalPages();
      
      let newPage = this._currentPage;
      if (pageStr === 'prev') newPage = Math.max(1, this._currentPage - 1);
      else if (pageStr === 'next') newPage = Math.min(totalPages, this._currentPage + 1);
      else {
        const p = parseInt(pageStr, 10);
        if (!isNaN(p)) newPage = p;
      }

      if (newPage !== this._currentPage) {
        this._currentPage = newPage;
        this.emit('page-changed', { page: this._currentPage });
        this.rerender();
      }
      return;
    }

    // Handle Action Menu Toggle
    const dotsBtn = target.closest('.dots-btn');
    if (dotsBtn) {
      const indexStr = dotsBtn.getAttribute('data-row-index');
      if (indexStr) {
        const index = parseInt(indexStr, 10);
        this.openMenuRowIndex = this.openMenuRowIndex === index ? null : index;
        this.rerender();
      }
      return;
    }

    // Handle Action Item Click
    const actionItem = target.closest('.action-item');
    if (actionItem && this.openMenuRowIndex !== null) {
      const actionId = actionItem.getAttribute('data-action-id');
      if (actionId) {
        const row = this._rows[this.openMenuRowIndex];
        const actionDef = this.rowActions.find(a => a.id === actionId);
        
        let toggleState = false;
        if (actionDef?.type === 'toggle') {
          const checkbox = actionItem.querySelector('input[type="checkbox"]') as HTMLInputElement | null;
          if (checkbox) toggleState = !checkbox.checked; // Invert because it hasn't visually updated yet if clicked on wrapper
          if (target.tagName.toLowerCase() === 'input') toggleState = (target as HTMLInputElement).checked;
        }

        this.emit('row-action', { actionId, row, toggleState });
        
        // Close menu unless it was a toggle click (optional, but good UX is to close)
        this.openMenuRowIndex = null;
        this.rerender();
      }
      return;
    }

    // Clicked elsewhere inside the component, close menu
    if (this.openMenuRowIndex !== null && !target.closest('.action-popover')) {
      this.openMenuRowIndex = null;
      this.rerender();
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
      const arrow = isActive ? (this.sortDirection === 'asc' ? ' &#9650;' : ' &#9660;') : '';
      return html`<th>
        <button class="sort-btn" data-sort-key="${col.key}" type="button">${col.label}${SafeHtmlString.trusted(arrow)}</button>
      </th>`;
    }).join('');

    const hasActions = this.rowActions.length > 0;
    const finalHeaders = hasActions ? headers + '<th style="width: 48px;"></th>' : headers;

    const bodyRows = this._rows.length === 0 
      ? `<tr><td colspan="${this._columns.length + (hasActions ? 1 : 0)}" style="text-align: center; padding: var(--space-8); color: var(--color-text-muted);">No data available</td></tr>`
      : this._rows.map((row, idx) => {
        const cells = this._columns.map((col) => {
          if (col.render) {
            return SafeHtmlString.trusted('<td>' + col.render(row) + '</td>');
          }
          const val = row[col.key];
          return html`<td>${val ?? ''}</td>`;
        }).join('');
        
        let actionCell = '';
        if (hasActions) {
          const isOpen = this.openMenuRowIndex === idx;
          const popover = isOpen ? this.renderActionPopover(row) : '';
          actionCell = `
            <td class="action-cell">
              <button class="dots-btn" data-row-index="${idx}" type="button">⋮</button>
              ${popover}
            </td>
          `;
        }
        
        return SafeHtmlString.trusted(`<tr>${cells}${actionCell}</tr>`);
      }).join('');

    return html`
      <div class="table-container">
        <div class="filter-bar">
          <span class="filter-label">Filters:</span>
          <div class="search-wrapper">
            <span class="search-icon">🔍</span>
            <input type="text" class="search-input" placeholder="${this.searchPlaceholder}">
          </div>
          <button class="icon-btn" title="Filter" type="button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
          </button>
          <slot name="filters"></slot>
          <div class="spacer"></div>
          ${this.showUploadButton ? SafeHtmlString.trusted(`<button class="btn upload-btn" type="button">Upload file</button>`) : ''}
          ${this.showAddButton ? SafeHtmlString.trusted(`<button class="btn btn-primary" type="button">+ ${this.addActionText}</button>`) : ''}
        </div>
        
        <div class="table-wrapper">
          <table class="table">
            <thead><tr>${SafeHtmlString.trusted(finalHeaders)}</tr></thead>
            <tbody>${SafeHtmlString.trusted(bodyRows)}</tbody>
          </table>
        </div>
        
        ${SafeHtmlString.trusted(this.renderFooter())}
      </div>
    `;
  }

  private renderActionPopover(row: Record<string, unknown>): string {
    const items = this.rowActions.map((action) => {
      let iconHtml = '';
      if (action.icon === 'edit') iconHtml = '✏️';
      else if (action.icon === 'view') iconHtml = '👁️';
      else if (action.icon === 'duplicate') iconHtml = '📋';
      else if (action.icon === 'approve') iconHtml = '✅';
      else if (action.icon === 'reject') iconHtml = '❌';

      if (action.type === 'toggle') {
        const isChecked = action.activeField ? Boolean(row[action.activeField]) : false;
        return `
          <button class="action-item" data-action-id="${action.id}" type="button">
            <div class="action-item-left">
              ${iconHtml ? `<span>${iconHtml}</span>` : ''}
              <span>${action.label}</span>
            </div>
            <label class="menu-toggle">
              <input type="checkbox" ${isChecked ? 'checked' : ''} onclick="event.stopPropagation()">
              <span class="menu-toggle-slider"></span>
            </label>
          </button>
        `;
      }
      
      return `
        <button class="action-item" data-action-id="${action.id}" type="button">
          <div class="action-item-left">
            ${iconHtml ? `<span>${iconHtml}</span>` : ''}
            <span>${action.label}</span>
          </div>
        </button>
      `;
    }).join('');

    return `
      <div class="action-popover" onclick="event.stopPropagation()">
        ${items}
      </div>
    `;
  }

  private renderFooter(): string {
    const totalPages = this.getTotalPages();
    if (this._totalItems === 0) return '';

    const startIdx = (this._currentPage - 1) * this._pageSize + 1;
    let endIdx = this._currentPage * this._pageSize;
    if (endIdx > this._totalItems || this._pageSize === 0) endIdx = this._totalItems;

    let pageBtns = '';
    const maxPagesToShow = 5;
    
    // Generate page numbers
    let startPage = Math.max(1, this._currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageBtns += `<button class="page-btn ${i === this._currentPage ? 'active' : ''}" data-page="${i}" type="button">${i}</button>`;
    }

    const onFirst = this._currentPage <= 1;
    const onLast = this._currentPage >= totalPages;

    return `
      <div class="footer-bar">
        <span class="page-info">Showing ${startIdx} to ${endIdx} of ${this._totalItems} entries</span>
        <div class="pagination-btns">
          <button class="page-btn" data-page="prev" type="button" ${onFirst ? 'disabled' : ''}>&lt;</button>
          ${pageBtns}
          <button class="page-btn" data-page="next" type="button" ${onLast ? 'disabled' : ''}>&gt;</button>
        </div>
      </div>
    `;
  }
}

ComponentRegistry.register('data-table', DataTableElement);
export { DataTableElement };
