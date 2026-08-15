/**
 * CreativeListPageElement.test.ts — tests for pages/client/creatives/.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { CreativeListPageElement } from '../../../../pages/client/creatives/CreativeListPageElement';

vi.mock('../../../../services', () => ({
  creativeService: {
    listCreatives: vi.fn(),
    deleteCreative: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../../../utils/navigate', () => ({
  navigate: vi.fn(),
}));

// Stub data-table so syncTable() can set rows
if (!customElements.get('data-table')) {
  class MockDataTable extends HTMLElement {
    columns: unknown[] = [];
    rows: Record<string, unknown>[] = [];
    totalItems = 0;
    pageSize = 10;
  }
  customElements.define('data-table', MockDataTable);
}

import '../../../../pages/client/creatives/CreativeListPageElement';

import { creativeService } from '../../../../services';
import { Creative } from '../../../../core/entities/Creative';
import { CreativeStatus } from '../../../../core/enums/CreativeStatus';

function makeCreative(id: string, name: string, format: string, status: CreativeStatus, campaignId = 'camp1'): Creative {
  return new Creative(id, name, campaignId, format, `mock://${id}.png`, status, new Date());
}

describe('CreativeListPageElement', () => {
  let el: CreativeListPageElement;

  beforeEach(() => {
    vi.mocked(creativeService.listCreatives).mockResolvedValue([]);
    el = document.createElement('creative-list-page') as CreativeListPageElement;
    document.body.appendChild(el);
  });

  afterEach(() => {
    if (el.parentNode) document.body.removeChild(el);
  });

  it('renders page title and create button', async () => {
    await new Promise((r) => setTimeout(r, 50));
    expect(el.shadowRoot!.querySelector('.page-title')?.textContent).toBe('Creatives');
    expect(el.shadowRoot!.querySelector('[data-action="create"]')).not.toBeNull();
  });

  it('renders filter dropdowns for type and status', async () => {
    await new Promise((r) => setTimeout(r, 50));
    expect(el.shadowRoot!.querySelector('[data-filter="type"]')).not.toBeNull();
    expect(el.shadowRoot!.querySelector('[data-filter="status"]')).not.toBeNull();
  });

  it('renders type badges with correct CSS classes', async () => {
    vi.mocked(creativeService.listCreatives).mockResolvedValue([
      makeCreative('c1', 'Img Ad', 'image', CreativeStatus.Active),
      makeCreative('c2', 'Vid Ad', 'video', CreativeStatus.Active),
      makeCreative('c3', 'VAST Ad', 'vast', CreativeStatus.Active),
    ]);
    el = document.createElement('creative-list-page') as CreativeListPageElement;
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 50));
    const table = el.shadowRoot!.querySelector('data-table') as HTMLElement & { rows: Record<string, unknown>[] };
    expect(table).not.toBeNull();
    expect(table.rows.length).toBe(3);
  });

  it('displays dual versions when pending edit of live creative exists', async () => {
    vi.mocked(creativeService.listCreatives).mockResolvedValue([
      makeCreative('c1', 'My Ad', 'image', CreativeStatus.Active, 'camp1'),
      makeCreative('c2', 'My Ad', 'image', CreativeStatus.PendingApproval, 'camp1'),
    ]);
    el = document.createElement('creative-list-page') as CreativeListPageElement;
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 50));
    const table = el.shadowRoot!.querySelector('data-table') as HTMLElement & { rows: Record<string, unknown>[] };
    expect(table).not.toBeNull();
    expect(table.rows.length).toBe(2);
    const pendingRow = table.rows.find((r) => String(r['name'] ?? '').includes('Pending Edit'));
    expect(pendingRow).toBeDefined();
  });
});