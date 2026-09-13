/**
 * AudienceDataSource.ts — core/enums/
 *
 * Expanded sources for Audience creation based on V4Connectt platform requirements.
 */
export const AudienceDataSource = {
  WebsiteActivity: 'website_activity',
  AppActivity: 'app_activity',
  ProductServiceActivity: 'product_service_activity',
  AdvertisingActivity: 'advertising_activity',
  CustomerList: 'customer_list',
  LeadList: 'lead_list',
  OfflineActivity: 'offline_activity',
  Catalogue: 'catalogue',
  V4ConnecttSources: 'v4connectt_sources'
} as const;

export type AudienceDataSource = (typeof AudienceDataSource)[keyof typeof AudienceDataSource];