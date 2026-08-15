/**
 * ClientSummary.ts — core/types/
 *
 * Summary DTO for Admin's My Clients and Accounts views. Aggregates
 * per-client metrics (active campaigns, total spend, pending approvals,
 * at-risk flag) that the Admin needs in one glance — not the full
 * Client entity, which lives in core/entities/Client.ts.
 *
 * !!! AT-RISK FLAG — MOCKED, NOT COMPUTED !!!
 * The isAtRisk flag is a health-scoring signal. No real ML or health-
 * scoring engine exists in this frontend — real health scoring is a
 * backend/Taranga concern. The MockClientRepository returns a flagged
 * subset to exercise the At-Risk Clients strip in the Admin Overview.
 * This is documented clearly: the frontend does NOT compute health
 * scores; it only displays a signal that the backend provides.
 */
export interface ClientSummary {
  readonly clientId: string;
  readonly companyName: string;
  readonly contactName: string;
  readonly status: 'active' | 'suspended' | 'pending';
  readonly campaignTypes: readonly string[];
  readonly activeCampaigns: number;
  readonly assignedSince: Date;
  readonly totalSpend: number;
  readonly pendingApprovals: number;
  readonly lastActivity: Date;
  readonly isAtRisk: boolean;
}