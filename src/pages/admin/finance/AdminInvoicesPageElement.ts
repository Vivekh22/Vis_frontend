/**
 * AdminInvoicesPageElement.ts — pages/admin/finance/
 *
 * Thin wrapper that reuses InvoicesBillingPageElement with cross-client-mode.
 *
 * !!! MARGIN ABSENCE CONFIRMED !!!
 * Margin remains invisible here too — the same Invoice entity and
 * InvoiceService are reused, which have no margin field. The
 * cross-client-mode attribute does not introduce margin; it only
 * adds a Client column and switches the data scope.
 */
import { BaseComponent } from '../../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../../platform/component/ComponentRegistry';
import { injectGlobalTokens } from '../../../platform/component/ShadowRenderMixin';

class AdminInvoicesPageElement extends BaseComponent {
  constructor() {
    super();
    injectGlobalTokens(this.shadow);
  }
  protected renderTemplate(): string {
    return '<invoices-billing-page cross-client-mode></invoices-billing-page>';
  }
}

ComponentRegistry.register('admin-invoices', AdminInvoicesPageElement);
export { AdminInvoicesPageElement };