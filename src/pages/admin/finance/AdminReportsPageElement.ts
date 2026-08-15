/**
 * AdminReportsPageElement.ts — pages/admin/finance/
 *
 * Thin wrapper that reuses ReportsPageElement with cross-client-mode.
 */
import { BaseComponent } from '../../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../../platform/component/ComponentRegistry';
import { injectGlobalTokens } from '../../../platform/component/ShadowRenderMixin';

class AdminReportsPageElement extends BaseComponent {
  constructor() {
    super();
    injectGlobalTokens(this.shadow);
  }
  protected renderTemplate(): string {
    return '<reports-page cross-client-mode></reports-page>';
  }
}

ComponentRegistry.register('admin-reports', AdminReportsPageElement);
export { AdminReportsPageElement };