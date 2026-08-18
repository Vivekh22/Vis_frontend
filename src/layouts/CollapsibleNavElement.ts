/**
 * CollapsibleNavElement.ts — layouts/
 *
 * Purpose:
 *   Reusable custom element that renders a collapsible accordion navigation.
 *   Shared by SuperAdminLayoutElement, AdminLayoutElement, and ClientLayoutElement.
 */
import { BaseComponent } from '../platform/component/BaseComponent';
import { ComponentRegistry } from '../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString } from '../platform/rendering/SafeHtml';
import { sidebarStateStore } from '../platform/state/SidebarStateStore';
import { SIDEBAR_STYLES } from './sidebarStyles';

export interface NavGroup {
  label: string;
  items: { label: string; path: string }[];
}

const STYLES = `
  :host {
    display: flex;
    flex-direction: column;
    width: 100%;
  }
  ${SIDEBAR_STYLES}
`;

class CollapsibleNavElement extends BaseComponent {
  private _groups: NavGroup[] = [];
  private _currentPath: string = '';
  private unsubscribeStore: (() => void) | null = null;
  private readonly clickHandler: (e: Event) => void;

  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
    this.clickHandler = this.onClick.bind(this);
  }

  public set groups(val: NavGroup[]) {
    this._groups = val;
    this.rerender();
  }

  public get groups(): NavGroup[] {
    return this._groups;
  }

  public set currentPath(val: string) {
    this._currentPath = val;
    this.autoExpandActive();
    this.rerender();
  }

  public get currentPath(): string {
    return this._currentPath;
  }

  protected onMount(): void {
    this.unsubscribeStore = sidebarStateStore.subscribe(() => {
      this.rerender();
    });
    this.shadow.addEventListener('click', this.clickHandler);
    this.autoExpandActive();
  }

  protected onUnmount(): void {
    if (this.unsubscribeStore) {
      this.unsubscribeStore();
      this.unsubscribeStore = null;
    }
    this.shadow.removeEventListener('click', this.clickHandler);
  }

  private autoExpandActive(): void {
    if (!this._currentPath) return;
    for (const group of this._groups) {
      if (group.items.some(item => this._currentPath === item.path || this._currentPath.startsWith(item.path + '/'))) {
        if (!sidebarStateStore.isExpanded(group.label)) {
          sidebarStateStore.expandGroup(group.label);
        }
      }
    }
  }

  private onClick(e: Event): void {
    const target = e.composedPath()[0] as Element;
    const header = target.closest('.nav-group-header');
    if (header) {
      const label = header.getAttribute('data-group-label');
      if (label) {
        sidebarStateStore.toggleGroup(label);
      }
    }
  }

  protected renderTemplate(): string {
    if (this._groups.length === 0) {
      return html`<div class="nav-group"><div class="nav-group-header">No Access</div></div>`;
    }

    return this._groups.map((group) => {
      const isExpanded = sidebarStateStore.isExpanded(group.label);
      const expandClass = isExpanded ? ' expanded' : '';
      
      const chevronSvg = html`<svg class="nav-chevron${expandClass}" viewBox="0 0 24 24"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/></svg>`;

      const itemsHtml = group.items.map((item) => {
        const isActive = this._currentPath && (this._currentPath === item.path || this._currentPath.startsWith(item.path + '/'));
        const cls = isActive ? 'nav-child-item active' : 'nav-child-item';
        return html`<a class="${cls}" href="${item.path}" data-router-link>${item.label}</a>`;
      }).join('');

      return html`
        <div class="nav-group">
          <button class="nav-group-header" data-group-label="${group.label}">
            <span>${group.label}</span>
            ${SafeHtmlString.trusted(chevronSvg)}
          </button>
          <div class="nav-children${expandClass}">
            ${SafeHtmlString.trusted(itemsHtml)}
          </div>
        </div>
      `;
    }).join('');
  }
}

ComponentRegistry.register('collapsible-nav', CollapsibleNavElement);
export { CollapsibleNavElement };
