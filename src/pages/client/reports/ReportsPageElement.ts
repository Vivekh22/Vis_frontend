/**
 * ReportsPageElement.ts — pages/client/reports/
 *
 * Report type selector, filters, live preview, CSV/Excel export,
 * schedule report, save as template, report history.
 *
 * CSV/EXCEL EXPORT TRADEOFF (DOCUMENTED):
 *   CSV export uses a hand-written, dependency-free CSV generator
 *   (utils/csvExport.ts) with RFC 4180 quoting. "Excel" export uses the
 *   same CSV content with an .xls extension and application/vnd.ms-excel
 *   MIME type — a well-known browser trick. This is an interim approach
 *   dictated by the no-new-dependency principle; real .xlsx generation
 *   requires an Excel-writing library (ExcelJS/SheetJS) and should move
 *   server-side when the backend is built.
 */
import { BaseComponent } from '../../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString } from '../../../platform/rendering/SafeHtml';
import { reportService } from '../../../services';
import { exportToCsv, exportToExcel } from '../../../utils/csvExport';

const REPORT_TYPES = [
  { value: 'performance', label: 'Performance' },
  { value: 'campaign', label: 'Campaign' },
  { value: 'creative', label: 'Creative' },
  { value: 'geo', label: 'Country/Geo' },
  { value: 'device', label: 'Device/OS' },
  { value: 'exchange', label: 'Exchange/Publisher' },
  { value: 'billing', label: 'Fund/Billing' },
  { value: 'custom', label: 'Custom' },
];

const STYLES = `
  :host { display: block; font-family: var(--font-body); }
  .page-title { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); color: var(--color-text-primary); margin: 0 0 var(--space-6); }
  .report-grid { display: grid; grid-template-columns: 300px 1fr; gap: var(--space-6); }
  @media (max-width: 768px) { .report-grid { grid-template-columns: 1fr; } }
  .filters-panel { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: var(--space-4); }
  .preview-panel { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: var(--space-4); }
  .form-group { margin-bottom: var(--space-3); }
  .form-label { font-size: var(--font-size-xs); color: var(--color-text-muted); display: block; margin-bottom: var(--space-1); }
  .form-input, .form-select { width: 100%; padding: var(--space-2); border: 1px solid var(--color-border); border-radius: var(--radius-sm); font-size: var(--font-size-sm); background: var(--color-bg); color: var(--color-text-primary); }
  .btn { padding: var(--space-2) var(--space-3); border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-bg); cursor: pointer; font-size: var(--font-size-sm); font-family: var(--font-body); color: var(--color-text-primary); }
  .btn.primary { background: var(--color-primary); color: var(--color-primary-foreground); border: none; font-weight: var(--font-weight-semibold); }
  .btn-row { display: flex; gap: var(--space-2); flex-wrap: wrap; margin-top: var(--space-3); }
  .preview-table { width: 100%; border-collapse: collapse; margin-top: var(--space-3); }
  .preview-table th, .preview-table td { text-align: left; padding: var(--space-2); border-bottom: 1px solid var(--color-border); font-size: var(--font-size-sm); }
  .preview-table th { font-weight: var(--font-weight-semibold); color: var(--color-text-muted); text-transform: uppercase; font-size: var(--font-size-xs); }
  .history-section { margin-top: var(--space-6); }
  .history-table { width: 100%; border-collapse: collapse; }
  .history-table th, .history-table td { text-align: left; padding: var(--space-2) var(--space-3); border-bottom: 1px solid var(--color-border); font-size: var(--font-size-sm); }
  .history-table th { font-weight: var(--font-weight-semibold); color: var(--color-text-muted); text-transform: uppercase; font-size: var(--font-size-xs); }
  .checkbox-row { display: flex; align-items: center; gap: var(--space-2); }
  .checkbox-row input { margin: 0; }
  .section-title { font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold); color: var(--color-text-primary); margin: 0 0 var(--space-3); }
`;

