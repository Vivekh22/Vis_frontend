import { BaseComponent } from '../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString } from '../../platform/rendering/SafeHtml';
import type { DashboardSummary } from '../../services/DashboardService';
import '../chart-widget/ChartWidgetElement';

const STYLES = `
  :host { display: block; font-family: var(--font-body); }
  .filters {
    margin-bottom: var(--space-4);
    display: flex;
    gap: var(--space-3);
    flex-wrap: wrap;
  }
  .filter-label {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    font-size: var(--font-size-sm);
    color: var(--color-text-primary);
    cursor: pointer;
  }
  .chart-area {
    margin-bottom: var(--space-4);
  }
`;

class ReportBreakdownElement extends BaseComponent {
  private _tileKey = '';
  private _summary: DashboardSummary | null = null;
  
  // State for By Exchange filters
  private allowedExchanges = ['AdX', 'AppLovin', 'UnityAds', 'IronSource'];
  private excludedExchanges: Set<string> = new Set();
  
  // State for By OS filters
  private osData = [
    { label: 'Android', value: 45000, color: 'var(--color-primary)' },
    { label: 'iOS', value: 38000, color: 'var(--color-accent)' },
    { label: 'Windows', value: 1200, color: 'var(--color-warning-border)' }
  ];
  private excludedOs: Set<string> = new Set();

  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
  }

  public set tileKey(value: string) {
    this._tileKey = value;
    this.rerender();
    this.syncChildren();
  }

  public set summary(value: DashboardSummary | null) {
    this._summary = value;
    this.rerender();
    this.syncChildren();
  }

  protected onMount(): void {
    this.shadow.addEventListener('change', this.handleChange);
  }

  protected onUnmount(): void {
    this.shadow.removeEventListener('change', this.handleChange);
  }

  private handleChange = (event: Event): void => {
    const target = event.target as HTMLInputElement;
    const filterKey = target.getAttribute('data-filter-key');
    const filterValue = target.value;
    
    if (filterKey === 'exchange') {
      if (target.checked) this.excludedExchanges.delete(filterValue);
      else this.excludedExchanges.add(filterValue);
      this.rerender();
      this.syncChildren();
    } else if (filterKey === 'os') {
      if (target.checked) this.excludedOs.delete(filterValue);
      else this.excludedOs.add(filterValue);
      this.rerender();
      this.syncChildren();
    }
  };

  private syncChildren(): void {
    if (!this._summary) return;
    
    // Sync data-table
    const table = this.shadow.querySelector('data-table') as any;
    if (table) {
      if (this._tileKey === 'day') {
        table.columns = [
          { key: 'date', label: 'Date', sortable: true },
          { key: 'impressions', label: 'Impressions', sortable: true },
          { key: 'clicks', label: 'Clicks', sortable: true },
          { key: 'spend', label: 'Spend', sortable: true },
          { key: 'revenue', label: 'Revenue', sortable: true },
          { key: 'roas', label: 'ROAS', sortable: true }
        ];
        table.rows = this._summary.chartData.map(d => ({
          date: d.label,
          impressions: Math.floor(d.value * 10),
          clicks: Math.floor(d.value / 10),
          spend: `$${Math.floor(d.value).toLocaleString()}`,
          revenue: `$${Math.floor(d.value * 1.5).toLocaleString()}`,
          roas: '150%'
        }));
      } else if (this._tileKey === 'exchange') {
        table.columns = [
          { key: 'name', label: 'Exchange Name', sortable: true },
          { key: 'impressions', label: 'Impressions', sortable: true },
          { key: 'clicks', label: 'Clicks', sortable: true },
          { key: 'spend', label: 'Spend', sortable: true },
          { key: 'ctr', label: 'CTR', sortable: true },
          { key: 'ecpm', label: 'eCPM', sortable: true }
        ];
        table.rows = this.allowedExchanges.filter(e => !this.excludedExchanges.has(e)).map((e, i) => ({
          name: e,
          impressions: 500000 - i * 50000,
          clicks: 2500 - i * 200,
          spend: `$${(1200 - i * 100).toLocaleString()}`,
          ctr: '0.5%',
          ecpm: '$2.40'
        }));
      } else if (this._tileKey === 'campaign') {
        table.columns = [
          { key: 'name', label: 'Campaign Name', sortable: true, render: (r: any) => `<a href="/client/campaigns" data-router-link style="color:var(--color-primary);">${r.name}</a>` },
          { key: 'status', label: 'Status', sortable: true, render: (r: any) => `<status-badge status="${r.status}"></status-badge>` },
          { key: 'impressions', label: 'Impressions', sortable: true },
          { key: 'clicks', label: 'Clicks', sortable: true },
          { key: 'spend', label: 'Spend', sortable: true }
        ];
        table.rows = [
          { name: 'Summer Sale 2026', status: 'running', impressions: 12000, clicks: 400, spend: '$500' },
          { name: 'Q3 Retargeting', status: 'paused', impressions: 8000, clicks: 150, spend: '$300' }
        ];
      } else if (this._tileKey === 'creative') {
        table.columns = [
          { key: 'name', label: 'Creative Name', sortable: true, render: (r: any) => `<a href="/client/creatives" data-router-link style="color:var(--color-primary);">${r.name}</a>` },
          { key: 'type', label: 'Type', sortable: true, render: (r: any) => `<span style="padding: 2px 6px; background: var(--color-surface-2); border-radius: 4px; font-size: 10px;">${r.type}</span>` },
          { key: 'impressions', label: 'Impressions', sortable: true },
          { key: 'ctr', label: 'CTR', sortable: true }
        ];
        table.rows = [
          { name: 'Banner_300x250_V1', type: 'image', impressions: 50000, ctr: '0.8%' },
          { name: 'Video_15s_Promo', type: 'video', impressions: 25000, ctr: '2.1%' }
        ];
      }
      table.totalItems = table.rows.length;
      table.pageSize = 5;
    }

    // Sync specific charts
    if (this._tileKey === 'day') {
      const chart = this.shadow.querySelector('chart-widget') as any;
      if (chart) {
        chart.data = this._summary.chartData;
        chart.chartType = 'bar';
        chart.format = 'currency';
      }
    } else if (this._tileKey === 'exchange') {
      const chart = this.shadow.querySelector('chart-widget') as any;
      if (chart) {
        chart.chartType = 'horizontal-bar';
        chart.format = 'number';
        chart.data = this.allowedExchanges
          .filter(e => !this.excludedExchanges.has(e))
          .map((e, i) => ({ label: e, value: 1200 - i * 100 }));
      }
    } else if (this._tileKey === 'os') {
      const chart = this.shadow.querySelector('chart-widget') as any;
      if (chart) {
        chart.chartType = 'donut';
        chart.format = 'number';
        chart.data = this.osData
          .filter(os => !this.excludedOs.has(os.label));
      }
    } else if (this._tileKey === 'campaign') {
      const chart = this.shadow.querySelector('chart-widget') as any;
      if (chart) {
        chart.chartType = 'horizontal-bar';
        chart.format = 'currency';
        chart.data = [
          { label: 'Summer Sale 2026', value: 500 },
          { label: 'Q3 Retargeting', value: 300 }
        ];
      }
    } else if (this._tileKey === 'creative') {
      const chart = this.shadow.querySelector('chart-widget') as any;
      if (chart) {
        chart.chartType = 'horizontal-bar';
        chart.format = 'number';
        chart.data = [
          { label: 'Banner_300x250_V1', value: 50000 },
          { label: 'Video_15s_Promo', value: 25000 }
        ];
      }
    }
  }

  protected renderTemplate(): string {
    if (!this._summary) return '';

    if (this._tileKey === 'day') {
      return html`
        <div class="chart-area"><chart-widget></chart-widget></div>
        <data-table></data-table>
      `;
    }

    if (this._tileKey === 'exchange') {
      const filters = this.allowedExchanges.map(e => html`
        <label class="filter-label">
          <input type="checkbox" data-filter-key="exchange" value="${e}" ${!this.excludedExchanges.has(e) ? 'checked' : ''}>
          ${e}
        </label>
      `).join('');
      return html`
        <div class="filters">${SafeHtmlString.trusted(filters)}</div>
        <div class="chart-area"><chart-widget></chart-widget></div>
        <data-table></data-table>
      `;
    }

    if (this._tileKey === 'os') {
      const filters = this.osData.map(os => html`
        <label class="filter-label">
          <input type="checkbox" data-filter-key="os" value="${os.label}" ${!this.excludedOs.has(os.label) ? 'checked' : ''}>
          <span style="color: ${!this.excludedOs.has(os.label) ? 'inherit' : 'var(--color-text-muted)'};">${os.label}</span>
        </label>
      `).join('');
      return html`
        <div class="filters">${SafeHtmlString.trusted(filters)}</div>
        <div class="chart-area"><chart-widget></chart-widget></div>
      `;
    }

    if (this._tileKey === 'campaign' || this._tileKey === 'creative') {
      return html`
        <div class="chart-area"><chart-widget></chart-widget></div>
        <data-table></data-table>
      `;
    }

    return '';
  }
}

ComponentRegistry.register('report-breakdown', ReportBreakdownElement);
export { ReportBreakdownElement };
