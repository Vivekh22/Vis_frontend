// @ts-nocheck
/**
 * SettingsPageElement.test.ts — tests/pages/client/settings/
 *
 * Tests that Deactivate Account submits a request, doesn't self-execute.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SettingsPageElement } from '../../../../pages/client/settings/SettingsPageElement';

vi.mock('../../../../services', () => ({
  settingsService: {
    getActiveSessions: vi.fn().mockResolvedValue([]),
    getLoginHistory: vi.fn().mockResolvedValue([]),
    requestDeactivation: vi.fn().mockResolvedValue(undefined),
  },
}));

import '../../../../pages/client/settings/SettingsPageElement';

describe('SettingsPageElement', () => {
  let el: SettingsPageElement;

  beforeEach(() => {
    el = document.createElement('settings-page') as SettingsPageElement;
    document.body.appendChild(el);
  });

  afterEach(() => {
    if (el.parentNode) document.body.removeChild(el);
  });

  it('renders page title', async () => {
    await new Promise((r) => setTimeout(r, 50));
    expect(el.shadowRoot!.querySelector('.page-title')?.textContent).toBe('Settings');
  });

  it('renders 5 tabs', async () => {
    await new Promise((r) => setTimeout(r, 50));
    const tabs = el.shadowRoot!.querySelectorAll('.tab');
    expect(tabs.length).toBe(5);
    const texts = Array.from(tabs).map((t: Element) => t.textContent);
    expect(texts).toContain('Profile');
    expect(texts).toContain('Regional');
    expect(texts).toContain('Notifications');
    expect(texts).toContain('Security');
    expect(texts).toContain('Danger Zone');
  });

  it('Danger Zone tab has Request Deactivation button', async () => {
    await new Promise((r) => setTimeout(r, 50));
    const dangerTab = Array.from(el.shadowRoot!.querySelectorAll('.tab')).find((t: Element) => t.textContent === 'Danger Zone') as HTMLElement;
    dangerTab.click();
    await new Promise((r) => setTimeout(r, 10));
    expect(el.shadowRoot!.querySelector('[data-action="show-deactivate"]')).not.toBeNull();
  });

  it('clicking Request Deactivation opens modal', async () => {
    await new Promise((r) => setTimeout(r, 50));
    const dangerTab = Array.from(el.shadowRoot!.querySelectorAll('.tab')).find((t: Element) => t.textContent === 'Danger Zone') as HTMLElement;
    dangerTab.click();
    await new Promise((r) => setTimeout(r, 10));
    const btn = el.shadowRoot!.querySelector('[data-action="show-deactivate"]') as HTMLButtonElement;
    btn.click();
    await new Promise((r) => setTimeout(r, 10));
    expect(el.shadowRoot!.querySelector('.modal-overlay')).not.toBeNull();
  });

  it('confirming deactivation calls requestDeactivation — NOT a delete method', async () => {
    await new Promise((r) => setTimeout(r, 50));
    const dangerTab = Array.from(el.shadowRoot!.querySelectorAll('.tab')).find((t: Element) => t.textContent === 'Danger Zone') as HTMLElement;
    dangerTab.click();
    await new Promise((r) => setTimeout(r, 10));
    const showBtn = el.shadowRoot!.querySelector('[data-action="show-deactivate"]') as HTMLButtonElement;
    showBtn.click();
    await new Promise((r) => setTimeout(r, 10));
    const confirmBtn = el.shadowRoot!.querySelector('[data-action="confirm-deactivate"]') as HTMLButtonElement;
    confirmBtn.click();
    await new Promise((r) => setTimeout(r, 50));
    // Verify requestDeactivation was called — not a deleteAccount method
    const { settingsService } = await import('../../../../services');
    expect(vi.mocked(settingsService.requestDeactivation)).toHaveBeenCalledTimes(1);
    // Verify the modal shows "Request Submitted" confirmation
    expect(el.shadowRoot!.innerHTML).toContain('Request Submitted');
  });
});