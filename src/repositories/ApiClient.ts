/**
 * ApiClient.ts — repositories/
 *
 * The single, audited HTTP client every real repository uses. No repository
 * should call fetch() directly — all traffic funnels through here, the same
 * "one audited chokepoint" principle SafeHtml.ts established for rendering.
 *
 * Responsibilities:
 *   - Correct HTTP method per call type (GET/POST/PUT/PATCH/DELETE)
 *   - JSON body serialization for write methods
 *   - Authorization header from TokenStorage (never read tokens any other way)
 *   - credentials: 'include' for the httpOnly-cookie-first auth model
 *   - CSRF protection via CsrfProtection (double-submit-cookie pattern)
 *   - Centralized error translation: non-2xx → ApiError
 *   - 401 → onUnauthorized callback (injected, not imported — avoids a
 *     circular dependency between data layer and service layer)
 *   - AbortSignal support for request cancellation
 *
 * Zero runtime dependencies — native fetch only.
 */
import { TokenStorage } from '../security/TokenStorage';
import { CsrfProtection } from '../security/CsrfProtection';
import { ApiError } from '../core/errors/ApiError';

type OnUnauthorized = () => void;

interface RequestOptions {
  signal?: AbortSignal;
}

export class ApiClient {
  constructor(
    private readonly baseUrl: string,
    private readonly onUnauthorized?: OnUnauthorized,
  ) {}

  public async get<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('GET', path, undefined, options);
  }

  public async post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('POST', path, body, options);
  }

  public async put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('PUT', path, body, options);
  }

  public async patch<T>(path: string, body: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('PATCH', path, body, options);
  }

  public async delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('DELETE', path, undefined, options);
  }

  private async request<T>(
    method: string,
    path: string,
    body: unknown,
    options?: RequestOptions,
  ): Promise<T> {
    const url = this.buildUrl(path);
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };

    const token = TokenStorage.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const isStateChanging = method !== 'GET';
    if (isStateChanging) {
      headers['Content-Type'] = 'application/json';
      const csrfToken = CsrfProtection.getToken();
      if (csrfToken) {
        headers[CsrfProtection.getHeaderName()] = csrfToken;
      }
    }

    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers,
        credentials: 'include',
        body: isStateChanging && body !== undefined ? JSON.stringify(body) : undefined,
        signal: options?.signal,
      });
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw err;
      }
      throw new ApiError(
        `Network error: ${method} ${path}`,
        0,
        { error: String(err) },
      );
    }

    if (!response.ok) {
      return this.handleError(response, method, path);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const text = await response.text();
    if (!text) {
      return undefined as T;
    }
    return JSON.parse(text) as T;
  }

  private async handleError(response: Response, method: string, path: string): Promise<never> {
    let body: unknown = null;
    try {
      const text = await response.text();
      if (text) {
        body = JSON.parse(text);
      }
    } catch {
      // Body is not JSON — leave as null
    }

    if (response.status === 401 && this.onUnauthorized) {
      this.onUnauthorized();
    }

    throw new ApiError(
      `API error ${response.status}: ${method} ${path}`,
      response.status,
      body,
    );
  }

  private buildUrl(path: string): string {
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    const base = this.baseUrl.endsWith('/') ? this.baseUrl.slice(0, -1) : this.baseUrl;
    const p = path.startsWith('/') ? path : `/${path}`;
    return `${base}${p}`;
  }
}