/**
 * AdminFundPageElement.ts — pages/admin/finance/
 *
 * Thin wrapper that reuses FundPageElement with cross-client-mode.
 * Cross-client fund data aggregation and Client column are handled by
 * the shared component.
 */
import { BaseComponent } from '../../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../../platform/component/ComponentRegistry';
import { injectGlobalTokens } from '../../../platform/component/ShadowRenderMixin';

class AdminFundPageElement extends BaseComponent {
  constructor() {
    super();
    injectGlobalTokens(this.shadow);
  }
  protected renderTemplate(): string {
    return '<fund-page cross-client-mode></fund-page>';
  }
}

ComponentRegistry.register('admin-fund', AdminFundPageElement);
export { AdminFundPageElement };