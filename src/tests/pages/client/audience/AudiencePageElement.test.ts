// @ts-nocheck
/**
 * AudiencePageElement.test.ts — tests for pages/client/audience/.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AudiencePageElement } from '../../../../pages/client/audience/AudiencePageElement';
import { AudienceList } from '../../../../core/entities/AudienceList';

vi.mock('../../../../services', () => ({
  audienceService: {
    listAudiences: vi.fn().mockResolvedValue([]),
    createAudience: vi.fn().mockResolvedValue({ id: 'aud_new' }),
  },
}));

import '../../../../pages/client/audience/AudiencePageElement';
import { audienceService } from '../../../../services';

describe('AudiencePageElement', () => {
  let el: AudiencePageElement;

  beforeEach(() => {
    vi.mocked(audienceService.listAudiences).mockResolvedValue([
      new AudienceList(
        'aud_1',
        'Test Aud',
        'Test Desc',
        'custom',
        'All',
        { type: 'website_activity', validated: true },
        [],
        1000,
        [500, 1500],
        'active',
        new Date(),
        new Date(),
        'client1'
      )
    ]);
    el = document.createElement('audience-page') as AudiencePageElement;
    document.body.appendChild(el);
  });

  afterEach(() => {
    if (el.parentNode) document.body.removeChild(el);
  });

  it('renders page title and subtitle', async () => {
    await new Promise((r) => setTimeout(r, 50));
    expect(el.shadowRoot!.querySelector('.page-title')?.textContent).toContain('Audience');
    expect(el.shadowRoot!.querySelector('.page-subtitle')?.textContent).toContain('Create, manage, and target');
  });

  it('renders KPI cards', async () => {
    await new Promise((r) => setTimeout(r, 50));
    const kpiCards = el.shadowRoot!.querySelectorAll('.kpi-card');
    expect(kpiCards.length).toBe(4);
    
    // Check that we have values in KPI cards
    const labels = Array.from(kpiCards).map(c => c.querySelector('.kpi-label')?.textContent);
    expect(labels).toContain('Total Audiences');
    expect(labels).toContain('Active Audiences');
  });

  it('renders table headers', async () => {
    await new Promise((r) => setTimeout(r, 50));
    const ths = el.shadowRoot!.querySelectorAll('th');
    const texts = Array.from(ths).map((th: Element) => th.textContent?.trim() ?? '');
    expect(texts).toContain('Audience Name');
    expect(texts).toContain('Estimated Size ℹ️');
    expect(texts).toContain('Status');
  });

  it('renders list items', async () => {
    await new Promise((r) => setTimeout(r, 50));
    const rows = el.shadowRoot!.querySelectorAll('tbody tr');
    expect(rows.length).toBeGreaterThan(0);
    const firstRowContent = rows[0].textContent;
    expect(firstRowContent).toContain('Test Aud');
    expect(firstRowContent).toContain('Test Desc');
  });

  it('opens wizard on Create button click', async () => {
    await new Promise((r) => setTimeout(r, 50));
    const createBtn = el.shadowRoot!.querySelector('[data-action="create"]') as HTMLButtonElement;
    createBtn.click();
    await new Promise((r) => setTimeout(r, 10));
    expect(el.shadowRoot!.querySelector('audience-wizard')).not.toBeNull();
  });
});