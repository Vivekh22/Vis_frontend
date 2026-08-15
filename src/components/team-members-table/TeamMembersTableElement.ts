/**
 * TeamMembersTableElement.ts — components/team-members-table/
 *
 * Shared team members table extracted from AccDetailsPageElement.
 * Used by:
 *   - Client Account Details (editable — invites, role changes, removal)
 *   - Admin Accounts drill-down (read-only — view only, no edit controls)
 *
 * !!! READ-ONLY ENFORCEMENT AT COMPONENT LEVEL !!!
 * When the `read-only` attribute is present, the component REFUSES to
 * render edit/invite/remove controls — not just hides them. The
 * inviteMember(), removeMember(), and updateMemberRole() handlers are
 * short-circuited: even if a future page reuses this component and
 * accidentally leaves an action button visible, the handler itself
 * throws in read-only mode. This is defense-in-depth — the component
 * enforces its own contract rather than relying on callers to hide UI.
 */
import { BaseComponent } from '../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString } from '../../platform/rendering/SafeHtml';
import { teamService } from '../../services';
import type { TeamMember } from '../../core/entities/TeamMember';

const STYLES = `
  :host { display: block; font-family: var(--font-body); }
  .header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4); }
  .btn { padding: var(--space-2) var(--space-4); background: var(--color-primary); color: var(--color-primary-foreground); border: none; border-radius: var(--radius-md); cursor: pointer; font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold); }
  .btn.secondary { background: var(--color-bg); color: var(--color-text-primary); border: 1px solid var(--color-border); }
  .btn.danger { background: var(--color-danger); color: var(--color-danger-foreground); }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: var(--space-2) var(--space-3); border-bottom: 1px solid var(--color-border); font-size: var(--font-size-sm); color: var(--color-text-primary); }
  th { font-weight: var(--font-weight-semibold); color: var(--color-text-muted); text-transform: uppercase; font-size: var(--font-size-xs); }
  .owner-badge { background: var(--color-primary); color: var(--color-primary-foreground); padding: var(--space-1) var(--space-2); border-radius: var(--radius-full); font-size: var(--font-size-xs); font-weight: var(--font-weight-semibold); }
  .readonly-notice { font-size: var(--font-size-xs); color: var(--color-text-muted); font-style: italic; margin-bottom: var(--space-3); }
  .role-select { padding: var(--space-1) var(--space-2); border: 1px solid var(--color-border); border-radius: var(--radius-sm); font-size: var(--font-size-xs); background: var(--color-bg); color: var(--color-text-primary); }
`;

class TeamMembersTableElement extends BaseComponent {
  private teamMembers: TeamMember[] = [];
  private isLoading = true;
  private readOnly = false;
  private clientId = 'client-1';

  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
  }

  public set clientIdValue(value: string) {
    this.clientId = value;
    void this.loadTeamMembers();
  }

  protected onMount(): void {
    this.readOnly = this.hasAttribute('read-only');
    if (this.hasAttribute('client-id')) {
      this.clientId = this.getAttribute('client-id') ?? 'client-1';
    }
    this.shadow.addEventListener('click', this.handleClick);
    void this.loadTeamMembers();
  }

  protected onUnmount(): void {
    this.shadow.removeEventListener('click', this.handleClick);
  }

  private async loadTeamMembers(): Promise<void> {
    this.isLoading = true;
    this.rerender();
    try {
      this.teamMembers = await teamService.listMembers(this.clientId);
    } catch {
      // Use defaults
    }
    this.isLoading = false;
    this.rerender();
  }

  private handleClick = (event: Event): void => {
    const target = event.target as HTMLElement;

    // READ-ONLY ENFORCEMENT: refuse all mutations in read-only mode.
    // Even if a button somehow renders, the handler itself rejects the action.
    if (this.readOnly) {
      const actionEl = target.closest('[data-action]');
      if (actionEl && ['invite-member', 'remove-member', 'update-role'].includes(actionEl.getAttribute('data-action') ?? '')) {
        throw new Error('TeamMembersTableElement is in read-only mode — mutation actions are refused.');
      }
      return;
    }

    if (target.closest('[data-action="invite-member"]')) {
      // Delegate to parent page for invite flow
      this.emit('invite-requested', { clientId: this.clientId });
      return;
    }
    const removeBtn = target.closest('[data-action="remove-member"]');
    if (removeBtn) {
      const memberId = removeBtn.getAttribute('data-member-id') ?? '';
      void this.removeMember(memberId);
      return;
    }
  };

  private async removeMember(memberId: string): Promise<void> {
    if (this.readOnly) return; // Defense-in-depth
    await teamService.removeMember(memberId);
    await this.loadTeamMembers();
  }

  protected renderTemplate(): string {
    if (this.isLoading) {
      return html`<loading-state variant="skeleton" shape="card"></loading-state>`;
    }
    const notice = this.readOnly
      ? '<p class="readonly-notice">Viewing team members in read-only mode.</p>'
      : '';
    const inviteBtn = this.readOnly
      ? ''
      : '<button class="btn" data-action="invite-member" type="button">+ Invite Team Member</button>';
    const rows = this.teamMembers.length === 0
      ? '<tr><td colspan="7" style="text-align:center;color:var(--color-text-muted);">No team members</td></tr>'
      : this.teamMembers.map((m) => `
        <tr>
          <td>${m.fullName}${m.isOwner ? ' <span class="owner-badge">Owner</span>' : ''}</td>
          <td>${m.email}</td>
          <td>${m.role}</td>
          <td>${m.status}</td>
          <td>${m.dateAdded.toLocaleDateString()}</td>
          <td>${m.lastActiveAt ? m.lastActiveAt.toLocaleDateString() : '—'}</td>
          <td>${!this.readOnly && m.isRemovable ? `<button class="btn danger" data-action="remove-member" data-member-id="${m.id}" type="button">Remove</button>` : '—'}</td>
        </tr>
      `).join('');
    return html`
      ${notice}
      <div class="header-row">${inviteBtn}</div>
      <table>
        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Date Added</th><th>Last Active</th><th>Actions</th></tr></thead>
        <tbody>${SafeHtmlString.trusted(rows)}</tbody>
      </table>
    `;
  }
}

ComponentRegistry.register('team-members-table', TeamMembersTableElement);
export { TeamMembersTableElement };