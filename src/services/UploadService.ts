/**
 * UploadService.ts — services/
 *
 * Purpose:
 *   Single entry point for all file uploads. Builders and other UI
 *   components call this service rather than hitting an upload endpoint
 *   directly — keeps upload logic in one place for when a real backend
 *   exists.
 *
 *   In mock mode, returns a fake URL. When a real backend exists, this
 *   will call the platform's file upload API.
 */
export interface UploadRepository {
  upload(file: File): Promise<{ url: string }>;
}

export class UploadService {
  constructor(private readonly uploadRepo: UploadRepository) {}

  async uploadFile(file: File): Promise<string> {
    const result = await this.uploadRepo.upload(file);
    return result.url;
  }
}