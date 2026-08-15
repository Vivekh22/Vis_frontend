/**
 * ReportsPageElement.test.ts — tests/pages/client/reports/
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ReportsPageElement } from '../../../../pages/client/reports/ReportsPageElement';

vi.mock('../../../../services', () => ({
  reportService: {
    generateReport: vi.fn().mockResolvedValue({ id: 'rpt_1', type: 'performance', generatedAt: new Date(), data: { entries: [] } }),
    scheduleReport: vi.fn().mockResolvedValue(undefined),
    getReportHistory: vi.fn().mockResolvedValue([]),
  },
}));

void ReportsPageElement;

describe('ReportsPageElement', () => {
  let el: ReportsPageElement;

  beforeEach(() => {
    el = document.createElement('reports-page') as ReportsPageElement;
    document.body.appendChild(el);
  });

  afterEach(() => {
    if (el.parentNode) document.body.removeChild(el);
  });

  it('renders page title', async () => {
    await new Promise((r) => setTimeout(r, 50));
    expect(el.shadowRoot!.querySelector('.page-title')?.textContent).toBe('Reports');
  });

  it('renders report type selector with 8 types', async () => {
    await new Promise((r) => setTimeout(r, 50));
    const options = el.shadowRoot!.querySelectorAll('select[name="report-type"] option');
    expect(options.length).toBe(8);
  });

  it('renders export buttons', async () => {
    await new Promise((r) => setTimeout(r, 50));
    expect(el.shadowRoot!.querySelector('[data-action="export-csv"]')).not.toBeNull();
    expect(el.shadowRoot!.querySelector('[data-action="export-excel"]')).not.toBeNull();
  });

  it('renders schedule and save template buttons', async () => {
    await new Promise((r) => setTimeout(r, 50));
    expect(el.shadowRoot!.querySelector('[data-action="schedule"]')).not.toBeNull();
    expect(el.shadowRoot!.querySelector('[data-action="save-template"]')).not.toBeNull();
  });
});