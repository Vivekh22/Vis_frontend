/**
 * MockAudienceRepository.ts — repositories/mocks/
 *
 * In-memory mock for AudienceRepository.
 */
import { AudienceList } from '../../core/entities/AudienceList';
import type { AudienceRepository } from '../../services/AudienceService';
import { AudienceDataSource } from '../../core/enums/AudienceDataSource';

export class MockAudienceRepository implements AudienceRepository {
  private readonly lists: Map<string, AudienceList> = new Map();

  constructor() {
    this.seed([
      new AudienceList(
        'aud_1001',
        'Karnataka Livestock Buyers',
        'Users interested in livestock products in Karnataka',
        'custom',
        'All V4Connectt Services',
        { type: AudienceDataSource.WebsiteActivity, validated: true },
        [],
        248000,
        [180000, 320000],
        'active',
        new Date('2026-09-13T10:24:00'),
        new Date('2026-09-13T10:24:00')
      ),
      new AudienceList(
        'aud_1002',
        'Bengaluru Transport Users',
        'People who searched for transport services in Bengaluru',
        'custom',
        'All V4Connectt Services',
        { type: AudienceDataSource.AppActivity, validated: true },
        [],
        86200,
        [75000, 100000],
        'active',
        new Date('2026-09-12T16:15:00'),
        new Date('2026-09-12T16:15:00')
      ),
      new AudienceList(
        'aud_1003',
        'Agriculture Interest - India',
        'Users interested in agriculture and farming',
        'saved',
        'All V4Connectt Services',
        { type: AudienceDataSource.V4ConnecttSources, validated: true },
        [],
        510000,
        [450000, 600000],
        'active',
        new Date('2026-09-11T09:40:00'),
        new Date('2026-09-11T09:40:00')
      ),
      new AudienceList(
        'aud_1004',
        'High Value Customers',
        'Existing high-value customers',
        'lookalike',
        'All V4Connectt Services',
        { type: AudienceDataSource.CustomerList, validated: true },
        [],
        320000,
        [250000, 400000],
        'active',
        new Date('2026-09-10T14:12:00'),
        new Date('2026-09-10T14:12:00')
      ),
      new AudienceList(
        'aud_1005',
        'Dairy Product Viewers',
        'Users who viewed dairy products',
        'custom',
        'All V4Connectt Services',
        { type: AudienceDataSource.WebsiteActivity, validated: true },
        [],
        194500,
        [150000, 220000],
        'active',
        new Date('2026-09-09T11:20:00'),
        new Date('2026-09-09T11:20:00')
      ),
      new AudienceList(
        'aud_1006',
        'Transport Leads - Last 30 Days',
        'Users who submitted transport enquiries',
        'custom',
        'All V4Connectt Services',
        { type: AudienceDataSource.LeadList, validated: true },
        [],
        42300,
        [30000, 50000],
        'active',
        new Date('2026-09-08T17:18:00'),
        new Date('2026-09-08T17:18:00')
      ),
      new AudienceList(
        'aud_1007',
        'Lookalike - Livestock Buyers',
        'Similar to Livestock Buyers (1%)',
        'lookalike',
        'All V4Connectt Services',
        { type: AudienceDataSource.WebsiteActivity, validated: true }, // Ideally Custom Audience source, mapping to existing
        [],
        620000,
        [500000, 750000],
        'active',
        new Date('2026-09-07T13:05:00'),
        new Date('2026-09-07T13:05:00')
      ),
      new AudienceList(
        'aud_1008',
        'All App Users',
        'Users who installed and opened the app',
        'custom',
        'All V4Connectt Services',
        { type: AudienceDataSource.AppActivity, validated: true },
        [],
        1200000,
        [1000000, 1500000],
        'active',
        new Date('2026-09-06T09:30:00'),
        new Date('2026-09-06T09:30:00')
      )
    ]);
  }

  seed(lists: AudienceList[]): void {
    for (const l of lists) this.lists.set(l.id, l);
  }

  async findById(id: string): Promise<AudienceList | null> {
    return this.lists.get(id) ?? null;
  }

  async findAll(): Promise<AudienceList[]> {
    return Array.from(this.lists.values());
  }

  async save(list: AudienceList): Promise<AudienceList> {
    this.lists.set(list.id, list);
    return list;
  }

  async delete(id: string): Promise<void> {
    this.lists.delete(id);
  }
}