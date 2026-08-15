/**
 * Registration.ts — core/entities/
 *
 * A new client registration awaiting Super Admin review.
 *
 * This is the ONLY entity whose approval creates a new Client account.
 * No other code path in the entire app can create a Client — all new
 * clients originate here, via RegistrationService.approveRegistration().
 *
 * Margin fields:
 *   - baseMargin: the platform's take rate for this client (Percentage VO)
 *   - typeSpecificMargins: per-campaign-type margin overrides
 *   These are set at approval time by the Super Admin, pre-filled from
 *   Platform Settings' default base margin but editable.
 */
import { Percentage } from '../value-objects/Percentage';

export type RegistrationStatus = 'pending' | 'approved' | 'rejected' | 'info_requested';

export interface TypeSpecificMargin {
  campaignType: string;
  margin: Percentage;
}

export class Registration {
  constructor(
    public readonly id: string,
    public readonly companyName: string,
    public readonly contactName: string,
    public readonly contactEmail: string,
    public readonly submittedAt: Date,
    public readonly requestedCampaignTypes: readonly string[],
    private _status: RegistrationStatus = 'pending',
    private _baseMargin: Percentage | null = null,
    private _typeSpecificMargins: TypeSpecificMargin[] = [],
    private _reviewNote: string | null = null,
  ) {}

  public get status(): RegistrationStatus {
    return this._status;
  }

  public get baseMargin(): Percentage | null {
    return this._baseMargin;
  }

  public get typeSpecificMargins(): TypeSpecificMargin[] {
    return [...this._typeSpecificMargins];
  }

  public get reviewNote(): string | null {
    return this._reviewNote;
  }

  public approve(baseMargin: Percentage, typeSpecificMargins: TypeSpecificMargin[]): void {
    if (this._status !== 'pending' && this._status !== 'info_requested') {
      throw new Error(`Cannot approve a registration with status: ${this._status}`);
    }
    this._baseMargin = baseMargin;
    this._typeSpecificMargins = [...typeSpecificMargins];
    this._status = 'approved';
  }

  public reject(note: string): void {
    if (this._status !== 'pending' && this._status !== 'info_requested') {
      throw new Error(`Cannot reject a registration with status: ${this._status}`);
    }
    this._reviewNote = note;
    this._status = 'rejected';
  }

  public requestMoreInfo(note: string): void {
    if (this._status !== 'pending') {
      throw new Error(`Cannot request more info for a registration with status: ${this._status}`);
    }
    this._reviewNote = note;
    this._status = 'info_requested';
  }
}