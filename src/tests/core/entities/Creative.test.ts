import { describe, it, expect } from 'vitest';
import { Creative } from '../../../core/entities/Creative';
import { DomainError } from '../../../core/errors/DomainError';

describe('Creative', () => {
  function makeCreative() {
    return new Creative('cr1', 'Banner Ad', 'camp-1', 'image', 'https://example.com/ad.png');
  }

  it('constructs in draft status by default', () => {
    const c = makeCreative();
    expect(c.status).toBe('draft');
    expect(c.id).toBe('cr1');
    expect(c.campaignId).toBe('camp-1');
  });

  it('implements IApprovable — tracks submission and approval history', () => {
    const c = makeCreative();
    expect(c.submittedAt).toBeNull();
    expect(c.submittedBy).toBeNull();
    c.submitForApproval('admin-1', 'Admin One');
    expect(c.status).toBe('pending_approval');
    expect(c.submittedAt).not.toBeNull();
    expect(c.submittedBy).toBe('admin-1');
    expect(c.approvalHistory).toHaveLength(1);
  });

  it('state machine allows draft → pending_approval → active', () => {
    const c = makeCreative();
    c.submitForApproval('admin-1', 'Admin One');
    c.approve('admin-1', 'Admin One');
    expect(c.status).toBe('active');
  });

  it('state machine throws on invalid transition draft → active', () => {
    const c = makeCreative();
    expect(() => c.transitionStatus('active', 'admin-1', 'Admin One')).toThrow(DomainError);
  });

  it('state machine allows active → paused → active', () => {
    const c = makeCreative();
    c.submitForApproval('admin-1', 'Admin One');
    c.approve('admin-1', 'Admin One');
    c.pause('admin-1', 'Admin One');
    expect(c.status).toBe('paused');
    c.resume('admin-1', 'Admin One');
    expect(c.status).toBe('active');
  });

  it('state machine allows rejected → pending_approval (resubmit)', () => {
    const c = makeCreative();
    c.submitForApproval('admin-1', 'Admin One');
    c.reject('admin-1', 'Admin One');
    expect(c.status).toBe('rejected');
    c.submitForApproval('admin-1', 'Admin One');
    expect(c.status).toBe('pending_approval');
  });
});