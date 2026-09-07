import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import {
  X, Mail, Shield, LogOut, ArrowLeftRight, CheckCircle2,
  Camera, Trash2, Loader2, AlertCircle, User,
  Lock, KeyRound, Eye, EyeOff, Save, Check, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchAccount: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  onSwitchAccount,
}) => {
  const { t } = useLanguage();
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  // Tab State
  const [activeTab, setActiveTab] = useState<'info' | 'security'>('info');

  // Avatar Upload States
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Edit Name State
  const [displayName, setDisplayName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);

  // Change Password States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Feedback Notification
  const [feedback, setFeedback] = useState<{ message: string; ok: boolean } | null>(null);

  // Sync state on open
  useEffect(() => {
    if (isOpen && user) {
      setImgError(false);
      setPreviewUrl(null);
      setDisplayName(user.name || user.email.split('@')[0]);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setActiveTab('info');
    }
  }, [isOpen, user?.email, user?.avatar, user?.name]);

  if (!isOpen || !user) return null;

  const showFeedback = (message: string, ok: boolean) => {
    setFeedback({ message, ok });
    setTimeout(() => setFeedback(null), 3500);
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Avatar Handlers
  // ───────────────────────────────────────────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    if (file.size > 5 * 1024 * 1024) {
      showFeedback('Kích thước file ảnh không được vượt quá 5MB.', false);
      return;
    }

    const localBlobUrl = URL.createObjectURL(file);
    setPreviewUrl(localBlobUrl);
    setImgError(false);
    setIsUploading(true);

    try {
      const res = await authService.uploadAvatar(file);
      const fullUrl = res.avatarUrl.startsWith('http') ? res.avatarUrl : `${import.meta.env.VITE_API_URL || ''}${res.avatarUrl}`;
      setPreviewUrl(fullUrl);
      showFeedback('Cập nhật ảnh đại diện thành công!', true);
    } catch (err: any) {
      setPreviewUrl(null);
      showFeedback(err?.message || 'Lỗi khi tải ảnh đại diện.', false);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAvatar = async () => {
    setIsUploading(true);
    try {
      await authService.deleteAvatar();
      setPreviewUrl(null);
      setImgError(true);
      showFeedback('Đã xóa ảnh đại diện thành công.', true);
    } catch (err: any) {
      showFeedback(err?.message || 'Lỗi khi xóa ảnh đại diện.', false);
    } finally {
      setIsUploading(false);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Edit Display Name Handler
  // ───────────────────────────────────────────────────────────────────────────
  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = displayName.trim();
    if (!cleanName) {
      showFeedback('Tên hiển thị không được để trống.', false);
      return;
    }
    if (cleanName.length < 2) {
      showFeedback('Tên hiển thị phải có ít nhất 2 ký tự.', false);
      return;
    }
    setIsSavingName(true);
    setTimeout(() => {
      authService.setStoredName(cleanName);
      setIsSavingName(false);
      showFeedback('Cập nhật tên hiển thị thành công!', true);
    }, 300);
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Password Strength & Change Password
  // ───────────────────────────────────────────────────────────────────────────
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, text: '', color: 'bg-gray-500' };
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    switch (score) {
      case 1: return { score: 25, text: 'Yếu', color: 'bg-red-500' };
      case 2: return { score: 50, text: 'Trung bình', color: 'bg-yellow-500' };
      case 3: return { score: 75, text: 'Khá', color: 'bg-blue-500' };
      case 4: return { score: 100, text: 'Mạnh', color: 'bg-emerald-500' };
      default: return { score: 0, text: '', color: 'bg-gray-500' };
    }
  };

  const passwordStrength = getPasswordStrength(newPassword);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword) {
      showFeedback('Vui lòng nhập mật khẩu hiện tại.', false);
      return;
    }
    if (!newPassword) {
      showFeedback('Vui lòng nhập mật khẩu mới.', false);
      return;
    }
    if (newPassword.length < 8 || newPassword.length > 72) {
      showFeedback('Mật khẩu mới phải có độ dài từ 8 đến 72 ký tự.', false);
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      showFeedback('Mật khẩu mới phải có ít nhất 1 chữ in hoa.', false);
      return;
    }
    if (!/[0-9]/.test(newPassword)) {
      showFeedback('Mật khẩu mới phải có ít nhất 1 chữ số.', false);
      return;
    }
    if (!/[^A-Za-z0-9]/.test(newPassword)) {
      showFeedback('Mật khẩu mới phải có ít nhất 1 ký tự đặc biệt.', false);
      return;
    }
    if (newPassword !== confirmPassword) {
      showFeedback('Mật khẩu xác nhận không khớp.', false);
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await authService.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      showFeedback(res.message || 'Đổi mật khẩu thành công!', true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      showFeedback(err?.message || 'Không thể đổi mật khẩu. Vui lòng thử lại.', false);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const getInitials = (email: string) => {
    return email ? email.substring(0, 2).toUpperCase() : 'US';
  };

  const currentAvatarSrc = previewUrl || (user.avatar && user.avatar !== 'none' ? authService.getDisplayAvatarUrl(user.avatar) : null);
  const hasAvatar = !imgError && !!currentAvatarSrc;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/75 backdrop-blur-md cursor-pointer"
        />

        {/* Modal Card */}
        <motion.div
          layout
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }}
          className="relative w-full max-w-lg bg-secondary-bg border border-custom-border p-6 md:p-8 rounded-3xl shadow-2xl z-10 font-sans text-primary-text max-h-[90vh] overflow-y-auto"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 z-20 text-secondary-text hover:text-primary-text p-2 rounded-full hover:bg-primary-bg transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={20} />
          </button>

          {/* Toast / Alert Feedback */}
          <AnimatePresence>
            {feedback && (
              <motion.div
                layout
                initial={{ opacity: 0, height: 0, scale: 0.96 }}
                animate={{ opacity: 1, height: 'auto', scale: 1 }}
                exit={{ opacity: 0, height: 0, scale: 0.96 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="overflow-hidden mr-8"
              >
                <div
                  className={`mb-5 p-3 px-4 rounded-xl border text-xs font-medium flex items-center gap-2.5 shadow-sm ${
                    feedback.ok
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-red-500/10 border-red-500/30 text-red-400'
                  }`}
                >
                  {feedback.ok ? <CheckCircle2 size={16} className="shrink-0" /> : <AlertCircle size={16} className="shrink-0" />}
                  <span className="leading-snug flex-1">{feedback.message}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Profile Header Block */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-6 pb-6 border-b border-custom-border/60">
            {/* Avatar with Camera Hover */}
            <div className="relative group shrink-0">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-accent/50 shadow-xl bg-primary-bg">
                {hasAvatar && currentAvatarSrc ? (
                  <img
                    key={currentAvatarSrc}
                    src={currentAvatarSrc}
                    alt={user.email}
                    onError={() => setImgError(true)}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-accent to-accent-hover text-black flex items-center justify-center text-xl font-bold font-mono">
                    {getInitials(user.email)}
                  </div>
                )}

                {/* Upload Hover Overlay */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:opacity-50"
                  title="Thay đổi ảnh đại diện"
                >
                  {isUploading ? (
                    <Loader2 size={20} className="animate-spin text-accent" />
                  ) : (
                    <>
                      <Camera size={18} className="text-accent mb-0.5" />
                      <span className="text-[9px] font-semibold">Đổi ảnh</span>
                    </>
                  )}
                </button>
              </div>

              {/* Chấm xanh trạng thái Online (Đồng nhất, không bị che) */}
              <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full border-2 border-secondary-bg z-10 shadow-sm" />
            </div>

            {/* Profile Info Summary */}
            <div className="text-center sm:text-left flex-1 min-w-0">
              <h2 className="text-lg font-bold text-primary-text truncate">
                {user.name || user.email.split('@')[0]}
              </h2>
              <p className="text-xs text-secondary-text truncate mt-0.5">{user.email}</p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                  isAdmin 
                    ? 'bg-accent/15 text-accent border-accent/30' 
                    : 'bg-secondary-bg text-secondary-text border-custom-border'
                }`}>
                  <Shield size={11} />
                  {isAdmin
                    ? t('navigation.roleAdmin', { defaultValue: 'Quản trị viên' })
                    : t('navigation.roleMember', { defaultValue: 'Thành viên' })}
                </span>

                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 size={10} />
                  Hoạt động
                </span>
              </div>

              {/* Nút Xóa ảnh nhanh (Không cần chữ tải ảnh mới) */}
              {hasAvatar && (
                <div className="flex items-center justify-center sm:justify-start pt-2">
                  <button
                    type="button"
                    onClick={handleDeleteAvatar}
                    disabled={isUploading}
                    className="text-xs text-red-400 hover:text-red-300 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <Trash2 size={12} />
                    <span>Xóa ảnh</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-1.5 p-1 bg-primary-bg/80 border border-custom-border rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => setActiveTab('info')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'info'
                  ? 'bg-secondary-bg text-primary-text border border-custom-border shadow-sm font-bold'
                  : 'text-secondary-text hover:text-primary-text'
              }`}
            >
              <User size={14} className={activeTab === 'info' ? 'text-accent' : ''} />
              <span>Hồ sơ & Thông tin</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('security')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'security'
                  ? 'bg-secondary-bg text-primary-text border border-custom-border shadow-sm font-bold'
                  : 'text-secondary-text hover:text-primary-text'
              }`}
            >
              <KeyRound size={14} className={activeTab === 'security' ? 'text-accent' : ''} />
              <span>Bảo mật & Mật khẩu</span>
            </button>
          </div>

          {/* ───────────────────────────────────────────────────────────────── */}
          {/* TAB 1: Profile Info & Edit Name                                   */}
          {/* ───────────────────────────────────────────────────────────────── */}
          {activeTab === 'info' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              {/* Form Sửa Tên hiển thị */}
              <form onSubmit={handleSaveName} className="space-y-3 bg-primary-bg/50 border border-custom-border rounded-2xl p-4">
                <label className="block text-xs font-bold text-primary-text uppercase tracking-wider">
                  Chỉnh sửa tên hiển thị
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary-text" />
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Nhập họ và tên..."
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-secondary-bg border border-custom-border text-xs text-primary-text focus:outline-hidden focus:border-accent transition-colors"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSavingName || displayName === user.name}
                    className="px-4 py-2.5 rounded-xl bg-accent text-black font-semibold text-xs hover:opacity-90 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    {isSavingName ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Save size={13} />
                    )}
                    <span>Lưu</span>
                  </button>
                </div>
              </form>

              {/* Thông tin chi tiết */}
              <div className="space-y-2.5 bg-primary-bg/50 border border-custom-border rounded-2xl p-4 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-custom-border/50">
                  <span className="text-secondary-text flex items-center gap-2">
                    <Mail size={14} />
                    <span>Email:</span>
                  </span>
                  <span className="font-semibold text-primary-text">{user.email}</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-custom-border/50">
                  <span className="text-secondary-text flex items-center gap-2">
                    <ShieldCheck size={14} className="text-accent" />
                    <span>Phương thức đăng nhập:</span>
                  </span>
                  <span className="font-semibold text-accent">
                    {user.authProvider === 1 ? 'Google OAuth 2.0' : 'Email & Mật khẩu (Local)'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5">
                  <span className="text-secondary-text flex items-center gap-2">
                    <Shield size={14} />
                    <span>Cấp độ tài khoản:</span>
                  </span>
                  <span className="font-semibold text-primary-text">{user.role}</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* ───────────────────────────────────────────────────────────────── */}
          {/* TAB 2: Security & Change Password                                 */}
          {/* ───────────────────────────────────────────────────────────────── */}
          {activeTab === 'security' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {user.authProvider === 1 ? (
                // Google Account Info
                <div className="p-5 bg-primary-bg/60 border border-custom-border rounded-2xl text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto">
                    <ShieldCheck size={24} />
                  </div>
                  <h3 className="text-sm font-bold text-primary-text">Tài khoản Google OAuth</h3>
                  <p className="text-xs text-secondary-text leading-relaxed">
                    Tài khoản của bạn đăng nhập thông qua Google. Mật khẩu và bảo mật hai lớp được quản lý trực tiếp bởi tài khoản Google của bạn.
                  </p>
                </div>
              ) : (
                // Change Password Form
                <form onSubmit={handleChangePassword} className="space-y-3.5">
                  {/* Current Password */}
                  <div>
                    <label className="block text-xs font-semibold text-secondary-text mb-1.5">
                      Mật khẩu hiện tại
                    </label>
                    <div className="relative">
                      <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary-text" />
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Nhập mật khẩu đang dùng..."
                        className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-primary-bg border border-custom-border text-xs text-primary-text focus:outline-hidden focus:border-accent transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-text hover:text-primary-text"
                      >
                        {showCurrentPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-xs font-semibold text-secondary-text mb-1.5">
                      Mật khẩu mới (8-72 ký tự, gồm chữ hoa, số & ký tự đặc biệt)
                    </label>
                    <div className="relative">
                      <KeyRound size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary-text" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Nhập mật khẩu mới..."
                        className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-primary-bg border border-custom-border text-xs text-primary-text focus:outline-hidden focus:border-accent transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-text hover:text-primary-text"
                      >
                        {showNewPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>

                    {/* Password Strength Bar */}
                    {newPassword && (
                      <div className="mt-2 space-y-1">
                        <div className="h-1.5 w-full bg-primary-bg/80 rounded-full overflow-hidden border border-custom-border/50">
                          <div
                            className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                            style={{ width: `${passwordStrength.score}%` }}
                          />
                        </div>
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-secondary-text">Độ mạnh mật khẩu:</span>
                          <span className="font-semibold text-primary-text">{passwordStrength.text}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-xs font-semibold text-secondary-text mb-1.5">
                      Xác nhận mật khẩu mới
                    </label>
                    <div className="relative">
                      <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary-text" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Nhập lại mật khẩu mới..."
                        className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-primary-bg border border-custom-border text-xs text-primary-text focus:outline-hidden focus:border-accent transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-text hover:text-primary-text"
                      >
                        {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>

                    {/* Realtime Match Indicator */}
                    {confirmPassword && (
                      <div className="mt-1.5 text-[11px] flex items-center gap-1 font-medium">
                        {newPassword === confirmPassword ? (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <Check size={12} /> Mật khẩu khớp
                          </span>
                        ) : (
                          <span className="text-red-400 flex items-center gap-1">
                            <X size={12} /> Mật khẩu chưa khớp
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                    className="w-full mt-2 py-3 rounded-xl bg-accent text-black font-semibold text-xs hover:opacity-90 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isChangingPassword ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <KeyRound size={15} />
                    )}
                    <span>Cập nhật mật khẩu mới</span>
                  </button>
                </form>
              )}
            </motion.div>
          )}

          {/* ───────────────────────────────────────────────────────────────── */}
          {/* Footer Actions                                                    */}
          {/* ───────────────────────────────────────────────────────────────── */}
          <div className="mt-6 pt-5 border-t border-custom-border/60 flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                onClose();
                onSwitchAccount();
              }}
              className="flex-1 py-2.5 px-3 rounded-xl border border-custom-border text-primary-text hover:bg-primary-bg font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowLeftRight size={14} />
              <span>Chuyển tài khoản</span>
            </button>

            <button
              type="button"
              onClick={() => {
                logout();
                onClose();
                navigate('/');
              }}
              className="flex-1 py-2.5 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut size={14} />
              <span>Đăng xuất</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
