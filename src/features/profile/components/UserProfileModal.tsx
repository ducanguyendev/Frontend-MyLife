import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/shared/hooks/useLanguage';
import { useAuth } from '@/features/auth/context/AuthContext';
import { authService } from '@/features/auth/services/authService';
import { getApiErrorMessage } from '@/shared/api/apiClient';
import { Modal, Button, SegmentedControl, DateInput, Input, PasswordInput, Select, SelectItem, formatBackendToDob, validateCalendarDate } from '@/shared/components/ui';
import { getDisplayNameInitials, getUserDisplayName, normalizeNameWhitespace } from '@/shared/utils/userDisplayName';
import {
  X, Mail, Shield, LogOut, ArrowLeftRight, CheckCircle2,
  Camera, Trash2, Loader2, AlertCircle, User,
  Lock, KeyRound, Save, Check, ShieldCheck, Phone
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './UserProfileModal.css';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchAccount: () => void | Promise<void>;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  onSwitchAccount,
}) => {
  const { t } = useLanguage();
  const { user, isAdmin, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  // Tab State
  const [activeTab, setActiveTab] = useState<'info' | 'security'>('info');

  // Avatar Upload States
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadInProgressRef = useRef(false);
  const openedProfileUserRef = useRef<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Profile Info States
  const [fullName, setFullName] = useState('');
  const [displayName, setDisplayName] = useState('');
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
    displayName?: string;
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
    if (!isOpen) {
      openedProfileUserRef.current = null;
      return;
    }
    // Avatar events change the user object while the modal is still open.
    // They must not clear upload feedback or reset the active tab/profile form.
    if (user && openedProfileUserRef.current === user.id) return;
    if (isOpen && user) {
      openedProfileUserRef.current = user.id;
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
          setFullName(info.fullName || user.fullName || '');
          setDisplayName(info.displayName || getUserDisplayName({ fullName: info.fullName || user.fullName, displayName: user.displayName, name: user.name }, ''));
          setPhoneNumber(info.phoneNumber || '');
          setGender(info.gender || '');
          setDateOfBirth(info.dateOfBirth ? formatBackendToDob(info.dateOfBirth) : '');
        } catch (error) {
           console.error('Unable to load profile information.', error);
           setErrorMessage('Unable to load profile information. Please try again.');
        } finally {
          setIsFetchingInfo(false);
        }
      };
      void fetchInfo();
    }
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  const userDisplayName = getUserDisplayName(user, t('common.userProfile.accountFallback', { defaultValue: 'Account' }));

  const hasLocalLogin = user.loginProviders?.local ?? user.authProvider !== 1;
  const hasGoogleLogin = user.loginProviders?.google ?? user.authProvider === 1;
  const loginMethod = [
    hasLocalLogin ? 'Email & Password' : null,
    hasGoogleLogin ? 'Google OAuth 2.0' : null,
  ].filter(Boolean).join(' + ');

  // ───────────────────────────────────────────────────────────────────────────
  // Avatar Handlers
  // ───────────────────────────────────────────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    if (uploadInProgressRef.current) return;

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

    uploadInProgressRef.current = true;
    const previousAvatarUrl = currentSrc;
    setIsUploading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await authService.uploadAvatar(file);
      setImgError(false);
      if (!res?.avatarUrl) throw new Error('Avatar storage returned no image URL.');
      setPreviewUrl(res.avatarUrl);
      setCurrentSrc(res.avatarUrl);
      setSuccessMessage(t('common.userProfile.msgUploadAvatarSuccess', { defaultValue: 'Cập nhật ảnh đại diện thành công!' }));
    } catch (err: unknown) {
      setPreviewUrl(previousAvatarUrl);
      setCurrentSrc(previousAvatarUrl);
      setSuccessMessage(null);
      setErrorMessage(getApiErrorMessage(err, t('common.userProfile.msgUploadAvatarError', { defaultValue: 'Lỗi khi tải ảnh đại diện lên.' })));
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
      uploadInProgressRef.current = false;
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
    } catch (err: unknown) {
      setErrorMessage(getApiErrorMessage(err, t('common.userProfile.msgDeleteAvatarError', { defaultValue: 'Lỗi khi xóa ảnh đại diện.' })));
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
    const trimmedDisplayName = normalizeNameWhitespace(displayName);
    if (!trimmedDisplayName) {
      errors.displayName = t('common.userProfile.msgNameEmpty', { defaultValue: 'Please enter a display name.' });
    } else if (trimmedDisplayName.length > 100) {
      errors.displayName = t('common.userProfile.msgNameLong', { maxLength: 100, defaultValue: 'Display name must be 100 characters or fewer.' });
    }

    const trimmedPhone = phoneNumber.trim().replace(/\s+/g, '');
    if (!trimmedPhone) {
      errors.phoneNumber = t('common.registerPage.errors.phoneRequired', { defaultValue: 'Vui lòng nhập số điện thoại.' });
    } else if (!/^(0[3|5|7|8|9])[0-9]{8}$/.test(trimmedPhone)) {
      errors.phoneNumber = t('common.registerPage.errors.phoneInvalid', { defaultValue: 'Số điện thoại không hợp lệ (10 chữ số bắt đầu bằng 03, 05, 07, 08, 09).' });
    }
    
    const dobValidation = validateCalendarDate(dateOfBirth, { required: true });
    const backendDob = dobValidation.backendDate || '';
    if (!dobValidation.valid) {
      const dobErrorKey = dobValidation.error === 'required'
        ? 'common.registerPage.errors.dobRequired'
        : dobValidation.error === 'format'
          ? 'common.registerPage.errors.dobFormat'
          : dobValidation.error === 'future'
            ? 'common.registerPage.errors.dobFuture'
            : 'common.registerPage.errors.dobInvalid';
      errors.dateOfBirth = t(dobErrorKey);
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
      const response = await authService.updateProfile({
        displayName: trimmedDisplayName,
        phoneNumber: trimmedPhone,
        gender,
        dateOfBirth: backendDob
      });
      updateUser(response.user);
      setFullName(response.user.fullName || fullName);
      setDisplayName(response.user.displayName || trimmedDisplayName);
      setSuccessMessage(t('common.userProfile.msgNameSuccess'));
      setIsEditingProfile(false);
    } catch (err: unknown) {
      setErrorMessage(getApiErrorMessage(err, t('common.userProfile.msgProfileError', { defaultValue: 'Unable to update profile.' })));
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
    } catch (err: unknown) {
      setErrorMessage(getApiErrorMessage(err, t('common.userProfile.msgPassError', { defaultValue: 'Không thể đổi mật khẩu. Vui lòng thử lại.' })));
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} showTitle={false} ariaLabel={t('navigation.profile')} maxWidth="2xl" className="user-profile-modal">
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
          <div className="user-profile__header">
            {/* Avatar with Camera Hover */}
            <div className="user-profile__avatar-wrap group">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                disabled={isUploading}
                onChange={handleFileChange}
                className="hidden"
              />

              <button
                type="button"
                aria-label={t('common.userProfile.uploadPhoto', { defaultValue: 'Change profile photo' })}
                disabled={isUploading}
                onClick={() => !isUploading && fileInputRef.current?.click()}
                className="user-profile__avatar"
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
                  <span className="w-full h-full bg-gradient-to-tr from-accent to-accent-hover text-primary-bg flex items-center justify-center text-xl font-bold font-mono">
                    {getDisplayNameInitials(userDisplayName)}
                  </span>
                )}

                {/* Upload Hover Overlay (Chỉ hiển thị icon Camera, không có chữ Đổi ảnh) */}
                <span
                  className="absolute inset-0 rounded-full bg-black/35 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  {isUploading ? (
                    <Loader2 size={22} className="animate-spin text-accent" />
                  ) : (
                    <Camera size={22} className="text-accent" />
                  )}
                </span>
              </button>

              {/* Chấm xanh trạng thái Online (Đồng nhất, không bị che) */}
              <span className="user-profile__availability" aria-hidden="true" />
            </div>

            {/* Profile Info Summary */}
            <div className="user-profile__identity">
              <h2 className="text-lg font-bold text-primary-text">
                {userDisplayName}
              </h2>

              <div className="user-profile__badges">
                <span className={`user-profile__badge ${
                  isAdmin 
                    ? 'bg-accent/15 text-accent border-accent/30' 
                    : 'bg-secondary-bg text-secondary-text border-custom-border'
                }`}>
                  <Shield size={11} />
                  {isAdmin
                    ? t('navigation.roleAdmin', { defaultValue: 'Quản trị viên' })
                    : t('navigation.roleMember', { defaultValue: 'Thành viên' })}
                </span>

                <span className="user-profile__badge user-profile__badge--active">
                  <CheckCircle2 size={11} />
                  {t('common.userProfile.statusActive', { defaultValue: 'Hoạt động' })}
                </span>
              </div>

              {/* Nút Xóa ảnh (Chỉ hiển thị khi có ảnh) */}
              {(!!currentSrc || (!!user.avatar && user.avatar !== 'none')) && (
                <div className="user-profile__avatar-actions">
                  <button
                    type="button"
                    onClick={handleDeleteAvatar}
                    disabled={isUploading}
                    className="user-profile__remove-avatar"
                  >
                    <Trash2 size={13} />
                    <span>{t('common.userProfile.deletePhoto', { defaultValue: 'Xóa ảnh' })}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <SegmentedControl label={t('navigation.profile')} value={activeTab} onChange={setActiveTab} className="user-profile__tabs" options={[
            { value: 'info', label: t('common.userProfile.tabInfo'), icon: <User size={14}/> },
            { value: 'security', label: t('common.userProfile.tabSecurity'), icon: <KeyRound size={14}/> },
          ]}/>


          {/* ───────────────────────────────────────────────────────────────── */}
          {/* TAB 1: Profile Info & Edit Name                                   */}
          {/* ───────────────────────────────────────────────────────────────── */}
          {activeTab === 'info' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="user-profile__content"
            >
              {/* Form Sửa Hồ Sơ */}
              {!isEditingProfile ? (
                <div className="user-profile__panel">
                  {isFetchingInfo ? (
                     <div className="flex justify-center p-4"><Loader2 size={24} className="animate-spin text-accent" /></div>
                  ) : (
                    <>
                      <div className="user-profile__facts">
                        <div className="flex flex-col">
                          <span className="text-[11px] font-semibold text-secondary-text mb-1 uppercase">{t('common.userProfile.fullName', { defaultValue: 'Full name' })}</span>
                          <span className="text-sm font-bold text-primary-text">{fullName || t('common.userProfile.notProvided', { defaultValue: 'Not provided' })}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[11px] font-semibold text-secondary-text mb-1 uppercase">{t('common.userProfile.phoneNumber', { defaultValue: 'Phone number' })}</span>
                          <span className="text-sm font-bold text-primary-text">{phoneNumber || t('common.userProfile.notProvided', { defaultValue: 'Not provided' })}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[11px] font-semibold text-secondary-text mb-1 uppercase">{t('common.userProfile.dateOfBirth', { defaultValue: 'Date of birth' })}</span>
                          <span className="text-sm font-bold text-primary-text">{dateOfBirth || t('common.userProfile.notProvided', { defaultValue: 'Not provided' })}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[11px] font-semibold text-secondary-text mb-1 uppercase">{t('common.userProfile.gender', { defaultValue: 'Gender' })}</span>
                          <span className="text-sm font-bold text-primary-text">{gender || t('common.userProfile.notProvided', { defaultValue: 'Not provided' })}</span>
                        </div>
                      </div>
                      <Button
                        type="button"
                        onClick={() => setIsEditingProfile(true)}
                        variant="outline" className="user-profile__edit-button"
                      >
                        {t('common.userProfile.editProfile', { defaultValue: 'Edit profile' })}
                      </Button>
                    </>
                  )}
                </div>
              ) : (
                <form onSubmit={handleSaveProfile} className="user-profile__panel user-profile__edit-form">
                  {isFetchingInfo ? (
                     <div className="flex justify-center p-4"><Loader2 size={24} className="animate-spin text-accent" /></div>
                  ) : (
                    <>
                    {/* Original account name is informational and never submitted for editing. */}
                    <Input
                      label={t('common.userProfile.fullName', { defaultValue: 'Full name' })}
                      value={fullName}
                      readOnly
                      className="read-only:cursor-default read-only:text-secondary-text"
                    />

                    {/* Display Name */}
                    <Input
                      label={t('common.userProfile.displayName', { defaultValue: 'Display name' })}
                      leftIcon={<User size={16} />}
                      value={displayName}
                      onChange={(e) => {
                        setDisplayName(e.target.value);
                        if (fieldErrors.displayName) setFieldErrors((prev) => ({ ...prev, displayName: undefined }));
                      }}
                      maxLength={100}
                      error={fieldErrors.displayName}
                    />
                    <p className="-mt-2 px-1 text-[11px] text-secondary-text">{t('common.userProfile.displayNameHelper')}</p>

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

                      <DateInput
                        label={t('common.userProfile.dateOfBirth', { defaultValue: 'Date of birth' })}
                        disableFuture
                        value={dateOfBirth}
                        onChange={(e) => {
                          setDateOfBirth(e.target.value);
                          if (fieldErrors.dateOfBirth) setFieldErrors((prev) => ({ ...prev, dateOfBirth: undefined }));
                        }}
                        error={fieldErrors.dateOfBirth}
                      />
                    </div>

                    {/* Gender Selector */}
                    <Select
                      appearance="simple"
                      label={t('common.userProfile.gender', { defaultValue: 'Gender' })}
                      value={gender || undefined}
                      floatingLabel
                      error={fieldErrors.gender}
                      onValueChange={(value) => {
                        setGender(value);
                        if (fieldErrors.gender) setFieldErrors((prev) => ({ ...prev, gender: undefined }));
                      }}
                    >
                      <SelectItem value="Nam">{t('common.genderMale', { defaultValue: 'Nam' })}</SelectItem>
                      <SelectItem value="Nữ">{t('common.genderFemale', { defaultValue: 'Nữ' })}</SelectItem>
                      <SelectItem value="Khác">{t('common.genderOther', { defaultValue: 'Khác' })}</SelectItem>
                    </Select>

                    <div className="flex gap-2 mt-2">
                      <Button
                        type="button"
                        onClick={() => setIsEditingProfile(false)}
                        variant="secondary" className="flex-1"
                      >
                        {t('common.userProfile.cancel', { defaultValue: 'Cancel' })}
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSavingProfile}
                        variant="primary" className="flex-1"
                      >
                        {isSavingProfile ? (
                          <Loader2 size={15} className="animate-spin" />
                        ) : (
                          <Save size={15} />
                        )}
                        <span>{t('common.userProfile.save', { defaultValue: 'Lưu thay đổi' })}</span>
                      </Button>
                    </div>
                    </>
                  )}
                </form>
              )}

              {/* Thông tin chi tiết */}
              <div className="user-profile__metadata">
                <div className="user-profile__metadata-row">
                  <span className="text-secondary-text flex items-center gap-2">
                    <Mail size={14} />
                    <span>{t('common.userProfile.emailLabel', { defaultValue: 'Email:' })}</span>
                  </span>
                  <span className="font-semibold text-primary-text">{user.email}</span>
                </div>

                <div className="user-profile__metadata-row">
                  <span className="text-secondary-text flex items-center gap-2">
                    <ShieldCheck size={14} className="text-accent" />
                    <span>{t('common.userProfile.loginMethod', { defaultValue: 'Phương thức đăng nhập:' })}</span>
                  </span>
                  <span className="font-semibold text-primary-text">{loginMethod}</span>
                </div>

                <div className="user-profile__metadata-row">
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
              className="user-profile__security"
            >
              {!hasLocalLogin ? (
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

                  <Button
                    type="submit"
                    disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                    variant="primary" className="mt-2 w-full"
                  >
                    {isChangingPassword ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <Save size={15} />
                    )}
                    <span>{t('common.userProfile.updatePassword', { defaultValue: 'Cập nhật mật khẩu' })}</span>
                  </Button>
                </form>
              )}
            </motion.div>
          )}

          {/* ───────────────────────────────────────────────────────────────── */}
          {/* Footer Actions                                                    */}
          {/* ───────────────────────────────────────────────────────────────── */}
          <div className="user-profile__footer">
            <Button
              type="button"
              onClick={async () => {
                onClose();
                await onSwitchAccount();
              }}
              variant="secondary"
            >
              <ArrowLeftRight size={14} />
              <span>{t('common.switchAccount')}</span>
            </Button>

            <Button
              type="button"
              onClick={async () => {
                await logout();
                onClose();
                navigate('/');
              }}
              variant="destructive" className="user-profile__logout"
            >
              <LogOut size={14} />
              <span>{t('common.logout')}</span>
            </Button>
          </div>
    </Modal>
  );
};
