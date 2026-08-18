/**
 * MasterIntegrationService.ts — services/
 *
 * The SINGLE SOURCE OF TRUTH for the master MMP list and master exchange
 * list. Part 10's client-facing IntegrationsPageElement MMP tab reads from
 * this service instead of a hardcoded list.
 */

// DESIGN NOTE: This service uses a mock repository by design — these are Super Admin
// monitoring/status/governance pages with no real backend API to call yet. When the
// backend is ready, swap the mock for a real repository in services/index.ts.
export interface MasterMmpEntry {
  readonly id: string;
  readonly name: string;
  readonly providerKey: string;
  readonly isActive: boolean;
}

export interface MasterIntegrationRepository {
  getMmpList(): Promise<MasterMmpEntry[]>;
  addMmp(name: string, providerKey: string): Promise<void>;
  removeMmp(id: string): Promise<void>;
  getMasterExchangeList(): Promise<string[]>;
}

export class MasterIntegrationService {
  constructor(private readonly repo: MasterIntegrationRepository) {}

  async getMmpList(): Promise<MasterMmpEntry[]> {
    return this.repo.getMmpList();
  }

  async addMmp(name: string, providerKey: string): Promise<void> {
    await this.repo.addMmp(name, providerKey);
  }

  async removeMmp(id: string): Promise<void> {
    await this.repo.removeMmp(id);
  }

  async getMasterExchangeList(): Promise<string[]> {
    return this.repo.getMasterExchangeList();
  }
}