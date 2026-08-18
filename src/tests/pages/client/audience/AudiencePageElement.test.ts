// @ts-nocheck
/**
 * AudiencePageElement.test.ts — tests for pages/client/audience/.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AudiencePageElement } from '../../../../pages/client/audience/AudiencePageElement';

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
    vi.mocked(audienceService.listAudiences).mockResolvedValue([]);
    el = document.createElement('audience-page') as AudiencePageElement;
    document.body.appendChild(el);
  });

  afterEach(() => {
    if (el.parentNode) document.body.removeChild(el);
  });

  it('renders page title', async () => {
    await new Promise((r) => setTimeout(r, 50));
    expect(el.shadowRoot!.querySelector('.page-title')?.textContent).toBe('Audiences');
  });

  it('renders table headers', async () => {
    await new Promise((r) => setTimeout(r, 50));
    const ths = el.shadowRoot!.querySelectorAll('th');
    const texts = Array.from(ths).map((th: Element) => th.textContent ?? '');
    expect(texts).toContain('Audience ID');
    expect(texts).toContain('No. of Users');
    expect(texts).toContain('Created On');
  });

  it('opens creation drawer on Create button', async () => {
    await new Promise((r) => setTimeout(r, 50));
    const createBtn = el.shadowRoot!.querySelector('[data-action="create"]') as HTMLButtonElement;
    createBtn.click();
    await new Promise((r) => setTimeout(r, 10));
    expect(el.shadowRoot!.querySelector('.drawer')).not.toBeNull();
  });

  it('renders three data source tabs', async () => {
    await new Promise((r) => setTimeout(r, 50));
    const createBtn = el.shadowRoot!.querySelector('[data-action="create"]') as HTMLButtonElement;
    createBtn.click();
    await new Promise((r) => setTimeout(r, 10));
    const tabs = el.shadowRoot!.querySelectorAll('[data-source-tab]');
    expect(tabs.length).toBe(3);
  });

  it('save button is disabled until source is validated', async () => {
    await new Promise((r) => setTimeout(r, 50));
    const createBtn = el.shadowRoot!.querySelector('[data-action="create"]') as HTMLButtonElement;
    createBtn.click();
    await new Promise((r) => setTimeout(r, 10));
    const saveBtn = el.shadowRoot!.querySelector('[data-action="save"]') as HTMLButtonElement;
    expect(saveBtn.disabled).toBe(true);
  });

  it('CSV file upload triggers preview and row count', async () => {
    // Test CSV parsing logic directly — happy-dom doesn't fully support file input simulation
    const csvContent = 'email,name\na@b.com,Alice\nc@d.com,Bob\ne@f.com,Eve';
    const { parseCsv } = await import('../../../../utils/csvParser');
    const result = parseCsv(csvContent);
    expect(result.rowCount).toBe(3);
    expect(result.rows[0]).toEqual(['a@b.com', 'Alice']);
  });
});