/**
 * AdminCreativesPageElement.ts — pages/admin/operations/
 *
 * Thin wrapper that reuses CreativeListPageElement with cross-client-mode.
 */
import { BaseComponent } from '../../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../../platform/component/ComponentRegistry';
import { injectGlobalTokens } from '../../../platform/component/ShadowRenderMixin';

class AdminCreativesPageElement extends BaseComponent {
  constructor() {
    super();
    injectGlobalTokens(this.shadow);
  }
  protected renderTemplate(): string {
    return '<creative-list-page cross-client-mode></creative-list-page>';
  }
}

ComponentRegistry.register('admin-creatives', AdminCreativesPageElement);
export { AdminCreativesPageElement };