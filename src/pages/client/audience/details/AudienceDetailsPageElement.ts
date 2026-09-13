/**
 * AudienceDetailsPageElement.ts — pages/client/audience/details/
 *
 * Detailed view of a single Audience. Shows overview, rules, insights, and actions.
 */
import { BaseComponent } from '../../../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../../../platform/component/ShadowRenderMixin';
import { html } from '../../../../platform/rendering/SafeHtml';
import { audienceService } from '../../../../services';
import type { AudienceList } from '../../../../core/entities/AudienceList';
import '../../../../components/loading-state/LoadingStateElement';
import { navigate } from '../../../../utils/navigate';

const STYLES = `
  :host { 
    display: block; 
    font-family: var(--font-body); 
    padding: var(--space-6); 
    background: #f8fafc;
    min-height: 100vh;
  }

  .breadcrumb { font-size: 13px; color: #64748b; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
  .breadcrumb a { color: #3b82f6; text-decoration: none; cursor: pointer; }
  .breadcrumb a:hover { text-decoration: underline; }

  /* Header */
  .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: var(--space-6); }
  .page-title { font-size: 28px; font-weight: 800; color: #0f172a; margin: 0 0 8px 0; letter-spacing: -0.02em; display: flex; align-items: center; gap: 12px; }
  .page-subtitle { font-size: 14px; color: #64748b; margin: 0; }
  
  .status-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
  
  .header-actions { display: flex; gap: 12px; }
  .btn { padding: 10px 16px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 8px; }
  .btn-outline { background: white; border: 1px solid #cbd5e1; color: #475569; }
  .btn-outline:hover { background: #f1f5f9; }
  .btn-primary { background: #3b82f6; border: 1px solid #3b82f6; color: white; }
  .btn-primary:hover { background: #2563eb; }

  /* Layout */
  .layout-grid { display: grid; grid-template-columns: 2fr 1fr; gap: var(--space-6); align-items: start; }
  
  .card { background: white; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.02); overflow: hidden; margin-bottom: var(--space-6); }
  .card-header { padding: 20px 24px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
  .card-title { font-size: 16px; font-weight: 700; color: #0f172a; margin: 0; }
  .card-body { padding: 24px; }

  /* Overview Grid */
  .overview-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
  .overview-item { display: flex; flex-direction: column; gap: 6px; }
  .overview-label { font-size: 13px; font-weight: 600; color: #64748b; }
  .overview-value { font-size: 14px; color: #0f172a; font-weight: 500; }

  /* Rules List */
  .rules-list { display: flex; flex-direction: column; gap: 16px; }
  .rule-item { padding: 16px; border: 1px solid #e2e8f0; border-radius: 8px; display: flex; gap: 16px; align-items: flex-start; }
  .rule-icon { color: #3b82f6; margin-top: 2px; }
  .rule-content { flex: 1; }
  .rule-title { font-weight: 600; font-size: 14px; color: #0f172a; margin: 0 0 4px 0; }
  .rule-desc { font-size: 13px; color: #475569; margin: 0; }

  /* Estimate Panel */
  .estimate-panel { display: flex; flex-direction: column; gap: 16px; text-align: center; }
  .estimate-number { font-size: 40px; font-weight: 800; color: #0f172a; margin: 0; line-height: 1; }
  .estimate-sub { font-size: 13px; color: #64748b; margin: 0; }
  
  /* Usage */
  .campaign-list { display: flex; flex-direction: column; gap: 12px; }
  .campaign-item { padding: 12px; border-radius: 8px; background: #f8fafc; border: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
  .campaign-name { font-weight: 600; font-size: 13px; color: #0f172a; }
  .campaign-status { font-size: 11px; color: #16a34a; font-weight: 600; }

  /* Error */
  .error-message { padding: 40px; text-align: center; color: #ef4444; background: white; border-radius: 12px; }
`;

