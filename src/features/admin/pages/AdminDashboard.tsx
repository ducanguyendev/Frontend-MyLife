import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, LogIn, LogOut, Lock, Unlock,
  RefreshCw, Home, LayoutDashboard, Globe, Mail,
  CheckCircle, AlertCircle, Clock, Trash2, AlertTriangle, Loader2,
  Search, Sun, Moon
} from "lucide-react";
import { useAuth } from "@/features/auth/context/AuthContext";
import { authService } from "@/features/auth/services/authService";
import { useTheme } from "@/shared/context/ThemeContext";
import { useLanguage } from "@/shared/hooks/useLanguage";
import { LanguageSwitcher } from "@/shared/components/LanguageSwitcher";
import { useNotification } from "@/shared/contexts/NotificationContext";

const API = import.meta.env.VITE_API_URL || "";

interface AdminStats {
  totalUsers: number;
  totalActive: number;
  totalLocked: number;
  last7Days: { successLogins: number; failedLogins: number; newRegistrations: number };
}

interface AdminUser {
  id: string;
  email: string;
  role: string;
  authProvider: number;
  authProviderName: string;
  isActive: boolean;
  avatarUrl?: string;
  createdAt: string;
}

interface LoginLog {
  id: number;
  attemptEmail: string;
  status: string;
  ipAddress?: string;
  createdAt: string;
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="glass-pill rounded-[28px] p-6 flex flex-col justify-between gap-4 group hover:-translate-y-1 transition-transform duration-300">
      <div className="flex justify-between items-start">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-secondary-bg border border-custom-border shadow-sm ${color}`}>{icon}</div>
      </div>
      <div>
        <p className="text-3xl font-black text-primary-text font-display tracking-tight mb-1">{value}</p>
        <p className="text-[10px] text-secondary-text font-bold tracking-widest uppercase">{label}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status, t }: { status: string, t: any }) {
  const map: Record<string, { label: string; cls: string, dot: string, bg: string }> = {
    SUCCESS: { label: t("admin.success", { defaultValue: "Thành công" }), cls: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500", bg: "bg-emerald-500/10" },
    FAILED: { label: t("admin.failed", { defaultValue: "Thất bại" }), cls: "text-rose-700 dark:text-rose-400", dot: "bg-rose-500", bg: "bg-rose-500/10" },
    REGISTERED: { label: t("admin.registered", { defaultValue: "Đăng ký" }), cls: "text-blue-700 dark:text-blue-400", dot: "bg-blue-500", bg: "bg-blue-500/10" },
  };
  const s = map[status] ?? { label: status, cls: "text-secondary-text", dot: "bg-secondary-text", bg: "bg-secondary-text/10" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${s.cls} ${s.bg} border border-transparent dark:border-custom-border/50`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`}></span>
      {s.label}
    </span>
  );
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
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [logs, setLogs] = useState<LoginLog[]>([]);
  const [activeTab, setActiveTab] = useState<"dashboard" | "users" | "logs">("dashboard");
  const [loading, setLoading] = useState(true);
  const { showNotification } = useNotification();
  const [toggling, setToggling] = useState<string | null>(null);

  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const getHeaders = useCallback(() => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("accessToken") ?? ""}`,
  }), []);

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
        fetch(`${API}/api/admin/stats`, { credentials: "include", headers: getHeaders() }),
        fetch(`${API}/api/admin/users`, { credentials: "include", headers: getHeaders() }),
        fetch(`${API}/api/admin/logs`, { credentials: "include", headers: getHeaders() }),
      ]);
      if (sRes.ok) setStats(await sRes.json());
      if (uRes.ok) setUsers(await uRes.json());
      if (lRes.ok) setLogs(await lRes.json());
    } catch {
      showToast(t("admin.error_connect", { defaultValue: "Lỗi kết nối đến Backend!" }), false);
    } finally {
      setLoading(false);
    }
  }, [getHeaders, showToast, t]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleToggle = async (u: AdminUser) => {
    setToggling(u.id);
    try {
      const res = await fetch(`${API}/api/admin/users/${u.id}/toggle-active`, {
        method: "PUT",
        credentials: "include",
        headers: getHeaders(),
      });
      const data = await res.json();
      if (res.ok) {
        setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, isActive: data.isActive } : x)));
        showToast(data.message, true);
      } else {
        showToast(data.message ?? t("admin.action_failed", { defaultValue: "Thao tác thất bại!" }), false);
      }
    } catch {
      showToast(t("admin.error_connect", { defaultValue: "Lỗi kết nối!" }), false);
    } finally {
      setToggling(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`${API}/api/admin/users/${userToDelete.id}`, {
        method: "DELETE",
        credentials: "include",
        headers: getHeaders(),
      });
      const data = await res.json();
      if (res.ok) {
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
    } catch {
      showToast(t("admin.error_connect", { defaultValue: "Lỗi kết nối khi xóa người dùng!" }), false);
    } finally {
      setIsDeleting(false);
    }
  };

  const fmtDate = (d: string) =>
    new Date(d).toLocaleString("vi-VN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const getPageTitle = () => {
    switch(activeTab) {
      case "dashboard": return t("admin.dashboard", { defaultValue: "Tổng quan" });
      case "users": return t("admin.users", { defaultValue: "Quản lý Người dùng" });
      case "logs": return t("admin.logs", { defaultValue: "Lịch sử Đăng nhập" });
      default: return "";
    }
  };

  const navItems = [
    { id: "dashboard", label: t("admin.dashboard", { defaultValue: "Dashboard" }), icon: <LayoutDashboard size={18} /> },
    { id: "users", label: t("admin.users", { defaultValue: "Users" }), icon: <Users size={18} /> },
    { id: "logs", label: t("admin.logs", { defaultValue: "Logs" }), icon: <Clock size={18} /> },
  ] as const;

  return (
    <div className="relative h-screen bg-primary-bg font-sans overflow-hidden transition-colors duration-300">
      
      {/* Background Image Overlay */}
      <div className="absolute inset-0 z-0 opacity-10 dark:opacity-[0.03] pointer-events-none bg-[url('/src/assets/admin-bg.png')] bg-cover bg-center" />

      {/* Floating Top Navigation */}
      <header className="absolute top-4 left-1/2 -translate-x-1/2 w-[96%] max-w-[1400px] z-50 glass-nav rounded-2xl md:rounded-full px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        
        {/* Left: Logo & Nav */}
        <div className="flex items-center gap-8 w-full md:w-auto overflow-x-auto no-scrollbar justify-between md:justify-start">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-full bg-primary-text text-primary-bg flex items-center justify-center font-bold text-sm shadow-md">ML</div>
            <span className="font-bold tracking-tight text-primary-text text-lg hidden lg:block">MyLife</span>
          </div>

          <nav className="flex items-center gap-1 bg-secondary-bg/50 p-1 rounded-full border border-custom-border/50">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`relative flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-300 cursor-pointer shrink-0 ${
                    isActive
                      ? "text-primary-bg"
                      : "text-secondary-text hover:text-primary-text"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="navTabIndicator"
                      className="absolute inset-0 bg-primary-text rounded-full z-[-1]"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className={isActive ? "text-primary-bg" : "text-secondary-text"}>{item.icon}</span>
                  <span className="hidden sm:inline-block">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="relative hidden xl:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-text" size={14} />
            <input 
              type="text" 
              placeholder={t("common.search", { defaultValue: "Search..." })}
              className="pl-9 pr-4 py-1.5 bg-secondary-bg/50 rounded-full border border-custom-border text-primary-text text-sm focus:outline-none focus:border-primary-text focus:ring-1 focus:ring-primary-text/20 w-48 transition-all hover:w-56 placeholder:text-secondary-text/50"
            />
          </div>
          
          <button onClick={fetchAll} className="w-8 h-8 flex items-center justify-center rounded-full bg-secondary-bg/50 hover:bg-secondary-bg border border-custom-border text-secondary-text hover:text-primary-text transition-colors cursor-pointer" title="Refresh">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
          
          <button
            onClick={toggleTheme}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-secondary-bg/50 hover:bg-secondary-bg border border-custom-border text-secondary-text hover:text-primary-text transition-colors cursor-pointer"
            title="Toggle Theme"
          >
            {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
          </button>
          
          <LanguageSwitcher />
          
          <div className="h-4 w-px bg-custom-border mx-1"></div>
          
          <button onClick={() => navigate("/")} className="w-8 h-8 flex items-center justify-center rounded-full bg-secondary-bg/50 hover:bg-secondary-bg border border-custom-border text-secondary-text hover:text-primary-text transition-colors cursor-pointer" title="Home">
            <Home size={14} />
          </button>

          <button onClick={() => { logout(); navigate("/"); }} className="w-8 h-8 flex items-center justify-center rounded-full bg-secondary-bg/50 hover:bg-error/10 border border-custom-border hover:border-error/30 text-secondary-text hover:text-error transition-colors cursor-pointer" title="Logout">
            <LogOut size={14} />
          </button>
          
          <div className="flex items-center gap-2 pl-2">
             <UserAvatarItem email={user?.email || "Admin"} avatarUrl={(user as any)?.avatar || (user as any)?.avatarUrl} />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 w-full h-full pt-[120px] pb-8 px-4 md:px-8 overflow-y-auto custom-scrollbar flex flex-col items-center">
        <div className="w-full max-w-[1400px] flex-1">
          {/* Header Title Section */}
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-primary-text tracking-tight uppercase font-display">{getPageTitle()}</h2>
              <p className="text-sm font-medium text-secondary-text mt-2 uppercase tracking-widest">
                {activeTab === "users" && `${users.length} ${t("admin.users_found", { defaultValue: "users found" })}`}
                {activeTab === "logs" && `${logs.length} ${t("admin.logs_found", { defaultValue: "logs found" })}`}
                {activeTab === "dashboard" && "OVERVIEW & METRICS"}
              </p>
            </div>
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
                  <StatCard icon={<Users size={20} />} label={t("admin.total_users", { defaultValue: "Tổng Users" })} value={stats.totalUsers} color="text-primary-text" />
                  <StatCard icon={<CheckCircle size={20} />} label={t("admin.active", { defaultValue: "Hoạt động" })} value={stats.totalActive} color="text-emerald-500" />
                  <StatCard icon={<Lock size={20} />} label={t("admin.locked", { defaultValue: "Bị khóa" })} value={stats.totalLocked} color="text-red-500" />
                  <StatCard icon={<LogIn size={20} />} label="Login (7d)" value={stats.last7Days.successLogins} color="text-purple-500" />
                  <StatCard icon={<AlertCircle size={20} />} label="Failed (7d)" value={stats.last7Days.failedLogins} color="text-orange-500" />
                </div>
              ) : null}
            </div>
          )}

          {/* Users Tab */}
          {activeTab === "users" && (
            <div className="glass-pill rounded-3xl overflow-hidden p-2">
              {/* Header Row */}
              <div className="grid grid-cols-12 gap-4 px-6 py-4 text-[11px] font-bold text-secondary-text uppercase tracking-widest border-b border-custom-border/30">
                <div className="col-span-4 md:col-span-3">{t("admin.col_email", { defaultValue: "Email" })}</div>
                <div className="col-span-2 hidden md:block">{t("admin.col_role", { defaultValue: "Role" })}</div>
                <div className="col-span-2 hidden md:block">{t("admin.col_auth", { defaultValue: "Auth" })}</div>
                <div className="col-span-4 md:col-span-2">{t("admin.col_status", { defaultValue: "Status" })}</div>
                <div className="col-span-2 hidden md:block">{t("admin.col_date", { defaultValue: "Date" })}</div>
                <div className="col-span-4 md:col-span-1 text-right">{t("admin.col_action", { defaultValue: "Action" })}</div>
              </div>

              {/* Data Rows */}
              <div className="space-y-1 mt-1 p-1">
                {users.length === 0 && !loading && (
                  <div className="py-10 text-center text-secondary-text text-sm">{t("admin.no_users", { defaultValue: "Không có người dùng nào." })}</div>
                )}
                {users.map((u, i) => (
                  <motion.div
                    key={u.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="grid grid-cols-12 gap-4 items-center hover:bg-secondary-bg/40 transition-colors duration-200 px-5 py-3 rounded-2xl"
                  >
                    <div className="col-span-4 md:col-span-3 flex items-center gap-3 overflow-hidden">
                      <UserAvatarItem email={u.email} avatarUrl={u.avatarUrl} />
                      <span className="text-primary-text font-semibold text-sm truncate">{u.email}</span>
                    </div>
                    <div className="col-span-2 hidden md:flex items-center">
                      {u.role === "ADMIN" ? (
                        <span className="bg-primary-text text-primary-bg px-2 py-0.5 rounded-full font-bold text-[10px] tracking-wider uppercase">Admin</span>
                      ) : (
                        <span className="bg-secondary-text/10 text-secondary-text px-2 py-0.5 rounded-full font-bold text-[10px] tracking-wider uppercase">User</span>
                      )}
                    </div>
                    <div className="col-span-2 hidden md:flex items-center text-secondary-text text-xs font-medium gap-1.5">
                      {u.authProvider === 1 ? <Globe size={14} className="text-blue-500" /> : <Mail size={14} />}
                      {u.authProviderName}
                    </div>
                    <div className="col-span-4 md:col-span-2 flex items-center">
                      <StatusBadge status={u.isActive ? "SUCCESS" : "FAILED"} t={t} />
                    </div>
                    <div className="col-span-2 hidden md:flex items-center text-secondary-text text-[11px] font-medium font-mono">
                      {fmtDate(u.createdAt)}
                    </div>
                    <div className="col-span-4 md:col-span-1 flex items-center justify-end gap-1">
                      {u.role !== "ADMIN" && (
                        <>
                          <button
                            onClick={() => handleToggle(u)}
                            disabled={toggling === u.id || isDeleting}
                            title={u.isActive ? t("admin.lock_acc", { defaultValue: "Khóa tài khoản" }) : t("admin.unlock_acc", { defaultValue: "Mở khóa tài khoản" })}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-secondary-text hover:text-primary-text hover:bg-secondary-bg transition-colors cursor-pointer border border-transparent hover:border-custom-border"
                          >
                            {toggling === u.id ? <Loader2 size={14} className="animate-spin" /> : u.isActive ? <Lock size={14} /> : <Unlock size={14} />}
                          </button>
                          <button
                            onClick={() => setUserToDelete(u)}
                            disabled={toggling === u.id || isDeleting}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-secondary-text hover:text-error hover:bg-error/10 transition-colors cursor-pointer border border-transparent hover:border-error/20"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Logs Tab */}
          {activeTab === "logs" && (
            <div className="glass-pill rounded-3xl overflow-hidden p-2">
              <div className="grid grid-cols-12 gap-4 px-6 py-4 text-[11px] font-bold text-secondary-text uppercase tracking-widest border-b border-custom-border/30">
                <div className="col-span-5 md:col-span-4">{t("admin.col_email", { defaultValue: "Email" })}</div>
                <div className="col-span-4 md:col-span-3">{t("admin.col_status", { defaultValue: "Trạng thái" })}</div>
                <div className="col-span-2 hidden md:block">IP Address</div>
                <div className="col-span-3">{t("admin.col_date", { defaultValue: "Thời gian" })}</div>
              </div>
              
              <div className="space-y-1 mt-1 p-1">
                {logs.length === 0 && !loading && (
                  <div className="py-10 text-center text-secondary-text text-sm">{t("admin.no_data", { defaultValue: "Không có dữ liệu." })}</div>
                )}
                {logs.map((log, i) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="grid grid-cols-12 gap-4 items-center hover:bg-secondary-bg/40 transition-colors duration-200 px-5 py-3 rounded-2xl"
                  >
                    <div className="col-span-5 md:col-span-4 text-primary-text font-semibold text-sm truncate pr-4">{log.attemptEmail}</div>
                    <div className="col-span-4 md:col-span-3"><StatusBadge status={log.status} t={t} /></div>
                    <div className="col-span-2 hidden md:block text-secondary-text text-xs font-mono">{log.ipAddress ?? "—"}</div>
                    <div className="col-span-3 text-secondary-text text-[11px] font-medium font-mono">{fmtDate(log.createdAt)}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {userToDelete && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 overflow-hidden"
            onClick={(e) => {
              if (e.target === e.currentTarget && !isDeleting) setUserToDelete(null);
            }}
          >
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => !isDeleting && setUserToDelete(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-md cursor-pointer"
            />
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md bg-secondary-bg p-8 rounded-[32px] shadow-2xl z-10 border border-custom-border"
            >
              <div className="w-16 h-16 rounded-full bg-error/10 text-error flex items-center justify-center mb-6 border border-error/20 mx-auto">
                <AlertTriangle size={28} />
              </div>
              <h3 className="text-2xl font-bold text-primary-text mb-3 text-center">{t("admin.delete_user_title", { defaultValue: "Xóa người dùng?" })}</h3>
              <p className="text-secondary-text text-sm mb-8 text-center leading-relaxed">
                {t("admin.delete_user_desc", { email: userToDelete.email, defaultValue: `Bạn sắp xóa vĩnh viễn tài khoản ${userToDelete.email}. Hành động này không thể hoàn tác.` })}
              </p>
              
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setUserToDelete(null)}
                  className="flex-1 py-3 px-4 rounded-full bg-secondary-bg hover:bg-custom-border text-primary-text text-sm font-bold transition-all cursor-pointer disabled:opacity-50 border border-custom-border"
                >
                  {t("admin.cancel", { defaultValue: "Hủy bỏ" })}
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDeleteUser}
                  className="flex-1 py-3 px-4 rounded-full bg-error hover:bg-red-600 text-white text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-error/20 disabled:opacity-50 border border-transparent"
                >
                  {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  <span>{t("admin.delete_forever", { defaultValue: "Xóa vĩnh viễn" })}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
