/**
 * ImpersonationService.ts — services/
 *
 * Purpose:
 *   Orchestrates "View As" for both Admin (scoped to allowedClientIds) and
 *   Super Admin (unrestricted). startImpersonation() checks the Admin's own
 *   client allowlist via PermissionService before calling sessionStore.
 *
 * !!! CLIENT-SIDE UX CHECK ONLY — NOT REAL AUTHORIZATION !!!
 *   This service carries the same caveat as RouteGuard: the allowlist check
 *   here prevents a legitimate Admin from confusingly viewing a client they
 *   shouldn't, but it is NOT a substitute for server-side authorization.
 *   Every actual API call must be independently authorized by the real
 *   backend regardless of what this client-side service allows.
 */
import { authStore } from '../platform/state/AuthStore';
import { sessionStore } from '../platform/state/SessionStore';
import type { PermissionService } from './PermissionService';
import { PermissionDeniedError } from '../core/errors/PermissionDeniedError';

export class ImpersonationService {
  constructor(private readonly permissionService: PermissionService) {}

  /**
   * Begins an impersonation session. For Admins, first checks that the
   * client is within their allowedClientIds. Throws PermissionDeniedError
   * if the Admin's own allowlist doesn't include the target client.
   */
  async startImpersonation(clientId: string, actingAsRole: 'admin' | 'super-admin'): Promise<void> {
    const user = authStore.getState().currentUser;
    if (!user) {
      throw new PermissionDeniedError(
        'Cannot impersonate: no authenticated user',
        'view',
        'none',
      );
    }

    if (actingAsRole === 'admin') {
      if (user.role !== 'super-admin' && !this.permissionService.canAccessClient(user, clientId)) {
        throw new PermissionDeniedError(
          `Admin ${user.fullName} cannot access client ${clientId}: outside allowedClientIds`,
          'view',
          'none',
        );
      }
    }

    sessionStore.startImpersonation({
      entityName: clientId,
      actingAsUserId: user.id,
      actingAsRole,
    });
  }

  /**
   * Ends the impersonation session. Delegates to sessionStore.endImpersonation()
   * which preserves actingAsUserId and actingAsRole for audit logging.
   */
  endImpersonation(): void {
    sessionStore.endImpersonation();
  }
}