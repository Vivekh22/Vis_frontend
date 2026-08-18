/**
 * MasterIntegrationListsPageElement.ts — pages/super-admin/integrations-apis/master-integration-lists/
 *
 * Source-of-truth MMP list (AppsFlyer, Adjust, Kochava, Branch, Singular,
 * + add/remove) and master exchange list. Every client-facing MMP dropdown
 * reads from this service.
 */
import { BaseComponent } from '../../../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../../../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString } from '../../../../platform/rendering/SafeHtml';
import { masterIntegrationService } from '../../../../services';
import type { MasterMmpEntry } from '../../../../services/MasterIntegrationService';
import '../../../../components/loading-state/LoadingStateElement';


const STYLES = `
  :host { display: block; font-family: var(--font-body); }
  .page-title { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); color: var(--color-text-primary); margin: 0 0 var(--space-6); }
  .panel { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: var(--space-4); margin-bottom: var(--space-4); }
  .panel-title { font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold); margin: 0 0 var(--space-3); }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: var(--space-2) var(--space-3); border-bottom: 1px solid var(--color-border); font-size: var(--font-size-sm); }
  th { font-weight: var(--font-weight-semibold); color: var(--color-text-muted); text-transform: uppercase; font-size: var(--font-size-xs); }
  .btn { padding: var(--space-1) var(--space-3); border: 1px solid var(--color-border); border-radius: var(--radius-sm); background: var(--color-bg); cursor: pointer; font-size: var(--font-size-sm); }
  .btn.primary { background: var(--color-primary); color: var(--color-primary-foreground); border: none; }
  .btn.danger { background: var(--color-danger); color: var(--color-danger-foreground); border: none; }
  .form-row { display: flex; align-items: center; gap: var(--space-2); margin-bottom: var(--space-2); }
  .form-input { padding: var(--space-1) var(--space-2); border: 1px solid var(--color-border); border-radius: var(--radius-sm); font-size: var(--font-size-sm); }
  .source-note { font-size: var(--font-size-xs); color: var(--color-text-muted); margin: 0 0 var(--space-3); font-style: italic; }
`;

class MasterIntegrationListsPageElement extends BaseComponent {
  private mmpList: MasterMmpEntry[] = [];
  private exchangeList: string[] = [];
  private newMmpName = '';
  private newMmpKey = '';
  private isLoading = true;

  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
  }

  protected onMount(): void {
    this.shadow.addEventListener('click', this.handleClick);
    this.shadow.addEventListener('input', this.handleInput);
    void this.loadData();
  }

  protected onUnmount(): void {
    this.shadow.removeEventListener('click', this.handleClick);
    this.shadow.removeEventListener('input', this.handleInput);
  }

  private async loadData(): Promise<void> {
    this.isLoading = true;
    this.rerender();
    try {
      const [mmpList, exchangeList] = await Promise.all([
        masterIntegrationService.getMmpList(),
        masterIntegrationService.getMasterExchangeList(),
      ]);
      this.mmpList = mmpList;
      this.exchangeList = exchangeList;
    } catch {
      // Use empty state
    }
    this.isLoading = false;
    this.rerender();
  }

  private handleInput = (event: Event): void => {
    const target = event.target as HTMLInputElement;
    if (target.name === 'mmp-name') this.newMmpName = target.value;
    else if (target.name === 'mmp-key') this.newMmpKey = target.value;
  };

  private handleClick = (event: Event): void => {
    const target = event.target as HTMLElement;
    if (target.closest('[data-action="add-mmp"]')) {
      if (!this.newMmpName || !this.newMmpKey) return;
      void masterIntegrationService.addMmp(this.newMmpName, this.newMmpKey).then(() => {
        this.newMmpName = '';
        this.newMmpKey = '';
        void this.loadData();
      });
      return;
    }
    const removeBtn = target.closest('[data-action="remove-mmp"]');
    if (removeBtn) {
      const id = removeBtn.getAttribute('data-mmp-id') ?? '';
      void masterIntegrationService.removeMmp(id).then(() => this.loadData());
      return;
    }
  };

  protected renderTemplate(): string {
    if (this.isLoading) {
      return '<loading-state variant="skeleton" shape="card"></loading-state>';
    }
    const mmpRows = this.mmpList.map((m) => html`
      <tr>
        <td>${m.name}</td>
        <td style="font-family:var(--font-mono);">${m.providerKey}</td>
        <td>${m.isActive ? 'Active' : 'Inactive'}</td>
        <td><button class="btn danger" data-action="remove-mmp" data-mmp-id="${m.id}" type="button">Remove</button></td>
      </tr>
    `).join('');

    const exchangeRows = this.exchangeList.map((name) => html`<tr><td>${name}</td></tr>`).join('');

    return html`
      <h1 class="page-title">Master Integration Lists</h1>
      <p class="source-note">Single source of truth — client-facing MMP dropdowns (Part 10) and Exchange Management (Part 12) read from these lists.</p>
      <div class="panel">
        <p class="panel-title">Master MMP List</p>
        <div class="form-row">
          <input class="form-input" type="text" name="mmp-name" value="${this.newMmpName}" placeholder="MMP Name" />
          <input class="form-input" type="text" name="mmp-key" value="${this.newMmpKey}" placeholder="Provider Key (e.g. appsflyer)" />
          <button class="btn primary" data-action="add-mmp" type="button">Add</button>
        </div>
        <table><thead><tr><th>Name</th><th>Provider Key</th><th>Status</th><th>Actions</th></tr></thead><tbody>${SafeHtmlString.trusted(mmpRows)}</tbody></table>
      </div>
      <div class="panel">
        <p class="panel-title">Master Exchange List</p>
        <p class="source-note">Source: Platform Connections → Connected Exchanges page.</p>
        <table><thead><tr><th>Exchange Name</th></tr></thead><tbody>${SafeHtmlString.trusted(exchangeRows)}</tbody></table>
      </div>
    `;
  }
}

ComponentRegistry.register('super-admin-master-integration-lists', MasterIntegrationListsPageElement);
export { MasterIntegrationListsPageElement };