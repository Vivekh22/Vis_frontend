/**
 * CreativeType.ts — core/enums/
 *
 * The five creative formats supported by the platform. Same const-object +
 * union-type pattern as CampaignStatus/CreativeStatus.
 */
export const CreativeType = {
  Image: 'image',
  Native: 'native',
  Html: 'html',
  Video: 'video',
  Vast: 'vast',
} as const;

export type CreativeType = (typeof CreativeType)[keyof typeof CreativeType];