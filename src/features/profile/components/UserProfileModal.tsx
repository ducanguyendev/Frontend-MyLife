import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/shared/hooks/useLanguage';
import { useAuth } from '@/features/auth/context/AuthContext';
import { authService } from '@/features/auth/services/authService';
import { Input, PasswordInput } from '@/shared/components/ui';
import {
  X, Mail, Shield, LogOut, ArrowLeftRight, CheckCircle2,
  Camera, Trash2, Loader2, AlertCircle, User,
  Lock, KeyRound, Save, Check, ShieldCheck, Phone, Calendar
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

  // Profile Info States
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [gender, setGender] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isFetchingInfo, setIsFetchingInfo] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Change Password States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Validation field errors
  const [fieldErrors, setFieldErrors] = useState<{
    fullName?: string;
    phoneNumber?: string;
    gender?: string;
    dateOfBirth?: string;
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  // Feedback Notification
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (errorMessage || successMessage) {
      timer = setTimeout(() => {
        setErrorMessage(null);
        setSuccessMessage(null);
      }, 4000);
    }
    return () => clearTimeout(timer);
  }, [errorMessage, successMessage]);

  // Dynamic Avatar Source with Google Drive Fallback
  const [currentSrc, setCurrentSrc] = useState<string | null>(null);

  useEffect(() => {
    if (previewUrl) {
      setCurrentSrc(previewUrl);
      setImgError(false);
    } else if (user?.avatar && user.avatar !== 'none') {
      setCurrentSrc(authService.getDisplayAvatarUrl(user.avatar, user.email, Date.now()));
      setImgError(false);
    } else {
      setCurrentSrc(null);
      setImgError(false);
    }
  }, [previewUrl, user?.avatar, user?.email]);

  const handleImageError = () => {
    setImgError(true);
  };

  // Sync state on open
  useEffect(() => {
    if (isOpen && user) {
      setImgError(false);
      setPreviewUrl(null);
      setCurrentSrc(user.avatar && user.avatar !== 'none' ? authService.getDisplayAvatarUrl(user.avatar, user.email, Date.now()) : null);
      
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setFieldErrors({});
      setErrorMessage(null);
      setSuccessMessage(null);
      setActiveTab('info');
      setIsEditingProfile(false);
      
      // Fetch full user info
      const fetchInfo = async () => {
        setIsFetchingInfo(true);
        try {
          const info = await authService.getUserInfo();
          setFullName(info.fullName || user.name || user.email.split('@')[0]);
          setPhoneNumber(info.phoneNumber || '');
          setGender(info.gender || '');
          if (info.dateOfBirth) {
             const [y, m, d] = info.dateOfBirth.split('T')[0].split('-');
             setDateOfBirth(`${d}/${m}/${y}`);
          } else {
             setDateOfBirth('');
          }
        } catch (err) {
           console.error(err);
        } finally {
          setIsFetchingInfo(false);
        }
      };
      fetchInfo();
    }
  }, [isOpen, user?.email, user?.avatar, user?.name]);

  if (!isOpen || !user) return null;

  // ───────────────────────────────────────────────────────────────────────────
  // Avatar Handlers
  // ───────────────────────────────────────────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    // Validate size (< 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage(t('common.userProfile.msgAvatarSize', { defaultValue: 'Kích thước ảnh không được vượt quá 5MB.' }));
      setSuccessMessage(null);
      return;
    }

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setErrorMessage(t('common.userProfile.msgAvatarFormat', { defaultValue: 'Định dạng ảnh không hợp lệ (JPG, PNG, WEBP, GIF).' }));
      setSuccessMessage(null);
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await authService.uploadAvatar(file);
      setImgError(false);
      if (res?.avatarUrl) {
        const freshUrl = authService.getDisplayAvatarUrl(res.avatarUrl, user.email, Date.now());
        setPreviewUrl(freshUrl);
        setCurrentSrc(freshUrl);
      }
      setSuccessMessage(t('common.userProfile.msgUploadAvatarSuccess', { defaultValue: 'Cập nhật ảnh đại diện thành công!' }));
    } catch (err: any) {
      setErrorMessage(err?.message || t('common.userProfile.msgUploadAvatarError', { defaultValue: 'Lỗi khi tải ảnh đại diện lên.' }));
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAvatar = async () => {
    if (isUploading) return;
    setIsUploading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await authService.deleteAvatar();
      setPreviewUrl(null);
      setCurrentSrc(null);
      setImgError(false);
      setSuccessMessage(t('common.userProfile.msgDeleteAvatarSuccess', { defaultValue: 'Đã xóa ảnh đại diện thành công.' }));
    } catch (err: any) {
      setErrorMessage(err?.message || t('common.userProfile.msgDeleteAvatarError', { defaultValue: 'Lỗi khi xóa ảnh đại diện.' }));
    } finally {
      setIsUploading(false);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Edit Profile Handler
  // ───────────────────────────────────────────────────────────────────────────
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    
    const errors: typeof fieldErrors = {};
    const trimmedFullName = fullName.trim();
    if (!trimmedFullName) {
      errors.fullName = t('common.registerPage.errors.nameRequired', { defaultValue: 'Vui lòng nhập họ và tên.' });
    } else if (trimmedFullName.length < 2 || trimmedFullName.length > 50) {
      errors.fullName = t('common.registerPage.errors.nameLength', { defaultValue: 'Họ và tên phải có độ dài từ 2 đến 50 ký tự.' });
    } else if (!/^[\p{L}\s]+$/u.test(trimmedFullName)) {
      errors.fullName = t('common.registerPage.errors.nameSpecialChars', { defaultValue: 'Họ và tên không được chứa số hoặc ký tự đặc biệt.' });
    }

    const trimmedPhone = phoneNumber.trim().replace(/\s+/g, '');
    if (!trimmedPhone) {
      errors.phoneNumber = t('common.registerPage.errors.phoneRequired', { defaultValue: 'Vui lòng nhập số điện thoại.' });
    } else if (!/^(0[3|5|7|8|9])[0-9]{8}$/.test(trimmedPhone)) {
      errors.phoneNumber = t('common.registerPage.errors.phoneInvalid', { defaultValue: 'Số điện thoại không hợp lệ (10 chữ số bắt đầu bằng 03, 05, 07, 08, 09).' });
    }
    
    // dateOfBirth format DD/MM/YYYY
    let backendDob = '';
    if (!dateOfBirth) {
       errors.dateOfBirth = t('common.registerPage.errors.dobRequired', { defaultValue: 'Vui lòng nhập ngày sinh.' });
    } else {
       const dobParts = dateOfBirth.split('/');
       if (dobParts.length !== 3) {
           errors.dateOfBirth = t('common.registerPage.errors.dobFormat', { defaultValue: 'Ngày sinh không hợp lệ (DD/MM/YYYY).' });
       } else {
           const [d, m, y] = dobParts;
           const dobStr = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
           const dDate = new Date(dobStr);
           if (isNaN(dDate.getTime())) {
               errors.dateOfBirth = t('common.registerPage.errors.dobInvalid', { defaultValue: 'Ngày sinh không hợp lệ.' });
           } else {
               backendDob = dobStr;
           }
       }
    }

    if (!gender || !['Nam', 'Nữ', 'Khác'].includes(gender)) {
      errors.gender = t('common.registerPage.errors.genderRequired', { defaultValue: 'Vui lòng chọn giới tính hợp lệ (Nam, Nữ hoặc Khác).' });
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setErrorMessage(Object.values(errors)[0] || t('common.registerPage.errors.checkInputs', { defaultValue: 'Vui lòng kiểm tra lại thông tin nhập.' }));
      return;
    }

    setFieldErrors({});
    setIsSavingProfile(true);
    try {
      await authService.updateProfile({
        fullName: trimmedFullName,
        phoneNumber: trimmedPhone,
        gender,
        dateOfBirth: backendDob
      });
      authService.setStoredName(trimmedFullName);
      setSuccessMessage(t('common.userProfile.msgProfileSuccess', { defaultValue: 'Cập nhật hồ sơ thành công!' }));
      setIsEditingProfile(false);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Lỗi khi cập nhật hồ sơ.');
    } finally {
      setIsSavingProfile(false);
    }
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
      case 1: return { score: 25, text: t('common.userProfile.strengthWeak', { defaultValue: 'Yếu' }), color: 'bg-red-500' };
      case 2: return { score: 50, text: t('common.userProfile.strengthMedium', { defaultValue: 'Trung bình' }), color: 'bg-yellow-500' };
      case 3: return { score: 75, text: t('common.userProfile.strengthGood', { defaultValue: 'Khá' }), color: 'bg-blue-500' };
      case 4: return { score: 100, text: t('common.userProfile.strengthStrong', { defaultValue: 'Mạnh' }), color: 'bg-emerald-500' };
      default: return { score: 0, text: '', color: 'bg-gray-500' };
    }
  };

  const passwordStrength = getPasswordStrength(newPassword);

  const validateNewPassword = (val: string): string | undefined => {
    if (!val) return undefined;
    if (val.length < 8 || val.length > 72) {
      return t('common.userProfile.msgPassLength', { defaultValue: 'Mật khẩu mới phải có độ dài từ 8 đến 72 ký tự.' });
    }
    if (!/[A-Z]/.test(val)) {
      return t('common.userProfile.msgPassUpper', { defaultValue: 'Mật khẩu mới phải có ít nhất 1 chữ in hoa.' });
    }
    if (!/[0-9]/.test(val)) {
      return t('common.userProfile.msgPassNum', { defaultValue: 'Mật khẩu mới phải có ít nhất 1 chữ số.' });
    }
    if (!/[^A-Za-z0-9]/.test(val)) {
      return t('common.userProfile.msgPassSpecial', { defaultValue: 'Mật khẩu mới phải có ít nhất 1 ký tự đặc biệt.' });
    }
    return undefined;
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    const errors: typeof fieldErrors = {};

    if (!currentPassword) {
      errors.currentPassword = t('common.userProfile.msgCurrentPassReq', { defaultValue: 'Vui lòng nhập mật khẩu hiện tại.' });
    }
    if (!newPassword) {
      errors.newPassword = t('common.userProfile.msgNewPassReq', { defaultValue: 'Vui lòng nhập mật khẩu mới.' });
    } else {
      const newPassErr = validateNewPassword(newPassword);
      if (newPassErr) errors.newPassword = newPassErr;
    }

    if (!confirmPassword) {
      errors.confirmPassword = t('common.userProfile.msgConfirmPassReq', { defaultValue: 'Vui lòng nhập lại mật khẩu mới.' });
    } else if (newPassword && newPassword !== confirmPassword) {
      errors.confirmPassword = t('common.userProfile.msgPassMismatch', { defaultValue: 'Mật khẩu xác nhận không khớp.' });
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setErrorMessage(Object.values(errors)[0] || 'Vui lòng kiểm tra lại thông tin.');
      return;
    }

    setFieldErrors({});
    setIsChangingPassword(true);
    try {
      const res = await authService.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      setSuccessMessage(res.message || t('common.userProfile.msgPassSuccess', { defaultValue: 'Đổi mật khẩu thành công!' }));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setErrorMessage(err?.message || t('common.userProfile.msgPassError', { defaultValue: 'Không thể đổi mật khẩu. Vui lòng thử lại.' }));
    } finally {
      setIsChangingPassword(false);
    }
  };

  const getInitials = (email: string) => {
    return email ? email.substring(0, 2).toUpperCase() : 'US';
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
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
          onClick={(e) => e.stopPropagation()}
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

          {/* Error Banner */}
          <AnimatePresence>
            {errorMessage && (
              <motion.div
                layout
                initial={{ opacity: 0, height: 0, scale: 0.96 }}
                animate={{ opacity: 1, height: 'auto', scale: 1 }}
                exit={{ opacity: 0, height: 0, scale: 0.96 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="overflow-hidden mb-5"
              >
                <div className="p-3 px-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium flex items-center gap-2.5 shadow-sm">
                  <AlertCircle size={16} className="shrink-0" />
                  <span className="leading-snug flex-1">{errorMessage}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Success Banner */}
          <AnimatePresence>
            {successMessage && (
              <motion.div
                layout
                initial={{ opacity: 0, height: 0, scale: 0.96 }}
                animate={{ opacity: 1, height: 'auto', scale: 1 }}
                exit={{ opacity: 0, height: 0, scale: 0.96 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="overflow-hidden mb-5"
              >
                <div className="p-3 px-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center gap-2.5 shadow-sm">
                  <CheckCircle2 size={16} className="shrink-0" />
                  <span className="leading-snug flex-1">{successMessage}</span>
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

              <div 
                onClick={() => !isUploading && fileInputRef.current?.click()}
                className="w-20 h-20 rounded-full overflow-hidden border-2 border-accent/50 shadow-xl bg-primary-bg relative cursor-pointer"
              >
                {!imgError && currentSrc ? (
                  <img
                    key={currentSrc}
                    src={currentSrc}
                    alt={user.email}
                    onError={handleImageError}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-accent to-accent-hover text-primary-bg flex items-center justify-center text-xl font-bold font-mono">
                    {getInitials(user.email)}
                  </div>
                )}

                {/* Upload Hover Overlay (Chỉ hiển thị icon Camera, không có chữ Đổi ảnh) */}
                <div
                  className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  {isUploading ? (
                    <Loader2 size={22} className="animate-spin text-accent" />
                  ) : (
                    <Camera size={22} className="text-accent" />
                  )}
                </div>
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
                  {t('common.userProfile.statusActive', { defaultValue: 'Hoạt động' })}
                </span>
              </div>

              {/* Nút Xóa ảnh (Chỉ hiển thị khi có ảnh) */}
              {(!!currentSrc || (!!user.avatar && user.avatar !== 'none')) && (
                <div className="flex items-center justify-center sm:justify-start mt-2">
                  <button
                    type="button"
                    onClick={handleDeleteAvatar}
                    disabled={isUploading}
                    className="text-xs text-red-400 hover:text-red-300 hover:underline flex items-center gap-1 cursor-pointer font-medium disabled:opacity-50"
                  >
                    <Trash2 size={13} />
                    <span>{t('common.userProfile.deletePhoto', { defaultValue: 'Xóa ảnh' })}</span>
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
              <span>{t('common.userProfile.tabInfo', { defaultValue: 'Hồ sơ & Thông tin' })}</span>
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
              <span>{t('common.userProfile.tabSecurity', { defaultValue: 'Bảo mật & Mật khẩu' })}</span>
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
              {/* Form Sửa Hồ Sơ */}
              {!isEditingProfile ? (
                <div className="space-y-4 bg-primary-bg/50 border border-custom-border rounded-2xl p-4">
                  {isFetchingInfo ? (
                     <div className="flex justify-center p-4"><Loader2 size={24} className="animate-spin text-accent" /></div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col">
                          <span className="text-[11px] font-semibold text-secondary-text mb-1 uppercase">Họ và tên</span>
                          <span className="text-sm font-bold text-primary-text">{fullName || user.name || user.email.split('@')[0]}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[11px] font-semibold text-secondary-text mb-1 uppercase">Số điện thoại</span>
                          <span className="text-sm font-bold text-primary-text">{phoneNumber || 'Chưa cập nhật'}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[11px] font-semibold text-secondary-text mb-1 uppercase">Ngày sinh</span>
                          <span className="text-sm font-bold text-primary-text">{dateOfBirth || 'Chưa cập nhật'}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[11px] font-semibold text-secondary-text mb-1 uppercase">Giới tính</span>
                          <span className="text-sm font-bold text-primary-text">{gender || 'Chưa cập nhật'}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsEditingProfile(true)}
                        className="w-full h-[40px] rounded-xl border border-accent text-accent font-semibold text-xs hover:bg-accent hover:text-primary-bg transition-all flex items-center justify-center gap-1.5 mt-2 cursor-pointer"
                      >
                        Chỉnh sửa hồ sơ
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <form onSubmit={handleSaveProfile} className="space-y-3 bg-primary-bg/50 border border-custom-border rounded-2xl p-4">
                  {isFetchingInfo ? (
                     <div className="flex justify-center p-4"><Loader2 size={24} className="animate-spin text-accent" /></div>
                  ) : (
                    <>
                    {/* Full Name */}
                    <Input
                      label={t('common.userProfile.editDisplayName', { defaultValue: 'Họ và tên' })}
                      leftIcon={<User size={16} />}
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        if (fieldErrors.fullName) setFieldErrors((prev) => ({ ...prev, fullName: undefined }));
                      }}
                      maxLength={50}
                      error={fieldErrors.fullName}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        label={t('common.userProfile.phoneNumber', { defaultValue: 'Số điện thoại' })}
                        leftIcon={<Phone size={16} />}
                        value={phoneNumber}
                        onChange={(e) => {
                          setPhoneNumber(e.target.value);
                          if (fieldErrors.phoneNumber) setFieldErrors((prev) => ({ ...prev, phoneNumber: undefined }));
                        }}
                        maxLength={10}
                        error={fieldErrors.phoneNumber}
                      />

                      <Input
                        label={t('common.userProfile.dateOfBirth', { defaultValue: 'Ngày sinh (DD/MM/YYYY)' })}
                        leftIcon={<Calendar size={16} />}
                        value={dateOfBirth}
                        onChange={(e) => {
                          let val = e.target.value.replace(/[^0-9]/g, '');
                          if (val.length > 2) val = val.slice(0, 2) + '/' + val.slice(2);
                          if (val.length > 5) val = val.slice(0, 5) + '/' + val.slice(5, 9);
                          setDateOfBirth(val);
                          if (fieldErrors.dateOfBirth) setFieldErrors((prev) => ({ ...prev, dateOfBirth: undefined }));
                        }}
                        maxLength={10}
                        error={fieldErrors.dateOfBirth}
                      />
                    </div>

                    {/* Gender Selector */}
                    <div>
                      <label className="block text-[11px] font-semibold text-secondary-text mb-1.5 ml-1 uppercase tracking-wider">
                        {t('common.gender', { defaultValue: 'Giới tính' })}
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { val: 'Nam', label: t('common.genderMale', { defaultValue: 'Nam' }) },
                          { val: 'Nữ', label: t('common.genderFemale', { defaultValue: 'Nữ' }) },
                          { val: 'Khác', label: t('common.genderOther', { defaultValue: 'Khác' }) },
                        ].map((opt) => (
                          <button
                            key={opt.val}
                            type="button"
                            onClick={() => {
                              setGender(opt.val);
                              if (fieldErrors.gender) setFieldErrors((prev) => ({ ...prev, gender: undefined }));
                            }}
                            className={`py-2.5 rounded-xl border border-custom-border text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                              gender === opt.val
                                ? 'bg-accent text-primary-bg font-semibold shadow-sm'
                                : 'text-secondary-text hover:text-primary-text hover:bg-secondary-bg'
                            }`}
                          >
                            {gender === opt.val && <Check size={13} className="stroke-[3]" />}
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => setIsEditingProfile(false)}
                        className="flex-1 h-[48px] rounded-xl bg-secondary-bg border border-custom-border text-primary-text font-semibold text-xs hover:opacity-90 transition-all cursor-pointer"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingProfile}
                        className="flex-1 h-[48px] rounded-xl bg-accent text-primary-bg font-semibold text-xs hover:opacity-90 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {isSavingProfile ? (
                          <Loader2 size={15} className="animate-spin" />
                        ) : (
                          <Save size={15} />
                        )}
                        <span>{t('common.userProfile.save', { defaultValue: 'Lưu thay đổi' })}</span>
                      </button>
                    </div>
                    </>
                  )}
                </form>
              )}

              {/* Thông tin chi tiết */}
              <div className="space-y-2.5 bg-primary-bg/50 border border-custom-border rounded-2xl p-4 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-custom-border/50">
                  <span className="text-secondary-text flex items-center gap-2">
                    <Mail size={14} />
                    <span>{t('common.userProfile.emailLabel', { defaultValue: 'Email:' })}</span>
                  </span>
                  <span className="font-semibold text-primary-text">{user.email}</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-custom-border/50">
                  <span className="text-secondary-text flex items-center gap-2">
                    <ShieldCheck size={14} className="text-accent" />
                    <span>{t('common.userProfile.loginMethod', { defaultValue: 'Phương thức đăng nhập:' })}</span>
                  </span>
                  <span className="font-semibold text-accent">
                    {user.authProvider === 1 ? 'Google OAuth 2.0' : t('common.userProfile.authLocal', { defaultValue: 'Email & Mật khẩu (Local)' })}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5">
                  <span className="text-secondary-text flex items-center gap-2">
                    <Shield size={14} />
                    <span>{t('common.userProfile.accountLevel', { defaultValue: 'Cấp độ tài khoản:' })}</span>
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
                  <h3 className="text-sm font-bold text-primary-text">{t('common.userProfile.googleAuthTitle', { defaultValue: 'Tài khoản Google OAuth' })}</h3>
                  <p className="text-xs text-secondary-text leading-relaxed">
                    {t('common.userProfile.googleAuthDesc', { defaultValue: 'Tài khoản của bạn đăng nhập thông qua Google. Mật khẩu và bảo mật hai lớp được quản lý trực tiếp bởi tài khoản Google của bạn.' })}
                  </p>
                </div>
              ) : (
                // Change Password Form
                <form onSubmit={handleChangePassword} className="space-y-4">
                  {/* Current Password */}
                  <PasswordInput
                    label={t('common.userProfile.currentPassword', { defaultValue: 'Mật khẩu hiện tại' })}
                    leftIcon={<Lock size={16} />}
                    value={currentPassword}
                    onChange={(e) => {
                      setCurrentPassword(e.target.value);
                      if (fieldErrors.currentPassword) setFieldErrors((prev) => ({ ...prev, currentPassword: undefined }));
                    }}
                    error={fieldErrors.currentPassword}
                  />

                  {/* New Password */}
                  <div>
                    <PasswordInput
                      label={t('common.userProfile.newPassword', { defaultValue: 'Mật khẩu mới' })}
                      leftIcon={<KeyRound size={16} />}
                      value={newPassword}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewPassword(val);
                        if (fieldErrors.newPassword) {
                          setFieldErrors((prev) => ({ ...prev, newPassword: validateNewPassword(val) }));
                        }
                      }}
                      onBlur={() => {
                        if (newPassword) {
                          const err = validateNewPassword(newPassword);
                          if (err) setFieldErrors((prev) => ({ ...prev, newPassword: err }));
                        }
                      }}
                      onCopy={(e) => {
                        e.preventDefault();
                        setErrorMessage(t('common.registerPage.errors.copyPasswordBlocked', { defaultValue: 'Không được phép sao chép mật khẩu vì lý do an toàn bảo mật.' }));
                      }}
                      onCut={(e) => {
                        e.preventDefault();
                      }}
                      error={fieldErrors.newPassword}
                    />

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
                          <span className="text-secondary-text">{t('common.userProfile.passwordStrength', { defaultValue: 'Độ mạnh mật khẩu:' })}</span>
                          <span className="font-semibold text-primary-text">{passwordStrength.text}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <PasswordInput
                      label={t('common.userProfile.confirmNewPassword', { defaultValue: 'Xác nhận mật khẩu mới' })}
                      leftIcon={<Lock size={16} />}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (fieldErrors.confirmPassword) setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                      }}
                      onPaste={(e) => {
                        e.preventDefault();
                        setErrorMessage(t('common.registerPage.errors.pastePasswordBlocked', { defaultValue: 'Không được phép dán (paste). Vui lòng tự nhập lại mật khẩu để xác nhận.' }));
                      }}
                      onCopy={(e) => {
                        e.preventDefault();
                      }}
                      onCut={(e) => {
                        e.preventDefault();
                      }}
                      error={fieldErrors.confirmPassword}
                    />

                    {/* Realtime Match Indicator */}
                    {confirmPassword && (
                      <div className="mt-1.5 text-[11px] flex items-center gap-1 font-medium ml-1">
                        {newPassword === confirmPassword ? (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <Check size={12} /> {t('common.userProfile.passwordMatch', { defaultValue: 'Mật khẩu khớp' })}
                          </span>
                        ) : (
                          <span className="text-red-400 flex items-center gap-1">
                            <X size={12} /> {t('common.userProfile.passwordNotMatch', { defaultValue: 'Mật khẩu chưa khớp' })}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                    className="w-full mt-2 py-3.5 rounded-2xl bg-accent text-primary-bg font-semibold text-xs hover:opacity-90 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isChangingPassword ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <Save size={15} />
                    )}
                    <span>{t('common.userProfile.updatePassword', { defaultValue: 'Cập nhật mật khẩu' })}</span>
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
