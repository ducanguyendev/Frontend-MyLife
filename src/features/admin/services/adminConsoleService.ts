import { apiClient, ApiError } from '@/shared/api/apiClient';

export interface AdminStats {
  totalUsers: number;
  totalActive: number;
  totalLocked: number;
  last7Days: { successLogins: number; failedLogins: number; newRegistrations: number };
}
export interface AdminUser {
  id: number;
  email: string;
  role: 'ADMIN' | 'USER';
  authProvider?: number;
  authProviderName?: string;
  loginProviders?: { local: boolean; google: boolean };
  isActive: boolean;
  avatarUrl?: string;
  createdAt?: string;
}
export interface LoginLog {
  id: number;
  attemptEmail: string;
  status: string;
  ipAddress?: string;
  createdAt: string;
}
interface ActionResponse { success?: boolean; message?: string; code?: string }

function confirmed<T extends ActionResponse>(response: T): T {
  if (!response || response.success === false) throw new ApiError(response?.message || 'Request rejected.', 0, response);
  return response;
}

export const adminConsoleService = {
  async stats(signal: AbortSignal): Promise<AdminStats | null> {
    const data = await apiClient.get<AdminStats | null>('/api/admin/stats', { signal });
    if (data !== null && [data.totalUsers, data.totalActive, data.totalLocked, data.last7Days?.successLogins,
      data.last7Days?.failedLogins, data.last7Days?.newRegistrations].some(value => !Number.isSafeInteger(value) || value < 0)) {
      throw new ApiError('Invalid statistics response.');
    }
    return data;
  },
  async users(signal: AbortSignal): Promise<AdminUser[]> {
    const data = await apiClient.get<AdminUser[]>('/api/admin/users', { signal });
    if (!Array.isArray(data)) throw new ApiError('Invalid users response.');
    return data;
  },
  async logs(signal: AbortSignal): Promise<LoginLog[]> {
    const data = await apiClient.get<LoginLog[]>('/api/admin/logs', { signal });
    if (!Array.isArray(data)) throw new ApiError('Invalid login logs response.');
    return data;
  },
  async role(id: number, role: AdminUser['role'], signal: AbortSignal) {
    const response = confirmed(await apiClient.put<ActionResponse & { role: AdminUser['role'] }>(`/api/admin/users/${id}/role`, { role }, { signal }));
    if (response.role !== 'ADMIN' && response.role !== 'USER') throw new ApiError('Invalid role response.');
    return response.role;
  },
  async status(id: number, isActive: boolean, signal: AbortSignal) {
    const response = confirmed(await apiClient.put<ActionResponse & { isActive: boolean }>(`/api/admin/users/${id}/status`, { isActive }, { signal }));
    if (typeof response.isActive !== 'boolean') throw new ApiError('Invalid status response.');
    return response.isActive;
  },
  async remove(id: number, signal: AbortSignal) {
    const response = await apiClient.delete<ActionResponse & { deletedId?: number }>(`/api/admin/users/${id}`, { signal });
    // A successful empty HTTP 204 is also a confirmed deletion.
    if (response !== undefined) confirmed(response);
  },
};

export type UserRoleFilter = 'all' | AdminUser['role'];
export type UserStatusFilter = 'all' | 'active' | 'locked';
export type UserSort = 'created-desc' | 'created-asc' | 'email-asc' | 'email-desc';
export type LogStatusFilter = 'all' | 'SUCCESS' | 'FAILED' | 'REGISTERED';
export type LogSort = 'newest' | 'oldest';
const searchable = (value: string) => value.trim().toLocaleLowerCase();
const timestamp = (value?: string) => value ? Date.parse(value) : NaN;

function dateOrder(a?: string, b?: string, descending = true) {
  const first = timestamp(a), second = timestamp(b);
  if (!Number.isFinite(first)) return Number.isFinite(second) ? 1 : 0;
  if (!Number.isFinite(second)) return -1;
  return descending ? second - first : first - second;
}

export function selectAdminUsers(users: readonly AdminUser[], query: string, role: UserRoleFilter, status: UserStatusFilter, sort: UserSort) {
  const term = searchable(query);
  return users.filter(user => (!term || searchable(user.email).includes(term)) && (role === 'all' || user.role === role)
    && (status === 'all' || user.isActive === (status === 'active'))).sort((a, b) => {
    const order = sort.startsWith('email-') ? searchable(a.email).localeCompare(searchable(b.email)) * (sort === 'email-desc' ? -1 : 1)
      : dateOrder(a.createdAt, b.createdAt, sort === 'created-desc');
    return order || a.id - b.id;
  });
}

export function selectAdminLogs(logs: readonly LoginLog[], query: string, status: LogStatusFilter, sort: LogSort) {
  const term = searchable(query);
  return logs.filter(log => (!term || searchable(`${log.attemptEmail} ${log.ipAddress ?? ''}`).includes(term))
    && (status === 'all' || log.status === status)).sort((a, b) => dateOrder(a.createdAt, b.createdAt, sort === 'newest') || b.id - a.id);
}

export function loginProvider(user: AdminUser): 'email' | 'google' | 'both' | 'unknown' {
  if (user.loginProviders) {
    if (user.loginProviders.local && user.loginProviders.google) return 'both';
    if (user.loginProviders.google) return 'google';
    if (user.loginProviders.local) return 'email';
  }
  return user.authProvider === 1 ? 'google' : user.authProvider === 0 ? 'email' : 'unknown';
}

export function adminErrorKey(error: unknown, fallback: string): string {
  const failure = error as { status?: number; payload?: { code?: string } } | null;
  if (failure?.status === 401) return 'admin.notifications.session_expired';
  if (failure?.status === 403) return 'admin.notifications.forbidden';
  if (failure?.payload?.code === 'USER_HAS_FAMILY_MEMBERS') return 'admin.user_has_family_members';
  return `admin.console.${fallback}`;
}

export function accountProportions(stats: AdminStats) {
  if (!stats.totalUsers || stats.totalActive + stats.totalLocked > stats.totalUsers) return null;
  return { active: stats.totalActive / stats.totalUsers * 100, locked: stats.totalLocked / stats.totalUsers * 100 };
}
