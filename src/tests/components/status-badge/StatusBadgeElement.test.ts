import { describe, it, expect } from 'vitest';
import type { StatusBadgeElement } from '../../../components/status-badge/StatusBadgeElement';
import '../../../components/status-badge/StatusBadgeElement';

describe('StatusBadgeElement', () => {
  it('renders known status with correct color class', () => {
    const el = document.createElement('status-badge') as StatusBadgeElement;
    document.body.appendChild(el);
    el.status = 'Active';
    const badge = el.shadowRoot!.querySelector('.badge');
    expect(badge?.className).toContain('badge--active');
    expect(badge?.textContent).toBe('Active');
    document.body.removeChild(el);
  });

  it('renders unrecognized status with neutral fallback and raw text', () => {
    const el = document.createElement('status-badge') as StatusBadgeElement;
    document.body.appendChild(el);
    el.status = 'Unknown';
    const badge = el.shadowRoot!.querySelector('.badge');
    expect(badge?.className).toContain('badge--neutral');
    expect(badge?.textContent).toBe('Unknown');
    document.body.removeChild(el);
  });
});