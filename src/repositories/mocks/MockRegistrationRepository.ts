/**
 * MockRegistrationRepository.ts — repositories/mocks/
 *
 * In-memory mock for RegistrationService. Seeds sample registrations.
 *
 * createClientFromRegistration() simulates the account-creation step.
 * In the real backend, this would create a new Client record with the
 * margin values from the approved registration.
 */
import { Registration } from '../../core/entities/Registration';
import type { RegistrationRepository } from '../../services/RegistrationService';

export class MockRegistrationRepository implements RegistrationRepository {
  private readonly registrations: Registration[] = [];
  private clientCounter = 100;

  constructor() {
    this.seed();
  }

  private seed(): void {
    const now = new Date();
    this.registrations.push(
      new Registration(
        'reg_001',
        'TechFlow Solutions',
        'Sarah Connor',
        'sarah@techflow.com',
        new Date(now.getTime() - 2 * 86400000),
        ['Acquisition', 'Retargeting'],
      ),
      new Registration(
        'reg_002',
        'ByteWright Inc',
        'Marcus Chen',
        'marcus@bytewright.com',
        new Date(now.getTime() - 5 * 86400000),
        ['Brand Awareness'],
      ),
      new Registration(
        'reg_003',
        'Nexus Digital',
        'Elena Rodriguez',
        'elena@nexusdigital.com',
        new Date(now.getTime() - 1 * 86400000),
        ['Acquisition', 'Brand Awareness', 'Retargeting'],
      ),
    );
  }

  async findAll(): Promise<Registration[]> {
    return [...this.registrations];
  }

  async findById(id: string): Promise<Registration | null> {
    return this.registrations.find((r) => r.id === id) ?? null;
  }

  async save(registration: Registration): Promise<void> {
    const idx = this.registrations.findIndex((r) => r.id === registration.id);
    if (idx >= 0) {
      this.registrations[idx] = registration;
    } else {
      this.registrations.push(registration);
    }
  }

  async createClientFromRegistration(registration: Registration): Promise<string> {
    // Simulate account creation — the real backend would insert a new
    // Client record with the margin values from the registration.
    const clientId = `client-${++this.clientCounter}`;
    return clientId;
  }
}