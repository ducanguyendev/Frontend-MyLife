import React, { useState, useEffect, useCallback } from "react";
import {
  Users, LogIn, Lock, Unlock,
  RefreshCw, LayoutDashboard, Globe, Mail,
  CheckCircle, AlertCircle, Clock, Trash2, Loader2
} from "lucide-react";
import { useAuth } from "@/features/auth/context/AuthContext";
import { authService } from "@/features/auth/services/authService";
import { useLanguage } from "@/shared/hooks/useLanguage";
import { Select, SelectItem } from "@/shared/components/ui";
import { SearchBar } from "@/shared/components/SearchBar";
import { useNotification } from "@/shared/contexts/NotificationContext";
import { apiClient, getApiErrorMessage } from "@/shared/api/apiClient";
import { MyLifeWorkspaceLayout } from "@/shared/layouts/MyLifeWorkspaceLayout";
import { PageHeader, StatCard, StatusPill, IconButton, SegmentedControl, TableShell, ConfirmDialog, Loading, EmptyState } from "@/design-system";

interface AdminStats {
  totalUsers: number;
  totalActive: number;
  totalLocked: number;
  last7Days: { successLogins: number; failedLogins: number; newRegistrations: number };
}

interface AdminUser {
  id: number;
  email: string;
  role: "ADMIN" | "USER";
  authProvider?: number;
  authProviderName?: string;
  loginProviders?: { local: boolean; google: boolean };
  isActive: boolean;
  avatarUrl?: string;
  createdAt?: string;
}

interface LoginLog {
  id: number;
  attemptEmail: string;
  status: string;
  ipAddress?: string;
  createdAt: string;
}

function StatusBadge({ status, t }: { status: string; t: ReturnType<typeof useLanguage>['t'] }) {
  const states = { SUCCESS: { label: t('admin.success'), tone: 'success' }, FAILED: { label: t('admin.failed'), tone: 'danger' }, REGISTERED: { label: t('admin.registered'), tone: 'info' } } as const;
  const state = states[status as keyof typeof states];
  return <StatusPill tone={state?.tone ?? 'neutral'}>{state?.label ?? status}</StatusPill>;
}

