/**
 * MockAuthRepository.ts — repositories/mocks/
 *
 * Minimal mock implementation of AuthRepository for AuthService.
 * Temporary — real repository implementations in Part 6.
 */
import type { AuthResponse, AuthRepository, RegistrationSubmission, RegistrationStatus } from '../../services/AuthService';

export class MockAuthRepository implements AuthRepository {
  private readonly credentials: Map<string, { password: string; user: AuthResponse['user'] }> = new Map();
  private readonly registrations: Map<string, { data: RegistrationSubmission; status: RegistrationStatus }> = new Map();

  addUser(email: string, password: string, user: AuthResponse['user']): void {
    this.credentials.set(email, { password, user });
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const cred = this.credentials.get(email);
    if (!cred || cred.password !== password) {
      throw new Error('Invalid credentials');
    }
    return { token: `mock-token-${Date.now()}`, user: cred.user };
  }

  async refreshToken(_token: string): Promise<AuthResponse> {
    const first = Array.from(this.credentials.values())[0];
    if (!first) {
      throw new Error('No users registered');
    }
    return { token: `refreshed-token-${Date.now()}`, user: first.user };
  }

  async submitRegistration(data: RegistrationSubmission): Promise<void> {
    this.registrations.set(data.email, { data, status: { status: 'pending' } });
    // Also add credentials so login works after approval in mock mode.
    this.addUser(data.email, data.password, {
      id: `user-${Date.now()}`,
      email: data.email,
      fullName: `${data.firstName} ${data.lastName}`,
      role: 'client',
    });
  }

  async getRegistrationStatus(email: string): Promise<RegistrationStatus> {
    const reg = this.registrations.get(email);
    if (!reg) return { status: 'pending' };
    return reg.status;
  }

  /** Test helper: set the status of a registration. */
  setRegistrationStatus(email: string, status: RegistrationStatus): void {
    const reg = this.registrations.get(email);
    if (reg) reg.status = status;
  }
}