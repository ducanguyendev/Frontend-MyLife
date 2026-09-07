import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, LogIn, LogOut, ShieldCheck, Lock, Unlock,
  RefreshCw, Home, LayoutDashboard, Globe, Mail,
  CheckCircle, XCircle, AlertCircle, Clock, Trash2, AlertTriangle, Loader2
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { authService } from "../services/authService";

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
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-secondary-bg border border-custom-border rounded-2xl p-5 flex items-center gap-4`}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
      <div>
        <p className="text-xs text-secondary-text font-medium uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-black text-primary-text">{value}</p>
      </div>
    </motion.div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    SUCCESS: { label: "Thành công", cls: "bg-green-500/10 text-green-400 border-green-500/30" },
    FAILED: { label: "Thất bại", cls: "bg-red-500/10 text-red-400 border-red-500/30" },
    REGISTERED: { label: "Đăng ký", cls: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
  };
  const s = map[status] ?? { label: status, cls: "bg-gray-500/10 text-gray-400 border-gray-500/30" };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${s.cls}`}>
      {s.label}
    </span>
  );
}

function UserAvatarItem({ email, avatarUrl }: { email: string; avatarUrl?: string }) {
  const [imgError, setImgError] = useState(false);
  const src = avatarUrl || authService.getAvatarUrl(email);

  if (imgError) {
    return (
      <div className="w-7 h-7 rounded-full bg-accent/20 text-accent text-[10px] font-bold flex items-center justify-center">
        {email.substring(0, 2).toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={email}
      onError={() => setImgError(true)}
      className="w-7 h-7 rounded-full object-cover"
      referrerPolicy="no-referrer"
    />
  );
}

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [logs, setLogs] = useState<LoginLog[]>([]);
  const [activeTab, setActiveTab] = useState<"users" | "logs">("users");
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  // Delete User Confirmation Modal State
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const getHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("accessToken") ?? ""}`,
  });

  const showToast = (text: string, ok: boolean) => {
    setToastMsg({ text, ok });
    setTimeout(() => setToastMsg(null), 3500);
  };

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
      showToast("Lỗi kết nối đến Backend!", false);
    } finally {
      setLoading(false);
    }
  }, []);

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
        showToast(data.message ?? "Thao tác thất bại!", false);
      }
    } catch {
      showToast("Lỗi kết nối!", false);
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
        // Xóa người dùng khỏi state UI ngay tức thì
        setUsers((prev) => prev.filter((x) => x.id !== userToDelete.id));
        setStats((prev) => prev ? {
          ...prev,
          totalUsers: Math.max(0, prev.totalUsers - 1),
          totalActive: userToDelete.isActive ? Math.max(0, prev.totalActive - 1) : prev.totalActive,
          totalLocked: !userToDelete.isActive ? Math.max(0, prev.totalLocked - 1) : prev.totalLocked,
        } : null);

        showToast(data.message || `Đã xóa vĩnh viễn tài khoản ${userToDelete.email}`, true);
        setUserToDelete(null);
      } else {
        showToast(data.message || "Không thể xóa tài khoản.", false);
      }
    } catch {
      showToast("Lỗi kết nối khi xóa người dùng!", false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLogout = () => { logout(); navigate("/"); };

  const fmtDate = (d: string) =>
    new Date(d).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="min-h-screen bg-primary-bg text-primary-text">
      {/* Toast */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium shadow-lg ${
              toastMsg.ok
                ? "bg-green-500/10 border-green-500/30 text-green-400"
                : "bg-red-500/10 border-red-500/30 text-red-400"
            }`}
          >
            {toastMsg.ok ? <CheckCircle size={16} /> : <XCircle size={16} />}
            {toastMsg.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal: Xóa vĩnh viễn tài khoản */}
      <AnimatePresence>
        {userToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isDeleting && setUserToDelete(null)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm cursor-pointer"
            />
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }}
              className="relative w-full max-w-md bg-secondary-bg border border-custom-border p-6 rounded-3xl shadow-2xl z-10 space-y-5"
            >
              <div className="flex items-center gap-3 text-red-400">
                <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-primary-text">Xác nhận xóa tài khoản</h3>
                  <p className="text-xs text-red-400 font-medium">Hành động này không thể hoàn tác</p>
                </div>
              </div>

              <div className="p-4 bg-primary-bg/70 border border-custom-border/70 rounded-2xl text-xs space-y-2 text-secondary-text leading-relaxed">
                <p>
                  Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản <strong className="text-primary-text font-bold">{userToDelete.email}</strong>?
                </p>
                <p className="text-red-400/90 font-medium">
                  • Toàn bộ dữ liệu của người dùng này trong cơ sở dữ liệu sẽ bị xóa hoàn toàn.
                </p>
                <p className="text-red-400/90 font-medium">
                  • Ảnh đại diện và các phiên đăng nhập cũng sẽ bị thu hồi vĩnh viễn.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setUserToDelete(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-custom-border text-primary-text hover:bg-primary-bg text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDeleteUser}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-red-500/20 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                  <span>Xác nhận xóa</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-primary-bg/90 backdrop-blur border-b border-custom-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/30 flex items-center justify-center">
              <LayoutDashboard size={18} className="text-accent" />
            </div>
            <div>
              <p className="text-sm font-bold text-primary-text leading-none">Admin Dashboard</p>
              <p className="text-[11px] text-secondary-text mt-0.5">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchAll}
              disabled={loading}
              title="Làm mới dữ liệu"
              className="p-2 rounded-lg border border-custom-border text-secondary-text hover:text-accent hover:border-accent/40 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
            <button
              onClick={() => navigate("/")}
              className="p-2 rounded-lg border border-custom-border text-secondary-text hover:text-accent hover:border-accent/40 transition-all cursor-pointer"
              title="Về Portfolio"
            >
              <Home size={16} />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all text-xs font-semibold cursor-pointer"
            >
              <LogOut size={14} />
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Stats */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-secondary-bg border border-custom-border rounded-2xl p-5 h-20 animate-pulse" />
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <StatCard icon={<Users size={22} className="text-blue-400" />} label="Tổng Users" value={stats.totalUsers} color="bg-blue-500/10" />
            <StatCard icon={<CheckCircle size={22} className="text-green-400" />} label="Đang hoạt động" value={stats.totalActive} color="bg-green-500/10" />
            <StatCard icon={<Lock size={22} className="text-red-400" />} label="Bị khóa" value={stats.totalLocked} color="bg-red-500/10" />
            <StatCard icon={<LogIn size={22} className="text-accent" />} label="Đăng nhập / 7 ngày" value={stats.last7Days.successLogins} color="bg-accent/10" />
            <StatCard icon={<AlertCircle size={22} className="text-orange-400" />} label="Thất bại / 7 ngày" value={stats.last7Days.failedLogins} color="bg-orange-500/10" />
          </div>
        ) : null}

        {/* Tabs */}
        <div className="flex gap-1 bg-secondary-bg border border-custom-border rounded-xl p-1 w-fit">
          {(["users", "logs"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === tab
                  ? "bg-primary-bg text-primary-text border border-custom-border shadow"
                  : "text-secondary-text hover:text-primary-text"
              }`}
            >
              {tab === "users" ? (
                <span className="flex items-center gap-1.5"><Users size={13} />Người dùng ({users.length})</span>
              ) : (
                <span className="flex items-center gap-1.5"><Clock size={13} />Login Logs ({logs.length})</span>
              )}
            </button>
          ))}
        </div>

        {/* Users Table */}
        {activeTab === "users" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-secondary-bg border border-custom-border rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-custom-border bg-primary-bg/50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-secondary-text uppercase tracking-wider">Email</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-secondary-text uppercase tracking-wider">Role</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-secondary-text uppercase tracking-wider">Auth</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-secondary-text uppercase tracking-wider">Trạng thái</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-secondary-text uppercase tracking-wider">Ngày tạo</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-secondary-text uppercase tracking-wider">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <motion.tr
                      key={u.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-custom-border/50 hover:bg-primary-bg/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <UserAvatarItem email={u.email} avatarUrl={u.avatarUrl} />
                          <span className="text-primary-text text-xs font-medium">{u.email}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                          u.role === "ADMIN"
                            ? "bg-accent/10 text-accent border-accent/30"
                            : "bg-secondary-bg text-secondary-text border-custom-border"
                        }`}>
                          {u.role === "ADMIN" && <ShieldCheck size={10} />}
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 text-xs text-secondary-text">
                          {u.authProvider === 1 ? <Globe size={12} className="text-blue-400" /> : <Mail size={12} />}
                          {u.authProviderName}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                          u.isActive
                            ? "bg-green-500/10 text-green-400 border-green-500/30"
                            : "bg-red-500/10 text-red-400 border-red-500/30"
                        }`}>
                          {u.isActive ? <CheckCircle size={10} /> : <XCircle size={10} />}
                          {u.isActive ? "Hoạt động" : "Bị khóa"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-secondary-text">{fmtDate(u.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        {u.role !== "ADMIN" && (
                          <div className="inline-flex items-center gap-1.5">
                            {/* Nút Khóa / Mở khóa */}
                            <button
                              onClick={() => handleToggle(u)}
                              disabled={toggling === u.id || isDeleting}
                              title={u.isActive ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer disabled:opacity-50 ${
                                u.isActive
                                  ? "border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
                                  : "border-green-500/30 text-green-400 hover:bg-green-500/10"
                              }`}
                            >
                              {toggling === u.id ? (
                                <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                              ) : u.isActive ? (
                                <><Lock size={11} /> Khóa</>
                              ) : (
                                <><Unlock size={11} /> Mở khóa</>
                              )}
                            </button>

                            {/* Nút Xóa vĩnh viễn tài khoản */}
                            <button
                              onClick={() => setUserToDelete(u)}
                              disabled={toggling === u.id || isDeleting}
                              title="Xóa vĩnh viễn tài khoản khỏi hệ thống"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all cursor-pointer disabled:opacity-50"
                            >
                              <Trash2 size={11} />
                              <span>Xóa</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && !loading && (
                <div className="py-12 text-center text-secondary-text text-sm">Không có dữ liệu</div>
              )}
            </div>
          </motion.div>
        )}

        {/* Logs Table */}
        {activeTab === "logs" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-secondary-bg border border-custom-border rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-custom-border bg-primary-bg/50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-secondary-text uppercase tracking-wider">Email</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-secondary-text uppercase tracking-wider">Trạng thái</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-secondary-text uppercase tracking-wider">IP</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-secondary-text uppercase tracking-wider">Thời gian</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, i) => (
                    <motion.tr
                      key={log.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="border-b border-custom-border/50 hover:bg-primary-bg/30 transition-colors"
                    >
                      <td className="px-4 py-3 text-xs text-primary-text font-medium">{log.attemptEmail}</td>
                      <td className="px-4 py-3"><StatusBadge status={log.status} /></td>
                      <td className="px-4 py-3 text-xs text-secondary-text font-mono">{log.ipAddress ?? "—"}</td>
                      <td className="px-4 py-3 text-xs text-secondary-text">{fmtDate(log.createdAt)}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
              {logs.length === 0 && !loading && (
                <div className="py-12 text-center text-secondary-text text-sm">Không có dữ liệu</div>
              )}
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
};
