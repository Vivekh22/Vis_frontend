/**
 * MarginManagementPageElement.ts — pages/super-admin/admin-panel/margin-management/
 *
 * Client selector, per-client Base Margin (editable anytime, forward-
 * looking only — never retroactive), Type-Specific Margin.
 *
 * History table below: old value, new value, changed-by, required note.
 * This is another mandatory-note-gated write action — reuses
 * MandatoryNoteDialogElement.
 *
 * Uses Percentage value object throughout, never raw numbers.
 */
import { BaseComponent } from '../../../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../../../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString } from '../../../../platform/rendering/SafeHtml';
import { marginService, clientService } from '../../../../services';
import { Percentage } from '../../../../core/value-objects/Percentage';
import { MandatoryNoteDialogElement } from '../../../../components/mandatory-note-dialog/MandatoryNoteDialogElement';
import type { ClientSummary } from '../../../../core/types/ClientSummary';
import type { ClientMargin } from '../../../../services/MarginService';
import type { MarginHistoryEntry } from '../../../../core/entities/MarginHistoryEntry';
import '../../../../components/loading-state/LoadingStateElement';


const STYLES = `
  :host { display: block; font-family: var(--font-body); }
  .page-title { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); color: var(--color-text-primary); margin: 0 0 var(--space-6); }
  .client-selector { padding: var(--space-2); border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: var(--font-size-sm); margin-bottom: var(--space-4); }
  .panel { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: var(--space-4); margin-bottom: var(--space-4); }
  .panel-title { font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold); margin: 0 0 var(--space-3); }
  .margin-row { display: flex; align-items: center; gap: var(--space-2); margin-bottom: var(--space-2); }
  .margin-label { font-size: var(--font-size-sm); min-width: 160px; }
  .margin-input { width: 80px; padding: var(--space-1) var(--space-2); border: 1px solid var(--color-border); border-radius: var(--radius-sm); font-size: var(--font-size-sm); }
  .save-btn { padding: var(--space-2) var(--space-4); background: var(--color-primary); color: var(--color-primary-foreground); border: none; border-radius: var(--radius-md); cursor: pointer; font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold); margin-top: var(--space-2); }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: var(--space-2) var(--space-3); border-bottom: 1px solid var(--color-border); font-size: var(--font-size-sm); }
  th { font-weight: var(--font-weight-semibold); color: var(--color-text-muted); text-transform: uppercase; font-size: var(--font-size-xs); }
`;

