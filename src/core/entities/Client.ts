/**
 * Client.ts — core/entities/
 *
 * A client account on the DSP platform. Clients are the entities that
 * Admins manage and that Super Admins oversee.
 */
export type ClientStatus = 'active' | 'suspended' | 'terminated';

export class Client {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly contactEmail: string,
    private _status: ClientStatus = 'active',
    public readonly createdAt: Date = new Date(),
  ) {}

  public get status(): ClientStatus {
    return this._status;
  }

  public suspend(): void {
    if (this._status === 'terminated') {
      throw new Error('Cannot suspend a terminated client');
    }
    this._status = 'suspended';
  }

  public reactivate(): void {
    if (this._status === 'terminated') {
      throw new Error('Cannot reactivate a terminated client');
    }
    this._status = 'active';
  }

  public terminate(): void {
    this._status = 'terminated';
  }
}