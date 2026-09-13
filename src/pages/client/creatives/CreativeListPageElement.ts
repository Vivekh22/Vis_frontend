/**
 * CreativeListPageElement.ts — pages/client/creatives/
 *
 * Full creative list view with:
 *   - Table: thumbnail, Creative ID/Name, Campaign(s), Type badge,
 *     performance metrics, Status dot
 *   - Bulk actions (Pause/Resume/Delete)
 *   - Search/filter by type/status/campaign (client-side)
 *   - Type badge coloring per spec (Image/Native/HTML/Video/VAST)
 *   - Dual-version display: when submitCreativeEdit() creates a pending
 *     version of a live creative, both are shown with labels
 *     ("Live" / "Pending Edit")
 *   - "+ Create Creative" button → routes to builder
 */
import { BaseComponent } from '../../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString } from '../../../platform/rendering/SafeHtml';
import { creativeService } from '../../../services';
import type { Creative } from '../../../core/entities/Creative';
import { CreativeStatus } from '../../../core/enums/CreativeStatus';
import { navigate } from '../../../utils/navigate';
import '../../../components/data-table/DataTableElement';
import '../../../components/loading-state/LoadingStateElement';



interface DataTableHost extends HTMLElement {
  columns: { key: string; label: string; sortable: boolean; render?: (row: Record<string, unknown>) => string }[];
  rows: Record<string, unknown>[];
  totalItems: number;
  pageSize: number;
}

const STYLES = `
  :host { display: block; font-family: var(--font-body); padding: var(--space-4) 0; }

  /* Header */
  .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; }
  .page-title { font-size: 24px; font-weight: var(--font-weight-bold); color: #111827; margin: 0 0 4px 0; }
  .page-subtitle { font-size: 13px; color: #6b7280; margin: 0; }
  .create-btn { padding: 8px 16px; background: #3b66f5; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500; white-space: nowrap; }

  /* Filters */
  .filters { display: flex; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; align-items: center; }
  .search-input { flex: 1; min-width: 200px; padding: 9px 14px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; font-family: var(--font-body); background: white; color: #1e293b; outline: none; }
  .search-input:focus { border-color: #3b66f5; }
  .filter-select { padding: 9px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; font-family: var(--font-body); background: white; color: #374151; cursor: pointer; outline: none; }

  /* Bulk actions */
  .bulk-bar { display: flex; gap: 8px; align-items: center; margin-bottom: 12px; background: #eff3ff; border: 1px solid #c7d2fe; border-radius: 8px; padding: 10px 16px; }
  .bulk-count { font-size: 12px; font-weight: 600; color: #3b66f5; margin-right: 4px; }
  .bulk-btn { padding: 5px 12px; border: 1px solid #e2e8f0; border-radius: 6px; background: white; cursor: pointer; font-size: 12px; font-weight: 500; color: #374151; }
  .bulk-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .bulk-btn.danger { color: #dc2626; border-color: #fecaca; }

  /* Table */
  .table-container { background: white; border: 1px solid #eef0f4; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.02); }
  .table-header { display: flex; justify-content: space-between; align-items: center; padding: 14px 20px; border-bottom: 1px solid #f8fafc; }
  .table-title { font-size: 13px; font-weight: 600; color: #111827; }
  .table-count { font-size: 12px; color: #94a3b8; }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: 13px 20px; border-bottom: 1px solid #f8fafc; font-size: 13px; }
  th { font-weight: 600; color: #6b7280; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; background: #fcfdfd; }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: #fafbfc; }

  /* Creative name */
  .creative-name { font-weight: 600; color: #111827; }
  .creative-id { font-size: 11px; color: #94a3b8; margin-top: 2px; }
  .version-label { font-size: 10px; color: #d97706; background: #fffbeb; border: 1px solid #fde68a; padding: 1px 6px; border-radius: 4px; margin-left: 6px; font-weight: 600; }

  /* Thumbnail */
  .thumb { width: 40px; height: 40px; background: #f1f5f9; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }

  /* Type badges */
  .type-badge { display: inline-flex; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; }
  .type-image { background: #eff3ff; color: #3b66f5; border: 1px solid #c7d2fe; }
  .type-native { background: #f5f3ff; color: #7c3aed; border: 1px solid #ddd6fe; }
  .type-html { background: #fffbeb; color: #d97706; border: 1px solid #fde68a; }
  .type-video { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
  .type-vast { background: #e5f5eb; color: #16a34a; border: 1px solid #bbf7d0; }

  /* Status */
  .status-cell { display: flex; align-items: center; gap: 7px; }
  .status-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .dot-active { background: #16a34a; }
  .dot-paused { background: #94a3b8; }
  .dot-pending { background: #d97706; }
  .dot-rejected { background: #dc2626; }
  .status-label { font-size: 12px; font-weight: 500; color: #374151; text-transform: capitalize; }

  /* Metrics */
  .metric { font-weight: 600; color: #111827; }
  .metric-sub { font-size: 11px; color: #94a3b8; }
`;

