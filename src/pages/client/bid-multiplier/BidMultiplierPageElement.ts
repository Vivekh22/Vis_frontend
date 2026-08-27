/**
 * BidMultiplierPageElement.ts — pages/client/bid-multiplier/
 *
 * A dedicated page for managing Bid Multipliers, extracted from the Campaign Wizard.
 * Implements a split layout matching the wireframe:
 * - Left: Table showing existing multipliers
 * - Right: Branching category selector to add new multipliers
 */
import { BaseComponent } from '../../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString } from '../../../platform/rendering/SafeHtml';

const STYLES = `
  :host {
    display: flex;
    flex-direction: column;
    height: 100%;
    font-family: var(--font-body);
    background: var(--color-bg);
    color: var(--color-text-primary);
  }
  
  .page-container {
    padding: var(--space-6);
    flex: 1;
    display: flex;
    flex-direction: column;
    max-width: 1400px;
    margin: 0 auto;
    width: 100%;
  }
  
  .page-header {
    border-bottom: 1px solid var(--color-border);
    padding-bottom: var(--space-4);
    margin-bottom: var(--space-6);
  }
  
  .page-title {
    font-size: var(--font-size-2xl);
    font-weight: bold;
    text-transform: uppercase;
    margin: 0;
  }
  
  .content-layout {
    display: flex;
    gap: var(--space-8);
    flex: 1;
    min-height: 500px;
  }
  
  /* Left Side: Table */
  .table-section {
    flex: 3;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    overflow: hidden;
  }
  
  table {
    width: 100%;
    border-collapse: collapse;
    text-transform: uppercase;
  }
  
  th {
    text-align: left;
    padding: var(--space-3) var(--space-4);
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--color-text-muted);
    border-bottom: 1px solid var(--color-border);
    border-right: 1px solid var(--color-border);
  }
  
  th:last-child {
    border-right: none;
  }
  
  td {
    padding: var(--space-4);
    font-size: var(--font-size-sm);
    border-bottom: 1px solid var(--color-border);
    border-right: 1px solid var(--color-border);
  }
  
  td:last-child {
    border-right: none;
  }
   /* Right Side: Flow Builder */
  .flow-section {
    flex: 2;
    display: flex;
    position: relative;
    padding-left: var(--space-8);
  }
  
  .category-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
    width: 200px;
    position: relative;
    z-index: 2;
  }
  
  .category-btn {
    width: 100%;
    height: 40px;
    padding: 0 var(--space-4);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: transparent;
    color: var(--color-text-primary);
    text-align: left;
    font-size: var(--font-size-sm);
    font-weight: 600;
    cursor: pointer;
    text-transform: uppercase;
    transition: all 0.2s ease;
  }
  
  .category-btn:hover, .category-btn.active {
    border-color: var(--color-primary);
    background: var(--color-surface-2);
  }
  
  .connection-svg {
    width: 80px;
    height: 320px;
    flex-shrink: 0;
    pointer-events: none;
  }
  
  path.wire {
    fill: none;
    stroke: var(--color-border);
    stroke-width: 2;
  }
  
  .sub-category-box {
    margin-top: 80px;
    width: 200px;
    height: max-content;
    padding: var(--space-4);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: transparent;
    color: var(--color-text-primary);
    font-size: var(--font-size-sm);
    font-weight: 600;
    text-transform: uppercase;
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }
`;

const CATEGORIES = [
  {
    id: 'apps', label: 'Apps',
    subs: ['App Bundle', 'Placement ID', 'URL']
  },
  {
    id: 'location', label: 'Location',
    subs: ['Country', 'State']
  },
  {
    id: 'devices', label: 'Device IDs',
    subs: ['Present', 'Missing']
  },
  {
    id: 'format', label: 'Ad Format',
    subs: ['Interstitial', 'Rewarded']
  },
  {
    id: 'network', label: 'Network',
    subs: ['Cellular', 'WiFi']
  }
];

class BidMultiplierPageElement extends BaseComponent {
  private activeCategory: string = 'apps';

  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
  }

  protected onMount(): void {
    this.shadow.addEventListener('click', this.handleClick);
  }

  protected onUnmount(): void {
    this.shadow.removeEventListener('click', this.handleClick);
  }
  
  private handleClick = (e: Event) => {
    const target = e.target as HTMLElement;
    const catBtn = target.closest('.category-btn');
    if (catBtn) {
      const id = catBtn.getAttribute('data-id');
      if (id && id !== this.activeCategory) {
        this.activeCategory = id;
        this.rerender();
      }
    }
  };

  protected renderTemplate(): string {
    const activeData = CATEGORIES.find(c => c.id === this.activeCategory) || CATEGORIES[0]!;
    
    return html`
      <div class="page-container">
        <div class="page-header">
          <h1 class="page-title">Bids Multiplier</h1>
        </div>
        
        <div class="content-layout">
          
          <div class="table-section">
            <table>
              <thead>
                <tr>
                  <th style="width: 20%">Multiply Vale</th>
                  <th style="width: 50%">Country/App Bundle</th>
                  <th style="width: 30%">Expiry</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>1.5x</td>
                  <td>US / com.example.game</td>
                  <td>2026-12-31</td>
                </tr>
                <tr>
                  <td>0.8x</td>
                  <td>IN / com.another.app</td>
                  <td>2026-10-15</td>
                </tr>
                <tr>
                  <td colspan="3" style="text-align: center; color: var(--color-text-muted); padding: var(--space-8);">
                    (Mock Data) Select a category on the right to add more
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div class="flow-section">
            <div class="category-list">
              ${SafeHtmlString.trusted(CATEGORIES.map(c => `
                <button class="category-btn ${c.id === this.activeCategory ? 'active' : ''}" data-id="${c.id}">
                  ${c.label}
                </button>
              `).join(''))}
            </div>
            
            <svg class="connection-svg" viewBox="0 0 80 320" preserveAspectRatio="none">
              <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--color-border)" />
                </marker>
              </defs>
              ${SafeHtmlString.trusted(CATEGORIES.map((c, i) => {
                if (c.id !== this.activeCategory) return '';
                // Calculate Y position of the active button.
                // Button height: 40px, gap: 16px. Center is at (i * 56) + 20
                const btnY = (i * 56) + 20;
                // Target Y position (center of the sub-category box)
                // Box margin-top is 80px, let's say center is around 120px
                const boxY = 120; 
                return `<path class="wire" d="M0,${btnY} C40,${btnY} 40,${boxY} 80,${boxY}" marker-end="url(#arrow)"></path>`;
              }).join(''))}
            </svg>
            
            <div class="sub-category-box">
              ${SafeHtmlString.trusted(activeData.subs.map(s => `<div>${s}</div>`).join(''))}
            </div>
          </div>
          
        </div>
      </div>
    `;
  }
}

ComponentRegistry.register('bid-multiplier-page', BidMultiplierPageElement);
export { BidMultiplierPageElement };