class MarginManagementPageElement extends BaseComponent {
  private clients: ClientSummary[] = [];
  private selectedClientId = '';
  private currentMargin: ClientMargin | null = null;
  private history: MarginHistoryEntry[] = [];
  private baseMarginValue = 0;
  private typeSpecificValues: Map<string, number> = new Map();
  private isLoading = true;
  private dialogEl: MandatoryNoteDialogElement | null = null;

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
    if (this.dialogEl) {
      this.dialogEl.remove();
      this.dialogEl = null;
    }
  }

  private async loadData(): Promise<void> {
    this.isLoading = true;
    this.rerender();
    try {
      this.clients = await clientService.listAssignedClients();
      if (this.clients.length > 0) {
        this.selectedClientId = this.clients[0]!.clientId;
        await this.loadClientMargin();
      }
    } catch {
      // Use empty state
    }
    this.isLoading = false;
    this.rerender();
  }

  private async loadClientMargin(): Promise<void> {
    if (!this.selectedClientId) return;
    try {
      this.currentMargin = await marginService.getClientMargin(this.selectedClientId);
      this.history = await marginService.getMarginHistory(this.selectedClientId);
      this.baseMarginValue = this.currentMargin.baseMargin.getValue();
      this.typeSpecificValues.clear();
      for (const tsm of this.currentMargin.typeSpecificMargins) {
        this.typeSpecificValues.set(tsm.campaignType, tsm.margin.getValue());
      }
    } catch {
      this.currentMargin = null;
    }
    this.rerender();
  }

  private handleClick = (event: Event): void => {
    const target = event.target as HTMLElement;
    const selector = target.closest('[data-field="client-selector"]');
    if (selector) {
      this.selectedClientId = (selector as HTMLSelectElement).value;
      void this.loadClientMargin();
      return;
    }
    if (target.closest('[data-action="save-base-margin"]')) {
      this.openNoteDialog('Update Base Margin', (note) => void this.saveBaseMargin(note));
      return;
    }
  };

  private handleInput = (event: Event): void => {
    const target = event.target as HTMLElement;
    const field = target.getAttribute('data-field');
    if (!field) return;
    const value = (target as HTMLInputElement).value;
    if (field === 'baseMargin') {
      this.baseMarginValue = parseFloat(value) || 0;
    } else if (field.startsWith('tsm_')) {
      const ct = field.substring(4);
      this.typeSpecificValues.set(ct, parseFloat(value) || 0);
    }
  };

  private openNoteDialog(actionDescription: string, onConfirm: (note: string) => void): void {
    if (!this.dialogEl) {
      this.dialogEl = new MandatoryNoteDialogElement();
      document.body.appendChild(this.dialogEl);
    }
    this.dialogEl.open({ actionDescription, onConfirm, onCancel: () => {} });
  }

  private async saveBaseMargin(note: string): Promise<void> {
    if (!this.selectedClientId) return;
    try {
      await marginService.updateBaseMargin(
        this.selectedClientId,
        new Percentage(this.baseMarginValue),
        'super-admin',
        note,
      );
      await this.loadClientMargin();
    } catch (err) {
      console.error('Failed to update base margin:', err);
    }
  }

  protected renderTemplate(): string {
    if (this.isLoading) {
      return '<loading-state variant="skeleton" shape="card"></loading-state>';
    }
    const options = this.clients.map((c) =>
      `<option value="${c.clientId}" ${c.clientId === this.selectedClientId ? 'selected' : ''}>${c.companyName}</option>`,
    ).join('');
    const tsmRows = this.currentMargin?.typeSpecificMargins.map((tsm) => {
      const val = this.typeSpecificValues.get(tsm.campaignType) ?? tsm.margin.getValue();
      return html`
        <div class="margin-row">
          <span class="margin-label">${tsm.campaignType}</span>
          <input class="margin-input" type="number" min="0" max="100" step="0.1" value="${val}" data-field="tsm_${tsm.campaignType}" />
          <span>%</span>
        </div>
      `;
    }).join('') ?? '';
    const historyRows = this.history.map((h) => html`
      <tr>
        <td>${h.field}</td>
        <td>${h.oldValue.toDisplayString()}</td>
        <td>${h.newValue.toDisplayString()}</td>
        <td>${h.changedBy}</td>
        <td>${h.note}</td>
        <td>${h.changedAt.toLocaleDateString()}</td>
      </tr>
    `).join('');
    return html`
      <h1 class="page-title">Margin Management</h1>
      <select class="client-selector" data-field="client-selector">${SafeHtmlString.trusted(options)}</select>
      <div class="panel">
        <p class="panel-title">Base Margin (forward-looking only — never retroactive)</p>
        <div class="margin-row">
          <span class="margin-label">Base Margin</span>
          <input class="margin-input" type="number" min="0" max="100" step="0.1" value="${this.baseMarginValue}" data-field="baseMargin" />
          <span>%</span>
        </div>
        <button class="save-btn" data-action="save-base-margin" type="button">Update Base Margin</button>
      </div>
      <div class="panel">
        <p class="panel-title">Type-Specific Margins</p>
        ${SafeHtmlString.trusted(tsmRows)}
      </div>
      <div class="panel">
        <p class="panel-title">Margin History</p>
        <table>
          <thead><tr><th>Field</th><th>Old Value</th><th>New Value</th><th>Changed By</th><th>Note</th><th>Date</th></tr></thead>
          <tbody>${SafeHtmlString.trusted(historyRows)}</tbody>
        </table>
      </div>
    `;
  }
}

ComponentRegistry.register('super-admin-margin-management', MarginManagementPageElement);
export { MarginManagementPageElement };