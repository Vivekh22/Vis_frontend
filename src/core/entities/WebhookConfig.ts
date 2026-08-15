/**
 * WebhookConfig.ts — core/entities/
 *
 * Represents a webhook subscription for platform events.
 */
import type { WebhookEvent } from '../enums/WebhookEvent';

export class WebhookConfig {
  private _events: Set<WebhookEvent>;
  private _active: boolean;

  constructor(
    public readonly id: string,
    public readonly clientId: string,
    public readonly url: string,
    events: WebhookEvent[],
    active: boolean = true,
    public readonly secret?: string,
    public readonly createdAt: Date = new Date(),
  ) {
    this._events = new Set(events);
    this._active = active;
  }

  public get events(): readonly WebhookEvent[] {
    return Array.from(this._events);
  }

  public get isActive(): boolean {
    return this._active;
  }

  public subscribesTo(event: WebhookEvent): boolean {
    return this._events.has(event);
  }

  public toggleEvent(event: WebhookEvent): void {
    if (this._events.has(event)) {
      this._events.delete(event);
    } else {
      this._events.add(event);
    }
  }

  public activate(): void {
    this._active = true;
  }

  public deactivate(): void {
    this._active = false;
  }
}