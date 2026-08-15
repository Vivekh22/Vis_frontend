/**
 * MockAdminUserRepository.ts — repositories/mocks/
 *
 * In-memory mock for the Super Admin User Management page's Admins tab.
 * Returns AdminUserSummary records for every Admin account.
 *
 * !!! NEVER DELEGABLE !!!
 * User management is a Super Admin-only control. No PermissionGrant
 * can delegate user management to Admins.
 */
import type { AdminUserSummary } from '../../core/types/AdminUserSummary';

export interface AdminUserRepository {
  findAllAdmins(): Promise<AdminUserSummary[]>;
  findAdminById(id: string): Promise<AdminUserSummary | null>;
}

export class MockAdminUserRepository implements AdminUserRepository {
  private readonly admins: AdminUserSummary[] = [];

  constructor() {
    this.seed();
  }

  private seed(): void {
    const now = new Date();
    this.admins.push(
      {
        adminId: 'admin-1',
        fullName: 'Alice Chen',
        email: 'alice@visprisca.ads',
        roleLabel: 'Senior Campaign Manager',
        assignedClientCount: 3,
        status: 'active',
        createdAt: new Date(now.getFullYear() - 2, now.getMonth(), 15),
      },
      {
        adminId: 'admin-2',
        fullName: 'Bob Smith',
        email: 'bob@visprisca.ads',
        roleLabel: 'Account Manager',
        assignedClientCount: 8,
        status: 'active',
        createdAt: new Date(now.getFullYear() - 1, now.getMonth() - 6, 1),
      },
      {
        adminId: 'admin-3',
        fullName: 'Carol Diaz',
        email: 'carol@visprisca.ads',
        roleLabel: 'Finance Specialist',
        assignedClientCount: 15,
        status: 'suspended',
        createdAt: new Date(now.getFullYear() - 3, now.getMonth() - 2, 10),
      },
    );
  }

  async findAllAdmins(): Promise<AdminUserSummary[]> {
    return [...this.admins];
  }

  async findAdminById(id: string): Promise<AdminUserSummary | null> {
    return this.admins.find((a) => a.adminId === id) ?? null;
  }
}