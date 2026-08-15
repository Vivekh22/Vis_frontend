/**
 * NotificationCategory.ts — core/enums/
 *
 * Categories for notification classification. Used by the Notification
 * Center page for category-based filtering.
 */
export const NotificationCategory = {
  Security: 'security',
  Campaign: 'campaign',
  Billing: 'billing',
  Team: 'team',
  Integrations: 'integrations',
  Support: 'support',
  Platform: 'platform',
} as const;

export type NotificationCategory = (typeof NotificationCategory)[keyof typeof NotificationCategory];