/**
 * UploadRepository.ts — repositories/
 *
 * Real implementation of UploadRepository.
 * Delegates to the platform's file upload API.
 */
import type { UploadRepository } from '../services/UploadService';
import { ApiClient } from './ApiClient';

export class UploadRepositoryImpl implements UploadRepository {
  constructor(private readonly api: ApiClient) {}

  async upload(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    const result = await this.api.post<{ url: string }>('/api/uploads', formData);
    return { url: result.url };
  }
}