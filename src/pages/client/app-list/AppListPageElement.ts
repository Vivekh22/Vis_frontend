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

interface TagInputHost extends HTMLElement {
  tags: string[];
}

const STYLES = `
  :host { display: block; font-family: var(--font-body); }
  .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-6); }
  .page-title { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); color: var(--color-text-primary); margin: 0; }
  .create-btn { padding: var(--space-2) var(--space-4); background: var(--color-primary); color: var(--color-primary-foreground); border: none; border-radius: var(--radius-md); cursor: pointer; font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold); }
  .table-container { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: var(--space-4); }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: var(--space-2) var(--space-3); border-bottom: 1px solid var(--color-border); font-size: var(--font-size-sm); color: var(--color-text-primary); }
  th { font-weight: var(--font-weight-semibold); color: var(--color-text-muted); text-transform: uppercase; font-size: var(--font-size-xs); }
  .drawer-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 100; display: flex; justify-content: flex-end; }
  .drawer { background: var(--color-bg); width: 480px; max-width: 90%; height: 100%; overflow-y: auto; padding: var(--space-6); display: flex; flex-direction: column; gap: var(--space-4); box-shadow: var(--shadow-lg); }
  .drawer-title { font-size: var(--font-size-lg); font-weight: var(--font-weight-bold); color: var(--color-text-primary); margin: 0; }
  .field-group { display: flex; flex-direction: column; gap: var(--space-1); }
  .field-label { font-size: var(--font-size-xs); font-weight: var(--font-weight-semibold); color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.03em; }
  .field-input { padding: var(--space-2) var(--space-3); border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: var(--font-size-sm); font-family: var(--font-body); background: var(--color-bg); color: var(--color-text-primary); }
  .drawer-actions { display: flex; gap: var(--space-3); margin-top: var(--space-4); }
  .save-btn { padding: var(--space-2) var(--space-4); background: var(--color-primary); color: var(--color-primary-foreground); border: none; border-radius: var(--radius-md); cursor: pointer; font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold); }
  .save-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .cancel-btn { padding: var(--space-2) var(--space-4); background: var(--color-bg); border: 1px solid var(--color-border); border-radius: var(--radius-md); cursor: pointer; font-size: var(--font-size-sm); font-family: var(--font-body); color: var(--color-text-primary); }
  .type-select { padding: var(--space-2) var(--space-3); border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: var(--font-size-sm); font-family: var(--font-body); background: var(--color-bg); color: var(--color-text-primary); }
  .close-btn { align-self: flex-end; background: none; border: none; cursor: pointer; font-size: var(--font-size-xl); color: var(--color-text-muted); }
`;

class AppListPageElement extends BaseComponent {
  private appLists: AppListEntry[] = [];
  private isLoading = true;
  private isDrawerOpen = false;
  private listName = '';
  private appBundles: string[] = [];
  private placementIds: string[] = [];
  private urls: string[] = [];
  private listType: 'whitelist' | 'blacklist' = 'whitelist';
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
  }

  private handleClick = (event: Event): void => {
    const target = event.target as HTMLElement;
    if (target.closest('[data-action="create"]')) {
      this.isDrawerOpen = true;
      this.listName = '';
      this.appBundles = [];
      this.placementIds = [];
      this.urls = [];
      this.listType = 'whitelist';
      this.rerender();
      this.syncTagInputs();
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
    if (target.classList.contains('drawer-overlay')) {
      this.isDrawerOpen = false;
      this.rerender();
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
    await appListService.createAppList({
      name: this.listName,
      appBundles: this.appBundles,
      placementIds: this.placementIds,
      urls: this.urls,
      listType: this.listType,
    });
    this.isDrawerOpen = false;
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
    return html`
      <div class="page-header">
        <h1 class="page-title">App Lists</h1>
        <button class="create-btn" data-action="create" type="button">+ Create App List</button>
      </div>
      ${this.crossClientMode ? SafeHtmlString.trusted(this.renderClientFilter()) : ''}
      <div class="table-container">
        <table>
          <thead>
            <tr>${this.crossClientMode ? '<th>Client</th>' : ''}<th>App List ID</th><th>Name</th><th>No. of Apps</th><th>White Listed</th><th>Black Listed</th><th>Created Date</th></tr>
          </thead>
          <tbody>
            ${SafeHtmlString.trusted(this.renderRows())}
          </tbody>
        </table>
      </div>
      ${this.isDrawerOpen ? SafeHtmlString.trusted(this.renderDrawer()) : ''}
    `;
  }

  private renderRows(): string {
    const filtered = this.crossClientMode && this.clientFilter
      ? this.appLists.filter((al) => al.clientId === this.clientFilter)
      : this.appLists;
    if (filtered.length === 0) {
      return '<tr><td colspan="7" style="text-align:center;color:var(--color-text-muted);">No app lists yet</td></tr>';
    }
    return filtered.map((al) => `
      <tr>
        ${this.crossClientMode ? `<td>${al.clientId}</td>` : ''}
        <td>${al.id}</td>
        <td>${al.name}</td>
        <td>${al.appCount}</td>
        <td>${al.whiteListedCount}</td>
        <td>${al.blackListedCount}</td>
        <td>${al.createdAt.toLocaleDateString()}</td>
      </tr>
    `).join('');
  }

  private renderClientFilter(): string {
    const clientIds = [...new Set(this.appLists.map((al) => al.clientId))];
    const options = clientIds.map((id) => `<option value="${id}" ${this.clientFilter === id ? 'selected' : ''}>${id}</option>`).join('');
    return `<div style="margin-bottom:var(--space-3);"><select class="type-select" data-filter="client"><option value="">All Clients</option>${options}</select></div>`;
  }

  private renderDrawer(): string {
    return html`
      <div class="drawer-overlay">
        <div class="drawer">
          <button class="close-btn" data-action="cancel" type="button">×</button>
          <h2 class="drawer-title">Create App List</h2>
          <div class="field-group">
            <label class="field-label">List Name</label>
            <input type="text" class="field-input" data-field="listName" value="${this.listName}" placeholder="My Whitelist">
          </div>
          <div class="field-group">
            <label class="field-label">List Type</label>
            <select class="type-select" data-field="listType">
              <option value="whitelist" ${this.listType === 'whitelist' ? 'selected' : ''}>Whitelist</option>
              <option value="blacklist" ${this.listType === 'blacklist' ? 'selected' : ''}>Blacklist</option>
            </select>
          </div>
          <div class="field-group">
            <label class="field-label">App Bundles (type or paste)</label>
            <tag-input data-field="appBundles" placeholder="com.example.app"></tag-input>
          </div>
          <div class="field-group">
            <label class="field-label">Placement IDs</label>
            <tag-input data-field="placementIds" placeholder="placement-123"></tag-input>
          </div>
          <div class="field-group">
            <label class="field-label">URLs</label>
            <tag-input data-field="urls" placeholder="https://example.com"></tag-input>
          </div>
          <div class="drawer-actions">
            <button class="save-btn" data-action="save" type="button" ${this.canSave ? '' : 'disabled'}>Create</button>
            <button class="cancel-btn" data-action="cancel" type="button">Cancel</button>
          </div>
        </div>
      </div>
    `;
  }
}

ComponentRegistry.register('app-list-page', AppListPageElement);
export { AppListPageElement };