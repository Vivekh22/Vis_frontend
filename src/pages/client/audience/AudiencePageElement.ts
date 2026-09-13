/**
 * AudiencePageElement.ts — pages/client/audience/
 *
 * Production-ready Audience module main page.
 * Displays KPI cards, filters, and a comprehensive data table of all audiences.
 */
import { BaseComponent } from '../../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString } from '../../../platform/rendering/SafeHtml';
import { audienceService } from '../../../services';
import { AudienceList, type AudienceStatus, type AudienceType } from '../../../core/entities/AudienceList';
import { navigate } from '../../../utils/navigate';
import { AudienceDataSource } from '../../../core/enums/AudienceDataSource';
import '../../../components/loading-state/LoadingStateElement';
import './wizard/AudienceWizardElement';

const STYLES = `
  :host { 
    display: block; 
    font-family: var(--font-body); 
    padding: var(--space-6); 
    background: #f8fafc;
    min-height: 100vh;
  }

  /* Header */
  .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: var(--space-6); }
  .page-title { font-size: 28px; font-weight: 800; color: #0f172a; margin: 0 0 8px 0; letter-spacing: -0.02em; }
  .page-subtitle { font-size: 14px; color: #64748b; margin: 0; }
  .create-btn { padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 8px; transition: background 0.2s; box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2); }
  .create-btn:hover { background: #2563eb; }
  
  /* KPI Cards */
  .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-4); margin-bottom: var(--space-6); }
  .kpi-card { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: var(--space-5); display: flex; align-items: center; gap: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
  .kpi-icon-wrapper { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
  .kpi-icon-wrapper.blue { background: #eff6ff; color: #3b82f6; }
  .kpi-icon-wrapper.green { background: #f0fdf4; color: #22c55e; }
  .kpi-icon-wrapper.indigo { background: #eef2ff; color: #6366f1; }
  .kpi-content { display: flex; flex-direction: column; gap: 4px; }
  .kpi-label { font-size: 13px; color: #64748b; font-weight: 500; }
  .kpi-value { font-size: 24px; font-weight: 700; color: #0f172a; display: flex; align-items: baseline; gap: 8px; }
  .kpi-sub { font-size: 13px; color: #94a3b8; font-weight: 400; }

  /* Filters Bar */
  .filters-bar { display: flex; gap: var(--space-3); margin-bottom: var(--space-4); }
  .search-wrapper { flex: 1; position: relative; }
  .search-input { width: 100%; box-sizing: border-box; padding: 10px 12px 10px 36px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; outline: none; transition: all 0.2s; }
  .search-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
  .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #94a3b8; }
  .filter-select { padding: 10px 32px 10px 16px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; color: #475569; background: white; cursor: pointer; outline: none; appearance: none; background-image: url('data:image/svg+xml;utf8,<svg fill="none" stroke="%2394a3b8" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>'); background-repeat: no-repeat; background-position: right 12px center; background-size: 16px; }

  /* Table Section */
  .table-container { background: white; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: 16px 20px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
  th { font-weight: 600; color: #64748b; font-size: 12px; text-transform: capitalize; background: #f8fafc; }
  tr:last-child td { border-bottom: none; }
  tr:hover { background: #f8fafc; }
  
  .checkbox-cell { width: 40px; text-align: center; }
  input[type="checkbox"] { width: 16px; height: 16px; border-radius: 4px; border: 1px solid #cbd5e1; cursor: pointer; accent-color: #3b82f6; }

  .aud-name { font-weight: 600; color: #0f172a; margin-bottom: 4px; }
  .aud-desc { font-size: 12px; color: #64748b; }
  
  .type-badge { display: inline-flex; align-items: center; justify-content: center; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; }
  .type-custom { background: #eff6ff; color: #2563eb; }
  .type-lookalike { background: #fffbeb; color: #d97706; }
  .type-saved { background: #f3e8ff; color: #9333ea; }
  
  .source-text { color: #475569; }
  
  .status-cell { display: flex; align-items: center; gap: 6px; }
  .status-dot { width: 8px; height: 8px; border-radius: 50%; }
  .dot-active { background: #22c55e; }
  .dot-processing { background: #f59e0b; }
  .dot-archived { background: #94a3b8; }
  .dot-failed { background: #ef4444; }
  .status-text { font-weight: 500; font-size: 13px; color: #334155; text-transform: capitalize; }
  
  .date-text { color: #475569; font-size: 13px; display: flex; flex-direction: column; gap: 2px; }
  .date-time { font-size: 11px; color: #94a3b8; }

  .actions-btn { background: transparent; border: none; cursor: pointer; color: #64748b; padding: 4px; border-radius: 4px; display: flex; align-items: center; justify-content: center; }
  .actions-btn:hover { background: #f1f5f9; color: #0f172a; }

  /* Pagination Footer */
  .pagination-footer { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-top: 1px solid #f1f5f9; background: white; }
  .showing-text { font-size: 13px; color: #64748b; }
  .pagination-controls { display: flex; gap: 4px; }
  .page-btn { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border: 1px solid #e2e8f0; border-radius: 6px; background: white; color: #475569; cursor: pointer; font-size: 13px; font-weight: 500; transition: all 0.2s; }
  .page-btn:hover { background: #f8fafc; }
  .page-btn.active { background: #3b82f6; color: white; border-color: #3b82f6; }
`;

