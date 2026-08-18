/**
 * CampaignListPageElement.ts — pages/client/campaign/
 *
 * Full campaign list view with:
 *   - Two tabs: Running / Pending Approval, each with row-count badge
 *   - DataTableElement with spec columns (14 columns)
 *   - Row checkboxes for bulk Pause/Resume/Archive
 *   - Row-level Duplicate action
 *   - Client-side search/filter (acceptable for bounded single-client dataset,
 *     unlike Admin's cross-client tables — same decision as ApprovalQueueElement
 *     in Part 2)
 *   - "+ Create Campaign" button → routes to campaign wizard
 */
import { BaseComponent } from '../../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString } from '../../../platform/rendering/SafeHtml';
import { campaignService } from '../../../services';
import type { BulkUpdateResult } from '../../../services/CampaignService';
import { CampaignStatus } from '../../../core/enums/CampaignStatus';
import type { Campaign } from '../../../core/entities/Campaign';
import { navigate } from '../../../utils/navigate';
import '../../../components/loading-state/LoadingStateElement';


interface DataTableHost extends HTMLElement {
  columns: { key: string; label: string; sortable: boolean; render?: (row: Record<string, unknown>) => string }[];
  rows: Record<string, unknown>[];
  totalItems: number;
  pageSize: number;
}

const STYLES = `
  :host { display: block; font-family: var(--font-body); }
  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-6);
  }
  .page-title {
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    margin: 0;
  }
  .create-btn {
    padding: var(--space-2) var(--space-4);
    background: var(--color-primary);
    color: var(--color-primary-foreground);
    border: none;
    border-radius: var(--radius-md);
    cursor: pointer;
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
  }
  .tabs {
    display: flex;
    gap: var(--space-1);
    margin-bottom: var(--space-4);
    border-bottom: 1px solid var(--color-border);
  }
  .tab {
    padding: var(--space-2) var(--space-4);
    background: none;
    border: none;
    cursor: pointer;
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-muted);
    border-bottom: 2px solid transparent;
  }
  .tab.active {
    color: var(--color-primary);
    border-bottom-color: var(--color-primary);
  }
  .tab-badge {
    display: inline-block;
    margin-left: var(--space-1);
    padding: 0 var(--space-2);
    background: var(--color-surface-2);
    border-radius: var(--radius-full);
    font-size: var(--font-size-xs);
  }
  .tab.active .tab-badge {
    background: var(--color-primary);
    color: var(--color-primary-foreground);
  }
  .search-bar {
    margin-bottom: var(--space-3);
  }
  .search-input {
    width: 100%;
    max-width: 400px;
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    font-size: var(--font-size-sm);
    font-family: var(--font-body);
  }
  .bulk-actions {
    display: flex;
    gap: var(--space-2);
    margin-bottom: var(--space-3);
  }
  .bulk-btn {
    padding: var(--space-1) var(--space-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-bg);
    cursor: pointer;
    font-size: var(--font-size-xs);
    font-family: var(--font-body);
  }
  .bulk-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .table-container {
    background: var(--color-glass-surface);
    border: 1px solid var(--color-glass-border);
    border-radius: var(--radius-md);
    padding: var(--space-4);
    box-shadow: var(--shadow-glass);
    backdrop-filter: var(--blur-surface);
    -webkit-backdrop-filter: var(--blur-surface);
  }
  .checkbox-col { width: 32px; text-align: center; }
  .action-btn {
    background: none;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: var(--space-1) var(--space-2);
    cursor: pointer;
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
  }
  .action-btn:hover { background: var(--color-surface-2); }
  .partial-fail-notice {
    background: #fef3c7;
    border: 1px solid #f59e0b;
    border-radius: var(--radius-md);
    padding: var(--space-2) var(--space-3);
    font-size: var(--font-size-xs);
    color: #92400e;
    margin-bottom: var(--space-3);
  }
  
  .status-cell {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }
  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--color-text-muted);
  }
  .status-dot.running {
    background: var(--color-success);
    animation: pulse-dot 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
  @media (prefers-reduced-motion: reduce) {
    .status-dot.running {
      animation: none;
    }
  }
  @keyframes pulse-dot {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  
  .sparkline-svg {
    width: 60px;
    height: 20px;
    display: block;
    overflow: visible;
  }
  .sparkline-path {
    fill: none;
    stroke: var(--color-primary);
    stroke-width: 1.5;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
`;

