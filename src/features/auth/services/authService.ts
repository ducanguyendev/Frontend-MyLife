import { API_BASE_URL, apiClient } from '@/shared/api/apiClient';

export type UserRole = 'ADMIN' | 'USER';

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface AuthenticatedUser {
  id: number;
  email: string;
  fullName?: string | null;
  name?: string | null;
  phoneNumber?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  avatarUrl?: string | null;
  authProvider?: number;
  loginProviders?: {
    local: boolean;
    google: boolean;
  };
  role: UserRole;
  isActive: boolean;
}

/**
 * The API returns token fields for non-browser clients as part of the shared
 * contract. The web app intentionally never reads or stores them; HttpOnly
 * cookies are the only browser credential mechanism.
 */
export interface LoginResponse {
  success: boolean;
  message: string;
  user: AuthenticatedUser;
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpiresIn?: number;
  refreshTokenExpiresIn?: number;
}

export interface RegisterRequest {
  fullName: string;
  phoneNumber: string;
  gender: string;
  dateOfBirth: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface RegisterResponse {
  success?: boolean;
  message: string;
  email: string;
}

export type UserInfoResponse = AuthenticatedUser;

interface MessageResponse {
  success?: boolean;
  message: string;
}

interface ProfileResponse extends MessageResponse {
  user?: AuthenticatedUser;
}

const LEGACY_AUTH_STORAGE_KEYS = [
  'accessToken',
  'accessExpiresAt',
  'refreshToken',
  'refreshExpiresAt',
  'userEmail',
  'userAvatar',
  'userAuthProvider',
  'userRole',
  'userDisplayName',
  'rememberedPassword',
] as const;

let activeEmail: string | undefined;

function clearLegacyAuthStorage(): void {
  LEGACY_AUTH_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
}

function saveRemembered(email: string, rememberMe: boolean): void {
  // Always delete the old reversible password value when an existing browser
  // upgrades to this version of the app.
  localStorage.removeItem('rememberedPassword');

  if (rememberMe) {
    localStorage.setItem('rememberMe', 'true');
    localStorage.setItem('rememberedEmail', email.trim().toLowerCase());
    return;
  }

  localStorage.removeItem('rememberMe');
  localStorage.removeItem('rememberedEmail');
}

function setActiveUser(user: AuthenticatedUser | null): void {
  activeEmail = user?.email;
}

export const authService = {
  /** Removes credentials left by pre-cookie versions before checking /api/me. */
  prepareSessionCheck(): void {
    clearLegacyAuthStorage();
  },

  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>(
      '/api/login',
      {
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe,
      },
      { skipAuthRefresh: true },
    );

    saveRemembered(data.email, data.rememberMe);
    setActiveUser(response.user);
    apiClient.markSessionActive();
    return response;
  },

  async register(data: RegisterRequest): Promise<RegisterResponse> {
    return apiClient.post<RegisterResponse>('/api/auth/register', data, {
      skipAuthRefresh: true,
    });
  },

  /** Web Google OAuth uses a verified authorization code, never an email fallback. */
  async loginWithGoogle(code: string, redirectUri: string): Promise<LoginResponse> {
    if (!code.trim()) {
      throw new Error('Google did not return an authorization code.');
    }

    const response = await apiClient.post<LoginResponse>(
      '/api/auth/google',
      { code, redirectUri },
      { skipAuthRefresh: true },
    );

    setActiveUser(response.user);
    apiClient.markSessionActive();
    return response;
  },

  /** /api/me is the server-side source of truth after a page reload. */
  async getUserInfo(): Promise<UserInfoResponse> {
    const user = await apiClient.get<UserInfoResponse>('/api/me');
    setActiveUser(user);
    apiClient.markSessionActive();
    return user;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.logoutSession();
    } catch (error) {
      // The server may be unreachable, but the browser must still leave its
      // local authenticated UI state. HttpOnly cookies will be cleared by the
      // next successful logout response or expire naturally.
      console.warn('Unable to complete server logout.', error);
    } finally {
      setActiveUser(null);
      clearLegacyAuthStorage();
      apiClient.clearSessionState();
    }
  },

  clearSessionState(): void {
    setActiveUser(null);
    clearLegacyAuthStorage();
    apiClient.clearSessionState();
  },

  saveRemembered(email: string): void {
    saveRemembered(email, true);
  },

  clearRemembered(): void {
    localStorage.removeItem('rememberMe');
    localStorage.removeItem('rememberedEmail');
    localStorage.removeItem('rememberedPassword');
  },

  getRemembered(): { rememberMe: boolean; email: string } {
    // Clean up a legacy field even if the user has not logged in again yet.
    localStorage.removeItem('rememberedPassword');
    const rememberMe = localStorage.getItem('rememberMe') === 'true';
    return {
      rememberMe,
      email: rememberMe ? (localStorage.getItem('rememberedEmail') ?? '') : '',
    };
  },

  getRememberedEmail(): string | null {
    const remembered = this.getRemembered();
    return remembered.email || null;
  },

  getDisplayAvatarUrl(url?: string | null, email?: string, timestamp?: number): string | null {
    if (!url || url === 'none' || url === 'null' || url === 'undefined') return null;

    const targetEmail = email ?? activeEmail;
    if (targetEmail && (url.includes('drive.google.com') || url.startsWith('/api/avatar') || url.includes('/api/avatar/'))) {
      const cacheBuster = timestamp ?? Date.now();
      return apiClient.url(`/api/avatar/${encodeURIComponent(targetEmail)}?t=${cacheBuster}`);
    }

    if (/^(https?:|blob:|data:)/i.test(url)) return url;
    return apiClient.url(url);
  },

  getAvatarUrl(email?: string, timestamp?: number): string {
    const targetEmail = email ?? activeEmail;
    if (!targetEmail) return '';
    const cacheBuster = timestamp ? `?t=${timestamp}` : '';
    return apiClient.url(`/api/avatar/${encodeURIComponent(targetEmail)}${cacheBuster}`);
  },

  async uploadAvatar(file: File): Promise<{ message: string; avatarUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<{ message: string; avatarUrl: string }>(
      '/api/avatar/upload',
      formData,
    );

    window.dispatchEvent(new CustomEvent('auth:avatarUpdated', {
      detail: { avatarUrl: response.avatarUrl, timestamp: Date.now() },
    }));
    return response;
  },

  async deleteAvatar(): Promise<MessageResponse> {
    const response = await apiClient.delete<MessageResponse>('/api/avatar');
    window.dispatchEvent(new CustomEvent('auth:avatarUpdated', {
      detail: { avatarUrl: null },
    }));
    return response;
  },

  async updateProfile(data: { fullName: string; phoneNumber: string; gender: string; dateOfBirth: string }): Promise<ProfileResponse> {
    return apiClient.put<ProfileResponse>('/api/me/profile', data);
  },

  async changePassword(data: { currentPassword: string; newPassword: string; confirmPassword: string }): Promise<MessageResponse> {
    return apiClient.post<MessageResponse>('/api/auth/change-password', data);
  },

  setStoredName(name: string): void {
    // This is intentionally an in-memory UI update. Profile identity is read
    // from /api/me on every fresh app load rather than from localStorage.
    window.dispatchEvent(new CustomEvent('auth:nameUpdated', { detail: { name } }));
  },
};

export { API_BASE_URL };
