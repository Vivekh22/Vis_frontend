/**
 * ApiKey.ts — core/entities/
 *
 * Represents an API key for client integrations.
 *
 * !!! ONE-TIME REVEAL — MASKED THEREAFTER !!!
 *
 * The real API key is returned EXACTLY ONCE when generateKey() is called.
 * After that initial reveal, only the masked representation is stored and
 * retrievable. The entity itself does NOT store the real key — it stores
 * only `maskedKey` (e.g. "va_sk_...a1b2"). The real key is never retained
 * in app state after the reveal screen closes.
 *
 * This is enforced at the entity level: there is no `getRealKey()` method.
 * The only way to obtain the real key is from the return value of
 * ApiKeyService.generateKey(), which returns it once and never again.
 */
import type { ApiKeyStatus } from '../enums/ApiKeyStatus';

export class ApiKey {
  private _status: ApiKeyStatus;

  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly scope: string,
    /**
     * The MASKED key — e.g. "va_sk_...a1b2". This is the ONLY representation
     * stored on the entity. The real key is never stored here.
     */
    public readonly maskedKey: string,
    status: ApiKeyStatus,
    public readonly createdAt: Date,
    public readonly expiresAt?: Date,
    public readonly lastUsedAt?: Date,
  ) {
    this._status = status;
  }

  public get status(): ApiKeyStatus {
    return this._status;
  }

  public get isExpired(): boolean {
    if (!this.expiresAt) return false;
    return this.expiresAt.getTime() < Date.now();
  }

  public revoke(): void {
    this._status = 'revoked';
  }
}