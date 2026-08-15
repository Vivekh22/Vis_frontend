/**
 * RegistrationService.ts — services/
 *
 * !!! SOLE ACCOUNT-CREATION ENTRY POINT !!!
 *
 * approveRegistration() is the ONLY method in the entire frontend that
 * creates a new Client account. No other service, repository, or page
 * can create a Client. This is enforced by:
 *   1. Client entity has no public constructor exposed outside this flow
 *   2. RegistrationService is the only service with a createClient method
 *   3. The ClientRepository (real or mock) only accepts new clients from
 *      this service's approveRegistration flow
 *
 * Approval flow:
 *   Super Admin reviews the registration, sets base margin (pre-filled
 *   from Platform Settings' default) and type-specific margins, then
 *   calls approveRegistration(). This:
 *     1. Sets the margin values on the Registration entity
 *     2. Transitions the registration to 'approved' status
 *     3. Creates a new Client account with the margin values
 *     4. The Client's Registration Status page (Part 7) reflects this
 *        on their next check
 */
import { Registration, type TypeSpecificMargin } from '../core/entities/Registration';
import type { RegistrationStatus } from '../core/entities/Registration';
import { Percentage } from '../core/value-objects/Percentage';
import type { PlatformSettingsService } from './PlatformSettingsService';
import { ValidationError } from '../core/errors/ValidationError';

export interface RegistrationRepository {
  findAll(): Promise<Registration[]>;
  findById(id: string): Promise<Registration | null>;
  save(registration: Registration): Promise<void>;
  createClientFromRegistration(registration: Registration): Promise<string>;
}

export interface RegistrationFilter {
  status?: RegistrationStatus;
}

export class RegistrationService {
  constructor(
    private readonly registrationRepo: RegistrationRepository,
    private readonly platformSettingsService: PlatformSettingsService,
  ) {}

  async getPendingRegistrations(): Promise<Registration[]> {
    const all = await this.registrationRepo.findAll();
    return all.filter((r) => r.status === 'pending' || r.status === 'info_requested');
  }

  async getRegistration(id: string): Promise<Registration | null> {
    return this.registrationRepo.findById(id);
  }

  /**
   * Returns the default base margin from Platform Settings, pre-filled
   * into the New Registrations review screen's base margin input.
   */
  async getDefaultBaseMargin(): Promise<Percentage> {
    const value = await this.platformSettingsService.getDefaultBaseMargin();
    return new Percentage(value);
  }

  /**
   * !!! THE SOLE ACCOUNT-CREATION ENTRY POINT !!!
   *
   * Approves a registration, setting margin values and creating a new
   * Client account. No other code path can create a Client.
   *
   * Margin values are FORWARD-LOOKING ONLY — they apply from the date
   * of approval forward, never retroactively to already-billed periods.
   */
  async approveRegistration(
    registrationId: string,
    baseMargin: Percentage,
    typeSpecificMargins: TypeSpecificMargin[],
  ): Promise<string> {
    const registration = await this.registrationRepo.findById(registrationId);
    if (!registration) {
      throw new ValidationError('Registration not found', 'registrationId', 'existing-id');
    }
    if (registration.status !== 'pending' && registration.status !== 'info_requested') {
      throw new ValidationError(
        `Registration is already ${registration.status}`,
        'registrationId',
        'pending-or-info-requested',
      );
    }

    registration.approve(baseMargin, typeSpecificMargins);
    await this.registrationRepo.save(registration);

    // Create the new Client account — this is the ONLY place this happens
    const clientId = await this.registrationRepo.createClientFromRegistration(registration);
    return clientId;
  }

  async rejectRegistration(registrationId: string, note: string): Promise<void> {
    this.validateNote(note);
    const registration = await this.registrationRepo.findById(registrationId);
    if (!registration) {
      throw new ValidationError('Registration not found', 'registrationId', 'existing-id');
    }
    registration.reject(note);
    await this.registrationRepo.save(registration);
  }

  async requestMoreInfo(registrationId: string, note: string): Promise<void> {
    this.validateNote(note);
    const registration = await this.registrationRepo.findById(registrationId);
    if (!registration) {
      throw new ValidationError('Registration not found', 'registrationId', 'existing-id');
    }
    registration.requestMoreInfo(note);
    await this.registrationRepo.save(registration);
  }

  private validateNote(note: string): void {
    if (!note || note.trim().length < 10) {
      throw new ValidationError(
        'A note of at least 10 characters is required',
        'note',
        'min-10-chars',
      );
    }
  }
}