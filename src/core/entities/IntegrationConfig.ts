/**
 * IntegrationConfig.ts — core/entities/
 *
 * Represents an MMP (Mobile Measurement Partner) integration connection.
 */
import type { IntegrationProvider } from '../enums/IntegrationProvider';

export class IntegrationConfig {
  private _connected: boolean;

  constructor(
    public readonly id: string,
    public readonly clientId: string,
    public readonly provider: IntegrationProvider,
    public readonly appName: string,
    public readonly apiKey: string,
    public readonly appId?: string,
    connected: boolean = false,
    public readonly connectedAt?: Date,
  ) {
    this._connected = connected;
  }

  public get isConnected(): boolean {
    return this._connected;
  }

  public connect(): void {
    this._connected = true;
  }

  public disconnect(): void {
    this._connected = false;
  }
}