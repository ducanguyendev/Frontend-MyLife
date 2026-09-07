export interface LoginRequest {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface LoginResponse {
  message: string;
  email?: string;
  role?: string;
  avatarUrl?: string;
  authProvider?: number;
  accessToken: string;
  refreshToken: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface RegisterResponse {
  message: string;
  email: string;
}

export interface UserInfoResponse {
  message: string;
  email: string;
  avatarUrl?: string;
  authProvider?: number;
  authProviderName?: string;
  isAuthenticated: boolean;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const authService = {
  /**
   * Gọi API đăng nhập đến C# Backend (/api/login)
   */
  async login(data: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Cho phép gửi và nhận HTTP-only cookies từ Backend
        body: JSON.stringify(data),
      });

      const responseData = await response.json().catch(() => null);

      if (!response.ok) {
        if (response.status === 502 || response.status === 503 || response.status === 504) {
          throw new Error(
            'Không thể kết nối đến Backend C# (Mã lỗi: 502 Bad Gateway). Vui lòng kiểm tra và khởi chạy Backend tại http://localhost:5274!'
          );
        }

        if (responseData) {
          if (responseData.message) {
            throw new Error(responseData.message);
          }
          // Xử lý ModelState validation errors nếu có
          if (responseData.errors) {
            const firstErrorKey = Object.keys(responseData.errors)[0];
            const firstErrorMessage = responseData.errors[firstErrorKey]?.[0];
            if (firstErrorMessage) {
              throw new Error(firstErrorMessage);
            }
          }
        }
        throw new Error(`Đăng nhập thất bại (Mã lỗi: ${response.status})`);
      }

      // Lưu trữ token vào localStorage để sử dụng cho các request sau
      if (responseData?.accessToken) {
        localStorage.setItem('accessToken', responseData.accessToken);
        localStorage.setItem('accessExpiresAt', (Date.now() + 30 * 1000).toString());
      }
      if (responseData?.refreshToken) {
        localStorage.setItem('refreshToken', responseData.refreshToken);
        localStorage.setItem('refreshExpiresAt', (Date.now() + 120 * 1000).toString());
      }
      localStorage.setItem('userAuthProvider', '0');
      // Lưu role thực từ database (ADMIN hoặc USER)
      localStorage.setItem('userRole', responseData?.role ?? 'USER');

      // Lưu avatar nếu có từ DB
      if (responseData?.avatarUrl) {
        localStorage.setItem('userAvatar', responseData.avatarUrl);
      } else {
        localStorage.removeItem('userAvatar');
      }

      // Xử lý Ghi nhớ mật khẩu / email
      if (data.rememberMe) {
        this.saveRemembered(data.email, data.password);
      } else {
        this.clearRemembered();
      }
      localStorage.setItem('userEmail', data.email);

      console.log(
        `%c[AUTH] 🔑 [${new Date().toLocaleTimeString()}] Đăng nhập thành công! Cấp mới: Access Token (30s) + Refresh Token (2m)`,
        'color: #10b981; font-weight: bold;'
      );

      window.dispatchEvent(new CustomEvent('auth:refreshed'));

      return responseData as LoginResponse;
    } catch (error: any) {
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        throw new Error(
          'Không thể kết nối đến Backend C# (ASP.NET Core). Vui lòng kiểm tra Backend đã chạy ở http://localhost:5274 chưa!'
        );
      }
      throw error;
    }
  },

  /**
   * Gọi API đăng ký tài khoản mới đến C# Backend (/api/auth/register)
   */
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      const responseData = await response.json().catch(() => null);

      if (!response.ok) {
        if (response.status === 502 || response.status === 503 || response.status === 504) {
          throw new Error(
            'Không thể kết nối đến Backend C# (Mã lỗi: 502). Vui lòng kiểm tra Backend đã chạy chưa!'
          );
        }
        if (responseData?.message) {
          throw new Error(responseData.message);
        }
        if (responseData?.errors) {
          const firstKey = Object.keys(responseData.errors)[0];
          const firstMsg = responseData.errors[firstKey]?.[0];
          if (firstMsg) throw new Error(firstMsg);
        }
        throw new Error(`Đăng ký thất bại (Mã lỗi: ${response.status})`);
      }

      return responseData as RegisterResponse;
    } catch (error: any) {
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        throw new Error(
          'Không thể kết nối đến Backend C# (ASP.NET Core). Vui lòng kiểm tra Backend đã chạy ở http://localhost:5274 chưa!'
        );
      }
      throw error;
    }
  },

  /**
   * Đăng nhập với Google OAuth 2.0 (Gửi Authorization Code lên Backend)
   */
  async loginWithGoogle(code: string, redirectUri?: string): Promise<LoginResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          code,
          redirectUri: redirectUri || window.location.origin,
        }),
      });

      const responseData = await response.json().catch(() => null);

      if (!response.ok) {
        if (responseData && responseData.message) {
          throw new Error(responseData.message);
        }
        throw new Error(`Đăng nhập Google thất bại (Mã lỗi: ${response.status})`);
      }

      // Lưu trữ token và email vào localStorage
      if (responseData?.accessToken) {
        localStorage.setItem('accessToken', responseData.accessToken);
        localStorage.setItem('accessExpiresAt', (Date.now() + 30 * 1000).toString());
      }
      if (responseData?.refreshToken) {
        localStorage.setItem('refreshToken', responseData.refreshToken);
        localStorage.setItem('refreshExpiresAt', (Date.now() + 120 * 1000).toString());
      }
      if (responseData?.email) {
        localStorage.setItem('userEmail', responseData.email);
      } else if (code.includes('@')) {
        localStorage.setItem('userEmail', code.trim().toLowerCase());
      }
      if (responseData?.avatarUrl) {
        localStorage.setItem('userAvatar', responseData.avatarUrl);
      } else {
        localStorage.removeItem('userAvatar');
      }
      localStorage.setItem('userAuthProvider', '1');
      // Lưu role thực từ database (ADMIN hoặc USER)
      localStorage.setItem('userRole', responseData?.role ?? 'USER');

      console.log(
        `%c[AUTH] 🌐 [${new Date().toLocaleTimeString()}] Đăng nhập Google (${responseData?.email || code}) thành công! Cấp mới: Access Token (30s) + Refresh Token (2m)`,
        'color: #10b981; font-weight: bold;'
      );

      window.dispatchEvent(new CustomEvent('auth:refreshed'));

      return responseData as LoginResponse;
    } catch (error: any) {
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        throw new Error(
          'Không thể kết nối đến Backend C# (ASP.NET Core). Vui lòng kiểm tra Backend đã chạy ở http://localhost:5274 chưa!'
        );
      }
      throw error;
    }
  },

  /**
   * Lưu thông tin đăng nhập khi chọn "Ghi nhớ mật khẩu"
   */
  saveRemembered(email: string, password: string): void {
    localStorage.setItem('rememberMe', 'true');
    localStorage.setItem('rememberedEmail', email);
    try {
      localStorage.setItem('rememberedPassword', btoa(password));
    } catch {
      localStorage.setItem('rememberedPassword', password);
    }
  },

  /**
   * Xóa thông tin đã lưu khi bỏ chọn "Ghi nhớ mật khẩu"
   */
  clearRemembered(): void {
    localStorage.removeItem('rememberMe');
    localStorage.removeItem('rememberedEmail');
    localStorage.removeItem('rememberedPassword');
  },

  /**
   * Lấy thông tin tài khoản đã ghi nhớ
   */
  getRemembered(): { rememberMe: boolean; email: string; password: string } {
    const isRemembered = localStorage.getItem('rememberMe') === 'true';
    if (!isRemembered) {
      return { rememberMe: false, email: '', password: '' };
    }
    const email = localStorage.getItem('rememberedEmail') || '';
    let password = '';
    const storedPass = localStorage.getItem('rememberedPassword');
    if (storedPass) {
      try {
        password = atob(storedPass);
      } catch {
        password = storedPass;
      }
    }
    return { rememberMe: true, email, password };
  },

  /**
   * Gọi API lấy thông tin người dùng (/api/me)
   */
  async getUserInfo(): Promise<UserInfoResponse> {
    const response = await this.fetchWithAuth(`${API_BASE_URL}/api/me`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Chưa đăng nhập hoặc phiên làm việc đã hết hạn.');
    }

    return response.json();
  },

  /**
   * Gọi API làm mới token (/api/refresh-token)
   * Rotate Token: Cấp mới Access Token (30s) + Refresh Token (2 phút mới)
   */
  async refreshToken(): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = this.getAccessToken();
    const refreshToken = this.getRefreshToken();

    const response = await fetch(`${API_BASE_URL}/api/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      credentials: 'include',
      body: JSON.stringify({
        accessToken,
        refreshToken,
      }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      console.log(
        `%c[AUTH] 🔴 [${new Date().toLocaleTimeString()}] Refresh Token (> 2m không thao tác) đã hết hạn -> Tự động LOGOUT & yêu cầu đăng nhập lại!`,
        'color: #ef4444; font-weight: bold;'
      );
      this.logout();
      window.dispatchEvent(new CustomEvent('auth:expired'));
      throw new Error(data?.message || 'Refresh Token đã hết hạn (2 phút). Vui lòng đăng nhập lại.');
    }

    if (data?.accessToken) {
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('accessExpiresAt', (Date.now() + 30 * 1000).toString());
    }
    if (data?.refreshToken) {
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('refreshExpiresAt', (Date.now() + 120 * 1000).toString());
    }

    console.log(
      `%c[AUTH] 🟢 [${new Date().toLocaleTimeString()}] Rotate Token thành công -> Đã cấp cặp mới: Access Token (30s) + Refresh Token (2 phút mới)!`,
      'color: #10b981; font-weight: bold;'
    );

    window.dispatchEvent(new CustomEvent('auth:refreshed'));

    return data;
  },

  /**
   * Kiểm tra xem Access Token còn hạn không
   */
  isAccessTokenValid(): boolean {
    const expiresAt = Number(localStorage.getItem('accessExpiresAt')) || 0;
    return Date.now() < expiresAt;
  },

  /**
   * Kiểm tra xem Refresh Token còn hạn không
   */
  isRefreshTokenValid(): boolean {
    const expiresAt = Number(localStorage.getItem('refreshExpiresAt')) || 0;
    return Date.now() < expiresAt;
  },

  /**
   * Lấy số giây còn lại của Access Token
   */
  getAccessRemainingSeconds(): number {
    const expiresAt = Number(localStorage.getItem('accessExpiresAt')) || 0;
    return Math.max(0, Math.round((expiresAt - Date.now()) / 1000));
  },

  /**
   * Lấy số giây còn lại của Refresh Token
   */
  getRefreshRemainingSeconds(): number {
    const expiresAt = Number(localStorage.getItem('refreshExpiresAt')) || 0;
    return Math.max(0, Math.round((expiresAt - Date.now()) / 1000));
  },

  /**
   * Xử lý kiểm tra Token khi User có thao tác trên trang (Click, phím, chuyển trang...)
   */
  async handleUserActivity(): Promise<void> {
    if (!this.isAuthenticated()) return;

    const accessRem = this.getAccessRemainingSeconds();
    const refreshRem = this.getRefreshRemainingSeconds();

    // 1. Kiểm tra Access Token: Còn hạn không?
    if (this.isAccessTokenValid()) {
      console.log(
        `%c[AUTH] 🟢 [${new Date().toLocaleTimeString()}] User thao tác -> Access Token CÒN HẠN (còn ${accessRem}s | Refresh: ${refreshRem}s) -> Tiếp tục sử dụng`,
        'color: #10b981;'
      );
      return;
    }

    // 2. Access Token ĐÃ HẾT HẠN -> Kiểm tra Refresh Token
    console.log(
      `%c[AUTH] ⚠️ [${new Date().toLocaleTimeString()}] User thao tác -> Access Token ĐÃ HẾT HẠN! Kiểm tra Refresh Token...`,
      'color: #f59e0b; font-weight: bold;'
    );

    if (this.isRefreshTokenValid()) {
      // Refresh Token CÒN HẠN -> Rotate Token
      console.log(
        `%c[AUTH] 🔄 [${new Date().toLocaleTimeString()}] Refresh Token CÒN HẠN (còn ${refreshRem}s) -> Đang gửi yêu cầu Rotate Token...`,
        'color: #06b6d4; font-weight: bold;'
      );
      try {
        await this.refreshToken();
      } catch (err) {
        console.warn('Lỗi khi rotate token:', err);
      }
    } else {
      // Refresh Token ĐÃ HẾT HẠN -> Logout
      console.log(
        `%c[AUTH] 🔴 [${new Date().toLocaleTimeString()}] Refresh Token ĐÃ HẾT HẠN (> 2 phút không thao tác) -> Tự động LOGOUT!`,
        'color: #ef4444; font-weight: bold;'
      );
      this.logout();
      window.dispatchEvent(new CustomEvent('auth:expired'));
    }
  },

  /**
   * Wrapper gọi API tự động đính kèm Access Token và Refresh Token khi gặp lỗi 401
   */
  async fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    let token = this.getAccessToken();

    const headers = new Headers(options.headers || {});
    headers.set('Content-Type', 'application/json');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    let response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    // Nếu Access Token hết hạn (401), tự động dùng Refresh Token để lấy token mới
    if (response.status === 401 && this.getRefreshToken()) {
      try {
        const refreshed = await this.refreshToken();
        if (refreshed?.accessToken) {
          headers.set('Authorization', `Bearer ${refreshed.accessToken}`);
          // Thử lại request ban đầu với token mới
          response = await fetch(url, {
            ...options,
            headers,
            credentials: 'include',
          });
        }
      } catch {
        // Refresh token hết hạn -> đã logout trong refreshToken()
      }
    }

    return response;
  },

  /**
   * Đăng xuất và xóa token trực tiếp ở Client
   */
  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('accessExpiresAt');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('refreshExpiresAt');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userAvatar');
    localStorage.removeItem('userAuthProvider');
    localStorage.removeItem('userRole');
  },

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  },

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  },

  getStoredEmail(): string | null {
    return localStorage.getItem('userEmail');
  },

  getStoredAvatar(): string | null {
    const av = localStorage.getItem('userAvatar');
    if (!av || av === 'none' || av === 'null' || av === 'undefined') return null;
    return av;
  },

  getStoredAuthProvider(): number {
    return Number(localStorage.getItem('userAuthProvider')) || 0;
  },

  getStoredRole(): string {
    return localStorage.getItem('userRole') ?? 'USER';
  },

  getRememberedEmail(): string | null {
    return this.getRemembered().email;
  },

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  },

  /**
   * Chuyển đổi định dạng URL Google Drive hoặc link cục bộ thành URL xem ảnh trực tiếp
   */
  getDisplayAvatarUrl(url?: string | null): string | null {
    if (!url || url === 'none') return null;
    const driveMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (driveMatch && driveMatch[1]) {
      return `https://drive.google.com/thumbnail?id=${driveMatch[1]}&sz=w1000`;
    }
    return url;
  },

  /**
   * Lấy URL ảnh đại diện từ Backend API
   */
  getAvatarUrl(email?: string, timestamp?: number): string {
    const targetEmail = email || this.getStoredEmail();
    if (!targetEmail) return '';
    const ts = timestamp ? `?t=${timestamp}` : '';
    return `${API_BASE_URL}/api/avatar/${encodeURIComponent(targetEmail)}${ts}`;
  },

  /**
   * Tải ảnh đại diện mới lên Google Drive (Multipart Form Data)
   */
  async uploadAvatar(file: File): Promise<{ message: string; avatarUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const token = this.getAccessToken();
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/avatar/upload`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.message || 'Không thể upload ảnh đại diện.');
    }

    // Cập nhật timestamp vào userAvatar để trigger re-render
    const freshAvatarUrl = data.avatarUrl.startsWith('http') 
      ? data.avatarUrl 
      : `${API_BASE_URL}${data.avatarUrl}`;
    localStorage.setItem('userAvatar', freshAvatarUrl);
    window.dispatchEvent(new CustomEvent('auth:avatarUpdated', { detail: { avatarUrl: freshAvatarUrl } }));

    return data;
  },

  /**
   * Xóa ảnh đại diện khỏi Google Drive
   */
  async deleteAvatar(): Promise<{ message: string }> {
    const token = this.getAccessToken();
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/avatar`, {
      method: 'DELETE',
      headers,
      credentials: 'include',
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.message || 'Không thể xóa ảnh đại diện.');
    }

    localStorage.setItem('userAvatar', 'none');
    window.dispatchEvent(new CustomEvent('auth:avatarUpdated', { detail: { avatarUrl: 'none' } }));

    return data;
  },

  /**
   * Đổi mật khẩu tài khoản Local
   */
  async changePassword(data: { currentPassword: string; newPassword: string; confirmPassword: string }): Promise<{ message: string }> {
    const token = this.getAccessToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify(data),
    });

    const responseData = await response.json();
    if (!response.ok) {
      if (responseData.errors) {
        const firstKey = Object.keys(responseData.errors)[0];
        const firstMsg = responseData.errors[firstKey]?.[0];
        if (firstMsg) throw new Error(firstMsg);
      }
      throw new Error(responseData?.message || 'Không thể đổi mật khẩu.');
    }

    return responseData;
  },

  /**
   * Lưu tên hiển thị (Display Name) vào Client Storage
   */
  setStoredName(name: string): void {
    localStorage.setItem('userDisplayName', name);
    window.dispatchEvent(new CustomEvent('auth:nameUpdated', { detail: { name } }));
  },

  getStoredName(): string | null {
    return localStorage.getItem('userDisplayName');
  },
};

