/**
 * IntegrationProvider.ts — core/enums/
 *
 * Prebuilt MMP (Mobile Measurement Partner) providers for integrations,
 * plus a generic/custom fallback.
 */
export const IntegrationProvider = {
  AppsFlyer: 'appsflyer',
  Adjust: 'adjust',
  Kochava: 'kochava',
  Branch: 'branch',
  Singular: 'singular',
  Custom: 'custom',
} as const;

export type IntegrationProvider = (typeof IntegrationProvider)[keyof typeof IntegrationProvider];