// @ts-nocheck
/**
 * IntegrationsPageElement.test.ts — tests/pages/client/integrations-api-keys/
 *
 * Tests API key one-time reveal — real key not retained in state after
 * reveal closes.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { IntegrationsPageElement } from '../../../../pages/client/integrations-api-keys/IntegrationsPageElement';

vi.mock('../../../../services', () => ({
  apiKeyService: {
    listKeys: vi.fn().mockResolvedValue([]),
    generateKey: vi.fn().mockResolvedValue({ apiKey: { id: 'key_1', name: 'Test', maskedKey: 'va_sk_...abcd', status: 'active' }, realKey: 'va_sk_real_abcd1234' }),
    revokeKey: vi.fn().mockResolvedValue(undefined),
  },
  integrationService: {
    listIntegrations: vi.fn().mockResolvedValue([]),
    listWebhooks: vi.fn().mockResolvedValue([]),
    connectIntegration: vi.fn(),
    disconnectIntegration: vi.fn(),
    createWebhook: vi.fn(),
    deleteWebhook: vi.fn(),
    testPostback: vi.fn().mockResolvedValue({ success: true, message: 'Test sent' }),
  },
  masterIntegrationService: {
    getMmpList: vi.fn().mockResolvedValue([
      { providerKey: 'appsflyer', name: 'AppsFlyer', description: 'AppsFlyer integration' },
      { providerKey: 'adjust', name: 'Adjust', description: 'Adjust integration' },
      { providerKey: 'kochava', name: 'Kochava', description: 'Kochava integration' },
      { providerKey: 'branch', name: 'Branch', description: 'Branch integration' },
      { providerKey: 'singular', name: 'Singular', description: 'Singular integration' },
      { providerKey: 'custom', name: 'Custom MMP', description: 'Custom integration' }
    ])
  }
}));

import '../../../../pages/client/integrations-api-keys/IntegrationsPageElement';

describe('IntegrationsPageElement', () => {
  let el: IntegrationsPageElement;

  beforeEach(() => {
    el = document.createElement('integrations-page') as IntegrationsPageElement;
    document.body.appendChild(el);
  });

  afterEach(() => {
    if (el.parentNode) document.body.removeChild(el);
  });

  it('renders page title', async () => {
    await new Promise((r) => setTimeout(r, 50));
    expect(el.shadowRoot!.querySelector('.page-title')?.textContent).toBe('Integrations & API Keys');
  });

  it('renders 4 tabs: API Keys, Postback, MMP, Webhooks', async () => {
    await new Promise((r) => setTimeout(r, 50));
    const tabs = el.shadowRoot!.querySelectorAll('.tab');
    expect(tabs.length).toBe(4);
    const texts = Array.from(tabs).map((t: Element) => t.textContent);
    expect(texts).toContain('API Keys');
    expect(texts).toContain('Postback / S2S');
    expect(texts).toContain('MMP Connections');
    expect(texts).toContain('Webhooks');
  });

  it('generateKey shows reveal banner with real key', async () => {
    await new Promise((r) => setTimeout(r, 50));
    // Set key name and trigger generate
    const nameInput = el.shadowRoot!.querySelector('input[name="key-name"]') as HTMLInputElement;
    if (nameInput) {
      nameInput.value = 'Test Key';
      nameInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
    const generateBtn = el.shadowRoot!.querySelector('[data-action="generate-key"]') as HTMLButtonElement;
    generateBtn.click();
    await new Promise((r) => setTimeout(r, 50));
    // The reveal banner should appear with the real key
    const banner = el.shadowRoot!.querySelector('.reveal-banner');
    expect(banner).not.toBeNull();
    expect(banner?.textContent).toContain('va_sk_real_abcd1234');
  });

  it('dismissing reveal clears the real key from state', async () => {
    await new Promise((r) => setTimeout(r, 50));
    const generateBtn = el.shadowRoot!.querySelector('[data-action="generate-key"]') as HTMLButtonElement;
    generateBtn.click();
    await new Promise((r) => setTimeout(r, 50));
    // Dismiss the reveal
    const dismissBtn = el.shadowRoot!.querySelector('[data-action="dismiss-reveal"]') as HTMLButtonElement;
    dismissBtn.click();
    await new Promise((r) => setTimeout(r, 10));
    // The reveal banner should be gone
    expect(el.shadowRoot!.querySelector('.reveal-banner')).toBeNull();
    // The real key should not be in the rendered HTML
    const html = el.shadowRoot!.innerHTML;
    expect(html).not.toContain('va_sk_real_');
  });

  it('MMP Connections tab shows prebuilt provider cards', async () => {
    await new Promise((r) => setTimeout(r, 50));
    const mmpTab = Array.from(el.shadowRoot!.querySelectorAll('.tab')).find((t: Element) => t.textContent === 'MMP Connections') as HTMLElement;
    mmpTab.click();
    await new Promise((r) => setTimeout(r, 10));
    const cards = el.shadowRoot!.querySelectorAll('.mmp-card');
    expect(cards.length).toBe(6); // AppsFlyer, Adjust, Kochava, Branch, Singular, Custom
  });

  it('Postback tab has macro cheat sheet', async () => {
    await new Promise((r) => setTimeout(r, 50));
    const postbackTab = Array.from(el.shadowRoot!.querySelectorAll('.tab')).find((t: Element) => t.textContent === 'Postback / S2S') as HTMLElement;
    postbackTab.click();
    await new Promise((r) => setTimeout(r, 10));
    expect(el.shadowRoot!.querySelector('.macro-list')).not.toBeNull();
  });
});