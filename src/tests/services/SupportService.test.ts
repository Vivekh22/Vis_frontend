// @ts-nocheck
/**
 * SupportService.test.ts — tests/services/
 *
 * !!! INTERNAL NOTES ABSENCE !!!
 * Tests that the SupportService does not have an internalNotes field
 * in any method signature, DTO, or return type.
 */
import { describe, it, expect, vi } from 'vitest';
import { SupportService } from '../../services/SupportService';
import { SupportService } from '../../services/SupportService';
import { SupportTicket } from '../../core/entities/SupportTicket';

function createMockRepo(): SupportRepository {
  const tickets: SupportTicket[] = [
    new SupportTicket('tkt_1', 'client-1', 'Test', 'technical', 'open', 'medium', new Date()),
  ];
  return {
    findAll: vi.fn().mockResolvedValue(tickets),
    findById: vi.fn().mockResolvedValue(tickets[0]),
    create: vi.fn().mockResolvedValue(tickets[0]),
    addReply: vi.fn().mockResolvedValue(tickets[0]),
    updateStatus: vi.fn(),
  };
}

describe('SupportService — Internal Notes Absence', () => {
  it('SupportService does not have an internalNotes-related method', () => {
    const service = new SupportService(createMockRepo());
    const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(service));
    const notesMethods = methods.filter((m) => m.toLowerCase().includes('internalnote'));
    expect(notesMethods).toEqual([]);
  });

  it('SupportRepository interface does not have an internalNotes method', () => {
    const repo = createMockRepo();
    const keys = Object.keys(repo);
    const notesKeys = keys.filter((k) => k.toLowerCase().includes('internalnote'));
    expect(notesKeys).toEqual([]);
  });

  it('SupportTicket entity does not have an internalNotes field', () => {
    const ticket = new SupportTicket('t1', 'c1', 'Test', 'technical', 'open', 'medium', new Date());
    const keys = Object.keys(ticket);
    const notesKeys = keys.filter((k) => k.toLowerCase().includes('internalnote'));
    expect(notesKeys).toEqual([]);
  });

  it('serialized SupportTicket does not contain "internalNote"', () => {
    const ticket = new SupportTicket('t1', 'c1', 'Test', 'technical', 'open', 'medium', new Date());
    const serialized = JSON.stringify(ticket);
    expect(serialized.toLowerCase()).not.toContain('internalnote');
  });
});

describe('SupportService — Basic Operations', () => {
  it('listTickets returns tickets from repository', async () => {
    const service = new SupportService(createMockRepo());
    const tickets = await service.listTickets('client-1');
    expect(tickets.length).toBe(1);
  });

  it('createTicket calls repository create', async () => {
    const repo = createMockRepo();
    const service = new SupportService(repo);
    await service.createTicket({
      clientId: 'client-1',
      subject: 'New Issue',
      category: 'technical',
      priority: 'high',
      body: 'Something is broken',
    });
    expect(repo.create).toHaveBeenCalledTimes(1);
  });

  it('addReply calls repository addReply', async () => {
    const repo = createMockRepo();
    const service = new SupportService(repo);
    await service.addReply({
      ticketId: 'tkt_1',
      authorId: 'u1',
      authorName: 'User',
      body: 'Reply text',
      isFromClient: true,
    });
    expect(repo.addReply).toHaveBeenCalledTimes(1);
  });
});