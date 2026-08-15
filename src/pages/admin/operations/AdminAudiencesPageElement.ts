/**
 * AdminAudiencesPageElement.ts — pages/admin/operations/
 *
 * Thin wrapper that reuses AudiencePageElement with cross-client-mode.
 */
import { BaseComponent } from '../../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../../platform/component/ComponentRegistry';
import { injectGlobalTokens } from '../../../platform/component/ShadowRenderMixin';

class AdminAudiencesPageElement extends BaseComponent {
  constructor() {
    super();
    injectGlobalTokens(this.shadow);
  }
  protected renderTemplate(): string {
    return '<audience-page cross-client-mode></audience-page>';
  }
}

ComponentRegistry.register('admin-audiences', AdminAudiencesPageElement);
export { AdminAudiencesPageElement };