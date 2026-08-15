/**
 * TeamPermissionLevel.test.ts — tests/core/types/
 *
 * !!! TYPE-LEVEL CONSTRAINT TEST !!!
 *
 * Confirms that 'approve' is genuinely unavailable at the type level for
 * the Team & Roles UI context — not just hidden via a filtered dropdown.
 *
 * The TeamPermissionLevel type is defined as 'view' | 'edit' | 'none' —
 * 'approve' is NOT a member. A developer using this type in the Team &
 * Roles UI literally cannot assign 'approve' — TypeScript prevents it
 * at compile time.
 *
 * The @ts-expect-error directive below is the type-level test: if someone
 * adds 'approve' to TeamPermissionLevel, the directive becomes unused and
 * tsc fails with "Unused '@ts-expect-error' directive." This is the
 * standard pattern for testing negative type constraints in TypeScript.
 */
import { describe, it, expect } from 'vitest';
import { TEAM_PERMISSION_LEVELS, ALL_TEAM_PERMISSION_LEVELS, PRESET_ROLE_PERMISSIONS } from '../../../core/types/TeamPermissionLevel';
import type { TeamPermissionLevel } from '../../../core/types/TeamPermissionLevel';

describe('TeamPermissionLevel type constraint', () => {
  it('does not include "approve" in the available permission levels array', () => {
    expect(TEAM_PERMISSION_LEVELS).not.toContain('approve');
  });

  it('contains only view, edit, and none', () => {
    expect(TEAM_PERMISSION_LEVELS).toEqual(['view', 'edit', 'none']);
  });

  it('ALL_TEAM_PERMISSION_LEVELS does not contain approve', () => {
    expect(ALL_TEAM_PERMISSION_LEVELS).not.toContain('approve');
  });

  it('no preset role has any approve-level permission', () => {
    for (const [_roleName, permissions] of Object.entries(PRESET_ROLE_PERMISSIONS)) {
      for (const [_module, level] of Object.entries(permissions)) {
        expect(level).not.toBe('approve');
      }
    }
  });

  // Type-level test: if 'approve' were assignable to TeamPermissionLevel,
  // this @ts-expect-error would be unused and tsc would report an error.
  // Since 'approve' is NOT assignable, the directive is needed and correct.
  it('prevents "approve" assignment at the type level', () => {
    // @ts-expect-error - 'approve' is not a valid TeamPermissionLevel
    const _test: TeamPermissionLevel = 'approve';
    // This line is unreachable due to the type error above; the test
    // exists solely to verify the type-level constraint at compile time.
    expect(true).toBe(true);
  });
});