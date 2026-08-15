/**
 * ConnectedDspsPageElement.ts — pages/super-admin/platform-connections/connected-dsps/
 *
 * Explicitly FUTURE/SSP-DEPENDENT — minimal placeholder using
 * EmptyStateElement. Not a full table/workflow UI for a capability
 * the platform doesn't have yet. Do not over-build.
 */
import { BaseComponent } from '../../../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../../../platform/component/ShadowRenderMixin';
import { html } from '../../../../platform/rendering/SafeHtml';

const STYLES = `
  :host { display: block; font-family: var(--font-body); }
  .page-title { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); color: var(--color-text-primary); margin: 0 0 var(--space-6); }
`;

class ConnectedDspsPageElement extends BaseComponent {
  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
  }

  protected renderTemplate(): string {
    return html`
      <h1 class="page-title">Connected DSPs</h1>
      <empty-state message="Available once supply-side operations are enabled."></empty-state>
    `;
  }
}

ComponentRegistry.register('super-admin-connected-dsps', ConnectedDspsPageElement);
export { ConnectedDspsPageElement };