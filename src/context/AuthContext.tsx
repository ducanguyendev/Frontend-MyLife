import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, type LoginRequest, type LoginResponse } from '../services/authService';

export interface User {
  email: string;
  name: string;
  role: string; // 'ADMIN' | 'USER'
  avatar?: string;
  authProvider?: number; // 0 = LOCAL, 1 = GOOGLE
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<LoginResponse>;
  loginWithGoogle: (code: string, redirectUri?: string) => Promise<LoginResponse>;
  logout: () => void;
  switchAccount: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check authentication on initial load
    const token = authService.getAccessToken();
    const storedEmail = authService.getStoredEmail();
    const storedName = authService.getStoredName();
    const storedAvatar = authService.getStoredAvatar() || undefined;
    const storedAuthProvider = authService.getStoredAuthProvider();
    const storedRole = authService.getStoredRole(); // Đọc role thực từ localStorage

    if (token && storedEmail) {
      setUser({
        email: storedEmail,
        name: storedName || storedEmail.split('@')[0],
        role: storedRole,
        avatar: storedAvatar,
        authProvider: storedAuthProvider,
      });
      setIsAuthenticated(true);
    } else {
      setUser(null);
      setIsAuthenticated(false);
    }
    setIsLoading(false);

    const handleExpired = () => {
      setUser(null);
      setIsAuthenticated(false);
    };

    const handleAvatarUpdated = (e: any) => {
      const newAvatar = e.detail?.avatarUrl || undefined;
      setUser((prev) => (prev ? { ...prev, avatar: newAvatar } : null));
    };

    const handleNameUpdated = (e: any) => {
      const newName = e.detail?.name;
      if (newName) {
        setUser((prev) => (prev ? { ...prev, name: newName } : null));
      }
    };

    window.addEventListener('auth:expired', handleExpired);
    window.addEventListener('auth:avatarUpdated', handleAvatarUpdated);
    window.addEventListener('auth:nameUpdated', handleNameUpdated);
    return () => {
      window.removeEventListener('auth:expired', handleExpired);
      window.removeEventListener('auth:avatarUpdated', handleAvatarUpdated);
      window.removeEventListener('auth:nameUpdated', handleNameUpdated);
    };
  }, []);

  // Theo dõi thời gian không thao tác (Inactivity / Expiry Timer):
  // Khi không có bất kỳ thao tác refresh nào trong vòng 2 phút -> Tự động LOGOUT
  useEffect(() => {
    if (!isAuthenticated) return;

    let timer: ReturnType<typeof setTimeout>;

    const resetExpiryTimer = () => {
      clearTimeout(timer);
      const refreshExpiresAt = Number(localStorage.getItem('refreshExpiresAt')) || (Date.now() + 120 * 1000);
      const remainingMs = Math.max(0, refreshExpiresAt - Date.now());

      timer = setTimeout(() => {
        console.log(
          `%c[AUTH] ⏰ [${new Date().toLocaleTimeString()}] Đã qua 2 phút không thao tác -> Refresh Token hết hạn, tự động LOGOUT!`,
          'color: #ef4444; font-weight: bold;'
        );
        authService.logout();
        setUser(null);
        setIsAuthenticated(false);
        window.dispatchEvent(new CustomEvent('auth:expired'));
      }, remainingMs);
    };

    resetExpiryTimer();

    // Lắng nghe các thao tác của người dùng (Click, gõ phím, chuyển trang)
    let lastActivityCheck = 0;
    const handleActivity = () => {
      const now = Date.now();
      // Throttle kiểm tra mỗi 3 giây 1 lần khi người dùng thao tác
      if (now - lastActivityCheck > 3000) {
        lastActivityCheck = now;
        authService.handleUserActivity();
      }
    };

    const activityEvents = ['mousedown', 'keydown', 'touchstart'];
    activityEvents.forEach((ev) => window.addEventListener(ev, handleActivity));
    window.addEventListener('auth:refreshed', resetExpiryTimer);

    return () => {
      clearTimeout(timer);
      activityEvents.forEach((ev) => window.removeEventListener(ev, handleActivity));
      window.removeEventListener('auth:refreshed', resetExpiryTimer);
    };
  }, [isAuthenticated]);

  const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await authService.login(credentials);
    const email = credentials.email;
    const role = response.role ?? authService.getStoredRole(); // Dùng role từ API response
    setUser({
      email,
      name: email.split('@')[0],
      role,
      authProvider: 0,
    });
    setIsAuthenticated(true);
    return response;
  };

  const loginWithGoogle = async (code: string, redirectUri?: string): Promise<LoginResponse> => {
    const response = await authService.loginWithGoogle(code, redirectUri);
    const email = response.email || authService.getStoredEmail() || (code.includes('@') ? code.trim().toLowerCase() : '');
    const avatar = response.avatarUrl || authService.getStoredAvatar() || undefined;
    const role = response.role ?? authService.getStoredRole();
    setUser({
      email,
      name: email.split('@')[0],
      role,
      avatar,
      authProvider: 1,
    });
    setIsAuthenticated(true);
    return response;
  };

  const logout = (): void => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const switchAccount = (): void => {
    logout();
  };

  // Computed: Admin khi role là 'ADMIN' (chính xác từ DB)
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
