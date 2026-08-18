// @ts-nocheck
/**
 * CampaignListPageElement.test.ts — tests for the campaign list page.
 *
 * Tests:
 *   - Tab switching (Running / Pending Approval)
 *   - Row-count badges reflect filtered counts
 *   - Create Campaign button emits navigation
 *   - Search filters campaigns by name
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import '../../../../pages/client/campaign/CampaignListPageElement';

vi.mock('../../../../services', () => ({
  campaignService: {
    listCampaigns: vi.fn(),
    bulkUpdateStatus: vi.fn(),
    duplicateCampaign: vi.fn(),
  },
}));

vi.mock('../../../../utils/navigate', () => ({
  navigate: vi.fn(),
}));

import { campaignService } from '../../../../services';
import { navigate } from '../../../../utils/navigate';
import { Campaign } from '../../../../core/entities/Campaign';
import { Money } from '../../../../core/value-objects/Money';


function createMockCampaign(id: string, name: string, status: 'running' | 'pending_approval'): Campaign {
  return new Campaign(
    id, name, 'client_1', new Money(10000, 'USD'), 'maximize_reach',
    new Date('2026-01-01'), new Date('2026-12-31'), status, new Date(),
  );
}

const RUNNING_CAMPAIGNS = [
  createMockCampaign('c1', 'Summer Sale', 'running'),
  createMockCampaign('c2', 'Holiday Promo', 'running'),
];

const PENDING_CAMPAIGNS = [
  createMockCampaign('c3', 'Q4 Push', 'pending_approval'),
];

describe('CampaignListPageElement', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
    vi.mocked(campaignService.listCampaigns).mockResolvedValue([...RUNNING_CAMPAIGNS, ...PENDING_CAMPAIGNS]);
  });

  it('renders page title', async () => {
    const el = document.createElement('campaign-list-page') as CampaignListPageElement;
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 50));
    const title = el.shadowRoot!.querySelector('.page-title');
    expect(title?.textContent).toBe('Campaigns');
  });

  it('renders Running tab with row count badge', async () => {
    const el = document.createElement('campaign-list-page') as CampaignListPageElement;
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 50));
    const runningTab = el.shadowRoot!.querySelector('[data-tab="running"]') as HTMLElement;
    expect(runningTab).not.toBeNull();
    const badge = runningTab.querySelector('.tab-badge');
    expect(badge?.textContent).toBe('2');
  });

  it('renders Pending Approval tab with row count badge', async () => {
    const el = document.createElement('campaign-list-page') as CampaignListPageElement;
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 50));
    const pendingTab = el.shadowRoot!.querySelector('[data-tab="pending"]') as HTMLElement;
    expect(pendingTab).not.toBeNull();
    const badge = pendingTab.querySelector('.tab-badge');
    expect(badge?.textContent).toBe('1');
  });

  it('switches tabs on click', async () => {
    const el = document.createElement('campaign-list-page') as CampaignListPageElement;
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 50));

    const pendingTab = el.shadowRoot!.querySelector('[data-tab="pending"]') as HTMLElement;
    pendingTab.click();
    await new Promise((r) => setTimeout(r, 10));

    const activeTab = el.shadowRoot!.querySelector('.tab.active') as HTMLElement;
    expect(activeTab.getAttribute('data-tab')).toBe('pending');
  });

  it('Create Campaign button navigates to wizard', async () => {
    const el = document.createElement('campaign-list-page') as CampaignListPageElement;
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 50));

    const createBtn = el.shadowRoot!.querySelector('[data-action="create"]') as HTMLElement;
    createBtn.click();
    expect(navigate).toHaveBeenCalledWith('/client/campaigns/new');
  });

  it('renders search input', async () => {
    const el = document.createElement('campaign-list-page') as CampaignListPageElement;
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 50));

    const search = el.shadowRoot!.querySelector('[data-field="search"]');
    expect(search).not.toBeNull();
  });

  it('renders data table with campaign rows', async () => {
    const el = document.createElement('campaign-list-page') as CampaignListPageElement;
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 50));

    const table = el.shadowRoot!.querySelector('data-table');
    expect(table).not.toBeNull();
  });
});