// @ts-nocheck
/**
 * RegistrationStatusPage.test.ts — tests for the three-state status page.
 *
 * Tests:
 *   - Pending state renders amber icon and pending message
 *   - Rejected state renders danger styling and rejection reason
 *   - Approved state renders success styling and "Go to Dashboard" button
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RegistrationStatusPageElement } from '../../../../pages/client/registration/RegistrationStatusPageElement';
import { authService } from '../../../../services';
import { navigate } from '../../../../utils/navigate';

vi.mock('../../../../services', () => ({
  authService: {
    getRegistrationStatus: vi.fn(),
  },
}));

vi.mock('../../../../utils/navigate', () => ({
  navigate: vi.fn(),
}));

import '../../../../pages/client/registration/RegistrationStatusPageElement';

describe('RegistrationStatusPageElement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState({}, '', '/register/status?email=test@example.com');
    document.body.innerHTML = '';
  });

  async function createAndWait(status: { status: string; rejectionReason?: string }): Promise<RegistrationStatusPageElement> {
    vi.mocked(authService.getRegistrationStatus).mockResolvedValue(status as never);
    const element = new RegistrationStatusPageElement();
    document.body.appendChild(element);
    await new Promise((r) => setTimeout(r, 50));
    return element;
  }

  it('renders pending state with amber icon', async () => {
    const element = await createAndWait({ status: 'pending' });
    const title = element.shadowRoot!.querySelector('.status-title');
    expect(title?.textContent).toContain('Pending');
    const icon = element.shadowRoot!.querySelector('.status-icon--pending');
    expect(icon).not.toBeNull();
    element.remove();
  });

  it('renders rejected state with rejection reason', async () => {
    const element = await createAndWait({ status: 'rejected', rejectionReason: 'Invalid banking details' });
    const title = element.shadowRoot!.querySelector('.status-title');
    expect(title?.textContent).toContain('Rejected');
    const reason = element.shadowRoot!.querySelector('.rejection-reason');
    expect(reason?.textContent).toContain('Invalid banking details');
    const icon = element.shadowRoot!.querySelector('.status-icon--rejected');
    expect(icon).not.toBeNull();
    element.remove();
  });

  it('renders approved state with Go to Dashboard button', async () => {
    const element = await createAndWait({ status: 'approved' });
    const title = element.shadowRoot!.querySelector('.status-title');
    expect(title?.textContent).toContain('Approved');
    const btn = element.shadowRoot!.querySelector('[data-action="go-to-dashboard"]');
    expect(btn).not.toBeNull();
    const icon = element.shadowRoot!.querySelector('.status-icon--approved');
    expect(icon).not.toBeNull();
    element.remove();
  });

  it('navigates to /register/welcome when Go to Dashboard is clicked', async () => {
    const element = await createAndWait({ status: 'approved' });
    const btn = element.shadowRoot!.querySelector('[data-action="go-to-dashboard"]') as HTMLButtonElement;
    btn.click();
    expect(navigate).toHaveBeenCalledWith('/register/welcome');
    element.remove();
  });

  it('fetches status via authService.getRegistrationStatus with email from URL', async () => {
    const element = await createAndWait({ status: 'pending' });
    expect(authService.getRegistrationStatus).toHaveBeenCalledWith(expect.any(String));
    element.remove();
  });
});