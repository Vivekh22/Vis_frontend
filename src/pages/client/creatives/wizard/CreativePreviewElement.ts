import { BaseComponent } from '../../../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../../../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString } from '../../../../platform/rendering/SafeHtml';
import { CreativeFormData } from './creative-wizard-types';

const STYLES = `
  :host { display: block; font-family: var(--font-body); height: 100%; }
  .preview-container {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f8fafc;
    border-radius: var(--radius-lg);
    padding: var(--space-4);
  }
  .mobile-frame {
    width: 300px;
    height: 600px;
    background: #ffffff;
    border-radius: 36px;
    border: 12px solid #1e293b;
    box-shadow: 0 20px 40px rgba(0,0,0,0.1);
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  .mobile-notch {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 120px;
    height: 24px;
    background: #1e293b;
    border-bottom-left-radius: 12px;
    border-bottom-right-radius: 12px;
    z-index: 10;
  }
  .mobile-content {
    flex: 1;
    overflow-y: auto;
    background: #f1f5f9;
    padding-top: 40px;
  }
  
  /* Ad Preview Styling */
  .ad-card {
    background: white;
    margin: var(--space-3);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-sm);
    overflow: hidden;
  }
  .ad-header {
    padding: var(--space-2) var(--space-3);
    display: flex;
    align-items: center;
    gap: var(--space-2);
    border-bottom: 1px solid var(--color-border);
  }
  .ad-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #e2e8f0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
  }
  .ad-meta {
    flex: 1;
  }
  .ad-advertiser {
    font-size: 13px;
    font-weight: 700;
    color: var(--color-text-primary);
    margin: 0;
  }
  .ad-sponsored {
    font-size: 11px;
    color: var(--color-text-muted);
    margin: 0;
  }
  .ad-media {
    width: 100%;
    height: 200px;
    background: #e2e8f0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #94a3b8;
    position: relative;
  }
  .ad-media img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .ad-body {
    padding: var(--space-3);
  }
  .ad-headline {
    font-size: 14px;
    font-weight: 700;
    margin: 0 0 4px 0;
    color: var(--color-text-primary);
  }
  .ad-desc {
    font-size: 13px;
    color: var(--color-text-secondary);
    margin: 0 0 12px 0;
  }
  .ad-cta {
    display: block;
    width: 100%;
    padding: 10px;
    text-align: center;
    background: #f1f5f9;
    color: var(--color-primary);
    font-weight: 700;
    font-size: 13px;
    border-radius: 6px;
    text-decoration: none;
  }
  .empty-state {
    text-align: center;
    padding: 40px 20px;
    color: #94a3b8;
    font-size: 14px;
  }
`;

class CreativePreviewElement extends BaseComponent {
  private _data!: CreativeFormData;

  set data(val: CreativeFormData) {
    this._data = val;
    this.rerender();
  }

  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
  }

  protected renderTemplate(): string {
    if (!this._data) return html`<div class="preview-container"></div>`;

    const advertiser = this._data.advertiserName || 'Advertiser Name';
    const headline = this._data.headline || 'Headline goes here';
    const desc = this._data.description || 'Description will appear here below the headline.';
    const cta = this._data.ctaText || 'Learn More';
    const hasMedia = !!this._data.assetUrl;

    return html`
      <div class="preview-container">
        <div class="mobile-frame">
          <div class="mobile-notch"></div>
          <div class="mobile-content">
            
            <div class="ad-card">
              <div class="ad-header">
                <div class="ad-avatar">${advertiser.charAt(0).toUpperCase()}</div>
                <div class="ad-meta">
                  <p class="ad-advertiser">${advertiser}</p>
                  <p class="ad-sponsored">Sponsored</p>
                </div>
              </div>
              
              <div class="ad-media">
                ${hasMedia ? SafeHtmlString.trusted(`<img src="${this._data.assetUrl}" alt="Ad Media" />`) : SafeHtmlString.trusted(`<span>No Media Uploaded</span>`)}
              </div>
              
              <div class="ad-body">
                <h4 class="ad-headline">${headline}</h4>
                <p class="ad-desc">${desc}</p>
                <div class="ad-cta">${cta}</div>
              </div>
            </div>

          </div>
        </div>
      </div>
    `;
  }
}

ComponentRegistry.register('creative-preview', CreativePreviewElement);
export { CreativePreviewElement };