const COLUMNS: { key: string; label: string }[] = [
  { key: 'id', label: 'Campaign ID' },
  { key: 'name', label: 'Name' },
  { key: 'optionName', label: 'Option Name' },
  { key: 'targetBid', label: 'Target Bid' },
  { key: 'dayBudget', label: 'Day Budget' },
  { key: 'totalBudget', label: 'Total Budget' },
  { key: 'impressions', label: 'Impressions' },
  { key: 'bids', label: 'Bids' },
  { key: 'clicks', label: 'Clicks' },
  { key: 'installs', label: 'Installs' },
  { key: 'spend', label: 'Spend' },
  { key: 'revenue', label: 'Revenue' },
  { key: 'roas', label: 'ROAS' },
  { key: 'clearRate', label: 'Clear Rate' },
];

type TabKey = 'running' | 'pending';

class CampaignListPageElement extends BaseComponent {
  private activeTab: TabKey = 'running';
  private allCampaigns: Campaign[] = [];
  private runningCampaigns: Campaign[] = [];
  private pendingCampaigns: Campaign[] = [];
  private filteredCampaigns: Campaign[] = [];
  private selectedIds: Set<string> = new Set();
  private searchTerm = '';
  private bulkResult: BulkUpdateResult | null = null;
  private isLoading = true;
  private crossClientMode = false;
  private clientFilter = '';

  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
  }

  private handleSearchChanged = (event: Event): void => {
    const detail = (event as CustomEvent<{ value: string }>).detail;
    this.searchTerm = detail.value;
    this.applyFilter();
    this.syncTable();
  };

  private handleAddClicked = (): void => {
    navigate('/client/campaigns/new');
  };

  private handleRowAction = (event: Event): void => {
    const detail = (event as CustomEvent<{ actionId: string; row: Record<string, unknown> }>).detail;
    const campaignId = String(detail.row['id']);
    
    if (detail.actionId === 'duplicate') {
      void this.handleDuplicate(campaignId);
    } else if (detail.actionId === 'approve') {
      void campaignService.bulkUpdateStatus([campaignId], 'resume').then(() => this.loadCampaigns());
    } else if (detail.actionId === 'reject') {
      void campaignService.bulkUpdateStatus([campaignId], 'pause').then(() => this.loadCampaigns());
    }
  };

  protected onMount(): void {
    this.crossClientMode = this.hasAttribute('cross-client-mode');
    this.shadow.addEventListener('click', this.handleClick);
    this.shadow.addEventListener('change', this.handleChange);
    this.shadow.addEventListener('input', this.handleInput);
    this.shadow.addEventListener('search-changed', this.handleSearchChanged);
    this.shadow.addEventListener('add-clicked', this.handleAddClicked);
    this.shadow.addEventListener('row-action', this.handleRowAction);
    void this.loadCampaigns();
  }

  protected onUnmount(): void {
    this.shadow.removeEventListener('click', this.handleClick);
    this.shadow.removeEventListener('change', this.handleChange);
    this.shadow.removeEventListener('input', this.handleInput);
    this.shadow.removeEventListener('search-changed', this.handleSearchChanged);
    this.shadow.removeEventListener('add-clicked', this.handleAddClicked);
    this.shadow.removeEventListener('row-action', this.handleRowAction);
  }

  private async loadCampaigns(): Promise<void> {
    this.isLoading = true;
    this.rerender();
    try {
      this.allCampaigns = await campaignService.listCampaigns();
    } catch {
      this.allCampaigns = [];
    }
    this.runningCampaigns = this.allCampaigns.filter((c) => c.status === CampaignStatus.Running);
    this.pendingCampaigns = this.allCampaigns.filter((c) => c.status === CampaignStatus.PendingApproval);
    this.applyFilter();
    this.isLoading = false;
    this.rerender();
    this.syncTable();
  }

  private applyFilter(): void {
    const source = this.activeTab === 'running' ? this.runningCampaigns : this.pendingCampaigns;
    let results = source;
    if (this.crossClientMode && this.clientFilter) {
      results = results.filter((c) => c.clientId === this.clientFilter);
    }
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      results = results.filter(
        (c) => c.name.toLowerCase().includes(term) || c.id.toLowerCase().includes(term),
      );
    }
    this.filteredCampaigns = results;
  }

  private handleClick = (event: Event): void => {
    const target = event.target as HTMLElement;

    const tab = target.closest('[data-tab]');
    if (tab) {
      this.activeTab = tab.getAttribute('data-tab') as TabKey;
      this.selectedIds.clear();
      this.applyFilter();
      this.rerender();
      this.syncTable();
      return;
    }

    const bulkBtn = target.closest('[data-bulk-action]');
    if (bulkBtn) {
      const action = bulkBtn.getAttribute('data-bulk-action');
      if (action) {
        void this.handleBulkAction(action as 'pause' | 'resume' | 'archive');
      }
    }
  };

  private handleChange = (event: Event): void => {
    const target = event.target as HTMLElement;
    const rowCheckbox = target.closest('[data-row-checkbox]');
    if (rowCheckbox) {
      const id = rowCheckbox.getAttribute('data-campaign-id');
      const checked = (target as HTMLInputElement).checked;
      if (id) {
        if (checked) this.selectedIds.add(id);
        else this.selectedIds.delete(id);
      }
      this.rerender(); // Rerender to show/hide bulk actions in the filter slot
      this.syncTable(); // Re-sync table state
    }
  };

  private handleInput = (event: Event): void => {
    const target = event.target as HTMLElement;
    if (target.getAttribute('data-filter') === 'client') {
      this.clientFilter = (target as HTMLSelectElement).value;
      this.applyFilter();
      this.rerender();
      this.syncTable();
      return;
    }
  };

  private async handleDuplicate(campaignId: string): Promise<void> {
    await campaignService.duplicateCampaign(campaignId);
    await this.loadCampaigns();
  }

  private async handleBulkAction(action: 'pause' | 'resume' | 'archive'): Promise<void> {
    const ids = Array.from(this.selectedIds);
    this.bulkResult = await campaignService.bulkUpdateStatus(ids, action);
    this.selectedIds.clear();
    await this.loadCampaigns();
  }

  private buildTableRows(): Record<string, unknown>[] {
    return this.filteredCampaigns.map((c, idx) => {
      // Generate some dummy trend data for the sparkline (7 data points)
      const trend = [
        100 + Math.random() * 50,
        110 + Math.random() * 50,
        105 + Math.random() * 50,
        120 + Math.random() * 50,
        115 + Math.random() * 50,
        130 + Math.random() * 50,
        125 + Math.random() * 50,
      ];
      
      const base: Record<string, unknown> = {
        id: c.id,
        name: c.name,
        status: c.status,
        trend,
        optionName: '—',
        targetBid: '$1.50',
        dayBudget: '$100',
        totalBudget: c.getBudget().toDisplayString(),
        impressions: (1200 + idx * 150).toLocaleString(),
        bids: (800 + idx * 100).toLocaleString(),
        clicks: (340 + idx * 20).toLocaleString(),
        installs: (87 + idx * 3).toLocaleString(),
        spend: '$' + (1200 + idx * 50).toLocaleString(),
        revenue: '$' + (3400 + idx * 80).toLocaleString(),
        roas: (2.8 + idx * 0.1).toFixed(2),
        clearRate: (42 + idx).toFixed(1) + '%',
      };
      if (this.crossClientMode) {
        base['client'] = c.clientId;
      }
      return base;
    });
  }

  private generateSparkline(data: number[]): string {
    if (!data || data.length === 0) return '';
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const width = 60;
    const height = 20;
    
    const stepX = width / (data.length - 1);
    const points = data.map((val, i) => {
      const x = i * stepX;
      const y = height - ((val - min) / range) * height;
      return `${i === 0 ? 'M' : 'L'}${x},${y}`;
    }).join(' ');
    
    return `<svg class="sparkline-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none"><path class="sparkline-path" d="${points}"></path></svg>`;
  }

  private syncTable(): void {
    const table = this.shadow.querySelector<any>('data-table');
    if (!table) return;
    
    // Configure Table UI Properties
    table.showAddButton = true;
    table.addActionText = 'Create Campaign';
    table.searchPlaceholder = 'Search by name or ID...';
    
    // Configure Row Actions
    const actions = [
      { id: 'duplicate', label: 'Duplicate', icon: 'duplicate' }
    ];
    if (this.crossClientMode && this.activeTab === 'pending') {
      actions.push({ id: 'approve', label: 'Approve', icon: 'approve' });
      actions.push({ id: 'reject', label: 'Reject', icon: 'reject' });
    }
    table.rowActions = actions;

    const rows = this.buildTableRows();
    const cols = COLUMNS.map((c) => ({
      key: c.key,
      label: c.label,
      sortable: true,
      render: (row: Record<string, unknown>) => {
        if (c.key === 'name') {
          const status = row['status'] as string;
          const isRunning = status === CampaignStatus.Running;
          return `<div class="status-cell"><div class="status-dot ${isRunning ? 'running' : ''}" title="${status}"></div><span>${row[c.key]}</span></div>`;
        }
        const val = row[c.key];
        return String(val ?? '');
      },
    }));
    
    // Add Trend (Sparkline) column after Name
    cols.splice(2, 0, {
      key: 'trend',
      label: '7D Trend',
      sortable: false,
      render: (row: Record<string, unknown>) => this.generateSparkline(row['trend'] as number[]),
    });
    
    // Add Client column as first column in cross-client mode
    if (this.crossClientMode) {
      cols.unshift({ key: 'client', label: 'Client', sortable: true, render: (row: Record<string, unknown>) => String(row['client'] ?? '') });
    }
    // Add checkbox column as first column
    cols.unshift({
      key: '_select',
      label: '',
      sortable: false,
      render: (row: Record<string, unknown>) => {
        const id = String(row['id'] ?? '');
        const checked = this.selectedIds.has(id) ? 'checked' : '';
        return `<input type="checkbox" data-row-checkbox data-campaign-id="${id}" ${checked} />`;
      },
    });

    table.columns = cols;
    table.rows = rows;
    table.totalItems = rows.length;
    // Set page size for pagination to work
    table.pageSize = 10;
  }

  protected renderTemplate(): string {
    if (this.isLoading) {
      return html`<loading-state variant="skeleton" shape="table-rows"></loading-state>`;
    }

    const runningCount = this.runningCampaigns.length;
    const pendingCount = this.pendingCampaigns.length;

    return html`
      <div class="page-header">
        <h1 class="page-title">Campaigns</h1>
      </div>
      <div class="tabs">
        <button class="tab ${this.activeTab === 'running' ? 'active' : ''}" data-tab="running" type="button">
          Running <span class="tab-badge">${runningCount}</span>
        </button>
        <button class="tab ${this.activeTab === 'pending' ? 'active' : ''}" data-tab="pending" type="button">
          Pending Approval <span class="tab-badge">${pendingCount}</span>
        </button>
      </div>
      
      ${this.bulkResult && this.bulkResult.failed.length > 0 ? SafeHtmlString.trusted(this.renderPartialFailNotice()) : ''}
      
      <data-table>
        <div slot="filters" style="display: flex; gap: var(--space-2); align-items: center;">
          ${this.crossClientMode ? SafeHtmlString.trusted(this.renderClientFilter()) : ''}
          ${this.selectedIds.size > 0 ? SafeHtmlString.trusted(this.renderBulkActions()) : ''}
        </div>
      </data-table>
    `;
  }

  private renderClientFilter(): string {
    const clientIds = [...new Set(this.allCampaigns.map((c) => c.clientId))];
    const options = clientIds.map((id) => `<option value="${id}" ${this.clientFilter === id ? 'selected' : ''}>${id}</option>`).join('');
    return `<select class="search-input" style="max-width:200px;" data-filter="client"><option value="">All Clients</option>${options}</select>`;
  }

  private renderBulkActions(): string {
    const isRunning = this.activeTab === 'running';
    const actions = isRunning
      ? `<button class="bulk-btn" data-bulk-action="pause" type="button">Pause</button>`
      : '';
    return html`
      <div class="bulk-actions">
        ${actions}
        ${!isRunning ? SafeHtmlString.trusted('<button class="bulk-btn" data-bulk-action="resume" type="button">Resume</button>') : ''}
        <button class="bulk-btn" data-bulk-action="archive" type="button">Archive</button>
        <span style="font-size: var(--font-size-xs); color: var(--color-text-muted);">${this.selectedIds.size} selected</span>
      </div>
    `;
  }

  private renderPartialFailNotice(): string {
    if (!this.bulkResult) return '';
    const failedIds = this.bulkResult.failed.map((f) => f.id).join(', ');
    return html`<div class="partial-fail-notice">${this.bulkResult.failed.length} campaign(s) could not be updated: ${failedIds}</div>`;
  }
}

ComponentRegistry.register('campaign-list-page', CampaignListPageElement);
export { CampaignListPageElement };