class ReportsPageElement extends BaseComponent {
  private selectedReportType = 'performance';
  private startDate = '';
  private endDate = '';
  private selectedMetric = 'impressions';
  private selectedGrouping = 'day';
  private compareEnabled = false;
  private previewData: { headers: string[]; rows: string[][] } = { headers: [], rows: [] };
  private reportHistory: { id: string; type: string; generatedAt: Date }[] = [];
  private isLoading = false;
  private crossClientMode = false;
  private clientFilter = '';

  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
  }

  protected onMount(): void {
    this.crossClientMode = this.hasAttribute('cross-client-mode');
    this.shadow.addEventListener('click', this.handleClick);
    this.shadow.addEventListener('change', this.handleChange);
    void this.loadHistory();
  }

  protected onUnmount(): void {
    this.shadow.removeEventListener('click', this.handleClick);
    this.shadow.removeEventListener('change', this.handleChange);
  }

  private async loadHistory(): Promise<void> {
    try {
      const history = await reportService.getReportHistory();
      this.reportHistory = history.map((r) => ({ id: r.id, type: r.type, generatedAt: r.generatedAt }));
    } catch {
      // Use defaults
    }
    this.rerender();
  }

  private handleClick = (event: Event): void => {
    const target = event.target as HTMLElement;
    if (target.closest('[data-action="generate"]')) {
      void this.generatePreview();
      return;
    }
    if (target.closest('[data-action="export-csv"]')) {
      this.exportCsv();
      return;
    }
    if (target.closest('[data-action="export-excel"]')) {
      this.exportExcel();
      return;
    }
    if (target.closest('[data-action="schedule"]')) {
      void this.scheduleReport();
      return;
    }
    if (target.closest('[data-action="save-template"]')) {
      this.saveTemplate();
      return;
    }
  };

  private handleChange = (event: Event): void => {
    const target = event.target as HTMLInputElement | HTMLSelectElement;
    if (target.getAttribute('data-filter') === 'client') {
      this.clientFilter = target.value;
      return;
    }
    if (target.name === 'report-type') this.selectedReportType = target.value;
    if (target.name === 'start-date') this.startDate = target.value;
    if (target.name === 'end-date') this.endDate = target.value;
    if (target.name === 'campaign') { /* campaign filter not stored separately */ }
    if (target.name === 'metric') this.selectedMetric = target.value;
    if (target.name === 'grouping') this.selectedGrouping = target.value;
    if (target.name === 'compare') {
      const checkbox = event.target as HTMLInputElement;
      this.compareEnabled = checkbox.checked;
    }
  };

  private async generatePreview(): Promise<void> {
    this.isLoading = true;
    this.rerender();
    try {
      const report = await reportService.generateReport(this.selectedReportType, {
        clientId: this.crossClientMode ? this.clientFilter || undefined : 'client-1',
        startDate: this.startDate ? new Date(this.startDate) : undefined,
        endDate: this.endDate ? new Date(this.endDate) : undefined,
      });
      // Build preview from report data
      const data = report.data as { entries?: { action: string; actorName: string; timestamp: string }[] };
      const entries = data?.entries ?? [];
      this.previewData = {
        headers: ['Date', 'Action', 'User'],
        rows: entries.map((e) => [new Date(e.timestamp).toLocaleDateString(), e.action, e.actorName]),
      };
    } catch {
      this.previewData = { headers: ['Date', 'Metric', 'Value'], rows: [['—', '—', '—']] };
    }
    this.isLoading = false;
    this.rerender();
  }

  private exportCsv(): void {
    if (this.previewData.rows.length === 0) return;
    exportToCsv(`report_${this.selectedReportType}_${Date.now()}`, this.previewData.headers, this.previewData.rows);
  }

  private exportExcel(): void {
    if (this.previewData.rows.length === 0) return;
    exportToExcel(`report_${this.selectedReportType}_${Date.now()}`, this.previewData.headers, this.previewData.rows);
  }

  private async scheduleReport(): Promise<void> {
    await reportService.scheduleReport({
      type: this.selectedReportType,
      frequency: 'weekly',
      filters: { clientId: 'client-1' },
    });
  }

  private saveTemplate(): void {
    // Mock: save current configuration as a template
  }

  private renderReportTypes(): string {
    return REPORT_TYPES.map((t) => `<option value="${t.value}" ${this.selectedReportType === t.value ? 'selected' : ''}>${t.label}</option>`).join('');
  }

  private renderPreviewTable(): string {
    if (this.previewData.rows.length === 0) {
      return '<p style="color:var(--color-text-muted);font-size:var(--font-size-sm);">Click "Generate Preview" to load data.</p>';
    }
    const headerCells = this.previewData.headers.map((h) => `<th>${h}</th>`).join('');
    const dataRows = this.previewData.rows.map((row) => `<tr>${row.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('');
    return `<table class="preview-table"><thead><tr>${headerCells}</tr></thead><tbody>${dataRows}</tbody></table>`;
  }

  private renderHistoryRows(): string {
    if (this.reportHistory.length === 0) {
      return '<tr><td colspan="4" style="text-align:center;color:var(--color-text-muted);">No reports generated yet</td></tr>';
    }
    return this.reportHistory.map((r) => `
      <tr><td>${r.id}</td><td>${r.type}</td><td>${r.generatedAt.toLocaleDateString()}</td><td>${r.generatedAt.toLocaleTimeString()}</td></tr>
    `).join('');
  }

  protected renderTemplate(): string {
    return html`
      <h1 class="page-title">Reports</h1>
      <div class="report-grid">
        <div class="filters-panel">
          <p class="section-title">Filters</p>
          <div class="form-group">
            <label class="form-label">Report Type</label>
            <select class="form-select" name="report-type">${SafeHtmlString.trusted(this.renderReportTypes())}</select>
          </div>
          <div class="form-group">
            <label class="form-label">Start Date</label>
            <input class="form-input" type="date" name="start-date" value="${this.startDate}" />
          </div>
          <div class="form-group">
            <label class="form-label">End Date</label>
            <input class="form-input" type="date" name="end-date" value="${this.endDate}" />
          </div>
          ${this.crossClientMode ? SafeHtmlString.trusted('<div class="form-group"><label class="form-label">Client</label><select class="form-select" data-filter="client"><option value="">All Clients</option><option value="client-1">client-1</option><option value="client-2">client-2</option><option value="client-3">client-3</option></select></div>') : ''}
          <div class="form-group">
            <label class="form-label">Campaign</label>
            <select class="form-select" name="campaign"><option value="">All Campaigns</option></select>
          </div>
          <div class="form-group">
            <label class="form-label">Metric</label>
            <select class="form-select" name="metric">
              <option value="impressions" ${this.selectedMetric === 'impressions' ? 'selected' : ''}>Impressions</option>
              <option value="clicks" ${this.selectedMetric === 'clicks' ? 'selected' : ''}>Clicks</option>
              <option value="conversions" ${this.selectedMetric === 'conversions' ? 'selected' : ''}>Conversions</option>
              <option value="spend" ${this.selectedMetric === 'spend' ? 'selected' : ''}>Spend</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Grouping</label>
            <select class="form-select" name="grouping">
              <option value="day" ${this.selectedGrouping === 'day' ? 'selected' : ''}>Day</option>
              <option value="week" ${this.selectedGrouping === 'week' ? 'selected' : ''}>Week</option>
              <option value="month" ${this.selectedGrouping === 'month' ? 'selected' : ''}>Month</option>
            </select>
          </div>
          <div class="form-group checkbox-row">
            <input type="checkbox" name="compare" id="compare" ${this.compareEnabled ? 'checked' : ''} />
            <label for="compare" style="font-size:var(--font-size-sm);">Compare to previous period</label>
          </div>
          <button class="btn primary" data-action="generate" type="button" style="width:100%;">${this.isLoading ? 'Loading...' : 'Generate Preview'}</button>
        </div>
        <div class="preview-panel">
          <p class="section-title">Live Preview</p>
          ${SafeHtmlString.trusted(this.renderPreviewTable())}
          <div class="btn-row">
            <button class="btn" data-action="export-csv" type="button">Export CSV</button>
            <button class="btn" data-action="export-excel" type="button">Export Excel</button>
            <button class="btn" data-action="schedule" type="button">Schedule Report</button>
            <button class="btn" data-action="save-template" type="button">Save as Template</button>
          </div>
        </div>
      </div>
      <div class="history-section">
        <p class="section-title">Report History</p>
        <table class="history-table">
          <thead><tr><th>Report ID</th><th>Type</th><th>Date</th><th>Time</th></tr></thead>
          <tbody>${SafeHtmlString.trusted(this.renderHistoryRows())}</tbody>
        </table>
      </div>
    `;
  }
}

ComponentRegistry.register('reports-page', ReportsPageElement);
export { ReportsPageElement };