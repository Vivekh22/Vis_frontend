/**
 * MockClientRepository.ts — repositories/mocks/
 *
 * In-memory mock for admin client roster data. Returns ClientSummary
 * records for the Admin's assigned clients (filtered by allowedClientIds
 * when provided).
 *
 * !!! AT-RISK FLAG — MOCKED, NOT COMPUTED !!!
 * The isAtRisk flag is a mocked health-scoring signal. Real health scoring
 * is a backend/Taranga concern — this frontend does NOT compute health
 * scores. The mock returns a hardcoded flagged subset to exercise the
 * At-Risk Clients strip in the Admin Overview. When the real backend is
 * built, this mock will be replaced by a real repository that delegates
 * health-score computation to the backend.
 */
import type { ClientSummary } from '../../core/types/ClientSummary';

export interface ClientRepository {
  findAssignedClients(clientIds?: ReadonlySet<string>): Promise<ClientSummary[]>;
  findAtRiskClients(clientIds?: ReadonlySet<string>): Promise<ClientSummary[]>;
  findClientDetail(clientId: string): Promise<ClientSummary | null>;
}

export class MockClientRepository implements ClientRepository {
  private readonly clients: ClientSummary[] = [];

  constructor() {
    this.seed();
  }

  private seed(): void {
    const now = new Date();
    this.clients.push(
      {
        clientId: 'client-1',
        companyName: 'Acme Corp',
        contactName: 'John Doe',
        status: 'active',
        campaignTypes: ['Acquisition', 'Retargeting'],
        activeCampaigns: 8,
        assignedSince: new Date(now.getFullYear() - 1, now.getMonth(), 1),
        totalSpend: 125000,
        pendingApprovals: 2,
        lastActivity: new Date(now.getTime() - 2 * 3600000),
        isAtRisk: false,
      },
      {
        clientId: 'client-2',
        companyName: 'Globex Inc',
        contactName: 'Jane Smith',
        status: 'active',
        campaignTypes: ['Brand Awareness', 'Retargeting'],
        activeCampaigns: 5,
        assignedSince: new Date(now.getFullYear() - 1, now.getMonth() - 3, 1),
        totalSpend: 87000,
        pendingApprovals: 1,
        lastActivity: new Date(now.getTime() - 6 * 3600000),
        isAtRisk: true,
      },
      {
        clientId: 'client-3',
        companyName: 'Initech LLC',
        contactName: 'Peter Gibbons',
        status: 'active',
        campaignTypes: ['Acquisition'],
        activeCampaigns: 3,
        assignedSince: new Date(now.getFullYear(), now.getMonth() - 2, 1),
        totalSpend: 34000,
        pendingApprovals: 0,
        lastActivity: new Date(now.getTime() - 48 * 3600000),
        isAtRisk: true,
      },
      {
        clientId: 'client-4',
        companyName: 'Umbrella Corp',
        contactName: 'Alice Wells',
        status: 'suspended',
        campaignTypes: ['Acquisition', 'Brand Awareness'],
        activeCampaigns: 0,
        assignedSince: new Date(now.getFullYear() - 2, now.getMonth(), 1),
        totalSpend: 210000,
        pendingApprovals: 0,
        lastActivity: new Date(now.getTime() - 15 * 86400000),
        isAtRisk: false,
      },
    );
  }

  async findAssignedClients(clientIds?: ReadonlySet<string>): Promise<ClientSummary[]> {
    if (!clientIds) return [...this.clients];
    return this.clients.filter((c) => clientIds.has(c.clientId));
  }

  async findAtRiskClients(clientIds?: ReadonlySet<string>): Promise<ClientSummary[]> {
    const scoped = clientIds ? this.clients.filter((c) => clientIds.has(c.clientId)) : [...this.clients];
    return scoped.filter((c) => c.isAtRisk);
  }

  async findClientDetail(clientId: string): Promise<ClientSummary | null> {
    return this.clients.find((c) => c.clientId === clientId) ?? null;
  }
}