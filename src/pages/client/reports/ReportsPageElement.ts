/**
 * ReportsPageElement.ts — pages/client/reports/
 *
 * Complete overhaul of the Reports page featuring a 3-step structured flow:
 * Step 1: Type Tiles (CSS Grid)
 * Step 2: Enhanced Filters (Presets, multi-select metrics/campaigns)
 * Step 3: Action Buttons & Live Preview
 * History Table
 */
import { BaseComponent } from '../../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString } from '../../../platform/rendering/SafeHtml';
import { reportService } from '../../../services';
import { exportToCsv, exportToExcel } from '../../../utils/csvExport';

const REPORT_TYPES = [
  { value: 'performance', label: 'Performance', icon: '📊' },
  { value: 'campaign', label: 'Campaign', icon: '📢' },
  { value: 'creative', label: 'Creative', icon: '🖼️' },
  { value: 'geo', label: 'Country/Geo', icon: '🌍' },
  { value: 'device', label: 'Device/OS', icon: '📱' },
  { value: 'exchange', label: 'Exchange/Publisher', icon: '🏢' },
  { value: 'billing', label: 'Fund/Billing', icon: '💳' },
  { value: 'custom', label: 'Custom', icon: '⚙️' },
];

const METRICS = [
  { value: 'impressions', label: 'Impressions' },
  { value: 'clicks', label: 'Clicks' },
  { value: 'conversions', label: 'Conversions' },
  { value: 'spend', label: 'Spend' },
  { value: 'ctr', label: 'CTR' },
  { value: 'cpc', label: 'CPC' },
  { value: 'cpm', label: 'CPM' },
  { value: 'cpa', label: 'CPA' },
  { value: 'roas', label: 'ROAS' },
  { value: 'viewability', label: 'Viewability Rate' },
  { value: 'bounce_rate', label: 'Bounce Rate' },
  { value: 'new_sessions', label: 'New Sessions' },
  { value: 'avg_duration', label: 'Avg. Session Duration' },
  { value: 'pages_session', label: 'Pages/Session' },
  { value: 'goal_completions', label: 'Goal Completions' },
  { value: 'unique_reach', label: 'Unique Reach' },
  { value: 'frequency', label: 'Frequency' },
  { value: 'video_completions', label: 'Video Completions' },
  { value: 'vtr', label: 'VTR (View-Through Rate)' },
];

const CAMPAIGNS = [
  { value: 'camp_1', label: 'Summer Sale 2026' },
  { value: 'camp_2', label: 'Retargeting - Q3' },
  { value: 'camp_3', label: 'Brand Awareness - US' },
  { value: 'camp_4', label: 'Holiday Special Promo' },
  { value: 'camp_5', label: 'App Install - Android' },
  { value: 'camp_6', label: 'App Install - iOS' },
  { value: 'camp_7', label: 'Video Ads - YouTube' },
  { value: 'camp_8', label: 'Display Network - APAC' },
  { value: 'camp_9', label: 'Display Network - EMEA' },
  { value: 'camp_10', label: 'Native Ads - Taboola' },
  { value: 'camp_11', label: 'Search - Branded Terms' },
  { value: 'camp_12', label: 'Search - Competitor Terms' },
  { value: 'camp_13', label: 'Shopping - Electronics' },
  { value: 'camp_14', label: 'Shopping - Apparel' },
  { value: 'camp_15', label: 'Remarketing - Cart Abandoners' },
];