class AudiencePageElement extends BaseComponent {
  private audiences: AudienceList[] = [];
  private isLoading = true;
  private searchTerm = '';
  private filterType = '';
  private filterSource = '';
  private filterStatus = '';
  private isModalOpen = false;

  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
  }

  protected onMount(): void {
    this.shadow.addEventListener('click', this.handleClick);
    this.shadow.addEventListener('input', this.handleInput);
    this.shadow.addEventListener('change', this.handleChange);
    this.shadow.addEventListener('audience-created', this.handleAudienceCreated);
    void this.loadAudiences();
  }

  protected onUnmount(): void {
    this.shadow.removeEventListener('click', this.handleClick);
    this.shadow.removeEventListener('input', this.handleInput);
    this.shadow.removeEventListener('change', this.handleChange);
    this.shadow.removeEventListener('audience-created', this.handleAudienceCreated);
  }

  private async loadAudiences(): Promise<void> {
    this.isLoading = true;
    this.rerender();
    try {
      this.audiences = await audienceService.listAudiences();
    } catch {
      this.audiences = [];
    }
    this.isLoading = false;
    this.rerender();
  }

  private get filteredAudiences(): AudienceList[] {
    let result = [...this.audiences];
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(a => a.name.toLowerCase().includes(term) || a.description.toLowerCase().includes(term));
    }
    if (this.filterType) {
      result = result.filter(a => a.audienceType === this.filterType);
    }
    if (this.filterSource) {
      result = result.filter(a => a.dataSource.type === this.filterSource);
    }
    if (this.filterStatus) {
      result = result.filter(a => a.status === this.filterStatus);
    }
    return result;
  }

  private handleClick = (event: Event): void => {
    const target = event.target as HTMLElement;
    if (target.closest('[data-action="create"]')) {
      this.isModalOpen = true;
      this.rerender();
      return;
    }
    
    const row = target.closest('.audience-row');
    if (row && !target.closest('.checkbox-cell') && !target.closest('.actions-btn')) {
      const id = row.getAttribute('data-id');
      if (id) {
        navigate(`/client/audiences/${id}`);
        return;
      }
    }
  };

  private handleInput = (event: Event): void => {
    const target = event.target as HTMLElement;
    if (target.getAttribute('data-field') === 'search') {
      this.searchTerm = (target as HTMLInputElement).value;
      this.rerender();
    }
  };

  private handleChange = (event: Event): void => {
    const target = event.target as HTMLSelectElement;
    const filter = target.getAttribute('data-filter');
    if (filter === 'type') {
      this.filterType = target.value;
      this.rerender();
    } else if (filter === 'source') {
      this.filterSource = target.value;
      this.rerender();
    } else if (filter === 'status') {
      this.filterStatus = target.value;
      this.rerender();
    }
  };

  private handleAudienceCreated = (): void => {
    this.isModalOpen = false;
    void this.loadAudiences();
  };

  private formatSource(source: string): string {
    const map: Record<string, string> = {
      'website_activity': 'Website',
      'app_activity': 'App',
      'product_service_activity': 'Product/Service',
      'advertising_activity': 'Advertising',
      'customer_list': 'Customer List',
      'lead_list': 'Lead Form',
      'offline_activity': 'Offline',
      'catalogue': 'Catalogue',
      'v4connectt_sources': 'V4Connectt'
    };
    return map[source] || source;
  }

  private formatNumber(num: number): string {
    return new Intl.NumberFormat('en-US').format(num);
  }

  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
  }

  private formatTime(date: Date): string {
    return new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' }).format(date);
  }

  protected renderTemplate(): string {
    const items = this.filteredAudiences;
    
    // KPI Data calculation
    const totalAudiences = this.audiences.length;
    let totalReachable = 0;
    let activeAudiences = 0;
    let recentlyUpdated = 0;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    this.audiences.forEach(a => {
      totalReachable += a.estimatedSize;
      if (a.status === 'active') activeAudiences++;
      if (a.updatedAt >= sevenDaysAgo) recentlyUpdated++;
    });

    const formatMillions = (num: number) => {
      if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
      if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
      return num.toString();
    };

    return html`
      <div class="page-header">
        <div>
          <h1 class="page-title">Audience</h1>
          <p class="page-subtitle">Create, manage, and target the right audience for your business across the V4Connectt ecosystem.</p>
        </div>
        <button class="create-btn" data-action="create">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Create Audience
        </button>
      </div>

      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-icon-wrapper blue">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Total Audiences</span>
            <span class="kpi-value">${totalAudiences}</span>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon-wrapper blue">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><polyline points="17 11 19 13 23 9"></polyline></svg>
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Total Reachable Users</span>
            <span class="kpi-value">${formatMillions(totalReachable)}</span>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon-wrapper green">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Active Audiences</span>
            <span class="kpi-value">${activeAudiences}</span>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon-wrapper indigo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Recently Updated</span>
            <span class="kpi-value">${recentlyUpdated} <span class="kpi-sub">in last 7 days</span></span>
          </div>
        </div>
      </div>

      <div class="filters-bar">
        <div class="search-wrapper">
          <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input type="text" class="search-input" data-field="search" placeholder="Search audiences by name, description, or source..." value="${this.searchTerm}">
        </div>
        <select class="filter-select" data-filter="type">
          <option value="">All Types</option>
          <option value="custom">Custom</option>
          <option value="lookalike">Lookalike</option>
          <option value="saved">Saved</option>
        </select>
        <select class="filter-select" data-filter="source">
          <option value="">All Sources</option>
          <option value="website_activity">Website</option>
          <option value="app_activity">App</option>
          <option value="v4connectt_sources">V4Connectt</option>
          <option value="customer_list">Customer List</option>
          <option value="lead_list">Lead Form</option>
        </select>
        <select class="filter-select" data-filter="status">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="processing">Processing</option>
          <option value="archived">Archived</option>
        </select>
        <select class="filter-select">
          <option>Last Updated</option>
          <option>Name A-Z</option>
          <option>Size (High-Low)</option>
        </select>
      </div>

      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th class="checkbox-cell"><input type="checkbox"></th>
              <th>Audience Name</th>
              <th>Type</th>
              <th>Source</th>
              <th>Estimated Size ℹ️</th>
              <th>Status</th>
              <th>Last Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${this.isLoading 
              ? SafeHtmlString.trusted('<tr><td colspan="8"><loading-state variant="skeleton" shape="table-rows"></loading-state></td></tr>')
              : items.length === 0 
                ? SafeHtmlString.trusted('<tr><td colspan="8" style="text-align:center; padding:40px; color:#64748b;">No audiences found</td></tr>')
                : SafeHtmlString.trusted(items.map(a => `
                  <tr class="audience-row" data-id="${a.id}" style="cursor:pointer;">
                    <td class="checkbox-cell"><input type="checkbox"></td>
                    <td>
                      <div class="aud-name" style="color: #2563eb;">${a.name}</div>
                      <div class="aud-desc">${a.description}</div>
                    </td>
                    <td><span class="type-badge type-${a.audienceType}">${a.audienceType.charAt(0).toUpperCase() + a.audienceType.slice(1)}</span></td>
                    <td><span class="source-text">${this.formatSource(a.dataSource.type)}</span></td>
                    <td>${this.formatNumber(a.estimatedSize)}</td>
                    <td>
                      <div class="status-cell">
                        <div class="status-dot dot-${a.status}"></div>
                        <span class="status-text">${a.status}</span>
                      </div>
                    </td>
                    <td>
                      <div class="date-text">
                        <span>${this.formatDate(a.updatedAt)}</span>
                        <span class="date-time">${this.formatTime(a.updatedAt)}</span>
                      </div>
                    </td>
                    <td>
                      <button class="actions-btn">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
                      </button>
                    </td>
                  </tr>
                `).join(''))
            }
          </tbody>
        </table>
        <div class="pagination-footer">
          <span class="showing-text">Showing 1 - ${Math.min(8, items.length)} of ${items.length} audiences</span>
          <div class="pagination-controls">
            <button class="page-btn">&lt;</button>
            <button class="page-btn active">1</button>
            <button class="page-btn">2</button>
            <button class="page-btn">3</button>
            <button class="page-btn">&gt;</button>
          </div>
        </div>
      </div>
      ${this.isModalOpen ? SafeHtmlString.trusted('<audience-wizard></audience-wizard>') : ''}
    `;
  }
}

ComponentRegistry.register('audience-page', AudiencePageElement);
export { AudiencePageElement };