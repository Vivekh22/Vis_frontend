/**
 * MockMasterIntegrationRepository.ts — repositories/mocks/
 *
 * Mock-backed master integration lists. Exports MASTER_MMP_LIST as the
 * canonical MMP provider list — IntegrationsPageElement reads from
 * MasterIntegrationService which delegates here.
 */
import type {
  MasterMmpEntry,
  MasterIntegrationRepository,
} from '../../services/MasterIntegrationService';

export const MASTER_MMP_LIST: readonly MasterMmpEntry[] = [
  { id: 'mmp-1', name: 'AppsFlyer', providerKey: 'appsflyer', isActive: true },
  { id: 'mmp-2', name: 'Adjust', providerKey: 'adjust', isActive: true },
  { id: 'mmp-3', name: 'Kochava', providerKey: 'kochava', isActive: true },
  { id: 'mmp-4', name: 'Branch', providerKey: 'branch', isActive: true },
  { id: 'mmp-5', name: 'Singular', providerKey: 'singular', isActive: true },
];

export class MockMasterIntegrationRepository implements MasterIntegrationRepository {
  private mmpList: MasterMmpEntry[] = [...MASTER_MMP_LIST];

  async getMmpList(): Promise<MasterMmpEntry[]> {
    return [...this.mmpList];
  }

  async addMmp(name: string, providerKey: string): Promise<void> {
    this.mmpList.push({
      id: `mmp-${this.mmpList.length + 1}`,
      name,
      providerKey,
      isActive: true,
    });
  }

  async removeMmp(id: string): Promise<void> {
    this.mmpList = this.mmpList.filter((m) => m.id !== id);
  }

  async getMasterExchangeList(): Promise<string[]> {
    // Delegates to PlatformConnectionRepository's exchange names — imported
    // here to keep the exchange list in one place (MockPlatformConnectionRepository).
    const { CONNECTED_EXCHANGE_NAMES } = await import('./MockPlatformConnectionRepository');
    return [...CONNECTED_EXCHANGE_NAMES];
  }
}