const STYLES = `
  :host { 
    display: block; 
    font-family: var(--font-body); 
    padding-bottom: var(--space-8);
  }
  
  .page-title { 
    font-size: var(--font-size-2xl); 
    font-weight: 800; 
    letter-spacing: -0.02em;
    background: linear-gradient(90deg, var(--color-text-primary), var(--color-text-muted));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin: 0 0 var(--space-6); 
  }
  
  .step-container { margin-bottom: var(--space-6); }
  
  .step-header { 
    display: flex; 
    align-items: center; 
    gap: var(--space-3); 
    margin-bottom: var(--space-4); 
  }
  
  .step-number { 
    width: 28px; 
    height: 28px; 
    border-radius: 8px; 
    background: linear-gradient(135deg, var(--color-primary), #3b82f6); 
    color: white; 
    display: flex; 
    align-items: center; 
    justify-content: center; 
    font-weight: bold; 
    font-size: var(--font-size-sm); 
    box-shadow: 0 4px 10px rgba(59, 130, 246, 0.3);
  }
  
  .step-title { 
    font-size: var(--font-size-lg); 
    font-weight: 700; 
    color: var(--color-text-primary); 
    margin: 0; 
    letter-spacing: -0.01em;
  }
  
  /* Step 1: Tiles */
  .type-grid { 
    display: grid; 
    grid-template-columns: repeat(8, 1fr); 
    gap: var(--space-4); 
  }
  
  .type-tile {
    background: linear-gradient(145deg, var(--color-surface), rgba(255,255,255,0.02));
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: var(--space-3) var(--space-2);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-2);
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 2px 5px rgba(0,0,0,0.02);
  }
  
  .type-tile:hover { 
    border-color: rgba(59, 130, 246, 0.5); 
    transform: translateY(-4px); 
    box-shadow: 0 12px 20px -10px rgba(59, 130, 246, 0.2);
  }
  
  .type-tile.active { 
    border-color: var(--color-primary); 
    background: linear-gradient(145deg, rgba(59, 130, 246, 0.05), transparent);
    box-shadow: 0 0 0 1px var(--color-primary), 0 10px 20px -5px rgba(59, 130, 246, 0.15); 
  }
  
  .tile-icon { font-size: 20px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1)); }
  .tile-label { font-size: 11px; font-weight: 600; text-align: center; color: var(--color-text-primary); }
  
  /* Step 2 & 3 Layout */
  .layout-row { 
    display: flex; 
    flex-direction: column; 
    gap: var(--space-6); 
  }
  @media (max-width: 1024px) { .layout-row { grid-template-columns: 1fr; } }
  
  /* Shared Glassmorphic Cards */
  .filters-card, .preview-card { 
    background: linear-gradient(180deg, var(--color-surface), rgba(255,255,255,0.01));
    border: 1px solid var(--color-border); 
    border-radius: var(--radius-xl); 
    padding: var(--space-6); 
    box-shadow: 0 4px 20px -2px rgba(0,0,0,0.03);
    backdrop-filter: blur(10px);
  }
  
  
  /* Collapsible Filters */
  .filters-content {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--space-6);
    align-items: start;
  }
  @media (max-width: 1024px) { .filters-content { grid-template-columns: 1fr 1fr; } }
  .preview-column { width: 100%; overflow-x: auto; }

  
  .custom-dropdown { position: relative; width: 100%; }
  .custom-dropdown-toggle {
    width: 100%;
    padding: var(--space-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-bg);
    text-align: left;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    font-size: var(--font-size-sm);
    color: var(--color-text-primary);
    transition: all 0.2s;
  }
  .custom-dropdown-toggle:hover { border-color: var(--color-primary); }
  .custom-dropdown-menu {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    margin-top: 4px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);
    max-height: 250px;
    overflow-y: auto;
    z-index: 100;
    padding: var(--space-2);
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  /* Filters */
  .form-group { margin-bottom: var(--space-5); }
  .form-label { 
    font-size: 11px; 
    font-weight: 700; 
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted); 
    display: block; 
    margin-bottom: var(--space-2); 
  }
  
  .preset-row { display: flex; gap: var(--space-2); margin-bottom: var(--space-3); }
  
  .preset-btn { 
    flex: 1; 
    padding: var(--space-2); 
    border: 1px solid var(--color-border); 
    border-radius: var(--radius-md); 
    background: var(--color-bg); 
    font-size: var(--font-size-xs); 
    font-weight: 600; 
    cursor: pointer; 
    transition: all 0.2s;
  }
  
  .preset-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }
  .preset-btn.active { 
    background: var(--color-primary); 
    color: white; 
    border-color: var(--color-primary); 
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
  }
  
  .date-row { display: flex; gap: var(--space-3); }
  .date-row input { flex: 1; }
  
  .form-input, .form-select { 
    width: 100%; 
    padding: var(--space-3); 
    border: 1px solid var(--color-border); 
    border-radius: var(--radius-md); 
    font-size: var(--font-size-sm); 
    background: var(--color-bg); 
    color: var(--color-text-primary); 
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .form-input:focus, .form-select:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  .checklist { 
    display: flex; 
    flex-direction: column; 
    gap: var(--space-2); 
  }
  
  .checkbox-row { 
    display: flex; 
    align-items: center; 
    gap: var(--space-3); 
    font-size: var(--font-size-sm); 
    cursor: pointer; 
    padding: var(--space-2);
    border-radius: var(--radius-sm);
    transition: background 0.2s;
  }
  .checkbox-row:hover { background: var(--color-surface-2); }
  .checkbox-row input { accent-color: var(--color-primary); width: 16px; height: 16px; margin: 0; cursor: pointer; }
  
  /* Preview & Actions */
  .preview-card { display: flex; flex-direction: column; height: 100%; }
  .action-bar { 
    display: flex; 
    flex-wrap: wrap; 
    gap: var(--space-3); 
    margin-bottom: var(--space-6); 
    padding-bottom: var(--space-5); 
    border-bottom: 1px solid var(--color-border); 
  }
  
  .btn { 
    padding: var(--space-2) var(--space-4); 
    border: 1px solid var(--color-border); 
    border-radius: var(--radius-lg); 
    background: var(--color-surface); 
    cursor: pointer; 
    font-size: var(--font-size-sm); 
    font-weight: 600; 
    color: var(--color-text-primary); 
    display: flex; 
    align-items: center; 
    gap: var(--space-2); 
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); 
  }
  
  .btn:hover { 
    background: var(--color-surface-2); 
    transform: translateY(-1px);
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
  }
  
  .btn.primary { 
    background: linear-gradient(135deg, var(--color-primary), #2563eb); 
    color: white; 
    border: none;
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
  }
  .btn.primary:hover { 
    box-shadow: 0 6px 16px rgba(37, 99, 235, 0.4);
    transform: translateY(-2px); 
  }
  
  .preview-wrapper { flex: 1; overflow-x: auto; padding-bottom: 16px; }
  /* PDF Preview Dashboard */
  .pdf-preview-container {
    background: #ffffff;
    border-radius: var(--radius-md);
    padding: var(--space-6);
    box-shadow: 0 4px 15px rgba(0,0,0,0.05);
    border: 1px solid var(--color-border);
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
    min-width: 800px;
  }
  .pdf-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 2px solid var(--color-border);
    padding-bottom: var(--space-4);
  }
  .pdf-logo {
    font-size: 24px;
    font-weight: 900;
    color: var(--color-text-primary);
    letter-spacing: -1px;
  }
  .pdf-logo span { color: var(--color-primary); }
  .pdf-title-container { text-align: right; }
  .pdf-title {
    font-size: 20px;
    font-weight: 700;
    color: var(--color-text-primary);
    margin: 0 0 4px 0;
  }
  .pdf-dates {
    font-size: 12px;
    color: var(--color-text-muted);
  }
  .pdf-charts-row {
    display: grid;
    grid-template-columns: 1.5fr 1fr;
    gap: var(--space-5);
  }
  .pdf-chart-box {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: var(--space-4);
    background: #fafafa;
  }
  .pdf-chart-title {
    font-size: 14px;
    font-weight: 700;
    color: var(--color-text-primary);
    margin: 0 0 var(--space-4) 0;
  }
  .pdf-scorecards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: var(--space-4);
  }
  .pdf-scorecard {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: var(--space-4);
    background: #fafafa;
    text-align: center;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  .pdf-scorecard-label {
    font-size: 11px;
    color: var(--color-text-muted);
    text-transform: uppercase;
    font-weight: 600;
    margin-bottom: var(--space-2);
  }
  .pdf-scorecard-value {
    font-size: 20px;
    font-weight: 800;
    color: var(--color-text-primary);
  }
  .pdf-chart-svg {
    width: 100%;
    height: 180px;
  }

  .preview-table { width: 100%; border-collapse: collapse; }
  .preview-table th, .preview-table td { text-align: left; padding: var(--space-4); border-bottom: 1px solid var(--color-border); font-size: var(--font-size-sm); white-space: nowrap; }
  .preview-table th { 
    font-weight: 700; 
    color: var(--color-text-muted); 
    text-transform: uppercase; 
    font-size: 11px; 
    letter-spacing: 0.05em;
    background: var(--color-surface-2); 
  }
  .preview-table tr:hover td { background: rgba(0,0,0,0.02); }
  
  /* History */
  .history-section { margin-top: var(--space-10); }
  .history-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-4); }
  .history-table { 
    width: 100%; 
    border-collapse: collapse; 
    background: var(--color-surface); 
    border: 1px solid var(--color-border); 
    border-radius: var(--radius-xl); 
    overflow: hidden; 
    box-shadow: 0 4px 20px -2px rgba(0,0,0,0.03);
  }
  .history-table th, .history-table td { text-align: left; padding: var(--space-4); border-bottom: 1px solid var(--color-border); font-size: var(--font-size-sm); }
  .history-table th { 
    font-weight: 700; 
    color: var(--color-text-muted); 
    text-transform: uppercase; 
    font-size: 11px; 
    letter-spacing: 0.05em;
    background: var(--color-surface-2); 
  }
  .history-table tr:last-child td { border-bottom: none; }
  .history-table tr:hover td { background: rgba(0,0,0,0.02); }
  
  .action-link { 
    color: var(--color-primary); 
    text-decoration: none; 
    font-weight: 600; 
    cursor: pointer; 
    margin-right: var(--space-3); 
    transition: color 0.2s;
  }
  .action-link:hover { color: #2563eb; text-decoration: underline; }
`;

