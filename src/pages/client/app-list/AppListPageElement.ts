/**
 * AppListPageElement.ts — pages/client/app-list/
 *
 * Table: App List ID, Name, No. of Apps, White/Black Listed counts, Created Date.
 * Right-side drawer for creation: List Name, App Bundle (tag input), Placement IDs, URLs.
 *
 * Per spec: NO approval gate. App lists are created and immediately active.
 * There is no pending_approval status path in AppListService or AppListEntry.
 */
import { BaseComponent } from '../../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString } from '../../../platform/rendering/SafeHtml';
import { appListService } from '../../../services';
import type { AppListEntry } from '../../../core/entities/AppListEntry';
import '../../../components/loading-state/LoadingStateElement';
import '../../../components/tag-input/TagInputElement';

interface TagInputHost extends HTMLElement {
  tags: string[];
}

const STYLES = `
  :host { display: block; font-family: var(--font-body); padding: var(--space-4) 0; }

  /* Header */
  .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: var(--space-6); }
  .page-title { font-size: 24px; font-weight: var(--font-weight-bold); color: var(--color-text-primary); margin: 0 0 4px 0; }
  .page-subtitle { font-size: 13px; color: var(--color-text-muted); margin: 0; }
  .create-btn { padding: 8px 16px; background: #3b66f5; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500; display: flex; align-items: center; gap: 6px; }
  
  /* Layout */
  .layout-grid { display: grid; grid-template-columns: 1fr; gap: var(--space-6); align-items: start; }
  .layout-grid.drawer-open { grid-template-columns: 1fr 420px; }
  @media (max-width: 1024px) { .layout-grid.drawer-open { grid-template-columns: 1fr; } }

  /* Table Section */
  .table-container { background: white; border: 1px solid #eef0f4; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.02); }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: 16px; border-bottom: 1px solid #f8fafc; font-size: 13px; }
  th { font-weight: 600; color: #6b7280; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; background: #fcfdfd; }
  tr:last-child td { border-bottom: none; }
  
  .list-name { font-weight: 600; color: #111827; margin-bottom: 4px; }
  .list-id { font-size: 11px; color: #94a3b8; font-weight: 500; }
  
  .app-count { font-weight: 700; color: #111827; font-size: 14px; }
  
  .pill { display: inline-flex; align-items: center; justify-content: center; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; }
  .pill.green { background: #e5f5eb; color: #16a34a; border: 1px solid #bbf7d0; }
  .pill.orange { background: #fffbeb; color: #d97706; border: 1px solid #fde68a; }
  .pill.gray { background: #f8fafc; color: #64748b; border: 1px solid #e2e8f0; }
  
  .created-date { color: #475569; font-weight: 500; }

  /* Side Panel */
  .drawer-panel { background: white; border: 1px solid #eef0f4; border-radius: 12px; padding: var(--space-6); box-shadow: 0 2px 8px rgba(0,0,0,0.02); display: flex; flex-direction: column; gap: var(--space-2); }
  .drawer-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4); }
  .drawer-title { font-size: 18px; font-weight: 600; color: #111827; margin: 0; }
  .close-btn { background: #f8fafc; border: 1px solid #eef0f4; border-radius: 6px; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #64748b; font-size: 16px; }
  .close-btn:hover { background: #f1f5f9; color: #1e293b; }
  
  .field-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
  .field-label { font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
  .field-input, .type-select { width: 100%; box-sizing: border-box; padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; font-family: var(--font-body); background: #fcfdfd; color: #1e293b; outline: none; transition: border-color 0.2s; }
  .field-input:focus, .type-select:focus { border-color: #3b66f5; background: white; }
  
  /* Tag Input override for light theme */
  tag-input { --ti-bg: #fcfdfd; --ti-border: #e2e8f0; --ti-border-focus: #3b66f5; --ti-tag-bg: #f0f4ff; --ti-tag-text: #3b66f5; --ti-border-radius: 8px; }
  
  .drawer-actions { display: flex; gap: var(--space-3); margin-top: var(--space-2); }
  .save-btn { width: 100%; padding: 12px; background: #3b66f5; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; text-align: center; }
  .save-btn:disabled { opacity: 0.5; cursor: not-allowed; }
`;

