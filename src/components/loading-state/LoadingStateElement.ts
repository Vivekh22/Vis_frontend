/**
 * LoadingStateElement.ts — components/loading-state/
 *
 * Purpose:
 *   Reusable loading-state component with two variants:
 *     - spinner: a generic animated spinner indicator.
 *     - skeleton: a pulsing placeholder shaped to match the content being loaded.
 *
 *   Skeleton variant takes a shape setter:
 *     - 'table-rows': renders placeholder table rows.
 *     - 'chart': renders a placeholder chart area.
 *     - 'card': renders a placeholder card.
 *
 *   This directly implements the Dashboard spec's documented "chart
 *   skeleton-loads before rendering" requirement, generalized for reuse.
 */
import { BaseComponent } from '../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../platform/component/ShadowRenderMixin';
import { html } from '../../platform/rendering/SafeHtml';

export type LoadingVariant = 'spinner' | 'skeleton';
export type SkeletonShape = 'table-rows' | 'chart' | 'card';

const STYLES = `
  :host { display: block; font-family: var(--font-body); }
  .spinner-container {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-8);
  }
  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid var(--color-surface-2);
    border-top-color: var(--color-primary);
    border-radius: var(--radius-full);
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  .skeleton {
    background: var(--color-surface);
    border-radius: var(--radius-md);
    animation: pulse 1.5s ease-in-out infinite;
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  .skeleton-chart { height: 200px; width: 100%; }
  .skeleton-card { height: 120px; width: 100%; }
  .skeleton-row { height: 40px; margin-bottom: var(--space-2); }
  .skeleton-rows { padding: var(--space-2) 0; }
`;

class LoadingStateElement extends BaseComponent {
  private _variant: LoadingVariant = 'spinner';
  private _shape: SkeletonShape = 'chart';

  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
  }

  public set variant(value: LoadingVariant) {
    this._variant = value;
    this.rerender();
  }

  public set shape(value: SkeletonShape) {
    this._shape = value;
    this.rerender();
  }

  protected renderTemplate(): string {
    if (this._variant === 'spinner') {
      return html`
        <div class="spinner-container">
          <div class="spinner"></div>
        </div>
      `;
    }
    return this.renderSkeleton();
  }

  private renderSkeleton(): string {
    switch (this._shape) {
      case 'chart':
        return html`<div class="skeleton skeleton-chart"></div>`;
      case 'card':
        return html`<div class="skeleton skeleton-card"></div>`;
      case 'table-rows':
        return html`
          <div class="skeleton-rows">
            <div class="skeleton skeleton-row"></div>
            <div class="skeleton skeleton-row"></div>
            <div class="skeleton skeleton-row"></div>
            <div class="skeleton skeleton-row"></div>
            <div class="skeleton skeleton-row"></div>
          </div>
        `;
      default:
        return html`<div class="skeleton skeleton-chart"></div>`;
    }
  }
}

ComponentRegistry.register('loading-state', LoadingStateElement);
export { LoadingStateElement };