class ReportsPageElement extends BaseComponent {
  private selectedReportType = 'performance';
  
  private datePreset = '7d';
  private startDate = '';
  private endDate = '';
  
  private selectedCampaigns: string[] = ['camp_1', 'camp_2'];
  private selectedMetrics: string[] = ['impressions', 'clicks', 'conversions', 'spend'];
  private selectedGrouping = 'day';
  private compareEnabled = false;
  private campaignsDropdownOpen = false;
  private metricsDropdownOpen = false;
    
  private previewData: { headers: string[]; rows: string[][] } = { headers: [], rows: [] };
  private reportHistory: any[] = [];
  
  private debounceTimer: number | null = null;

  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
  }

  protected onMount(): void {
    this.shadow.addEventListener('click', this.handleClick);
    this.shadow.addEventListener('change', this.handleChange);
    this.shadow.addEventListener('input', this.handleInput);
    
    // Set initial custom dates based on preset
    this.updateDatesFromPreset();
    
    void this.loadHistory();
    this.updatePreview();
  }

  protected onUnmount(): void {
    this.shadow.removeEventListener('click', this.handleClick);
    this.shadow.removeEventListener('change', this.handleChange);
    this.shadow.removeEventListener('input', this.handleInput);
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
  }

  private async loadHistory(): Promise<void> {
    try {
      const history = await reportService.getReportHistory();
      this.reportHistory = history.map((r, i) => ({
        name: `Report ${r.type.toUpperCase()} - ${i+1}`,
        type: r.type,
        dateRange: 'Last 7 Days',
        generatedAt: r.generatedAt
      }));
    } catch {
      // Use defaults
    }
    this.rerender();
  }

  private handleClick = (event: Event): void => {
    const target = event.target as HTMLElement;
    
    


    
    // Dropdown Toggles
    if (target.closest('[data-action="toggle-campaigns"]')) {
      this.campaignsDropdownOpen = !this.campaignsDropdownOpen;
      this.metricsDropdownOpen = false;
      this.rerender();
      return;
    }
    if (target.closest('[data-action="toggle-metrics"]')) {
      this.metricsDropdownOpen = !this.metricsDropdownOpen;
      this.campaignsDropdownOpen = false;
      this.rerender();
      return;
    }
    
    // Close dropdowns when clicking outside
    if (!target.closest('.custom-dropdown') && (this.campaignsDropdownOpen || this.metricsDropdownOpen)) {
      this.campaignsDropdownOpen = false;
      this.metricsDropdownOpen = false;
      this.rerender();
      return;
    }

    // Type Tile
    const tile = target.closest('.type-tile');
    if (tile) {
      this.selectedReportType = tile.getAttribute('data-value') || 'performance';
      this.updatePreview();
      this.rerender();
      return;
    }
    
    // Date Preset
    const presetBtn = target.closest('.preset-btn');
    if (presetBtn) {
      this.datePreset = presetBtn.getAttribute('data-value') || 'custom';
      this.updateDatesFromPreset();
      this.updatePreview();
      this.rerender();
      return;
    }
    
    // Action Buttons
    if (target.closest('[data-action="export-pdf"]')) {
      alert('Generating PDF... (Mock)');
      return;
    }
    if (target.closest('[data-action="export-csv"]')) {
      this.exportCsv();
      return;
    }
    if (target.closest('[data-action="export-email"]')) {
      alert('Report scheduled to send via Email (Mock)');
      return;
    }
    if (target.closest('[data-action="schedule"]')) {
      void this.scheduleReport();
      return;
    }
    if (target.closest('[data-action="save-template"]')) {
      alert('Configuration saved as template (Mock)');
      return;
    }
  };

  private handleInput = (event: Event): void => {
    const target = event.target as HTMLInputElement;
    if (target.name === 'start-date' || target.name === 'end-date') {
      this.datePreset = 'custom';
      if (target.name === 'start-date') this.startDate = target.value;
      if (target.name === 'end-date') this.endDate = target.value;
      this.queuePreviewUpdate();
      this.rerender();
    }
  };

  private handleChange = (event: Event): void => {
    const target = event.target as HTMLInputElement | HTMLSelectElement;
    
    if (target.name === 'campaigns') {
      const val = target.value;
      const checked = (target as HTMLInputElement).checked;
      if (checked) this.selectedCampaigns.push(val);
      else this.selectedCampaigns = this.selectedCampaigns.filter(v => v !== val);
      this.queuePreviewUpdate();
    }
    
    if (target.name === 'metrics') {
      const val = target.value;
      const checked = (target as HTMLInputElement).checked;
      if (checked) this.selectedMetrics.push(val);
      else this.selectedMetrics = this.selectedMetrics.filter(v => v !== val);
      this.queuePreviewUpdate();
    }
    
    if (target.name === 'grouping') {
      this.selectedGrouping = target.value;
      this.queuePreviewUpdate();
    }
    
    if (target.name === 'compare') {
      this.compareEnabled = (target as HTMLInputElement).checked;
      this.queuePreviewUpdate();
    }
  };
  
  private updateDatesFromPreset() {
    const today = new Date();
    this.endDate = today.toISOString().split('T')[0]!;
    
    const start = new Date();
    if (this.datePreset === 'today') {
      // same as end date
    } else if (this.datePreset === '7d') {
      start.setDate(today.getDate() - 7);
    } else if (this.datePreset === '30d') {
      start.setDate(today.getDate() - 30);
    }
    this.startDate = start.toISOString().split('T')[0]!;
  }
  
  private queuePreviewUpdate() {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = window.setTimeout(() => {
      this.updatePreview();
      this.rerender();
    }, 300);
  }

  private updatePreview(): void {
    if (this.selectedMetrics.length === 0 || this.selectedCampaigns.length === 0) {
      this.previewData = { headers: ['Notice'], rows: [['Select at least one campaign and metric']] };
      return;
    }
    
    // Generate dynamic mock data based on selections
    const headers = [
      this.selectedGrouping === 'day' ? 'Date' : 'Period',
      'Campaign',
      ...this.selectedMetrics.map(m => m.charAt(0).toUpperCase() + m.slice(1))
    ];
    
    const rows: string[][] = [];
    // Generate 3 mock rows
    for (let i = 0; i < 3; i++) {
      const d = new Date(this.startDate);
      d.setDate(d.getDate() + i);
      const camp = CAMPAIGNS.find(c => c.value === this.selectedCampaigns[i % this.selectedCampaigns.length])?.label || 'Campaign';
      
      const row = [d.toLocaleDateString(), camp];
      
      for (const m of this.selectedMetrics) {
        if (m === 'impressions') row.push(Math.floor(Math.random() * 50000 + 10000).toLocaleString());
        else if (m === 'clicks') row.push(Math.floor(Math.random() * 1000 + 100).toLocaleString());
        else if (m === 'conversions') row.push(Math.floor(Math.random() * 50 + 5).toString());
        else if (m === 'spend') row.push('$' + (Math.random() * 500 + 100).toFixed(2));
        else if (m === 'ctr') row.push((Math.random() * 3 + 0.5).toFixed(2) + '%');
        else if (m === 'cpc') row.push('$' + (Math.random() * 2 + 0.2).toFixed(2));
        else row.push('-');
      }
      rows.push(row);
    }
    
    this.previewData = { headers, rows };
  }

  private exportCsv(): void {
    if (this.previewData.rows.length === 0) return;
    exportToCsv(`report_${this.selectedReportType}_${Date.now()}`, this.previewData.headers, this.previewData.rows);
  }

  private async scheduleReport(): Promise<void> {
    await reportService.scheduleReport({
      type: this.selectedReportType,
      frequency: 'weekly',
      filters: { clientId: 'client-1' },
    });
    alert('Report scheduled successfully (Mock)');
  }

  
  private renderSvgLineChart(): string {
    return `
      <svg class="pdf-chart-svg" viewBox="0 0 400 150" preserveAspectRatio="none">
        <path d="M0,120 Q20,110 40,120 T80,100 T120,130 T160,80 T200,90 T240,40 T280,60 T320,20 T360,40 T400,10" 
              fill="none" stroke="var(--color-primary)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M0,120 Q20,110 40,120 T80,100 T120,130 T160,80 T200,90 T240,40 T280,60 T320,20 T360,40 T400,10 L400,150 L0,150 Z" 
              fill="url(#grad1)" opacity="0.2"/>
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:var(--color-primary);stop-opacity:1" />
            <stop offset="100%" style="stop-color:var(--color-primary);stop-opacity:0" />
          </linearGradient>
        </defs>
        <line x1="0" y1="37.5" x2="400" y2="37.5" stroke="var(--color-border)" stroke-width="1" stroke-dasharray="4" />
        <line x1="0" y1="75" x2="400" y2="75" stroke="var(--color-border)" stroke-width="1" stroke-dasharray="4" />
        <line x1="0" y1="112.5" x2="400" y2="112.5" stroke="var(--color-border)" stroke-width="1" stroke-dasharray="4" />
      </svg>
    `;
  }

  private renderSvgDonutChart(): string {
    return `
      <div style="display:flex; align-items:center; gap: 16px; justify-content: center; height: 180px;">
        <svg style="width: 120px; height: 120px;" viewBox="0 0 36 36">
          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e2e8f0" stroke-width="4"/>
          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831" fill="none" stroke="var(--color-primary)" stroke-width="4" stroke-dasharray="40, 100"/>
          <path d="M18 33.9155 a 15.9155 15.9155 0 0 1 -15.9155 -15.9155" fill="none" stroke="#f59e0b" stroke-width="4" stroke-dasharray="25, 100"/>
          <path d="M2.0845 18 a 15.9155 15.9155 0 0 1 15.9155 -15.9155" fill="none" stroke="#10b981" stroke-width="4" stroke-dasharray="20, 100"/>
          <text x="18" y="20.5" font-size="6" text-anchor="middle" font-weight="bold" fill="var(--color-text-primary)">4,414</text>
        </svg>
        <div style="font-size: 11px; display: flex; flex-direction: column; gap: 8px;">
          <div style="display:flex; align-items:center; gap:6px;"><div style="width:8px;height:8px;border-radius:50%;background:var(--color-primary);"></div> Direct</div>
          <div style="display:flex; align-items:center; gap:6px;"><div style="width:8px;height:8px;border-radius:50%;background:#f59e0b;"></div> Organic Search</div>
          <div style="display:flex; align-items:center; gap:6px;"><div style="width:8px;height:8px;border-radius:50%;background:#10b981;"></div> Paid Search</div>
          <div style="display:flex; align-items:center; gap:6px;"><div style="width:8px;height:8px;border-radius:50%;background:#e2e8f0;"></div> Referral</div>
        </div>
      </div>
    `;
  }

  private renderScorecards(): string {
    return this.selectedMetrics.slice(0, 6).map(m => {
      const label = m.charAt(0).toUpperCase() + m.slice(1);
      let val = '';
      if (m === 'impressions') val = '41,965';
      else if (m === 'clicks') val = '2,787';
      else if (m === 'conversions') val = '778';
      else if (m === 'spend') val = '$4,250.00';
      else if (m === 'ctr') val = '6.64%';
      else if (m === 'cpc') val = '$1.52';
      else val = '0';
      
      return `
        <div class="pdf-scorecard">
          <div class="pdf-scorecard-label">${label}</div>
          <div class="pdf-scorecard-value">${val}</div>
        </div>
      `;
    }).join('');
  }

  protected renderTemplate(): string {
    return html`
      <h1 class="page-title">Reports</h1>
      
      <!-- STEP 1 -->
      <div class="step-container">
        <div class="step-header">
          <div class="step-number">1</div>
          <h2 class="step-title">Select Report Type</h2>
        </div>
        <div class="type-grid">
          ${SafeHtmlString.trusted(REPORT_TYPES.map(t => `
            <div class="type-tile ${this.selectedReportType === t.value ? 'active' : ''}" data-value="${t.value}">
              <div class="tile-icon">${t.icon}</div>
              <div class="tile-label">${t.label}</div>
            </div>
          `).join(''))}
        </div>
      </div>
      
      <div class="layout-row">
        <!-- STEP 2 -->
        <div class="filters-column" style="position: relative; z-index: 10;">
          <div class="step-container">
            <div class="step-header">
              <div class="step-number">2</div>
              <h2 class="step-title">Configure Filters</h2>
            </div>
            
            <div class="filters-card filters-content" style="position: relative; z-index: 10;">
              <div class="form-group">
                <label class="form-label">Date Range</label>
                <div class="preset-row">
                  <button class="preset-btn ${this.datePreset === 'today' ? 'active' : ''}" data-value="today" type="button">Today</button>
                  <button class="preset-btn ${this.datePreset === '7d' ? 'active' : ''}" data-value="7d" type="button">7 Days</button>
                  <button class="preset-btn ${this.datePreset === '30d' ? 'active' : ''}" data-value="30d" type="button">30 Days</button>
                </div>
                <div class="date-row">
                  <input class="form-input" type="date" name="start-date" value="${this.startDate}" />
                  <input class="form-input" type="date" name="end-date" value="${this.endDate}" />
                </div>
              </div>
              
              <div class="form-group">
                <label class="form-label">Campaigns</label>
                <div class="custom-dropdown">
                  <button class="custom-dropdown-toggle" type="button" data-action="toggle-campaigns">
                    ${this.selectedCampaigns.length} Selected
                    <span style="font-size: 10px;">${this.campaignsDropdownOpen ? '▲' : '▼'}</span>
                  </button>
                  ${this.campaignsDropdownOpen ? SafeHtmlString.trusted(`
                    <div class="custom-dropdown-menu">
                      ${CAMPAIGNS.map(c => `
                        <label class="checkbox-row" style="padding: 6px; border-radius: 4px;">
                          <input type="checkbox" name="campaigns" value="${c.value}" ${this.selectedCampaigns.includes(c.value) ? 'checked' : ''}>
                          ${c.label}
                        </label>
                      `).join('')}
                    </div>
                  `) : ''}
                </div>
              </div>
              
              <div class="form-group">
                <label class="form-label">Metrics</label>
                <div class="custom-dropdown">
                  <button class="custom-dropdown-toggle" type="button" data-action="toggle-metrics">
                    ${this.selectedMetrics.length} Selected
                    <span style="font-size: 10px;">${this.metricsDropdownOpen ? '▲' : '▼'}</span>
                  </button>
                  ${this.metricsDropdownOpen ? SafeHtmlString.trusted(`
                    <div class="custom-dropdown-menu">
                      ${METRICS.map(m => `
                        <label class="checkbox-row" style="padding: 6px; border-radius: 4px;">
                          <input type="checkbox" name="metrics" value="${m.value}" ${this.selectedMetrics.includes(m.value) ? 'checked' : ''}>
                          ${m.label}
                        </label>
                      `).join('')}
                    </div>
                  `) : ''}
                </div>
              </div>
              
              <div class="form-group">
                <label class="form-label">Grouping & Options</label>
                <select class="form-select" name="grouping" style="margin-bottom:var(--space-3);">
                  <option value="day" ${this.selectedGrouping === 'day' ? 'selected' : ''}>Day</option>
                  <option value="week" ${this.selectedGrouping === 'week' ? 'selected' : ''}>Week</option>
                  <option value="month" ${this.selectedGrouping === 'month' ? 'selected' : ''}>Month</option>
                </select>
                <label class="checkbox-row" style="font-weight: 600;">
                  <input type="checkbox" name="compare" ${this.compareEnabled ? 'checked' : ''} />
                  Compare to previous period
                </label>
              </div>
            </div>
          </div>
        </div>
        
        <!-- STEP 3 -->
        <div class="preview-column">
          <div class="step-container" style="height: 100%; display: flex; flex-direction: column;">
            <div class="step-header">
              <div class="step-number">3</div>
              <h2 class="step-title">Preview & Export</h2>
            </div>
            
            <div class="preview-card">
              <div class="action-bar">
                <button class="btn primary" data-action="export-pdf" type="button">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                  Download PDF
                </button>
                <button class="btn" data-action="export-csv" type="button">CSV</button>
                <button class="btn" data-action="export-email" type="button">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                  Send via Email
                </button>
                <div style="flex: 1;"></div>
                <button class="btn" data-action="schedule" type="button">Schedule this report</button>
                <button class="btn" data-action="save-template" type="button">Save as Template</button>
              </div>
              
              <div class="preview-wrapper">
                <div class="pdf-preview-container">
                  <div class="pdf-header">
                    <div class="pdf-logo">your <span>LOGO</span>™</div>
                    <div class="pdf-title-container">
                      <h3 class="pdf-title">${this.selectedReportType.charAt(0).toUpperCase() + this.selectedReportType.slice(1)} Report</h3>
                      <div class="pdf-dates">${new Date(this.startDate).toLocaleDateString()} to ${new Date(this.endDate).toLocaleDateString()}</div>
                    </div>
                  </div>
                  
                  <div class="pdf-charts-row">
                    <div class="pdf-chart-box">
                      <h4 class="pdf-chart-title">Trend Overview</h4>
                      ${SafeHtmlString.trusted(this.renderSvgLineChart())}
                    </div>
                    <div class="pdf-chart-box">
                      <h4 class="pdf-chart-title">Channel Breakdown</h4>
                      ${SafeHtmlString.trusted(this.renderSvgDonutChart())}
                    </div>
                  </div>
                  
                  <div class="pdf-scorecards">
                    ${SafeHtmlString.trusted(this.renderScorecards())}
                  </div>
                  
                  <div style="margin-top: 16px;">
                    <div style="font-size: 11px; color: var(--color-text-muted); margin-bottom: 8px;">Showing preview of ${this.previewData.rows.length} rows</div>
                    <table class="preview-table">
                      <thead>
                        <tr>
                          ${SafeHtmlString.trusted(this.previewData.headers.map(h => `<th>${h}</th>`).join(''))}
                        </tr>
                      </thead>
                      <tbody>
                        ${SafeHtmlString.trusted(this.previewData.rows.map(row => `
                          <tr>${row.map(c => `<td>${c}</td>`).join('')}</tr>
                        `).join(''))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- HISTORY -->
      <div class="history-section">
        <div class="step-header">
          <h2 class="step-title">Report History</h2>
        </div>
        <table class="history-table">
          <thead>
            <tr>
              <th>Report Name</th>
              <th>Type</th>
              <th>Date Range</th>
              <th>Generated On</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${this.reportHistory.length === 0 ? SafeHtmlString.trusted('<tr><td colspan="5" style="text-align:center; color:var(--color-text-muted);">No reports generated yet</td></tr>') : ''}
            ${SafeHtmlString.trusted(this.reportHistory.map(r => `
              <tr>
                <td style="font-weight: 600;">${r.name}</td>
                <td><span style="text-transform: capitalize;">${r.type}</span></td>
                <td>${r.dateRange}</td>
                <td>${r.generatedAt.toLocaleString()}</td>
                <td>
                  <a class="action-link" data-action="export-pdf">Re-download</a>
                  <a class="action-link" style="color: var(--color-text-primary);">Regenerate</a>
                </td>
              </tr>
            `).join(''))}
          </tbody>
        </table>
      </div>
    `;
  }
}

ComponentRegistry.register('reports-page', ReportsPageElement);
export { ReportsPageElement };