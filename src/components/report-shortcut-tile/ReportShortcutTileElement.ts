/**
 * ReportShortcutTileElement.ts — components/report-shortcut-tile/
 *
 * Purpose:
 *   A single report shortcut tile (By Day, By Exchange, By OS, By Campaign,
 *   By Creative). Clicking the tile emits a 'tile-clicked' event; the
 *   parent (DashboardPageElement) coordinates accordion behavior — only
 *   one tile's breakdown is open at a time. The tile itself does NOT know
 *   about its siblings; it simply reports "I was clicked" upward.
 *
 *   When expanded, the tile renders a breakdown widget composing
 *   ChartWidgetElement + DataTableElement below the tile header.
 *
 * Accordion coordination is in the parent, NOT here:
 *   This component only sets its own `expanded` state. The parent is
 *   responsible for collapsing other tiles when one expands — a tile
 *   shouldn't know about its siblings.
 */
import { BaseComponent } from '../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString } from '../../platform/rendering/SafeHtml';

export interface ReportTileData {
  label: string;
  chartData: { label: string; value: number }[];
  tableRows: Record<string, unknown>[];
  tableColumns: { key: string; label: string }[];
}

interface ChartWidgetHost extends HTMLElement {
  data: { label: string; value: number }[];
  chartType: 'bar' | 'line' | 'area';
}

interface DataTableHost extends HTMLElement {
  columns: { key: string; label: string; sortable: boolean }[];
  rows: Record<string, unknown>[];
  totalItems: number;
  pageSize: number;
}

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
  private _tileData: ReportTileData | null = null;
  private _expanded = false;
  private _chartType: 'bar' | 'line' | 'area' = 'bar';

  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
  }

  public set tileData(value: ReportTileData) {
    this._tileData = value;
    this.rerender();
    this.syncBreakdownComponents();
  }

  public set expanded(value: boolean) {
    this._expanded = value;
    this.rerender();
    if (value) {
      this.syncBreakdownComponents();
    }
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
      this.emit('tile-clicked', { label: this._tileData?.label ?? '', expanded: this._expanded });
      this.rerender();
      if (this._expanded) {
        this.syncBreakdownComponents();
      }
    }
  };

  private syncBreakdownComponents(): void {
    if (!this._expanded || !this._tileData) return;
    const chart = this.shadow.querySelector<ChartWidgetHost>('chart-widget');
    if (chart) {
      chart.data = this._tileData.chartData;
      chart.chartType = this._chartType;
    }
    const table = this.shadow.querySelector<DataTableHost>('data-table');
    if (table) {
      table.columns = this._tileData.tableColumns.map((c) => ({ ...c, sortable: true }));
      table.rows = this._tileData.tableRows;
      table.totalItems = this._tileData.tableRows.length;
      table.pageSize = 5;
    }
  }

  protected renderTemplate(): string {
    if (!this._tileData) return '';
    const data = this._tileData;
    return html`
      <div class="tile">
        <div class="tile-header" data-action="toggle-tile">
          <p class="tile-label">${data.label}</p>
          <span class="tile-chevron ${this._expanded ? 'expanded' : ''}">▼</span>
        </div>
        ${this._expanded ? SafeHtmlString.trusted(this.renderBreakdown()) : ''}
      </div>
    `;
  }

  private renderBreakdown(): string {
    return html`
      <div class="tile-breakdown">
        <chart-widget></chart-widget>
        <data-table></data-table>
      </div>
    `;
  }
}

ComponentRegistry.register('report-shortcut-tile', ReportShortcutTileElement);
export { ReportShortcutTileElement };