function UserAvatarItem({ email, avatarUrl }: { email: string; avatarUrl?: string }) {
  const [imgError, setImgError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string | null>(
    avatarUrl && avatarUrl !== 'none'
      ? authService.getDisplayAvatarUrl(avatarUrl, email)
      : authService.getAvatarUrl(email)
  );

  useEffect(() => {
    setCurrentSrc(
      avatarUrl && avatarUrl !== 'none'
        ? authService.getDisplayAvatarUrl(avatarUrl, email)
        : authService.getAvatarUrl(email)
    );
    setImgError(false);
  }, [avatarUrl, email]);

  const handleError = () => {
    setImgError(true);
  };

  if (imgError || !currentSrc) {
    return (
      <div className="w-8 h-8 rounded-full bg-accent text-primary-bg text-xs font-bold flex items-center justify-center shrink-0">
        {email.substring(0, 2).toUpperCase()}
      </div>
    );
  }

  return (
    <img
      key={currentSrc}
      src={currentSrc}
      alt={email}
      onError={handleError}
      className="w-8 h-8 rounded-full object-cover shrink-0 border border-custom-border"
      referrerPolicy="no-referrer"
    />
  );
}

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [logs, setLogs] = useState<LoginLog[]>([]);
  const [activeTab, setActiveTab] = useState<"dashboard" | "users" | "logs">("dashboard");
  const [adminSearch, setAdminSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const { showNotification } = useNotification();
  const [toggling, setToggling] = useState<number | null>(null);
  const [roleUpdating, setRoleUpdating] = useState<number | null>(null);

  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const showToast = useCallback((text: string, ok: boolean) => {
    showNotification({
      message: text,
      type: ok ? 'success' : 'error'
    });
  }, [showNotification]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, uRes, lRes] = await Promise.all([
        apiClient.get<AdminStats>("/api/admin/stats"),
        apiClient.get<AdminUser[]>("/api/admin/users"),
        apiClient.get<LoginLog[]>("/api/admin/logs"),
      ]);
      setStats(sRes);
      setUsers(uRes);
      setLogs(lRes);
    } catch (error) {
      console.warn("Unable to load administration data.", getApiErrorMessage(error));
      showToast(t("admin.error_connect", { defaultValue: "Lỗi kết nối đến Backend!" }), false);
    } finally {
      setLoading(false);
    }
  }, [showToast, t]);

  useEffect(() => { void fetchAll(); }, [fetchAll]);

  const handleToggle = async (u: AdminUser) => {
    setToggling(u.id);
    try {
      const data = await apiClient.put<{ success?: boolean; isActive: boolean; message?: string }>(
        `/api/admin/users/${u.id}/status`,
        { isActive: !u.isActive },
      );
      if (data.success !== false) {
        setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, isActive: data.isActive } : x)));
        showToast(data.message ?? (u.isActive ? "User locked." : "User unlocked."), true);
      } else {
        showToast(data.message ?? t("admin.action_failed", { defaultValue: "Thao tác thất bại!" }), false);
      }
    } catch (error) {
      console.warn("Unable to update user status.", getApiErrorMessage(error));
      showToast(t("admin.error_connect", { defaultValue: "Lỗi kết nối!" }), false);
    } finally {
      setToggling(null);
    }
  };

  const handleRoleChange = async (target: AdminUser, role: AdminUser['role']) => {
    if (target.role === role) return;

    setRoleUpdating(target.id);
    try {
      const data = await apiClient.put<{ success?: boolean; role: AdminUser['role']; message?: string }>(
        `/api/admin/users/${target.id}/role`,
        { role },
      );
      if (data.success !== false) {
        setUsers((previous) => previous.map((item) => (
          item.id === target.id ? { ...item, role: data.role } : item
        )));
        showToast(data.message ?? `Role updated to ${data.role}.`, true);
      }
    } catch (error) {
      console.warn("Unable to update user role.", getApiErrorMessage(error));
      showToast(getApiErrorMessage(error, "Unable to update the user role."), false);
    } finally {
      setRoleUpdating(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      const data = await apiClient.delete<{ success?: boolean; message?: string; deletedId?: number }>(
        `/api/admin/users/${userToDelete.id}`,
      );
      if (data.success !== false) {
        setUsers((prev) => prev.filter((x) => x.id !== userToDelete.id));
        setStats((prev) => prev ? {
          ...prev,
          totalUsers: Math.max(0, prev.totalUsers - 1),
          totalActive: userToDelete.isActive ? Math.max(0, prev.totalActive - 1) : prev.totalActive,
          totalLocked: !userToDelete.isActive ? Math.max(0, prev.totalLocked - 1) : prev.totalLocked,
        } : null);
        showToast(data.message || t("admin.delete_success", { defaultValue: "Đã xóa vĩnh viễn tài khoản" }), true);
        setUserToDelete(null);
      } else {
        showToast(data.message || t("admin.delete_failed", { defaultValue: "Không thể xóa tài khoản." }), false);
      }
    } catch (error) {
      console.warn("Unable to delete user.", getApiErrorMessage(error));
      const failure = error as { payload?: { code?: string } };
      showToast(t(failure.payload?.code === "USER_HAS_FAMILY_MEMBERS" ? "admin.user_has_family_members" : "admin.error_connect"), false);
    } finally {
      setIsDeleting(false);
    }
  };

  const fmtDate = (value?: string) => {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? "—"
      : date.toLocaleString("vi-VN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const getPageTitle = () => {
    switch(activeTab) {
      case "dashboard": return t("admin.dashboard", { defaultValue: "Tổng quan" });
      case "users": return t("admin.users", { defaultValue: "Quản lý Người dùng" });
      case "logs": return t("admin.logs", { defaultValue: "Lịch sử Đăng nhập" });
      default: return "";
    }
  };

  const navItems: Array<{ id: typeof activeTab; label: string; icon: React.ReactNode }> = [
    { id: "dashboard", label: t("admin.dashboard", { defaultValue: "Dashboard" }), icon: <LayoutDashboard size={18} /> },
    { id: "users", label: t("admin.users", { defaultValue: "Users" }), icon: <Users size={18} /> },
    { id: "logs", label: t("admin.logs", { defaultValue: "Logs" }), icon: <Clock size={18} /> },
  ] as const;

  return (
    <MyLifeWorkspaceLayout backTo="/mylife">
      <PageHeader eyebrow={t('appShell.admin')} title={getPageTitle()} description={activeTab === 'users' ? users.length + ' ' + t('admin.users_found') : activeTab === 'logs' ? logs.length + ' ' + t('admin.logs_found') : t('appShell.overview')}
        actions={<IconButton label={t('appShell.refresh')} variant="secondary" disabled={loading} onClick={() => void fetchAll()}><RefreshCw size={17} className={loading ? 'animate-spin' : ''}/></IconButton>}/>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <SegmentedControl label={t('appShell.admin')} value={activeTab} onChange={setActiveTab} options={navItems.map(item => ({ value: item.id, label: item.label, icon: item.icon }))}/>
        <SearchBar className="sm:!w-72" ariaLabel={t('common.search')} placeholder={t('common.search')} value={adminSearch} onChange={setAdminSearch}/>
      </div>
          {/* Dashboard Tab */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-secondary-bg rounded-3xl h-32 animate-pulse shadow-sm border border-custom-border" />
                  ))}
                </div>
              ) : stats ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                  <StatCard icon={<Users size={20} />} label={t("admin.total_users", { defaultValue: "Tổng Users" })} value={stats.totalUsers} />
                  <StatCard icon={<CheckCircle size={20} />} label={t("admin.active", { defaultValue: "Hoạt động" })} value={stats.totalActive} />
                  <StatCard icon={<Lock size={20} />} label={t("admin.locked", { defaultValue: "Bị khóa" })} value={stats.totalLocked} />
                  <StatCard icon={<LogIn size={20} />} label={t('appShell.loginWeek')} value={stats.last7Days.successLogins} />
                  <StatCard icon={<AlertCircle size={20} />} label={t('appShell.failedWeek')} value={stats.last7Days.failedLogins} />
                </div>
              ) : null}
            </div>
          )}

      {activeTab === 'users' && <TableShell><table className="min-w-[860px]">
        <thead><tr>{['col_email','col_role','col_auth','col_status','col_date','col_action'].map(key => <th key={key} scope="col">{t('admin.' + key)}</th>)}</tr></thead>
        <tbody>{loading ? <tr><td colSpan={6}><Loading label={t('admin.library_ui.loading')}/></td></tr> : users.length === 0 ? <tr><td colSpan={6}><EmptyState title={t('admin.no_users')}/></td></tr> : users.map(u => <tr key={u.id}>
          <td><div className="flex items-center gap-3"><UserAvatarItem email={u.email} avatarUrl={u.avatarUrl}/><span className="font-medium text-primary-text">{u.email}</span></div></td>
          <td><Select value={u.role} disabled={roleUpdating === u.id || user?.id === u.id} onValueChange={value => void handleRoleChange(u, value as AdminUser['role'])} variant="compact" aria-label={t('admin.col_role') + ': ' + u.email}><SelectItem value="USER">User</SelectItem><SelectItem value="ADMIN">Admin</SelectItem></Select></td>
          <td><span className="inline-flex items-center gap-2 text-xs text-secondary-text">{u.authProvider === 1 ? <Globe size={14}/> : <Mail size={14}/>} {u.authProviderName ?? (u.loginProviders?.local && u.loginProviders?.google ? 'Email + Google' : u.authProvider === 1 ? 'Google OAuth 2.0' : 'Email & Password')}</span></td>
          <td><StatusBadge status={u.isActive ? 'SUCCESS' : 'FAILED'} t={t}/></td><td className="whitespace-nowrap text-xs text-secondary-text">{fmtDate(u.createdAt)}</td>
          <td><div className="flex items-center justify-end gap-1">{u.role !== 'ADMIN' && <><IconButton size="sm" variant="ghost" label={t(u.isActive ? 'admin.lock_acc' : 'admin.unlock_acc')} disabled={toggling === u.id || isDeleting} onClick={() => void handleToggle(u)}>{toggling === u.id ? <Loader2 size={15} className="animate-spin"/> : u.isActive ? <Lock size={15}/> : <Unlock size={15}/>}</IconButton><IconButton size="sm" variant="ghost" label={t('admin.delete_user_title')} disabled={toggling === u.id || isDeleting} onClick={() => setUserToDelete(u)}><Trash2 size={15} className="text-[var(--state-danger)]"/></IconButton></>}</div></td>
        </tr>)}</tbody>
      </table></TableShell>}
      {activeTab === 'logs' && <TableShell><table className="min-w-[640px]"><thead><tr><th scope="col">{t('admin.col_email')}</th><th scope="col">{t('admin.col_status')}</th><th scope="col">IP</th><th scope="col">{t('admin.col_date')}</th></tr></thead><tbody>
        {loading ? <tr><td colSpan={4}><Loading label={t('admin.library_ui.loading')}/></td></tr> : logs.length === 0 ? <tr><td colSpan={4}><EmptyState title={t('admin.no_data')}/></td></tr> : logs.map(log => <tr key={log.id}><td className="font-medium">{log.attemptEmail}</td><td><StatusBadge status={log.status} t={t}/></td><td className="text-xs text-secondary-text">{log.ipAddress ?? '?'}</td><td className="text-xs text-secondary-text">{fmtDate(log.createdAt)}</td></tr>)}
      </tbody></table></TableShell>}
      <ConfirmDialog isOpen={!!userToDelete} title={t('admin.delete_user_title')} busy={isDeleting} confirmLabel={t('admin.delete_forever')} cancelLabel={t('admin.cancel')} onClose={() => setUserToDelete(null)} onConfirm={() => void handleDeleteUser()}>
        {t('admin.delete_user_desc', { email: userToDelete?.email })}
      </ConfirmDialog>
    </MyLifeWorkspaceLayout>
  );
};
