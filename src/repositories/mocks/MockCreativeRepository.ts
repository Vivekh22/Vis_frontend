/**
 * MockCreativeRepository.ts — repositories/mocks/
 *
 * Minimal mock implementation of CreativeRepository for CreativeService.
 * Stores creatives in memory. Temporary — real repository implementations
 * in Part 6.
 */
import { Creative } from '../../core/entities/Creative';
import type { CreativeFilter, CreativeRepository } from '../../services/CreativeService';

export class MockCreativeRepository implements CreativeRepository {
  private readonly creatives: Map<string, Creative> = new Map();

  constructor() {
    this.seed([
      new Creative(
        'CRV-1042',
        'Summer Banner 320x50',
        'CPG-2026-048',
        'image',
        'https://picsum.photos/320/50',
        'active'
      ),
      new Creative(
        'CRV-1038',
        'In-Feed Video 30s',
        'CPG-2026-045',
        'video',
        'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4',
        'active'
      ),
      new Creative(
        'CRV-1031',
        'Native Story Card',
        'CPG-2026-040',
        'native',
        'https://picsum.photos/400/400',
        'pending_approval'
      ),
      new Creative(
        'CRV-1024',
        'HTML Expandable Unit',
        'CPG-2026-033',
        'html',
        'https://example.com/html5.zip',
        'paused'
      )
    ]);
  }

  seed(creatives: Creative[]): void {
    for (const c of creatives) {
      this.creatives.set(c.id, c);
    }
  }

  async findById(id: string): Promise<Creative | null> {
    return this.creatives.get(id) ?? null;
  }

  async findAll(filter?: CreativeFilter): Promise<Creative[]> {
    let results = Array.from(this.creatives.values());
    if (filter?.campaignId) {
      results = results.filter((c) => c.campaignId === filter.campaignId);
    }
    if (filter?.status) {
      results = results.filter((c) => c.status === filter.status);
    }
    return results;
  }

  async save(creative: Creative): Promise<Creative> {
    this.creatives.set(creative.id, creative);
    return creative;
  }

  async delete(id: string): Promise<void> {
    this.creatives.delete(id);
  }
}