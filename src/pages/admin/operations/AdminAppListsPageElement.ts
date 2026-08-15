/**
 * AdminAppListsPageElement.ts — pages/admin/operations/
 *
 * Thin wrapper that reuses AppListPageElement with cross-client-mode.
 */
import { BaseComponent } from '../../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../../platform/component/ComponentRegistry';
import { injectGlobalTokens } from '../../../platform/component/ShadowRenderMixin';

class AdminAppListsPageElement extends BaseComponent {
  constructor() {
    super();
    injectGlobalTokens(this.shadow);
  }
  protected renderTemplate(): string {
    return '<app-list-page cross-client-mode></app-list-page>';
  }
}

ComponentRegistry.register('admin-app-lists', AdminAppListsPageElement);
export { AdminAppListsPageElement };