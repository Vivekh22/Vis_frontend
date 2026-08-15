/**
 * ModelManagementPageElement.ts — pages/super-admin/taranga-governance/model-management/
 *
 * Every deployed model's model_version, deployment status, last-retrained
 * date, drift-alert status, rollback capability. Mock-backed — model names
 * match Taranga's locked structure (pctr, pcvr, ltv, etc.).
 *
 * ROLLBACK FLOW:
 *   Rollback goes through MandatoryNoteDialogElement — rolling back a
 *   production model is a consequential action that requires a mandatory
 *   note. The underlying call is mocked but the UI flow is real.
 */
import { BaseComponent } from '../../../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../../../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString } from '../../../../platform/rendering/SafeHtml';
import { modelManagementService } from '../../../../services';
import { MandatoryNoteDialogElement } from '../../../../components/mandatory-note-dialog/MandatoryNoteDialogElement';
import type { ModelDeployment } from '../../../../services/ModelManagementService';

const STYLES = `
  :host { display: block; font-family: var(--font-body); }
  .page-title { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); color: var(--color-text-primary); margin: 0 0 var(--space-6); }
  .model-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: var(--space-4); margin-bottom: var(--space-4); }
  .model-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-2); }
  .model-name { font-size: var(--font-size-base); font-weight: var(--font-weight-semibold); color: var(--color-text-primary); }
  .model-version { font-family: var(--font-mono); font-size: var(--font-size-sm); color: var(--color-text-muted); }
  .model-meta { font-size: var(--font-size-xs); color: var(--color-text-muted); margin: var(--space-1) 0; }
  .version-list { margin-top: var(--space-3); }
  .version-row { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-1) 0; font-size: var(--font-size-sm); }
  .version-tag { font-family: var(--font-mono); }
  .version-current { font-weight: var(--font-weight-bold); color: var(--color-primary); }
  .btn { padding: var(--space-1) var(--space-3); border: 1px solid var(--color-border); border-radius: var(--radius-sm); background: var(--color-bg); cursor: pointer; font-size: var(--font-size-sm); font-family: var(--font-body); }
  .btn.primary { background: var(--color-primary); color: var(--color-primary-foreground); border: none; }
  .status-badge { display: inline-block; padding: var(--space-1) var(--space-2); border-radius: var(--radius-full); font-size: var(--font-size-xs); font-weight: var(--font-weight-semibold); }
  .status-deployed { background: rgba(22,163,74,0.12); color: var(--color-success); }
  .status-canary { background: rgba(217,119,6,0.12); color: var(--color-warning); }
  .status-idle { background: var(--color-surface-2); color: var(--color-text-muted); }
  .status-failed { background: rgba(220,38,38,0.12); color: var(--color-danger); }
  .drift-none { color: var(--color-text-muted); }
  .drift-warning { color: var(--color-warning); font-weight: var(--font-weight-semibold); }
  .drift-critical { color: var(--color-danger); font-weight: var(--font-weight-semibold); }
`;

class ModelManagementPageElement extends BaseComponent {
  private models: ModelDeployment[] = [];
  private isLoading = true;
  private rollbackTarget: { modelId: string; version: string } | null = null;
  private noteDialog: MandatoryNoteDialogElement | null = null;

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
      this.models = await modelManagementService.getModels();
    } catch {
      this.models = [];
    }
    this.isLoading = false;
    this.rerender();
  }

  private handleClick = (event: Event): void => {
    const target = event.target as HTMLElement;
    const rollbackBtn = target.closest('[data-action="rollback"]');
    if (rollbackBtn) {
      const modelId = rollbackBtn.getAttribute('data-model-id') ?? '';
      const version = rollbackBtn.getAttribute('data-version') ?? '';
      this.rollbackTarget = { modelId, version };
      this.openRollbackDialog();
      return;
    }
  };

  private openRollbackDialog(): void {
    if (!this.rollbackTarget) return;
    // Ensure dialog element exists
    let dialog = this.shadow.querySelector('mandatory-note-dialog') as MandatoryNoteDialogElement | null;
    if (!dialog) {
      dialog = document.createElement('mandatory-note-dialog') as MandatoryNoteDialogElement;
      this.shadow.appendChild(dialog);
    }
    this.noteDialog = dialog;
    const modelName = this.models.find((m) => m.id === this.rollbackTarget!.modelId)?.modelName ?? 'Unknown';
    dialog.open({
      actionDescription: `Rollback model "${modelName}" to version ${this.rollbackTarget.version}`,
      onConfirm: (note: string) => {
        if (!this.rollbackTarget) return;
        void modelManagementService
          .rollbackModel(this.rollbackTarget.modelId, this.rollbackTarget.version, note)
          .then(() => this.loadData());
      },
      onCancel: () => {
        this.rollbackTarget = null;
      },
    });
  }

  private renderStatusBadge(status: string): string {
    const cls = `status-${status}`;
    return `<span class="status-badge ${cls}">${status}</span>`;
  }

  private renderDriftStatus(status: string): string {
    const cls = `drift-${status}`;
    const label = status === 'none' ? 'No drift' : status === 'warning' ? '⚠ Drift warning' : '✖ Critical drift';
    return `<span class="${cls}">${label}</span>`;
  }

  protected renderTemplate(): string {
    if (this.isLoading) {
      return '<loading-state variant="skeleton" shape="card"></loading-state>';
    }
    const cards = this.models.map((model) => {
      const versions = model.versionHistory.map((v) => html`
        <div class="version-row">
          <span class="version-tag ${v.isCurrent ? 'version-current' : ''}">${v.version}</span>
          <span style="color:var(--color-text-muted);font-size:var(--font-size-xs);">${v.deployedAt.toLocaleDateString()}</span>
          ${v.isCurrent ? '' : html`<button class="btn" data-action="rollback" data-model-id="${model.id}" data-version="${v.version}" type="button">Rollback</button>`}
        </div>
      `).join('');

      return html`
        <div class="model-card">
          <div class="model-header">
            <span class="model-name">${model.modelName}</span>
            ${SafeHtmlString.trusted(this.renderStatusBadge(model.status))}
          </div>
          <div class="model-version">Current: ${model.currentVersion}</div>
          <p class="model-meta">Last retrained: ${model.lastRetrained.toLocaleDateString()}</p>
          <p class="model-meta">Drift: ${SafeHtmlString.trusted(this.renderDriftStatus(model.driftAlert))}</p>
          <div class="version-list">${SafeHtmlString.trusted(versions)}</div>
        </div>
      `;
    }).join('');

    return html`
      <h1 class="page-title">Model Management</h1>
      ${SafeHtmlString.trusted(cards)}
    `;
  }
}

ComponentRegistry.register('super-admin-model-management', ModelManagementPageElement);
export { ModelManagementPageElement };