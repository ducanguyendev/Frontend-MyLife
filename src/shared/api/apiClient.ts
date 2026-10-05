export type ApiValidationErrors = Record<string, string[] | string>;

export interface ApiErrorPayload {
  success?: boolean;
  message?: string;
  title?: string;
  errors?: ApiValidationErrors;
}

export class ApiError extends Error {
  readonly status: number;
  readonly errors?: ApiValidationErrors;
  readonly payload?: unknown;

  constructor(message: string, status = 0, payload?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
    this.errors = isApiErrorPayload(payload) ? payload.errors : undefined;
  }
}

export interface ApiRequestOptions extends Omit<RequestInit, 'body' | 'credentials'> {
  /**
   * Plain objects are serialized as JSON. FormData and other BodyInit values
   * are passed through without forcing a Content-Type header.
   */
  body?: BodyInit | object | null;
  /** Do not attempt a refresh for endpoints such as login, refresh, or logout. */
  skipAuthRefresh?: boolean;
}

const configuredBaseUrl = (import.meta.env.VITE_API_URL ?? '').trim();
export const API_BASE_URL = configuredBaseUrl.replace(/\/$/, '');

const authEndpointsWithoutRefresh = new Set([
  '/api/login',
  '/api/auth/register',
  '/api/auth/google',
  '/api/refresh-token',
  '/api/logout',
]);

function isApiErrorPayload(value: unknown): value is ApiErrorPayload {
  return typeof value === 'object' && value !== null;
}

function firstValidationMessage(errors: ApiValidationErrors | undefined): string | undefined {
  if (!errors) return undefined;

  for (const value of Object.values(errors)) {
    if (Array.isArray(value) && value[0]) return value[0];
    if (typeof value === 'string' && value) return value;
  }

  return undefined;
}

function errorMessage(payload: unknown, status: number): string {
  if (isApiErrorPayload(payload)) {
    if (typeof payload.message === 'string' && payload.message) return payload.message;
    if (typeof payload.title === 'string' && payload.title) return payload.title;

    const validationMessage = firstValidationMessage(payload.errors);
    if (validationMessage) return validationMessage;
  }

  if (status === 401) return 'Your session has expired. Please sign in again.';
  if (status === 403) return 'You do not have permission to perform this action.';
  if (status === 404) return 'The requested resource was not found.';
  if (status >= 500) return 'The server could not complete this request. Please try again later.';
  return `Request failed (${status}).`;
}

async function readResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined;

  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return response.json().catch(() => undefined);
  }

  const text = await response.text().catch(() => '');
  return text || undefined;
}

function isJsonBody(body: ApiRequestOptions['body']): body is object {
  return body !== null
    && typeof body === 'object'
    && !(body instanceof FormData)
    && !(body instanceof URLSearchParams)
    && !(body instanceof Blob)
    && !(body instanceof ArrayBuffer)
    && !ArrayBuffer.isView(body);
}

/**
 * Shared browser API client. Authentication is cookie-only: neither access nor
 * refresh tokens are read from or written to JavaScript storage.
 */
class ApiClient {
  private refreshPromise: Promise<void> | null = null;
  private sessionKnownActive = false;
  private sessionExpiredNotified = false;
  private invalidationPromise: Promise<void> | null = null;
  private signingOut = false;

