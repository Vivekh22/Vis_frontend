/**
 * CampaignStatus.ts — core/enums/
 *
 * Canonical definition of campaign lifecycle states. Uses a `const` object
 * + derived union type instead of TypeScript's native `enum` keyword.
 *
 * Why not native `enum`:
 *   Native TypeScript enums have known quirks: they generate reverse-mapping
 *   runtime objects (doubling bundle size), they are not tree-shakeable by
 *   bundlers in all configurations, and numeric enums in particular have
 *   surprising coercion behavior. A `const` object with `as const` produces
 *   no runtime code beyond the literal values, is fully tree-shakeable, and
 *   gives us a value namespace (CampaignStatus.Running) and a type
 *   (CampaignStatus) in one declaration — the same ergonomics without the
 *   overhead. This pattern is used for ALL enums in this project.
 *
 * Values per the Client UI spec's Campaign list tabs and approval flow:
 *   draft → pending_approval → running → paused → archived
 *                         ↘ rejected ↗
 */
export const CampaignStatus = {
  Draft: 'draft',
  PendingApproval: 'pending_approval',
  Running: 'running',
  Paused: 'paused',
  Rejected: 'rejected',
  Archived: 'archived',
} as const;

export type CampaignStatus = (typeof CampaignStatus)[keyof typeof CampaignStatus];