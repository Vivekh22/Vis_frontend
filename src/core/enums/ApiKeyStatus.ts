/**
 * ApiKeyStatus.ts — core/enums/
 *
 * Lifecycle states for API keys.
 */
export const ApiKeyStatus = {
  Active: 'active',
  Revoked: 'revoked',
  Expired: 'expired',
} as const;

export type ApiKeyStatus = (typeof ApiKeyStatus)[keyof typeof ApiKeyStatus];