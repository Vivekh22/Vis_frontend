/**
 * AuthService.ts — services/
 *
 * Purpose:
 *   Orchestrates login/logout. Calls the auth endpoint via an injected
 *   AuthRepository (interface, not concrete class), constructs a real
 *   core/entities/User instance from the response, calls authStore.login()
 *   and TokenStorage.setToken(), and on logout calls authStore.logout()
 *   (which cascades to clearing sessionStore and tokens together per Part 1).
 *
 *   refreshSession() supports token refresh flows — even if the mock
 *   repository just returns a renewed mock token for now.
 *
 *   getCurrentUser() is a convenience accessor reading from authStore.
 */
import type { User } from '../platform/types';
import type { UserRole } from '../core/enums/UserRole';
import type { PermissionLevel } from '../core/enums/PermissionLevel';
import { User as UserEntity } from '../core/entities/User';
import { authStore } from '../platform/state/AuthStore';
import { TokenStorage } from '../security/TokenStorage';

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: UserRole;
    permissions?: Readonly<Record<string, PermissionLevel>>;
    allowedClientIds?: ReadonlySet<string>;
  };
}

export interface RegistrationSubmission {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  businessName: string;
  businessPhone: string;
  agency?: string;
  pricingModels: string[];
  accountNumber: string;
  holderName: string;
  vatTaxNumber: string;
  routingNumber: string;
  companyName: string;
  country: string;
  address: string;
}

export interface RegistrationStatus {
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
}

export interface AuthRepository {
  login(email: string, password: string): Promise<AuthResponse>;
  refreshToken(token: string): Promise<AuthResponse>;
  submitRegistration(data: RegistrationSubmission): Promise<void>;
  getRegistrationStatus(email: string): Promise<RegistrationStatus>;
}

export class AuthService {
  constructor(private readonly authRepo: AuthRepository) {}

  async login(email: string, password: string): Promise<UserEntity> {
    const { token, user } = await this.authRepo.login(email, password);
    TokenStorage.setToken(token);
    const userEntity = new UserEntity(
      user.id,
      user.email,
      user.fullName,
      user.role,
      user.permissions ?? {},
      user.allowedClientIds,
    );
    authStore.login(userEntity);
    return userEntity;
  }

  logout(): void {
    authStore.logout();
  }

  async refreshSession(): Promise<void> {
    const token = TokenStorage.getToken();
    if (!token) {
      throw new Error('Cannot refresh session: no token present');
    }
    const { token: newToken, user } = await this.authRepo.refreshToken(token);
    TokenStorage.setToken(newToken);
    const userEntity = new UserEntity(
      user.id,
      user.email,
      user.fullName,
      user.role,
      user.permissions ?? {},
      user.allowedClientIds,
    );
    authStore.login(userEntity);
  }

  getCurrentUser(): User | null {
    return authStore.getState().currentUser;
  }

  async submitRegistration(data: RegistrationSubmission): Promise<void> {
    await this.authRepo.submitRegistration(data);
  }

  async getRegistrationStatus(email: string): Promise<RegistrationStatus> {
    return this.authRepo.getRegistrationStatus(email);
  }
}