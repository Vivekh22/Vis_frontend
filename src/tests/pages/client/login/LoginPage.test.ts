/**
 * LoginPage.test.ts — tests for the login page's role-based post-login redirect.
 *
 * Tests:
 *   - Client role redirects to /client/dashboard
 *   - Admin role redirects to /admin/overview
 *   - Super-admin role redirects to /super-admin/overview
 *   - Invalid credentials show error
 *   - Forgot password flow shows confirmation
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { LoginPageElement } from '../../../../pages/client/login/LoginPageElement';
import { authService } from '../../../../services';
import { navigate } from '../../../../utils/navigate';
import { User } from '../../../../core/entities/User';

vi.mock('../../../../services', () => ({
  authService: {
    login: vi.fn(),
  },
}));

vi.mock('../../../../utils/navigate', () => ({
  navigate: vi.fn(),
}));

import '../../../../pages/client/login/LoginPageElement';

function createMockUser(role: 'client' | 'admin' | 'super-admin'): User {
  return new User('u1', 'test@example.com', 'Test User', role);
}

describe('LoginPageElement', () => {
  let element: LoginPageElement;

  beforeEach(() => {
    vi.clearAllMocks();
    element = new LoginPageElement();
    document.body.innerHTML = '<div id="test-root"></div>';
    document.getElementById('test-root')!.appendChild(element);
  });

  afterEach(() => {
    element.remove();
  });

  async function performLogin(role: 'client' | 'admin' | 'super-admin'): Promise<void> {
    vi.mocked(authService.login).mockResolvedValue(createMockUser(role));
    const internal = element as unknown as { email: string; password: string; handleLogin: () => Promise<void> };
    internal.email = 'test@example.com';
    internal.password = 'password123';
    await internal.handleLogin();
  }

  it('redirects to /client/dashboard for client role', async () => {
    await performLogin('client');
    expect(authService.login).toHaveBeenCalledWith('test@example.com', 'password123');
    expect(navigate).toHaveBeenCalledWith('/client/dashboard');
  });

  it('redirects to /admin/overview for admin role', async () => {
    await performLogin('admin');
    expect(navigate).toHaveBeenCalledWith('/admin/overview');
  });

  it('redirects to /super-admin/overview for super-admin role', async () => {
    await performLogin('super-admin');
    expect(navigate).toHaveBeenCalledWith('/super-admin/overview');
  });

  it('shows error on invalid credentials', async () => {
    vi.mocked(authService.login).mockRejectedValue(new Error('Invalid credentials'));
    const internal = element as unknown as { email: string; password: string; handleLogin: () => Promise<void> };
    internal.email = 'wrong@example.com';
    internal.password = 'wrongpass';
    await internal.handleLogin();
    const errorBanner = element.shadowRoot!.querySelector('.error-banner');
    expect(errorBanner?.textContent).toContain('Invalid');
  });

  it('toggles forgot password panel', () => {
    const forgotLink = element.shadowRoot!.querySelector('[data-action="forgot"]') as HTMLElement;
    forgotLink.click();
    const panel = element.shadowRoot!.querySelector('.forgot-panel');
    expect(panel).not.toBeNull();
  });

  it('Login button is disabled when email is empty', () => {
    const btn = element.shadowRoot!.querySelector('[data-action="login"]') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });
});