import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '@/shared/hooks/useLanguage';
import { authService } from '../services/authService';
import { Input, PasswordInput, DateInput, validateDob } from '@/shared/components/ui';
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher';
import {
  X,
  Lock,
  Mail,
  UserRound,
  Phone,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Register: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Form State
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [gender, setGender] = useState<'Nam' | 'Nữ' | 'Khác'>('Nam');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    fullName?: string;
    phoneNumber?: string;
    dateOfBirth?: string;
    gender?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  // Tự động tắt thông báo lỗi sau 4 giây
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  // Tự động chuyển sang trang đăng nhập sau 2.5 giây khi đăng ký thành công
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => navigate('/'), 2500);
      return () => clearTimeout(timer);
    }
  }, [successMessage, navigate]);

  // Localized DOB messages
  const dobMessages = {
    required: t('common.registerPage.dobValidation.required', { defaultValue: 'Vui lòng nhập ngày sinh.' }),
    format: t('common.registerPage.dobValidation.format', { defaultValue: 'Vui lòng nhập đầy đủ ngày/tháng/năm theo định dạng DD/MM/YYYY (ví dụ: 16/12/2005).' }),
    invalid: t('common.registerPage.dobValidation.invalid', { defaultValue: 'Ngày sinh không hợp lệ.' }),
    invalidMonth: t('common.registerPage.dobValidation.invalidMonth', { defaultValue: 'Tháng sinh không hợp lệ (từ 01 đến 12).' }),
    invalidDay: t('common.registerPage.dobValidation.invalidDay', { defaultValue: 'Ngày sinh không hợp lệ (từ 01 đến 31).' }),
    dayNotExist: (month: number, day: number) => t('common.registerPage.dobValidation.dayNotExist', { month, day, defaultValue: `Tháng ${month} không có ngày ${day}. Vui lòng kiểm tra lại.` }),
    futureDate: t('common.registerPage.dobValidation.futureDate', { defaultValue: 'Ngày sinh không hợp lệ (không được lớn hơn ngày hiện tại).' }),
    minAge: (minAge: number) => t('common.registerPage.dobValidation.minAge', { minAge, defaultValue: `Bạn phải từ đủ ${minAge} tuổi trở lên để đăng ký tài khoản.` }),
    maxAge: (maxAge: number) => t('common.registerPage.dobValidation.maxAge', { maxAge, defaultValue: `Ngày sinh không hợp lệ (độ tuổi vượt quá ${maxAge} tuổi).` }),
  };

  // Kiểm tra độ mạnh mật khẩu (gồm chữ hoa, chữ thường, số, ký tự đặc biệt và độ dài >= 8)
  const passwordStrength = (() => {
    if (!password) return { score: 0, label: '', color: '' };
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    const normalizedScore = Math.min(4, Math.floor((score / 5) * 4) + (score >= 3 ? 1 : 0));
    const map = [
      { label: '', color: '' },
      { label: t('common.userProfile.strengthWeak', { defaultValue: 'Yếu' }), color: 'bg-red-500' },
      { label: t('common.userProfile.strengthMedium', { defaultValue: 'Trung bình' }), color: 'bg-yellow-500' },
      { label: t('common.userProfile.strengthGood', { defaultValue: 'Khá' }), color: 'bg-blue-500' },
      { label: t('common.userProfile.strengthStrong', { defaultValue: 'Mạnh' }), color: 'bg-emerald-500' },
    ];
    return { score: normalizedScore, ...map[normalizedScore] };
  })();

  // Chặn và cảnh báo khi nhập số hoặc ký tự đặc biệt ở ô Họ và Tên
  const handleFullNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return;
    if (!/^[\p{L}\s]$/u.test(e.key)) {
      e.preventDefault();
      setErrorMessage(t('common.registerPage.errors.nameSpecialChars', { defaultValue: 'Họ và tên không được chứa số hoặc ký tự đặc biệt.' }));
    }
  };

  const handleFullNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!/^[\p{L}\s]*$/u.test(val)) {
      setErrorMessage(t('common.registerPage.errors.nameSpecialChars', { defaultValue: 'Họ và tên không được chứa số hoặc ký tự đặc biệt.' }));
      const cleaned = val.replace(/[^\p{L}\s]/gu, '');
      setFullName(cleaned);
      return;
    }
    setFullName(val);
  };

  const handleFullNamePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasteData = e.clipboardData.getData('text');
    if (!/^[\p{L}\s]*$/u.test(pasteData)) {
      e.preventDefault();
      setErrorMessage(t('common.registerPage.errors.nameSpecialChars', { defaultValue: 'Họ và tên không được chứa số hoặc ký tự đặc biệt.' }));
      const cleaned = pasteData.replace(/[^\p{L}\s]/gu, '');
      setFullName((prev) => (prev + cleaned).slice(0, 50));
    }
  };

  // Chặn và cảnh báo khi nhập ký tự không phải chữ số ở ô Số Điện Thoại
  const handlePhoneKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return;
    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault();
      setErrorMessage(t('common.registerPage.errors.phoneDigitsOnly', { defaultValue: 'Số điện thoại chỉ được chứa các chữ số (0-9).' }));
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (/[^0-9]/.test(val)) {
      setErrorMessage(t('common.registerPage.errors.phoneDigitsOnly', { defaultValue: 'Số điện thoại chỉ được chứa các chữ số (0-9).' }));
      const cleaned = val.replace(/[^0-9]/g, '').slice(0, 10);
      setPhoneNumber(cleaned);
      return;
    }
    setPhoneNumber(val.slice(0, 10));
  };

  const handlePhonePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasteData = e.clipboardData.getData('text');
    if (/[^0-9]/.test(pasteData)) {
      e.preventDefault();
      setErrorMessage(t('common.registerPage.errors.phoneDigitsOnly', { defaultValue: 'Số điện thoại chỉ được chứa các chữ số (0-9).' }));
      const cleaned = pasteData.replace(/[^0-9]/g, '').slice(0, 10);
      setPhoneNumber((prev) => (prev + cleaned).slice(0, 10));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const errors: typeof fieldErrors = {};

    // 1. Họ và tên
    const trimmedFullName = fullName.trim();
    if (!trimmedFullName) {
      errors.fullName = t('common.registerPage.errors.nameRequired', { defaultValue: 'Vui lòng nhập họ và tên.' });
    } else if (trimmedFullName.length < 2 || trimmedFullName.length > 50) {
      errors.fullName = t('common.registerPage.errors.nameLength', { defaultValue: 'Họ và tên phải có độ dài từ 2 đến 50 ký tự.' });
    } else if (!/^[\p{L}\s]+$/u.test(trimmedFullName)) {
      errors.fullName = t('common.registerPage.errors.nameSpecialChars', { defaultValue: 'Họ và tên không được chứa số hoặc ký tự đặc biệt.' });
    }

    // 2. Số điện thoại
    const trimmedPhone = phoneNumber.trim().replace(/\s+/g, '');
    if (!trimmedPhone) {
      errors.phoneNumber = t('common.registerPage.errors.phoneRequired', { defaultValue: 'Vui lòng nhập số điện thoại.' });
    } else if (!/^(0[3|5|7|8|9])[0-9]{8}$/.test(trimmedPhone)) {
      errors.phoneNumber = t('common.registerPage.errors.phoneInvalid', { defaultValue: 'Số điện thoại không hợp lệ (10 chữ số bắt đầu bằng 03, 05, 07, 08, 09).' });
    }

    // 3. Ngày sinh (Định dạng DD/MM/YYYY, convert sang YYYY-MM-DD cho API)
    let backendDob = '';
    const dobResult = validateDob(dateOfBirth, 6, 120, dobMessages);
    if (!dobResult.valid) {
      errors.dateOfBirth = dobResult.error;
    } else {
      backendDob = dobResult.backendDate!;
    }

    // 4. Giới tính
    if (!gender || !['Nam', 'Nữ', 'Khác'].includes(gender)) {
      errors.gender = t('common.registerPage.errors.genderRequired', { defaultValue: 'Vui lòng chọn giới tính hợp lệ (Nam, Nữ hoặc Khác).' });
    }

    // 5. Email
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      errors.email = t('common.registerPage.errors.emailRequired', { defaultValue: 'Vui lòng nhập địa chỉ email.' });
    } else if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(trimmedEmail) || trimmedEmail.length > 254) {
      errors.email = t('common.registerPage.errors.emailInvalid', { defaultValue: 'Địa chỉ email phải có định dạng Gmail hợp lệ (ví dụ: example@gmail.com).' });
    }

    // 6. Mật khẩu
    if (!password) {
      errors.password = t('common.registerPage.errors.passwordRequired', { defaultValue: 'Vui lòng nhập mật khẩu.' });
    } else if (password.length < 8 || password.length > 72) {
      errors.password = t('common.registerPage.errors.passwordMinLength', { defaultValue: 'Mật khẩu phải có độ dài tối thiểu từ 8 ký tự trở lên.' });
    } else if (!/[a-z]/.test(password)) {
      errors.password = t('common.registerPage.errors.passwordLower', { defaultValue: 'Mật khẩu phải chứa ít nhất 1 chữ thường.' });
    } else if (!/[A-Z]/.test(password)) {
      errors.password = t('common.registerPage.errors.passwordUpper', { defaultValue: 'Mật khẩu phải chứa ít nhất 1 chữ in hoa.' });
    } else if (!/[0-9]/.test(password)) {
      errors.password = t('common.registerPage.errors.passwordNumber', { defaultValue: 'Mật khẩu phải chứa ít nhất 1 chữ số.' });
    } else if (!/[^A-Za-z0-9]/.test(password)) {
      errors.password = t('common.registerPage.errors.passwordSpecial', { defaultValue: 'Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt (ví dụ: @, #, $, !...).' });
    }

    // 7. Xác nhận mật khẩu
    if (!confirmPassword) {
      errors.confirmPassword = t('common.registerPage.errors.confirmPasswordRequired', { defaultValue: 'Vui lòng nhập lại mật khẩu xác nhận.' });
    } else if (password !== confirmPassword) {
      errors.confirmPassword = t('common.registerPage.errors.confirmPasswordMismatch', { defaultValue: 'Mật khẩu xác nhận phải khớp hoàn toàn với trường mật khẩu.' });
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setErrorMessage(Object.values(errors)[0] || t('common.registerPage.errors.checkInputs', { defaultValue: 'Vui lòng kiểm tra lại thông tin nhập.' }));
      return;
    }

    setFieldErrors({});
    setIsLoading(true);

    try {
      await authService.register({
        fullName: trimmedFullName,
        phoneNumber: trimmedPhone,
        gender,
        dateOfBirth: backendDob,
        email: trimmedEmail,
        password,
        confirmPassword,
      });

      setSuccessMessage(t('common.registerPage.errors.registerSuccess', { defaultValue: 'Đăng ký tài khoản thành công! Đang chuyển đến trang đăng nhập...' }));
    } catch (err: any) {
      setErrorMessage(err.message || t('common.registerPage.errors.registerFailed', { defaultValue: 'Đăng ký thất bại. Vui lòng thử lại.' }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary-bg flex items-center justify-center p-4 py-8 relative overflow-hidden">
      {/* Background decorative blobs */}
      <div className="absolute top-0 left-0 w-80 h-80 bg-accent/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />

      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', duration: 0.3 }}
        className="relative w-full max-w-xl bg-secondary-bg border border-custom-border p-8 rounded-3xl shadow-2xl z-10 font-sans text-primary-text"
      >
        {/* Top bar with Language Switcher and Close button */}
        <div className="absolute top-5 right-5 flex items-center gap-3">
          <LanguageSwitcher />
          <button
            onClick={() => navigate('/')}
            className="text-secondary-text hover:text-primary-text p-1.5 rounded-full hover:bg-primary-bg transition-colors cursor-pointer"
            aria-label={t('common.registerPage.backHome', { defaultValue: 'Quay về trang chủ' })}
          >
            <X size={20} />
          </button>
        </div>

        {/* Header matching LoginModal */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-accent/15 text-accent flex items-center justify-center mx-auto mb-3">
            <ShieldCheck size={28} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-primary-text">
            {t('common.registerPage.title', { defaultValue: 'Đăng Ký' })}
          </h2>
          <p className="text-xs text-secondary-text">
            {t('common.registerPage.subtitle', { defaultValue: 'Nhập thông tin tài khoản của bạn để đăng ký.' })}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Error Banner */}
          <AnimatePresence>
            {errorMessage && (
              <motion.div
                layout
                initial={{ opacity: 0, height: 0, scale: 0.96 }}
                animate={{ opacity: 1, height: 'auto', scale: 1 }}
                exit={{ opacity: 0, height: 0, scale: 0.96 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs mb-1">
                  <AlertCircle size={16} className="shrink-0" />
                  <span className="flex-1 leading-snug font-medium">{errorMessage}</span>
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
                className="overflow-hidden"
              >
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs mb-1">
                  <CheckCircle2 size={16} className="shrink-0" />
                  <span className="flex-1 leading-snug font-medium">{successMessage}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Row 1: Họ và tên & Số điện thoại */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Họ và Tên */}
            <Input
              label={t('common.registerPage.fullName', { defaultValue: 'Họ và tên' })}
              leftIcon={<UserRound size={18} />}
              type="text"
              name="fullName"
              autoComplete="name"
              maxLength={50}
              value={fullName}
              onKeyDown={handleFullNameKeyDown}
              onChange={(e) => {
                handleFullNameChange(e);
                if (fieldErrors.fullName) setFieldErrors((prev) => ({ ...prev, fullName: undefined }));
              }}
              onPaste={handleFullNamePaste}
              error={fieldErrors.fullName}
            />

            {/* Số điện thoại */}
            <Input
              label={t('common.registerPage.phoneNumber', { defaultValue: 'Số điện thoại' })}
              leftIcon={<Phone size={18} />}
              type="tel"
              name="phoneNumber"
              autoComplete="tel"
              maxLength={10}
              value={phoneNumber}
              onKeyDown={handlePhoneKeyDown}
              onChange={(e) => {
                handlePhoneChange(e);
                if (fieldErrors.phoneNumber) setFieldErrors((prev) => ({ ...prev, phoneNumber: undefined }));
              }}
              onPaste={handlePhonePaste}
              error={fieldErrors.phoneNumber}
            />
          </div>

          {/* Row 2: Ngày sinh & Giới tính */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Ngày sinh */}
            <DateInput
              label={t('common.registerPage.dateOfBirth', { defaultValue: 'Ngày sinh' })}
              name="dateOfBirth"
              value={dateOfBirth}
              onChange={(e) => {
                setDateOfBirth(e.target.value);
                if (fieldErrors.dateOfBirth) setFieldErrors((prev) => ({ ...prev, dateOfBirth: undefined }));
              }}
              error={fieldErrors.dateOfBirth}
            />

            {/* Giới tính - Pill Segmented Switch */}
            <div className="flex flex-col">
              <div className="grid grid-cols-3 gap-1.5 bg-primary-bg p-1.5 rounded-2xl border border-custom-border min-h-[56px] items-center">
                {([
                  { val: 'Nam', label: t('common.registerPage.genderNam', { defaultValue: 'Nam' }) },
                  { val: 'Nữ', label: t('common.registerPage.genderNu', { defaultValue: 'Nữ' }) },
                  { val: 'Khác', label: t('common.registerPage.genderKhac', { defaultValue: 'Khác' }) },
                ] as const).map((opt) => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => {
                      setGender(opt.val as 'Nam' | 'Nữ' | 'Khác');
                      if (fieldErrors.gender) setFieldErrors((prev) => ({ ...prev, gender: undefined }));
                    }}
                    className={`h-[42px] text-xs font-medium rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
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
              {fieldErrors.gender && (
                <div className="flex items-center gap-1 mt-1.5 ml-1 text-xs text-error">
                  <AlertCircle size={13} />
                  <span>{fieldErrors.gender}</span>
                </div>
              )}
            </div>
          </div>

          {/* Row 3: Email (Full Width) */}
          <Input
            label={t('common.email', { defaultValue: 'Email' })}
            leftIcon={<Mail size={18} />}
            type="email"
            name="email"
            autoComplete="email"
            maxLength={254}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
            }}
            error={fieldErrors.email}
          />

          {/* Row 4: Mật khẩu & Xác nhận mật khẩu */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Mật khẩu */}
            <div>
              <PasswordInput
                label={t('common.password', { defaultValue: 'Mật khẩu' })}
                leftIcon={<Lock size={18} />}
                name="password"
                autoComplete="new-password"
                maxLength={72}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
                }}
                onCopy={(e) => {
                  e.preventDefault();
                  setErrorMessage(t('common.registerPage.errors.copyPasswordBlocked', { defaultValue: 'Không được phép sao chép mật khẩu vì lý do an toàn bảo mật.' }));
                }}
                onCut={(e) => {
                  e.preventDefault();
                }}
                error={fieldErrors.password}
              />

              {/* Password Strength Bar */}
              {password.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((bar) => (
                      <div
                        key={bar}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          passwordStrength.score >= bar
                            ? passwordStrength.color
                            : 'bg-custom-border'
                        }`}
                      />
                    ))}
                  </div>
                  {passwordStrength.label && (
                    <p className="text-xs text-secondary-text">
                      {t('common.registerPage.passwordStrength', { defaultValue: 'Độ mạnh mật khẩu:' })}{' '}
                      <span
                        className={
                          passwordStrength.score <= 1
                            ? 'text-red-400'
                            : passwordStrength.score <= 2
                            ? 'text-yellow-400'
                            : passwordStrength.score <= 3
                            ? 'text-blue-400'
                            : 'text-emerald-400'
                        }
                      >
                        {passwordStrength.label}
                      </span>
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Nhập Lại Mật Khẩu */}
            <div>
              <PasswordInput
                label={t('common.registerPage.confirmPassword', { defaultValue: 'Nhập lại mật khẩu' })}
                leftIcon={<Lock size={18} />}
                name="confirmPassword"
                autoComplete="new-password"
                maxLength={72}
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

              {/* Match indicator */}
              {confirmPassword.length > 0 && (
                <p
                  className={`text-xs mt-1.5 ml-1 ${
                    confirmPassword === password ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {confirmPassword === password
                    ? t('common.registerPage.passwordMatch', { defaultValue: '✓ Mật khẩu khớp' })
                    : t('common.registerPage.passwordNotMatch', { defaultValue: '✗ Mật khẩu chưa khớp' })}
                </p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !!successMessage}
            className="w-full py-3.5 px-4 bg-accent hover:opacity-90 text-primary-bg font-semibold text-sm rounded-xl transition-all shadow-lg cursor-pointer disabled:opacity-50 mt-2"
          >
            {isLoading
              ? t('common.registerPage.submitting', { defaultValue: 'Đang xử lý...' })
              : t('common.registerPage.submit', { defaultValue: 'Đăng Ký' })}
          </button>

          {/* Link sang Login */}
          <p className="text-center text-xs text-secondary-text pt-1">
            {t('common.registerPage.alreadyHaveAccount', { defaultValue: 'Đã có tài khoản?' })}{' '}
            <Link
              to="/"
              className="text-accent hover:underline font-semibold cursor-pointer"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('ui:openLogin'));
              }}
            >
              {t('common.registerPage.loginNow', { defaultValue: 'Đăng nhập ngay' })}
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
};
