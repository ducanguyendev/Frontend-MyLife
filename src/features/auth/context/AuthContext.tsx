import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  authService,
  type AuthenticatedUser,
  type LoginRequest,
  type LoginResponse,
  type UserRole,
} from '../services/authService';

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  authProvider?: number;
  loginProviders?: AuthenticatedUser['loginProviders'];
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<LoginResponse>;
  loginWithGoogle: (code: string, redirectUri: string) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  switchAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function isGoogleOAuthPopupCallback(): boolean {
  if (typeof window === 'undefined' || !window.opener) return false;
  const params = new URLSearchParams(window.location.search);
  return params.has('code') || params.has('error');
}

function toContextUser(user: AuthenticatedUser): User {
  return {
    id: user.id,
    email: user.email,
    name: user.fullName?.trim() || user.name?.trim() || user.email.split('@')[0],
    role: user.role === 'ADMIN' ? 'ADMIN' : 'USER',
    avatar: authService.getDisplayAvatarUrl(user.avatarUrl, user.email, Date.now()) ?? undefined,
    authProvider: user.authProvider,
    loginProviders: user.loginProviders,
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(() => !isGoogleOAuthPopupCallback());

  const clearAuthenticatedState = useCallback(() => {
    authService.clearSessionState();
    setUser(null);
  }, []);

  useEffect(() => {
    // The OAuth redirect loads this SPA inside a popup. Its parent reads the
    // authorization code from the callback URL, so this transient document
    // must not call /me, refresh, or logout shared cookies.
    if (isGoogleOAuthPopupCallback()) return undefined;

    let isMounted = true;

    const verifySession = async () => {
      authService.prepareSessionCheck();

      try {
        // apiClient transparently performs one cookie-based refresh after a
        // /api/me 401. The server response, never localStorage, is the source
        // of truth for identity and role after every app start.
        const currentUser = await authService.getUserInfo();
        if (isMounted) setUser(toContextUser(currentUser));
      } catch {
        if (isMounted) clearAuthenticatedState();
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    const handleExpired = () => {
      if (!isMounted) return;
      clearAuthenticatedState();
    };

    const handleAvatarUpdated = (event: Event) => {
      const { avatarUrl } = (event as CustomEvent<{ avatarUrl?: string | null }>).detail ?? {};
      setUser((previous) => previous ? { ...previous, avatar: avatarUrl ?? undefined } : null);
    };

    const handleNameUpdated = (event: Event) => {
      const { name } = (event as CustomEvent<{ name?: string }>).detail ?? {};
      if (name?.trim()) {
        setUser((previous) => previous ? { ...previous, name: name.trim() } : null);
      }
    };

    window.addEventListener('auth:expired', handleExpired);
    window.addEventListener('auth:avatarUpdated', handleAvatarUpdated);
    window.addEventListener('auth:nameUpdated', handleNameUpdated);
    void verifySession();

    return () => {
      isMounted = false;
      window.removeEventListener('auth:expired', handleExpired);
      window.removeEventListener('auth:avatarUpdated', handleAvatarUpdated);
      window.removeEventListener('auth:nameUpdated', handleNameUpdated);
    };
  }, [clearAuthenticatedState]);

  const login = useCallback(async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await authService.login(credentials);
    setUser(toContextUser(response.user));
    return response;
  }, []);

  const loginWithGoogle = useCallback(async (code: string, redirectUri: string): Promise<LoginResponse> => {
    const response = await authService.loginWithGoogle(code, redirectUri);
    setUser(toContextUser(response.user));
    return response;
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    await authService.logout();
    setUser(null);
  }, []);

  const switchAccount = useCallback(async (): Promise<void> => {
    await logout();
  }, [logout]);

  const isAuthenticated = user !== null;
  const isAdmin = user?.role === 'ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isAdmin,
        isLoading,
        login,
        loginWithGoogle,
        logout,
        switchAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
