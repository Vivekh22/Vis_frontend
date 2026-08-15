/**
 * CreativeLibraryPickerElement.ts — components/creative-library-picker/
 *
 * Reusable asset picker that lists library assets and emits 'asset-selected'
 * when the user picks one. Usable from within any creative builder.
 */
import { BaseComponent } from '../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString } from '../../platform/rendering/SafeHtml';
import { creativeLibraryService } from '../../services';
import type { LibraryAsset } from '../../services/CreativeLibraryService';

const STYLES = `
  :host { display: block; font-family: var(--font-body); }
  .picker-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    gap: var(--space-2);
    max-height: 240px;
    overflow-y: auto;
  }
  .asset-tile {
    cursor: pointer;
    border: 2px solid transparent;
    border-radius: var(--radius-sm);
    overflow: hidden;
    text-align: center;
    padding: var(--space-1);
  }
  .asset-tile:hover { border-color: var(--color-primary); }
  .asset-tile img { width: 100%; height: 60px; object-fit: cover; border-radius: var(--radius-xs); }
  .asset-name { font-size: var(--font-size-xs); color: var(--color-text-muted); margin-top: var(--space-1); word-break: break-all; }
  .empty { color: var(--color-text-muted); font-size: var(--font-size-sm); padding: var(--space-4); text-align: center; }
`;

class CreativeLibraryPickerElement extends BaseComponent {
  private assets: LibraryAsset[] = [];
  private isLoading = true;

  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
  }

  protected onMount(): void {
    this.shadow.addEventListener('click', this.handleClick);
    void this.loadAssets();
  }

  protected onUnmount(): void {
    this.shadow.removeEventListener('click', this.handleClick);
  }

  private async loadAssets(): Promise<void> {
    this.isLoading = false;
    try {
      this.assets = await creativeLibraryService.listAssets();
    } catch {
      this.assets = [];
    }
    this.rerender();
  }

  private handleClick = (event: Event): void => {
    const target = event.target as HTMLElement;
    const tile = target.closest('[data-asset-id]');
    if (tile) {
      const id = tile.getAttribute('data-asset-id');
      const asset = this.assets.find((a) => a.id === id);
      if (asset) {
        this.emit('asset-selected', asset);
      }
    }
  };

  protected renderTemplate(): string {
    if (this.isLoading) return html`<loading-state variant="spinner"></loading-state>`;
    if (this.assets.length === 0) {
      return html`<div class="empty">No assets in library</div>`;
    }
    const tiles = this.assets
      .map((a) => `<div class="asset-tile" data-asset-id="${a.id}"><img src="${a.url}" alt="${a.name}"><div class="asset-name">${a.name}</div></div>`)
      .join('');
    return html`<div class="picker-grid">${SafeHtmlString.trusted(tiles)}</div>`;
  }
}

ComponentRegistry.register('creative-library-picker', CreativeLibraryPickerElement);
export { CreativeLibraryPickerElement };