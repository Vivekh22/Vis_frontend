/**
 * AdminCampaignsPageElement.ts — pages/admin/operations/
 *
 * Thin wrapper that reuses CampaignListPageElement with cross-client-mode.
 * The Client column, client filter, and admin-scoped data fetch are all
 * handled by the shared component — this page just sets the attribute.
 */
import { BaseComponent } from '../../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../../platform/component/ComponentRegistry';
import { injectGlobalTokens } from '../../../platform/component/ShadowRenderMixin';

class AdminCampaignsPageElement extends BaseComponent {
  constructor() {
    super();
    injectGlobalTokens(this.shadow);
  }
  protected renderTemplate(): string {
    return '<campaign-list-page cross-client-mode></campaign-list-page>';
  }
}

ComponentRegistry.register('admin-campaigns', AdminCampaignsPageElement);
export { AdminCampaignsPageElement };