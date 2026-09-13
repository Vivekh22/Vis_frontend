/**
 * AudienceService.test.ts — tests for services/AudienceService.
 *
 * Confirms save is rejected when data source is not validated.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { AudienceService } from '../../services/AudienceService';
import { AudienceList } from '../../core/entities/AudienceList';
import { AudienceDataSource } from '../../core/enums/AudienceDataSource';
import type { AudienceRepository } from '../../services/AudienceService';

class MockAudienceRepo implements AudienceRepository {
  private lists: Map<string, AudienceList> = new Map();

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

describe('AudienceService', () => {
  let repo: MockAudienceRepo;
  let svc: AudienceService;

  beforeEach(() => {
    repo = new MockAudienceRepo();
    svc = new AudienceService(repo);
  });

  it('createAudience rejects unvalidated data source', async () => {
    await expect(svc.createAudience({
      name: 'Test',
      description: '',
      audienceType: 'custom',
      businessProduct: 'All',
      rules: [],
      dataSource: { type: AudienceDataSource.CustomerList, validated: false },
    })).rejects.toThrow('data source has not been validated');
  });

  it('createAudience accepts validated CSV source and calculates size', async () => {
    const list = await svc.createAudience({
      name: 'Test Audience',
      description: 'Test description',
      audienceType: 'custom',
      businessProduct: 'All',
      rules: [],
      dataSource: {
        type: AudienceDataSource.CustomerList,
        csvData: 'email\na@b.com\nc@d.com\ne@f.com',
        validated: true,
      },
    });
    expect(list.id).toBeTruthy();
    expect(list.name).toBe('Test Audience');
    expect(list.estimatedSize).toBe(3); // 3 data rows
  });

  it('createAudience computes row count from CSV', async () => {
    const list = await svc.createAudience({
      name: 'CSV Audience',
      description: 'Test desc',
      audienceType: 'custom',
      businessProduct: 'All',
      rules: [],
      dataSource: {
        type: AudienceDataSource.CustomerList,
        csvData: 'col1\nrow1\nrow2',
        validated: true,
      },
    });
    expect(list.estimatedSize).toBe(2);
  });

  it('listAudiences returns all', async () => {
    await svc.createAudience({
      name: 'A1',
      description: '',
      audienceType: 'custom',
      businessProduct: 'All',
      rules: [],
      dataSource: { type: AudienceDataSource.CustomerList, csvData: 'x\n1\n2', validated: true },
    });
    await svc.createAudience({
      name: 'A2',
      description: '',
      audienceType: 'custom',
      businessProduct: 'All',
      rules: [],
      dataSource: { type: AudienceDataSource.CustomerList, csvData: 'x\n1', validated: true },
    });
    const lists = await svc.listAudiences();
    expect(lists).toHaveLength(2);
  });

  it('deleteAudience removes the list', async () => {
    const list = await svc.createAudience({
      name: 'To Delete',
      description: '',
      audienceType: 'custom',
      businessProduct: 'All',
      rules: [],
      dataSource: { type: AudienceDataSource.CustomerList, csvData: 'x\n1', validated: true },
    });
    expect(await svc.listAudiences()).toHaveLength(1);

    await svc.deleteAudience(list.id);
    expect(await svc.listAudiences()).toHaveLength(0);
  });
});