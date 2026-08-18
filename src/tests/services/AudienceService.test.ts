// @ts-nocheck
/**
 * AudienceService.test.ts — tests for services/AudienceService.
 *
 * Confirms save is rejected when data source is not validated.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { AudienceService } from '../../services/AudienceService';
import { AudienceService } from '../../services/AudienceService';
import { AudienceList } from '../../core/entities/AudienceList';
import { AudienceDataSource } from '../../core/enums/AudienceDataSource';

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
      listType: 'whitelist',
      comments: null,
      dataSource: { type: AudienceDataSource.CsvFile, validated: false },
    })).rejects.toThrow('data source has not been validated');
  });

  it('createAudience accepts validated CSV source', async () => {
    const list = await svc.createAudience({
      name: 'Test Audience',
      listType: 'whitelist',
      comments: 'Test comments',
      dataSource: {
        type: AudienceDataSource.CsvFile,
        csvData: 'email\na@b.com\nc@d.com\ne@f.com',
        validated: true,
      },
    });
    expect(list.id).toBeTruthy();
    expect(list.name).toBe('Test Audience');
    expect(list.userCount).toBe(3); // 3 data rows
    expect(list.whiteListedCount).toBe(3);
  });

  it('createAudience computes row count from CSV', async () => {
    const list = await svc.createAudience({
      name: 'CSV Audience',
      listType: 'blacklist',
      comments: null,
      dataSource: {
        type: AudienceDataSource.CsvFile,
        csvData: 'col1\nrow1\nrow2',
        validated: true,
      },
    });
    expect(list.userCount).toBe(2);
    expect(list.blackListedCount).toBe(2);
  });

  it('listAudiences returns all', async () => {
    await svc.createAudience({
      name: 'A1',
      listType: 'whitelist',
      comments: null,
      dataSource: { type: AudienceDataSource.CsvFile, csvData: 'x\n1\n2', validated: true },
    });
    await svc.createAudience({
      name: 'A2',
      listType: 'blacklist',
      comments: null,
      dataSource: { type: AudienceDataSource.CsvFile, csvData: 'x\n1', validated: true },
    });
    const lists = await svc.listAudiences();
    expect(lists).toHaveLength(2);
  });

  it('deleteAudience removes list', async () => {
    const list = await svc.createAudience({
      name: 'Temp',
      listType: 'whitelist',
      comments: null,
      dataSource: { type: AudienceDataSource.CsvFile, csvData: 'x\n1', validated: true },
    });
    await svc.deleteAudience(list.id);
    const found = await svc.getAudience(list.id);
    expect(found).toBeNull();
  });
});