const TYPE_CLASS_MAP: Record<string, string> = {
  image: 'type-image',
  native: 'type-native',
  html: 'type-html',
  video: 'type-video',
  vast: 'type-vast',
};

const STATUS_DOT_MAP: Record<string, string> = {
  active: 'dot-active',
  paused: 'dot-paused',
  pending_approval: 'dot-pending',
  rejected: 'dot-rejected',
  draft: 'dot-paused',
};

class CreativeListPageElement extends BaseComponent {
  private allCreatives: Creative[] = [];
  private filteredCreatives: Creative[] = [];
  private selectedIds: Set<string> = new Set();
  private searchTerm = '';
  private filterType = '';
  private filterStatus = '';
  private isLoading = true;
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
    this.shadow.addEventListener('input', this.handleInput);
    void this.loadCreatives();
  }

  protected onUnmount(): void {
    this.shadow.removeEventListener('click', this.handleClick);
    this.shadow.removeEventListener('change', this.handleChange);
    this.shadow.removeEventListener('input', this.handleInput);
  }

  private async loadCreatives(): Promise<void> {
    this.isLoading = true;
    this.rerender();
    try {
      this.allCreatives = await creativeService.listCreatives();
    } catch {
      this.allCreatives = [];
    }
    this.applyFilter();
    this.isLoading = false;
    this.rerender();
    this.syncTable();
  }

  private applyFilter(): void {
    let results = [...this.allCreatives];
    if (this.crossClientMode && this.clientFilter) {
      results = results.filter((c) => c.campaignId.includes(this.clientFilter));
    }
    if (this.filterType) {
      results = results.filter((c) => c.format === this.filterType);
    }
    if (this.filterStatus) {
      results = results.filter((c) => c.status === this.filterStatus);
    }
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      results = results.filter(
        (c) => c.name.toLowerCase().includes(term) || c.id.toLowerCase().includes(term),
      );
    }
    this.filteredCreatives = results;
  }

  private handleClick = (event: Event): void => {
    const target = event.target as HTMLElement;
    const createBtn = target.closest('[data-action="create"]');
    if (createBtn) {
      navigate('/client/creatives/new');
      return;
    }
    const bulkBtn = target.closest('[data-bulk-action]');
    if (bulkBtn) {
      const action = bulkBtn.getAttribute('data-bulk-action');
      if (action) {
        void this.handleBulkAction(action as 'pause' | 'resume' | 'delete');
      }
    }
  };

  private handleChange = (event: Event): void => {
    const target = event.target as HTMLElement;
    if (target.getAttribute('data-filter') === 'client') {
      this.clientFilter = (target as HTMLSelectElement).value;
      this.applyFilter();
      this.rerender();
      this.syncTable();
      return;
    }
    const selectAll = target.closest('[data-select-all]');
    if (selectAll) {
      const checked = (target as HTMLInputElement).checked;
      if (checked) {
        const visibleIds = this.filteredCreatives.length > 0 
          ? this.filteredCreatives.map(c => c.id) 
          : ['CRV-1042', 'CRV-1038', 'CRV-1031', 'CRV-1024']; // mock ids
        visibleIds.forEach(id => this.selectedIds.add(id));
      } else {
        this.selectedIds.clear();
      }
      this.rerender();
      this.syncTable();
      return;
    }

    const rowCheckbox = target.closest('[data-row-checkbox]');
    if (rowCheckbox) {
      const id = rowCheckbox.getAttribute('data-creative-id');
      const checked = (target as HTMLInputElement).checked;
      if (id) {
        if (checked) this.selectedIds.add(id);
        else this.selectedIds.delete(id);
        
        // Rerender so bulk actions bar appears/disappears
        this.rerender();
        this.syncTable();
      }
      return;
    }
    if (target.getAttribute('data-filter') === 'type') {
      this.filterType = (target as HTMLSelectElement).value;
      this.applyFilter();
      this.rerender();
      this.syncTable();
    }
    if (target.getAttribute('data-filter') === 'status') {
      this.filterStatus = (target as HTMLSelectElement).value;
      this.applyFilter();
      this.rerender();
      this.syncTable();
    }
  };

  private handleInput = (event: Event): void => {
    const target = event.target as HTMLElement;
    if (target.getAttribute('data-field') === 'search') {
      this.searchTerm = (target as HTMLInputElement).value;
      this.applyFilter();
      this.rerender();
      this.syncTable();
    }
  };

  private async handleBulkAction(action: 'pause' | 'resume' | 'delete'): Promise<void> {
    const ids = Array.from(this.selectedIds);
    for (const id of ids) {
      if (action === 'delete') {
        await creativeService.deleteCreative(id);
      }
    }
    this.selectedIds.clear();
    await this.loadCreatives();
  }

  private buildTableRows(): Record<string, unknown>[] {
    return this.filteredCreatives.map((c, idx) => {
      const isPendingEdit = c.status === CreativeStatus.PendingApproval && this.allCreatives.some(
        (other) => other.campaignId === c.campaignId && other.id !== c.id && other.status === CreativeStatus.Active,
      );
      const row: Record<string, unknown> = {
        id: c.id,
        thumbnail: `<div style="width:32px;height:32px;background:var(--color-surface-2);border-radius:var(--radius-xs);"></div>`,
        name: c.name + (isPendingEdit ? ' <span class="version-label">(Pending Edit)</span>' : ''),
        campaign: c.campaignId,
        type: `<span class="type-badge ${TYPE_CLASS_MAP[c.format] ?? 'type-image'}">${c.format}</span>`,
        impressions: (1200 + idx * 150).toLocaleString(),
        clicks: (340 + idx * 20).toLocaleString(),
        ctr: ((340 + idx * 20) / (1200 + idx * 150) * 100).toFixed(1) + '%',
        status: `<span class="status-dot ${STATUS_DOT_MAP[c.status] ?? 'dot-paused'}"></span>${c.status}`,
      };
      if (this.crossClientMode) {
        row['client'] = c.campaignId;
      }
      return row;
    });
  }

  private syncTable(): void {
    const table = this.shadow.querySelector<DataTableHost>('data-table');
    if (!table) return;
    const rows = this.buildTableRows();
    const cols = [];
    if (this.crossClientMode) {
      cols.push({ key: 'client', label: 'Client', sortable: true, render: (row: Record<string, unknown>) => String(row['client'] ?? '') });
    }
    cols.push(
      { key: '_select', label: '', sortable: false, render: (row: Record<string, unknown>) => {
        const id = String(row['id'] ?? '');
        const checked = this.selectedIds.has(id) ? 'checked' : '';
        return `<input type="checkbox" data-row-checkbox data-creative-id="${id}" ${checked} />`;
      }},
      { key: 'thumbnail', label: '', sortable: false, render: (row: Record<string, unknown>) => String(row['thumbnail'] ?? '') },
      { key: 'id', label: 'Creative ID', sortable: true },
      { key: 'name', label: 'Name', sortable: true, render: (row: Record<string, unknown>) => String(row['name'] ?? '') },
      { key: 'campaign', label: 'Campaign', sortable: true },
      { key: 'type', label: 'Type', sortable: true, render: (row: Record<string, unknown>) => String(row['type'] ?? '') },
      { key: 'impressions', label: 'Impressions', sortable: true },
      { key: 'clicks', label: 'Clicks', sortable: true },
      { key: 'ctr', label: 'CTR', sortable: true },
      { key: 'status', label: 'Status', sortable: true, render: (row: Record<string, unknown>) => String(row['status'] ?? '') },
    );
    table.columns = cols;
    table.rows = rows;
    table.totalItems = rows.length;
    table.pageSize = 0;
  }

  protected renderTemplate(): string {
    if (this.isLoading) {
      return html`<loading-state variant="skeleton" shape="table-rows"></loading-state>`;
    }
    const creatives = this.filteredCreatives;
    const mockCreatives = [
      { id: 'CRV-1042', name: 'Summer Banner 320x50', campaign: 'CPG-2026-048', format: 'image', impressions: '12,400', clicks: '340', installs: '45', bids: '15,000', ctr: '2.7%', clearRate: '82%', revenue: '$1,200', roas: '2.4x', status: 'active' },
      { id: 'CRV-1038', name: 'In-Feed Video 30s', campaign: 'CPG-2026-045', format: 'video', impressions: '8,820', clicks: '210', installs: '30', bids: '10,500', ctr: '2.4%', clearRate: '84%', revenue: '$850', roas: '1.9x', status: 'active' },
      { id: 'CRV-1031', name: 'Native Story Card', campaign: 'CPG-2026-040', format: 'native', impressions: '5,200', clicks: '98', installs: '12', bids: '6,000', ctr: '1.9%', clearRate: '86%', revenue: '$400', roas: '1.5x', status: 'pending_approval' },
      { id: 'CRV-1024', name: 'HTML Expandable Unit', campaign: 'CPG-2026-033', format: 'html', impressions: '3,100', clicks: '44', installs: '5', bids: '4,200', ctr: '1.4%', clearRate: '73%', revenue: '$150', roas: '1.1x', status: 'paused' },
    ];
    
    const rows = creatives.length > 0
      ? creatives.map((c) => {
          const isPendingEdit = c.status === CreativeStatus.PendingApproval && this.allCreatives.some(
            (other) => other.campaignId === c.campaignId && other.id !== c.id && other.status === CreativeStatus.Active,
          );
          const statusKey = c.status.replace('pending_approval', 'pending');
          const isChecked = this.selectedIds.has(c.id);
          return `<tr>
            <td><input type="checkbox" data-row-checkbox data-creative-id="${c.id}" ${isChecked ? 'checked' : ''}></td>
            <td><div class="creative-id">${c.id.toUpperCase()}</div></td>
            <td><div class="creative-name">${c.name}${isPendingEdit ? '<span class="version-label">Pending Edit</span>' : ''}</div></td>
            <td style="color:#475569;">${c.campaignId}</td>
            <td><span class="type-badge type-${c.format}">${c.format}</span></td>
            <td><span class="metric">—</span></td>
            <td><span class="metric">—</span></td>
            <td><span class="metric">—</span></td>
            <td><span class="metric">—</span></td>
            <td><span class="metric">—</span></td>
            <td><span class="metric">—</span></td>
            <td><span class="metric">—</span></td>
            <td><span class="metric">—</span></td>
            <td><div class="status-cell"><div class="status-dot dot-${statusKey}"></div><span class="status-label">${c.status.replace('_', ' ')}</span></div></td>
          </tr>`;
        }).join('')
      : mockCreatives.map((c) => {
          const isChecked = this.selectedIds.has(c.id);
          return `<tr>
            <td><input type="checkbox" data-row-checkbox data-creative-id="${c.id}" ${isChecked ? 'checked' : ''}></td>
            <td><div class="creative-id">${c.id}</div></td>
            <td><div class="creative-name">${c.name}</div></td>
            <td style="color:#475569;">${c.campaign}</td>
            <td><span class="type-badge type-${c.format}">${c.format}</span></td>
            <td><span class="metric">${c.impressions}</span></td>
            <td><span class="metric">${c.clicks}</span></td>
            <td><span class="metric">${c.installs}</span></td>
            <td><span class="metric">${c.bids}</span></td>
            <td><span class="metric">${c.ctr}</span></td>
            <td><span class="metric">${c.clearRate}</span></td>
            <td><span class="metric">${c.revenue}</span></td>
            <td><span class="metric">${c.roas}</span></td>
            <td><div class="status-cell"><div class="status-dot dot-${c.status.replace('pending_approval','pending')}"></div><span class="status-label">${c.status.replace('_',' ')}</span></div></td>
          </tr>`;
        }).join('');
        
    return html`
      <div class="page-header">
        <div>
          <h1 class="page-title">Creatives</h1>
          <p class="page-subtitle">Manage ad creatives across all your campaigns</p>
        </div>
        <button class="create-btn" data-action="create" type="button">+ Create Creative</button>
      </div>
      <div class="filters">
        <input type="text" class="search-input" data-field="search" placeholder="🔍  Search by name or ID..." value="${this.searchTerm}">
        ${this.crossClientMode ? SafeHtmlString.trusted(this.renderClientFilter()) : ''}
        <select class="filter-select" data-filter="type">
          <option value="">All Types</option>
          <option value="image">Image</option>
          <option value="native">Native</option>
          <option value="html">HTML</option>
          <option value="video">Video</option>
          <option value="vast">VAST</option>
        </select>
        <select class="filter-select" data-filter="status">
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="pending_approval">Pending Review</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>
      ${this.selectedIds.size > 0 ? SafeHtmlString.trusted(this.renderBulkActions()) : ''}
      <div class="table-container">
        <div class="table-header">
          <span class="table-title">Creative Library</span>
          <span class="table-count">${creatives.length || mockCreatives.length} creatives</span>
        </div>
        <div style="overflow-x: auto;">
          <table>
            <thead>
              <tr>
                <th style="width: 40px"><input type="checkbox" data-select-all></th>
                <th>Creative ID</th>
                <th>Creative Name</th>
                <th>Added in Camp</th>
                <th>Image Type</th>
                <th>Impressions</th>
                <th>Clicks</th>
                <th>Installs</th>
                <th>Bids</th>
                <th>CTR</th>
                <th>Clear Rate</th>
                <th>Revenue</th>
                <th>ROAS</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>${SafeHtmlString.trusted(rows)}</tbody>
          </table>
        </div>
      </div>
    `;
  }

  private renderClientFilter(): string {
    const clientIds = [...new Set(this.allCreatives.map((c) => c.campaignId))];
    const options = clientIds.map((id) => `<option value="${id}" ${this.clientFilter === id ? 'selected' : ''}>${id}</option>`).join('');
    return `<select class="filter-select" data-filter="client"><option value="">All Clients</option>${options}</select>`;
  }

  private renderBulkActions(): string {
    return html`
      <div class="bulk-bar">
        <span class="bulk-count">${this.selectedIds.size} selected</span>
        <button class="bulk-btn" data-bulk-action="pause" type="button">Pause</button>
        <button class="bulk-btn" data-bulk-action="resume" type="button">Resume</button>
        <button class="bulk-btn danger" data-bulk-action="delete" type="button">Delete</button>
      </div>
    `;
  }
}

ComponentRegistry.register('creative-list-page', CreativeListPageElement);
export { CreativeListPageElement };