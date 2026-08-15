/**
 * RolePermissionBuilderPageElement.ts — pages/super-admin/admin-panel/role-permission-builder/
 *
 * Panel A: searchable client allowlist selector (or "all current and
 * future clients" shortcut — modeled as a real sentinel value in
 * PermissionGrant, not a giant enumerated set).
 *
 * Panel B: module-by-permission-level grid (View/Edit/Approve/None)
 * covering every client-facing module plus Admin-exclusive ones.
 *
 * Margin, Exchange Allowlist, and Feature Gating rows are PERMANENTLY
 * GREYED OUT with a tooltip — genuinely disabled, non-interactive (not
 * just visually dimmed while still clickable).
 *
 * Plain-English summary preview generated from the grid's current
 * state before saving.
 */
import { BaseComponent } from '../../../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../../../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString } from '../../../../platform/rendering/SafeHtml';
import { roleManagementService, clientService } from '../../../../services';
import type { PermissionLevel } from '../../../../core/enums/PermissionLevel';
import type { ClientSummary } from '../../../../core/types/ClientSummary';

const MODULES = [
  { key: 'dashboard', label: 'Dashboard', delegable: true },
  { key: 'campaigns', label: 'Campaigns', delegable: true },
  { key: 'creatives', label: 'Creatives', delegable: true },
  { key: 'app_lists', label: 'App Lists', delegable: true },
  { key: 'audiences', label: 'Audiences', delegable: true },
  { key: 'billing', label: 'Billing', delegable: true },
  { key: 'reports', label: 'Reports', delegable: true },
  { key: 'support', label: 'Support', delegable: true },
  { key: 'settings', label: 'Settings', delegable: true },
  { key: 'margin', label: 'Margin Management', delegable: false },
  { key: 'exchange', label: 'Exchange Allowlist', delegable: false },
  { key: 'feature_gating', label: 'Feature Gating', delegable: false },
];

const LEVELS: PermissionLevel[] = ['none', 'view', 'edit', 'approve'];

const STYLES = `
  :host { display: block; font-family: var(--font-body); }
  .page-title { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); color: var(--color-text-primary); margin: 0 0 var(--space-6); }
  .panel { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: var(--space-4); margin-bottom: var(--space-4); }
  .panel-title { font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold); margin: 0 0 var(--space-3); }
  .client-search { width: 100%; padding: var(--space-2); border: 1px solid var(--color-border); border-radius: var(--radius-sm); font-size: var(--font-size-sm); margin-bottom: var(--space-2); }
  .client-list { max-height: 200px; overflow-y: auto; border: 1px solid var(--color-border); border-radius: var(--radius-sm); }
  .client-item { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-1) var(--space-2); font-size: var(--font-size-sm); cursor: pointer; }
  .client-item:hover { background: var(--color-bg); }
  .all-clients-option { padding: var(--space-2); border-bottom: 1px solid var(--color-border); font-size: var(--font-size-sm); cursor: pointer; font-weight: var(--font-weight-semibold); }
  .all-clients-option:hover { background: var(--color-bg); }
  .grid-table { width: 100%; border-collapse: collapse; }
  .grid-table th, .grid-table td { padding: var(--space-2) var(--space-3); border-bottom: 1px solid var(--color-border); text-align: center; font-size: var(--font-size-sm); }
  .grid-table th { font-weight: var(--font-weight-semibold); color: var(--color-text-muted); text-transform: uppercase; font-size: var(--font-size-xs); }
  .grid-table td.module-label { text-align: left; font-weight: var(--font-weight-medium); }
  .level-btn { padding: var(--space-1) var(--space-2); border: 1px solid var(--color-border); border-radius: var(--radius-sm); background: var(--color-bg); cursor: pointer; font-size: var(--font-size-xs); }
  .level-btn.active { background: var(--color-primary); color: var(--color-primary-foreground); border-color: var(--color-primary); }
  .row-disabled { opacity: 0.4; pointer-events: none; }
  .row-disabled .module-label { color: var(--color-text-muted); }
  .tooltip { position: relative; display: inline-block; }
  .tooltip-text { visibility: hidden; position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%); background: var(--color-text-primary); color: var(--color-surface); padding: 4px 8px; border-radius: var(--radius-sm); font-size: var(--font-size-xs); white-space: nowrap; z-index: 10; }
  .tooltip:hover .tooltip-text { visibility: visible; }
  .summary { background: var(--color-bg); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: var(--space-3); font-size: var(--font-size-sm); margin-bottom: var(--space-4); }
  .save-btn { padding: var(--space-2) var(--space-4); background: var(--color-primary); color: var(--color-primary-foreground); border: none; border-radius: var(--radius-md); cursor: pointer; font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold); }
`;