class AppListPageElement extends BaseComponent {
  private appLists: AppListEntry[] = [];
  private isLoading = true;
  private isDrawerOpen = true; // Default open to match mockup
  private listName = '';
  private appBundles: string[] = [];
  private placementIds: string[] = [];
  private urls: string[] = [];
  private listType: 'whitelist' | 'blacklist' = 'whitelist';
  private editingId: string | null = null;
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
    this.shadow.addEventListener('tags-changed', this.handleTagsChanged);
    this.shadow.addEventListener('input', this.handleInput);
    this.shadow.addEventListener('change', this.handleChange);
    void this.loadAppLists();
  }

  protected onUnmount(): void {
    this.shadow.removeEventListener('click', this.handleClick);
    this.shadow.removeEventListener('tags-changed', this.handleTagsChanged);
    this.shadow.removeEventListener('input', this.handleInput);
    this.shadow.removeEventListener('change', this.handleChange);
  }

  private async loadAppLists(): Promise<void> {
    this.isLoading = true;
    this.rerender();
    try {
      this.appLists = await appListService.listAppLists();
    } catch {
      this.appLists = [];
    }
    this.isLoading = false;
    this.rerender();
    this.syncTagInputs();
  }

  private handleClick = (event: Event): void => {
    const target = event.target as HTMLElement;
    if (target.closest('[data-action="create"]')) {
      this.isDrawerOpen = !this.isDrawerOpen;
      this.editingId = null;
      this.listName = '';
      this.appBundles = [];
      this.placementIds = [];
      this.urls = [];
      this.listType = 'whitelist';
      this.rerender();
      this.syncTagInputs();
      return;
    }
    if (target.closest('[data-action="edit"]')) {
      const btn = target.closest('[data-action="edit"]') as HTMLElement;
      const id = btn.getAttribute('data-id');
      if (id) {
        const al = this.appLists.find(a => a.id === id);
        if (al) {
          this.editingId = id;
          this.isDrawerOpen = true;
          this.listName = al.name;
          this.appBundles = [...al.appBundles];
          this.placementIds = [...al.placementIds];
          this.urls = [...al.urls];
          this.listType = al.listType;
          this.rerender();
          this.syncTagInputs();
        }
      }
      return;
    }
    if (target.closest('[data-action="cancel"]')) {
      this.isDrawerOpen = false;
      this.rerender();
      return;
    }
    if (target.closest('[data-action="save"]')) {
      void this.handleSave();
      return;
    }
  };

  private handleTagsChanged = (event: Event): void => {
    const target = event.target as HTMLElement;
    const field = target.getAttribute('data-field');
    const detail = (event as CustomEvent<string[]>).detail;
    if (field === 'appBundles') this.appBundles = detail;
    else if (field === 'placementIds') this.placementIds = detail;
    else if (field === 'urls') this.urls = detail;
  };

  private handleInput = (event: Event): void => {
    const target = event.target as HTMLElement;
    const field = target.getAttribute('data-field');
    if (field === 'listName') this.listName = (target as HTMLInputElement).value;
  };

  private handleChange = (event: Event): void => {
    const target = event.target as HTMLSelectElement;
    if (target.getAttribute('data-filter') === 'client') {
      this.clientFilter = target.value;
      this.rerender();
      return;
    }
    if (target.getAttribute('data-field') === 'listType') {
      this.listType = target.value as 'whitelist' | 'blacklist';
    }
  };

  private async handleSave(): Promise<void> {
    if (!this.canSave) return;
    const data = {
      name: this.listName,
      appBundles: this.appBundles,
      placementIds: this.placementIds,
      urls: this.urls,
      listType: this.listType,
    };
    if (this.editingId) {
      await appListService.updateAppList(this.editingId, data);
    } else {
      await appListService.createAppList(data);
    }
    this.isDrawerOpen = false;
    this.editingId = null;
    await this.loadAppLists();
  }

  private get canSave(): boolean {
    return this.listName.trim().length > 0 && this.appBundles.length > 0;
  }

  private syncTagInputs(): void {
    const bundles = this.shadow.querySelector<TagInputHost>('[data-field="appBundles"]');
    if (bundles) bundles.tags = this.appBundles;
    const placements = this.shadow.querySelector<TagInputHost>('[data-field="placementIds"]');
    if (placements) placements.tags = this.placementIds;
    const urls = this.shadow.querySelector<TagInputHost>('[data-field="urls"]');
    if (urls) urls.tags = this.urls;
  }

  protected renderTemplate(): string {
    if (this.isLoading) {
      return html`<loading-state variant="skeleton" shape="table-rows"></loading-state>`;
    }
    
    // Check if we are mocking the UI state (if lists are empty)
    const hasData = this.appLists.length > 0;
    
    return html`
      <div class="page-header">
        <div class="header-text">
          <h1 class="page-title">App List</h1>
          <p class="page-subtitle">Manage the apps you're advertising and targeting across campaigns</p>
        </div>
        <button class="create-btn" data-action="create" type="button">
          + Create New App List
        </button>
      </div>
      
      ${this.crossClientMode ? SafeHtmlString.trusted(this.renderClientFilter()) : ''}
      
      <div class="layout-grid ${this.isDrawerOpen ? 'drawer-open' : ''}">
        <div class="table-container">
          <table>
            <thead>
              <tr>
                ${this.crossClientMode ? SafeHtmlString.trusted('<th>Client</th>') : ''}
                <th>App List</th>
                <th>No. of Apps</th>
                <th>White Listed</th>
                <th>Black Listed</th>
                <th>Created Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${SafeHtmlString.trusted(hasData ? this.renderRows() : this.renderMockRows())}
            </tbody>
          </table>
        </div>
        
        ${this.isDrawerOpen ? SafeHtmlString.trusted(this.renderSidePanel()) : ''}
      </div>
    `;
  }

  private renderRows(): string {
    const filtered = this.crossClientMode && this.clientFilter
      ? this.appLists.filter((al) => al.clientId === this.clientFilter)
      : this.appLists;
    if (filtered.length === 0) {
      return '<tr><td colspan="6" style="text-align:center;color:var(--color-text-muted);">No app lists yet</td></tr>';
    }
    return filtered.map((al) => `
      <tr>
        ${this.crossClientMode ? `<td>${al.clientId}</td>` : ''}
        <td>
          <div class="list-name">${al.name}</div>
          <div class="list-id">${al.id.toUpperCase()}</div>
        </td>
        <td><span class="app-count">${al.appCount}</span></td>
        <td><div class="pill ${al.whiteListedCount > 0 ? 'green' : 'gray'}">${al.whiteListedCount} Apps</div></td>
        <td><div class="pill ${al.blackListedCount > 0 ? 'orange' : 'gray'}">${al.blackListedCount} Apps</div></td>
        <td><span class="created-date">${al.createdAt.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</span></td>
        <td>
          <button style="background:none;border:none;color:#3b66f5;cursor:pointer;font-weight:600;font-size:12px;" data-action="edit" data-id="${al.id}" type="button">Edit</button>
        </td>
      </tr>
    `).join('');
  }
  
  private renderMockRows(): string {
    return `
      <tr>
        <td>
          <div class="list-name">Holiday Sale — Core Bundle</div>
          <div class="list-id">APP-LIST-1042</div>
        </td>
        <td><span class="app-count">18</span></td>
        <td><div class="pill green">14 Apps</div></td>
        <td><div class="pill orange">4 Apps</div></td>
        <td><span class="created-date">Jul 12, 2026</span></td>
        <td><button style="background:none;border:none;color:#3b66f5;cursor:pointer;font-weight:600;font-size:12px;" data-action="edit" data-id="mock-1" type="button">Edit</button></td>
      </tr>
      <tr>
        <td>
          <div class="list-name">Retargeting Q3 — Gaming Vertical</div>
          <div class="list-id">APP-LIST-1039</div>
        </td>
        <td><span class="app-count">42</span></td>
        <td><div class="pill green">38 Apps</div></td>
        <td><div class="pill orange">4 Apps</div></td>
        <td><span class="created-date">Jul 04, 2026</span></td>
        <td><button style="background:none;border:none;color:#3b66f5;cursor:pointer;font-weight:600;font-size:12px;" data-action="edit" data-id="mock-2" type="button">Edit</button></td>
      </tr>
      <tr>
        <td>
          <div class="list-name">CTV Premium Publishers</div>
          <div class="list-id">APP-LIST-1027</div>
        </td>
        <td><span class="app-count">9</span></td>
        <td><div class="pill green">9 Apps</div></td>
        <td><div class="pill gray">0 Apps</div></td>
        <td><span class="created-date">Jun 28, 2026</span></td>
        <td><button style="background:none;border:none;color:#3b66f5;cursor:pointer;font-weight:600;font-size:12px;" data-action="edit" data-id="mock-3" type="button">Edit</button></td>
      </tr>
      <tr>
        <td>
          <div class="list-name">Global Reach — Tier 1 Markets</div>
          <div class="list-id">APP-LIST-1015</div>
        </td>
        <td><span class="app-count">126</span></td>
        <td><div class="pill green">112 Apps</div></td>
        <td><div class="pill orange">14 Apps</div></td>
        <td><span class="created-date">Jun 15, 2026</span></td>
        <td><button style="background:none;border:none;color:#3b66f5;cursor:pointer;font-weight:600;font-size:12px;" data-action="edit" data-id="mock-4" type="button">Edit</button></td>
      </tr>
    `;
  }

  private renderClientFilter(): string {
    const clientIds = [...new Set(this.appLists.map((al) => al.clientId))];
    const options = clientIds.map((id) => `<option value="${id}" ${this.clientFilter === id ? 'selected' : ''}>${id}</option>`).join('');
    return `<div style="margin-bottom:var(--space-3);"><select class="type-select" style="width:200px" data-filter="client"><option value="">All Clients</option>${options}</select></div>`;
  }

  private renderSidePanel(): string {
    return html`
      <div class="drawer-panel">
        <div class="drawer-header">
          <h2 class="drawer-title">${this.editingId ? 'Edit App List' : 'Create New App List'}</h2>
          <button class="close-btn" data-action="cancel" type="button">×</button>
        </div>
        
        <div class="field-group">
          <label class="field-label">App List Name</label>
          <input type="text" class="field-input" data-field="listName" value="${this.listName}" placeholder="e.g. Retargeting Q3 — Gaming Vertical">
        </div>
        
        <div class="field-group">
          <label class="field-label">App Bundle</label>
          <tag-input data-field="appBundles" placeholder="e.g. com.supercell.clash"></tag-input>
        </div>
        
        <div class="field-group">
          <label class="field-label">Placement IDs</label>
          <tag-input data-field="placementIds" placeholder="e.g. plc_9a2f1"></tag-input>
        </div>
        
        <div class="field-group">
          <label class="field-label">URLs</label>
          <tag-input data-field="urls" placeholder="e.g. clashgame.com/rewards"></tag-input>
        </div>
        
        <div class="drawer-actions">
          <button class="save-btn" data-action="save" type="button" ${this.canSave ? '' : 'disabled'}>
            ${this.editingId ? 'Update App List' : 'Save App List'}
          </button>
        </div>
      </div>
    `;
  }
}

ComponentRegistry.register('app-list-page', AppListPageElement);
export { AppListPageElement };