  url(path: string): string {
    if (/^https?:\/\//i.test(path)) return path;
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${API_BASE_URL}${normalizedPath}`;
  }

  markSessionActive(): void {
    this.signingOut = false;
    this.sessionKnownActive = true;
    this.sessionExpiredNotified = false;
  }

  clearSessionState(): void {
    this.sessionKnownActive = false;
  }

  async logoutSession(): Promise<void> {
    this.signingOut = true;
    // If rotation already started, wait for its Set-Cookie response before
    // revoking/deleting the resulting session. This prevents a late refresh
    // response from resurrecting cookies after the user has signed out.
    try {
      await this.refreshPromise;
    } catch {
      // A failed refresh already invalidates the server session when possible.
    }
    const response = await this.send('/api/logout', { method: 'POST', skipAuthRefresh: true });
    if (!response.ok) {
      const payload = await readResponseBody(response);
      throw new ApiError(errorMessage(payload, response.status), response.status, payload);
    }
    await readResponseBody(response);
    this.clearSessionState();
  }

  async get<T>(path: string, options: Omit<ApiRequestOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: 'GET' });
  }

  async post<T>(path: string, body?: ApiRequestOptions['body'], options: Omit<ApiRequestOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: 'POST', body });
  }

  async put<T>(path: string, body?: ApiRequestOptions['body'], options: Omit<ApiRequestOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: 'PUT', body });
  }

  async delete<T>(path: string, options: Omit<ApiRequestOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: 'DELETE' });
  }

  async request<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
    const response = await this.requestRaw(path, options);
    const payload = await readResponseBody(response);

    if (!response.ok) {
      throw new ApiError(errorMessage(payload, response.status), response.status, payload);
    }

    return payload as T;
  }

  async requestRaw(path: string, options: ApiRequestOptions = {}): Promise<Response> {
    const response = await this.send(path, options);
    const canRefresh = !options.skipAuthRefresh
      && !this.signingOut
      && response.status === 401
      && !authEndpointsWithoutRefresh.has(this.pathOnly(path));

    if (!canRefresh) return response;

    try {
      await this.refreshSession();
      const retry = await this.send(path, options);
      if (retry.status === 401) {
        void this.invalidateSession();
      }
      return retry;
    } catch {
      // refreshSession has already invalidated the cookie session. Return the
      // original response so callers receive its endpoint-specific error.
      return response;
    }
  }

  private pathOnly(path: string): string {
    if (/^https?:\/\//i.test(path)) return new URL(path).pathname;
    return path.startsWith('/') ? path : `/${path}`;
  }

  private async send(path: string, options: ApiRequestOptions): Promise<Response> {
    const { body, headers: requestHeaders, ...requestOptions } = options;
    delete requestOptions.skipAuthRefresh;
    const headers = new Headers(requestHeaders);
    // Backend CSRF/origin middleware requires an explicit same-origin AJAX
    // marker for cookie-authenticated mutations. Sending it for reads keeps
    // request construction consistent without exposing credentials to JS.
    if (!headers.has('X-Requested-With')) headers.set('X-Requested-With', 'MyLife');
    let requestBody: BodyInit | null | undefined = body as BodyInit | null | undefined;

    if (isJsonBody(body)) {
      if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
      requestBody = JSON.stringify(body);
    }

    try {
      return await fetch(this.url(path), {
        ...requestOptions,
        headers,
        body: requestBody,
        credentials: 'include',
      });
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Unknown network error';
      throw new ApiError(`Unable to connect to the server. ${detail}`, 0);
    }
  }

  private async refreshSession(): Promise<void> {
    if (!this.refreshPromise) {
      this.refreshPromise = this.performRefresh().finally(() => {
        this.refreshPromise = null;
      });
    }

    return this.refreshPromise;
  }

  private async performRefresh(): Promise<void> {
    try {
      const response = await this.send('/api/refresh-token', {
        method: 'POST',
        skipAuthRefresh: true,
      });

      if (!response.ok) {
        const payload = await readResponseBody(response);
        throw new ApiError(errorMessage(payload, response.status), response.status, payload);
      }

      // The backend rotates HttpOnly cookies. Response tokens, if present for
      // mobile compatibility, are deliberately ignored by the web client.
      await readResponseBody(response);
      window.dispatchEvent(new CustomEvent('auth:refreshed'));
    } catch (error) {
      await this.invalidateSession();
      throw error;
    }
  }

  private async invalidateSession(): Promise<void> {
    if (this.invalidationPromise) return this.invalidationPromise;

    const notifySessionExpired = this.sessionKnownActive && !this.sessionExpiredNotified;
    this.sessionKnownActive = false;
    this.sessionExpiredNotified = this.sessionExpiredNotified || notifySessionExpired;

    this.invalidationPromise = (async () => {
      try {
        // Logout is idempotent and clears HttpOnly cookies even when refresh
        // rotation has already rejected the old session.
        await this.send('/api/logout', {
          method: 'POST',
          skipAuthRefresh: true,
        });
      } catch (error) {
        // The local UI must still become signed out if the network is down.
        console.warn('Unable to notify the server that the session ended.', error);
      } finally {
        if (notifySessionExpired) {
          window.dispatchEvent(new CustomEvent('auth:expired'));
        }
      }
    })().finally(() => {
      this.invalidationPromise = null;
    });

    return this.invalidationPromise;
  }
}

export const apiClient = new ApiClient();

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (error instanceof ApiError) return error.message || fallback;
  if (error instanceof Error) return error.message || fallback;
  return fallback;
}
