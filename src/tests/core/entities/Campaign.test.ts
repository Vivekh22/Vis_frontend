// @ts-nocheck
import { describe, it, expect } from 'vitest';
import { Campaign } from '../../../core/entities/Campaign';
import { Money } from '../../../core/value-objects/Money';
import { DomainError } from '../../../core/errors/DomainError';

describe('Campaign', () => {
  function makeCampaign() {
    return new Campaign(
      'c1',
      'Test Campaign',
      'client-1',
      new Money(500000, 'USD'),
      'maximize_clicks',
      new Date('2026-01-01'),
      new Date('2026-12-31'),
    );
  }

  it('constructs in draft status by default', () => {
    const c = makeCampaign();
    expect(c.status).toBe('draft');
    expect(c.id).toBe('c1');
    expect(c.name).toBe('Test Campaign');
    expect(c.clientId).toBe('client-1');
  });

  it('implements IApprovable — tracks submission and approval history', () => {
    const c = makeCampaign();
    expect(c.submittedAt).toBeNull();
    expect(c.submittedBy).toBeNull();
    expect(c.approvalHistory).toEqual([]);

    c.submitForApproval('admin-1', 'Admin One', 'Submitting for review');
    expect(c.status).toBe('pending_approval');
    expect(c.submittedAt).not.toBeNull();
    expect(c.submittedBy).toBe('admin-1');
    expect(c.approvalHistory).toHaveLength(1);
  });

  it('implements IAuditable — getHistory returns audit entries', () => {
    const c = makeCampaign();
    c.submitForApproval('admin-1', 'Admin One');
    const history = c.getHistory();
    expect(history).toHaveLength(1);
    expect(history[0]!.action).toContain('status_transition');
  });

  it('state machine allows draft → pending_approval → running', () => {
    const c = makeCampaign();
    c.submitForApproval('admin-1', 'Admin One');
    c.approve('admin-1', 'Admin One');
    expect(c.status).toBe('running');
  });

  it('state machine throws on invalid transition draft → running', () => {
    const c = makeCampaign();
    expect(() => c.transitionStatus('running', 'admin-1', 'Admin One')).toThrow(DomainError);
  });

  it('state machine allows running → paused → running', () => {
    const c = makeCampaign();
    c.submitForApproval('admin-1', 'Admin One');
    c.approve('admin-1', 'Admin One');
    c.pause('admin-1', 'Admin One');
    expect(c.status).toBe('paused');
    c.resume('admin-1', 'Admin One');
    expect(c.status).toBe('running');
  });

  it('state machine allows rejected → pending_approval (resubmit)', () => {
    const c = makeCampaign();
    c.submitForApproval('admin-1', 'Admin One');
    c.reject('admin-1', 'Admin One', 'Needs changes');
    expect(c.status).toBe('rejected');
    c.submitForApproval('admin-1', 'Admin One');
    expect(c.status).toBe('pending_approval');
  });

  it('state machine allows archiving from any non-archived state', () => {
    const c = makeCampaign();
    c.archive('admin-1', 'Admin One');
    expect(c.status).toBe('archived');
  });

  it('state machine throws on transition from archived', () => {
    const c = makeCampaign();
    c.archive('admin-1', 'Admin One');
    expect(() => c.submitForApproval('admin-1', 'Admin One')).toThrow(DomainError);
  });

  it('getBudget returns the Money value object', () => {
    const c = makeCampaign();
    expect(c.getBudget()).toBeInstanceOf(Money);
    expect(c.getBudget().getAmountMinorUnits()).toBe(500000);
  });
});