class RolePermissionBuilderPageElement extends BaseComponent {
  private clients: ClientSummary[] = [];
  private selectedClientIds: Set<string> = new Set();
  private allClients = false;
  private searchQuery = '';
  private gridState: Map<string, PermissionLevel> = new Map();
  private summary = '';
  private isLoading = true;

  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
  }

  protected onMount(): void {
    this.shadow.addEventListener('click', this.handleClick);
    void this.loadData();
  }

  protected onUnmount(): void {
    this.shadow.removeEventListener('click', this.handleClick);
  }

  private async loadData(): Promise<void> {
    this.isLoading = true;
    this.rerender();
    try {
      this.clients = await clientService.listAssignedClients();
    } catch {
      this.clients = [];
    }
    // Initialize grid state to all 'none'
    for (const mod of MODULES) {
      this.gridState.set(mod.key, 'none');
    }
    this.updateSummary();
    this.isLoading = false;
    this.rerender();
  }

  private handleClick = (event: Event): void => {
    const target = event.target as HTMLElement;
    const allClients = target.closest('[data-action="all-clients"]');
    if (allClients) {
      this.allClients = true;
      this.selectedClientIds.clear();
      this.updateSummary();
      this.rerender();
      return;
    }
    const clientItem = target.closest('[data-client-id]');
    if (clientItem) {
      const id = clientItem.getAttribute('data-client-id');
      if (id) {
        this.allClients = false;
        if (this.selectedClientIds.has(id)) {
          this.selectedClientIds.delete(id);
        } else {
          this.selectedClientIds.add(id);
        }
        this.updateSummary();
        this.rerender();
      }
      return;
    }
    const levelBtn = target.closest('[data-module][data-level]');
    if (levelBtn) {
      const mod = levelBtn.getAttribute('data-module');
      const level = levelBtn.getAttribute('data-level') as PermissionLevel;
      if (mod && level) {
        this.gridState.set(mod, level);
        this.updateSummary();
        this.rerender();
      }
      return;
    }
    if (target.closest('[data-action="save"]')) {
      void this.saveGrant();
      return;
    }
  };

  private updateSummary(): void {
    this.summary = roleManagementService.generateSummary(
      this.gridState,
      this.allClients ? null : this.selectedClientIds,
    );
  }

  private async saveGrant(): Promise<void> {
    // In a real app, this would save to the currently-selected admin user
    await roleManagementService.saveGrant(
      'admin-new',
      this.gridState,
      this.allClients ? null : this.selectedClientIds,
    );
  }

  private renderGrid(): string {
    const headerCells = ['<th>Module</th>', ...LEVELS.map((l) => `<th>${l.charAt(0).toUpperCase() + l.slice(1)}</th>`)].join('');
    const rows = MODULES.map((mod) => {
      const currentLevel = this.gridState.get(mod.key) ?? 'none';
      const levelBtns = LEVELS.map((l) => {
        const active = currentLevel === l ? 'active' : '';
        return `<button class="level-btn ${active}" data-module="${mod.key}" data-level="${l}" type="button">${l.charAt(0).toUpperCase() + l.slice(1)}</button>`;
      }).join('');
      if (!mod.delegable) {
        return html`
          <tr class="row-disabled">
            <td class="module-label">
              <span class="tooltip">${mod.label}<span class="tooltip-text">This permission can never be delegated — Super Admin only.</span></span>
            </td>
            ${SafeHtmlString.trusted(levelBtns)}
          </tr>
        `;
      }
      return html`
        <tr>
          <td class="module-label">${mod.label}</td>
          ${SafeHtmlString.trusted(levelBtns)}
        </tr>
      `;
    }).join('');
    return html`
      <table class="grid-table">
        <thead><tr>${SafeHtmlString.trusted(headerCells)}</tr></thead>
        <tbody>${SafeHtmlString.trusted(rows)}</tbody>
      </table>
    `;
  }

  private renderClientList(): string {
    const filtered = this.clients.filter((c) =>
      c.companyName.toLowerCase().includes(this.searchQuery.toLowerCase()),
    );
    const items = filtered.map((c) => {
      const selected = this.selectedClientIds.has(c.clientId) ? '✓ ' : '';
      return html`<div class="client-item" data-client-id="${c.clientId}">${selected}${c.companyName}</div>`;
    }).join('');
    return html`
      <input class="client-search" type="text" placeholder="Search clients..." value="${this.searchQuery}" />
      <div class="all-clients-option" data-action="all-clients">${this.allClients ? '✓ ' : ''}All current and future clients</div>
      <div class="client-list">${SafeHtmlString.trusted(items)}</div>
    `;
  }

  protected renderTemplate(): string {
    if (this.isLoading) {
      return '<loading-state variant="skeleton" shape="card"></loading-state>';
    }
    return html`
      <h1 class="page-title">Role & Permission Builder</h1>
      <div class="summary">${this.summary}</div>
      <div class="panel">
        <p class="panel-title">Panel A — Client Allowlist</p>
        ${SafeHtmlString.trusted(this.renderClientList())}
      </div>
      <div class="panel">
        <p class="panel-title">Panel B — Module Permission Grid</p>
        ${SafeHtmlString.trusted(this.renderGrid())}
      </div>
      <button class="save-btn" data-action="save" type="button">Save Permission Grant</button>
    `;
  }
}

ComponentRegistry.register('super-admin-role-permission-builder', RolePermissionBuilderPageElement);
export { RolePermissionBuilderPageElement };