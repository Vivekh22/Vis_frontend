/**
 * AppListEntry.ts — core/entities/
 *
 * An app list entry — a named collection of app bundles, placement IDs,
 * and URLs used for supply-side targeting (whitelist/blacklist).
 *
 * Per spec: NO approval gate on this module. There is no 'pending_approval'
 * status path at all. App lists are created and immediately active —
 * they are targeting configuration, not creative content.
 */
export type AppListType = 'whitelist' | 'blacklist';

export class AppListEntry {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly appBundles: string[] = [],
    public readonly placementIds: string[] = [],
    public readonly urls: string[] = [],
    public readonly listType: AppListType = 'whitelist',
    public readonly createdAt: Date = new Date(),
    public readonly clientId: string = 'client-1',
  ) {}

  public get appCount(): number {
    return this.appBundles.length;
  }

  public get whiteListedCount(): number {
    return this.listType === 'whitelist' ? this.appBundles.length : 0;
  }

  public get blackListedCount(): number {
    return this.listType === 'blacklist' ? this.appBundles.length : 0;
  }
}