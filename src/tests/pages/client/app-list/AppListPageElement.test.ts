// @ts-nocheck
/**
 * AppListPageElement.test.ts — tests for pages/client/app-list/.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AppListPageElement } from '../../../../pages/client/app-list/AppListPageElement';

vi.mock('../../../../services', () => ({
  appListService: {
    listAppLists: vi.fn().mockResolvedValue([]),
    createAppList: vi.fn().mockResolvedValue({ id: 'al_new' }),
  },
}));

import '../../../../pages/client/app-list/AppListPageElement';

import { appListService } from '../../../../services';
import { AppListEntry } from '../../../../core/entities/AppListEntry';

describe('AppListPageElement', () => {
  let el: AppListPageElement;

  beforeEach(() => {
    vi.mocked(appListService.listAppLists).mockResolvedValue([]);
    el = document.createElement('app-list-page') as AppListPageElement;
    document.body.appendChild(el);
  });

  afterEach(() => {
    if (el.parentNode) document.body.removeChild(el);
  });

  it('renders page title', async () => {
    await new Promise((r) => setTimeout(r, 50));
    expect(el.shadowRoot!.querySelector('.page-title')?.textContent).toBe('App Lists');
  });

  it('renders table headers', async () => {
    await new Promise((r) => setTimeout(r, 50));
    const ths = el.shadowRoot!.querySelectorAll('th');
    const texts = Array.from(ths).map((th: Element) => th.textContent ?? '');
    expect(texts).toContain('App List ID');
    expect(texts).toContain('No. of Apps');
    expect(texts).toContain('White Listed');
    expect(texts).toContain('Black Listed');
  });

  it('renders app list rows with correct counts', async () => {
    vi.mocked(appListService.listAppLists).mockResolvedValue([
      new AppListEntry('al1', 'Whitelist 1', ['com.a', 'com.b'], [], [], 'whitelist', new Date()),
      new AppListEntry('al2', 'Blacklist 1', ['com.x', 'com.y', 'com.z'], [], [], 'blacklist', new Date()),
    ]);
    el = document.createElement('app-list-page') as AppListPageElement;
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 50));
    const rows = el.shadowRoot!.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
  });

  it('opens creation drawer on Create button click', async () => {
    await new Promise((r) => setTimeout(r, 50));
    const createBtn = el.shadowRoot!.querySelector('[data-action="create"]') as HTMLButtonElement;
    createBtn.click();
    await new Promise((r) => setTimeout(r, 10));
    expect(el.shadowRoot!.querySelector('.drawer')).not.toBeNull();
  });

  it('save button is disabled when name is empty', async () => {
    await new Promise((r) => setTimeout(r, 50));
    const createBtn = el.shadowRoot!.querySelector('[data-action="create"]') as HTMLButtonElement;
    createBtn.click();
    await new Promise((r) => setTimeout(r, 10));
    const saveBtn = el.shadowRoot!.querySelector('[data-action="save"]') as HTMLButtonElement;
    expect(saveBtn.disabled).toBe(true);
  });

  it('renders tag-input components in drawer', async () => {
    await new Promise((r) => setTimeout(r, 50));
    const createBtn = el.shadowRoot!.querySelector('[data-action="create"]') as HTMLButtonElement;
    createBtn.click();
    await new Promise((r) => setTimeout(r, 10));
    const tagInputs = el.shadowRoot!.querySelectorAll('tag-input');
    expect(tagInputs.length).toBeGreaterThanOrEqual(3);
  });
});