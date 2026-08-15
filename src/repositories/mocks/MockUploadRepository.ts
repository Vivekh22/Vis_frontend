/**
 * MockUploadRepository.ts — repositories/mocks/
 *
 * In-memory mock for UploadService's UploadRepository.
 * Returns a fake URL without actually uploading anything.
 */
import type { UploadRepository } from '../../services/UploadService';

export class MockUploadRepository implements UploadRepository {
  async upload(file: File): Promise<{ url: string }> {
    return { url: `mock://uploads/${encodeURIComponent(file.name)}` };
  }
}