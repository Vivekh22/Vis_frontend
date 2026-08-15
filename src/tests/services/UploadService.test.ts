/**
 * UploadService.test.ts — tests for services/UploadService.
 */
import { describe, it, expect } from 'vitest';
import { UploadService } from '../../services/UploadService';
import type { UploadRepository } from '../../services/UploadService';

class MockUploadRepo implements UploadRepository {
  lastFile: File | null = null;

  async upload(file: File): Promise<{ url: string }> {
    this.lastFile = file;
    return { url: `mock://uploads/${encodeURIComponent(file.name)}` };
  }
}

describe('UploadService', () => {
  it('uploadFile returns URL from repository', async () => {
    const repo = new MockUploadRepo();
    const svc = new UploadService(repo);
    const file = new File(['test'], 'test.png', { type: 'image/png' });
    const url = await svc.uploadFile(file);
    expect(url).toBe('mock://uploads/test.png');
    expect(repo.lastFile).toBe(file);
  });
});