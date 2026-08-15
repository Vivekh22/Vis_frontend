/**
 * AuthRepository.ts — repositories/
 *
 * Real implementation of the AuthRepository interface from AuthService.
 * Calls the authentication API endpoints.
 *
 * Assumed endpoint shape (de facto API contract):
 *   POST /api/auth/login
 *     Body: { email: string, password: string }
 *     Response: { token: string, user: UserDto }
 *   POST /api/auth/refresh
 *     Body: { token: string }
 *     Response: { token: string, user: UserDto }
 *
 *   UserDto: {
 *     id: string, email: string, fullName: string, role: UserRole,
 *     permissions?: Record<string, PermissionLevel>,
 *     allowedClientIds?: string[]
 *   }
 */
import type { AuthResponse, AuthRepository as IAuthRepository, RegistrationSubmission, RegistrationStatus } from '../services/AuthService';
import type { UserRole } from '../core/enums/UserRole';
import type { PermissionLevel } from '../core/enums/PermissionLevel';
import { ApiClient } from './ApiClient';

interface UserDto {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  permissions?: Record<string, PermissionLevel>;
  allowedClientIds?: string[];
}

interface AuthResponseDto {
  token: string;
  user: UserDto;
}

export class AuthRepository implements IAuthRepository {
  constructor(private readonly api: ApiClient) {}

  async login(email: string, password: string): Promise<AuthResponse> {
    const dto = await this.api.post<AuthResponseDto>('/api/auth/login', { email, password });
    return this.mapResponse(dto);
  }

  async refreshToken(token: string): Promise<AuthResponse> {
    const dto = await this.api.post<AuthResponseDto>('/api/auth/refresh', { token });
    return this.mapResponse(dto);
  }

  /**
   * Assumed endpoint: POST /api/auth/register
   *   Body: RegistrationSubmission
   *   Response: 204 No Content (or 200 with empty body)
   */
  async submitRegistration(data: RegistrationSubmission): Promise<void> {
    await this.api.post('/api/auth/register', data);
  }

  /**
   * Assumed endpoint: GET /api/auth/registration-status?email=...
   *   Response: { status: 'pending'|'approved'|'rejected', rejectionReason?: string }
   */
  async getRegistrationStatus(email: string): Promise<RegistrationStatus> {
    return this.api.get<RegistrationStatus>(`/api/auth/registration-status?email=${encodeURIComponent(email)}`);
  }

  private mapResponse(dto: AuthResponseDto): AuthResponse {
    return {
      token: dto.token,
      user: {
        id: dto.user.id,
        email: dto.user.email,
        fullName: dto.user.fullName,
        role: dto.user.role,
        permissions: dto.user.permissions,
        allowedClientIds: dto.user.allowedClientIds
          ? new Set(dto.user.allowedClientIds)
          : undefined,
      },
    };
  }
}