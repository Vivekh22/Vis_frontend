/**
 * ClientService.ts — services/
 *
 * Orchestrates admin client roster operations. Delegates to the
 * ClientRepository interface — the service owns no client-health
 * computation logic (see ClientSummary.ts docstring).
 *
 * The service accepts an optional allowedClientIds set to scope
 * results to the Admin's assigned clients — this is the same
 * PermissionGrant allowlist used by RouteGuard and ImpersonationService.
 */
import type { ClientSummary } from '../core/types/ClientSummary';

export interface ClientRepository {
  findAssignedClients(clientIds?: ReadonlySet<string>): Promise<ClientSummary[]>;
  findAtRiskClients(clientIds?: ReadonlySet<string>): Promise<ClientSummary[]>;
  findClientDetail(clientId: string): Promise<ClientSummary | null>;
}

export class ClientService {
  constructor(private readonly clientRepo: ClientRepository) {}

  async listAssignedClients(clientIds?: ReadonlySet<string>): Promise<ClientSummary[]> {
    return await this.clientRepo.findAssignedClients(clientIds);
  }

  async listAtRiskClients(clientIds?: ReadonlySet<string>): Promise<ClientSummary[]> {
    return await this.clientRepo.findAtRiskClients(clientIds);
  }

  async getClientDetail(clientId: string): Promise<ClientSummary | null> {
    return await this.clientRepo.findClientDetail(clientId);
  }
}