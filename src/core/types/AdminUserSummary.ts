/**
 * AdminUserSummary.ts — core/types/
 *
 * Summary DTO for the Super Admin User Management page's Admins tab.
 * Aggregates per-admin metrics (role label, assigned client count,
 * status) that Super Admin needs in one glance.
 */
export interface AdminUserSummary {
  readonly adminId: string;
  readonly fullName: string;
  readonly email: string;
  readonly roleLabel: string;
  readonly assignedClientCount: number;
  readonly status: 'active' | 'suspended';
  readonly createdAt: Date;
}