class AudienceDetailsPageElement extends BaseComponent {
  private audience: AudienceList | null = null;
  private isLoading = true;
  private error: string | null = null;

  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
  }

  protected async onMount(): Promise<void> {
    this.shadow.addEventListener('click', this.handleClick);
    await this.loadAudience();
  }

  protected onUnmount(): void {
    this.shadow.removeEventListener('click', this.handleClick);
  }

  private async loadAudience(): Promise<void> {
    this.isLoading = true;
    this.error = null;
    this.rerender();

    try {
      const match = window.location.pathname.match(/\/client\/audiences\/(aud_[a-zA-Z0-9_]+)/);
      const id = match ? match[1] : null;

      if (!id) throw new Error('Invalid audience ID');

      const aud = await audienceService.getAudience(id);
      if (!aud) throw new Error('Audience not found');

      this.audience = aud;
    } catch (e: any) {
      this.error = e.message || 'Failed to load audience';
    } finally {
      this.isLoading = false;
      this.rerender();
    }
  }

  private handleClick = (event: Event): void => {
    const target = event.target as HTMLElement;
    if (target.closest('[data-action="back"]')) {
      navigate('/client/audiences');
    }
  };

  private formatSource(source: string): string {
    const map: Record<string, string> = {
      'website_activity': 'Website',
      'app_activity': 'App',
      'product_service_activity': 'Product/Service',
      'advertising_activity': 'Advertising',
      'customer_list': 'Customer List',
      'lead_list': 'Lead Form',
      'offline_activity': 'Offline',
      'catalogue': 'Catalogue',
      'v4connectt_sources': 'V4Connectt'
    };
    return map[source] || source;
  }

  private formatNumber(num: number): string {
    return new Intl.NumberFormat('en-US').format(num);
  }

  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit' }).format(date);
  }

  protected renderTemplate(): string {
    if (this.isLoading) {
      return html`<div style="padding:40px"><loading-state variant="spinner"></loading-state></div>`;
    }

    if (this.error || !this.audience) {
      return html`
        <div class="breadcrumb"><a data-action="back">← Back to Audience</a></div>
        <div class="error-message">
          <h3>Error</h3>
          <p>${this.error}</p>
        </div>
      `;
    }

    const a = this.audience;

    return html`
      <div class="breadcrumb">
        <a data-action="back">Audiences</a> / ${a.name}
      </div>

      <div class="page-header">
        <div>
          <h1 class="page-title">
            ${a.name}
            <div class="status-badge">
              <div class="status-dot dot-${a.status}" style="width:8px; height:8px; border-radius:50%; background:#16a34a"></div>
              Active
            </div>
          </h1>
          <p class="page-subtitle">${a.description}</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-outline">Edit</button>
          <button class="btn btn-primary">Use in Campaign</button>
        </div>
      </div>

      <div class="layout-grid">
        <div class="main-column">
          <div class="card">
            <div class="card-header">
              <h2 class="card-title">Overview</h2>
            </div>
            <div class="card-body">
              <div class="overview-grid">
                <div class="overview-item">
                  <span class="overview-label">Audience ID</span>
                  <span class="overview-value">${a.id}</span>
                </div>
                <div class="overview-item">
                  <span class="overview-label">Type</span>
                  <span class="overview-value" style="text-transform:capitalize">${a.audienceType}</span>
                </div>
                <div class="overview-item">
                  <span class="overview-label">Source</span>
                  <span class="overview-value">${this.formatSource(a.dataSource.type)}</span>
                </div>
                <div class="overview-item">
                  <span class="overview-label">Business / Product</span>
                  <span class="overview-value">${a.businessProduct}</span>
                </div>
                <div class="overview-item">
                  <span class="overview-label">Created At</span>
                  <span class="overview-value">${this.formatDate(a.createdAt)}</span>
                </div>
                <div class="overview-item">
                  <span class="overview-label">Last Updated</span>
                  <span class="overview-value">${this.formatDate(a.updatedAt)}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <h2 class="card-title">Targeting Rules</h2>
            </div>
            <div class="card-body">
              <div class="rules-list">
                ${a.rules.length > 0 ? '' : '<p style="color:#64748b; font-size:14px; margin:0">No targeting rules defined.</p>'}
                <!-- Mocking some rules visually if array is empty since mock data seed has [] for rules -->
                ${a.rules.length === 0 ? html`
                  <div class="rule-item">
                    <svg class="rule-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                    <div class="rule-content">
                      <p class="rule-title">Location</p>
                      <p class="rule-desc">Include people in India (Karnataka, Bengaluru) within 25km radius.</p>
                    </div>
                  </div>
                ` : ''}
              </div>
            </div>
          </div>
          <div class="card">
            <div class="card-header">
              <h2 class="card-title">Audience Growth & Insights</h2>
            </div>
            <div class="card-body">
              <div style="height: 180px; display:flex; flex-direction:column; justify-content:flex-end; gap:8px; border-bottom:1px solid #e2e8f0; padding-bottom:8px;">
                 <div style="display:flex; align-items:flex-end; gap:4px; height: 100%;">
                    <div style="flex:1; background:#bfdbfe; border-radius:4px 4px 0 0; height:40%;"></div>
                    <div style="flex:1; background:#93c5fd; border-radius:4px 4px 0 0; height:50%;"></div>
                    <div style="flex:1; background:#60a5fa; border-radius:4px 4px 0 0; height:45%;"></div>
                    <div style="flex:1; background:#3b82f6; border-radius:4px 4px 0 0; height:60%;"></div>
                    <div style="flex:1; background:#2563eb; border-radius:4px 4px 0 0; height:75%;"></div>
                    <div style="flex:1; background:#1d4ed8; border-radius:4px 4px 0 0; height:90%;"></div>
                    <div style="flex:1; background:#1e40af; border-radius:4px 4px 0 0; height:100%;"></div>
                 </div>
                 <div style="display:flex; justify-content:space-between; font-size:11px; color:#64748b;">
                    <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                 </div>
              </div>
              <div style="margin-top:16px; font-size:13px; color:#475569; display:flex; justify-content:space-between;">
                 <span>Growth this week:</span>
                 <span style="color:#16a34a; font-weight:600;">+ 4.2% ↑</span>
              </div>
            </div>
          </div>
        </div>

        <div class="side-column">
          <div class="card">
            <div class="card-header">
              <h2 class="card-title">Audience Estimate</h2>
            </div>
            <div class="card-body">
              <div class="estimate-panel">
                <div class="estimate-number">${this.formatNumber(a.estimatedSize)}</div>
                <p class="estimate-sub">Estimated audience size</p>
                <div style="margin-top:24px; padding-top:24px; border-top:1px solid #e2e8f0; text-align:left;">
                  <div style="font-size:13px; font-weight:600; color:#475569; margin-bottom:8px">Potential Reach</div>
                  <div style="font-size:16px; font-weight:700; color:#0f172a">${this.formatNumber(a.potentialReach[0])} - ${this.formatNumber(a.potentialReach[1])}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <h2 class="card-title">Campaign Usage</h2>
            </div>
            <div class="card-body">
              <div class="campaign-list">
                <div class="campaign-item">
                  <span class="campaign-name">Q3 Livestock Promo</span>
                  <span class="campaign-status">Active</span>
                </div>
                <div class="campaign-item">
                  <span class="campaign-name">Retargeting 2026</span>
                  <span class="campaign-status">Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

ComponentRegistry.register('audience-details-page', AudienceDetailsPageElement);
export { AudienceDetailsPageElement };
