import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';
import { authService } from '../services/authService';
import {
  X,
  Lock,
  Mail,
  Eye,
  EyeOff,
  UserRound,
  Phone,
  Calendar,
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Giới hạn ngày sinh: Từ 6 tuổi đến 120 tuổi
  const today = new Date();
  const maxDateObj = new Date(today.getFullYear() - 6, today.getMonth(), today.getDate());
  const minDateObj = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate());
  const maxBirthDate = maxDateObj.toISOString().split('T')[0];
  const minBirthDate = minDateObj.toISOString().split('T')[0];

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
      { label: 'Yếu', color: 'bg-red-500' },
      { label: 'Trung bình', color: 'bg-yellow-500' },
      { label: 'Khá', color: 'bg-blue-500' },
      { label: 'Mạnh', color: 'bg-emerald-500' },
    ];
    return { score: normalizedScore, ...map[normalizedScore] };
  })();

  // Chặn và cảnh báo khi nhập số hoặc ký tự đặc biệt ở ô Họ và Tên
  const handleFullNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return;
    if (!/^[\p{L}\s]$/u.test(e.key)) {
      e.preventDefault();
      setErrorMessage('Họ và tên không được chứa số hoặc ký tự đặc biệt.');
    }
  };

  const handleFullNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!/^[\p{L}\s]*$/u.test(val)) {
      setErrorMessage('Họ và tên không được chứa số hoặc ký tự đặc biệt.');
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
      setErrorMessage('Họ và tên không được chứa số hoặc ký tự đặc biệt.');
      const cleaned = pasteData.replace(/[^\p{L}\s]/gu, '');
      setFullName((prev) => (prev + cleaned).slice(0, 50));
    }
  };

  // Chặn và cảnh báo khi nhập ký tự không phải chữ số ở ô Số Điện Thoại
  const handlePhoneKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return;
    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault();
      setErrorMessage('Số điện thoại chỉ được chứa các chữ số (0-9).');
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (/[^0-9]/.test(val)) {
      setErrorMessage('Số điện thoại chỉ được chứa các chữ số (0-9).');
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
      setErrorMessage('Số điện thoại chỉ được chứa các chữ số (0-9).');
      const cleaned = pasteData.replace(/[^0-9]/g, '').slice(0, 10);
      setPhoneNumber((prev) => (prev + cleaned).slice(0, 10));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // ─────────────────────────────────────────────────────────────
    // 1. Validation Họ và tên (Bắt buộc, 2 - 50 ký tự, không chứa số / ký tự đặc biệt)
    // ─────────────────────────────────────────────────────────────
    const trimmedFullName = fullName.trim();
    if (!trimmedFullName) {
      setErrorMessage('Vui lòng nhập họ và tên.');
      return;
    }
    if (trimmedFullName.length < 2 || trimmedFullName.length > 50) {
      setErrorMessage('Họ và tên phải có độ dài từ 2 đến 50 ký tự.');
      return;
    }
    const nameRegex = /^[\p{L}\s]+$/u;
    if (!nameRegex.test(trimmedFullName)) {
      setErrorMessage('Họ và tên không được chứa số hoặc ký tự đặc biệt.');
      return;
    }

    // ─────────────────────────────────────────────────────────────
    // 2. Validation Số điện thoại (Bắt buộc, 10 số, chuẩn đầu số VN: 03, 05, 07, 08, 09)
    // ─────────────────────────────────────────────────────────────
    const trimmedPhone = phoneNumber.trim().replace(/\s+/g, '');
    if (!trimmedPhone) {
      setErrorMessage('Vui lòng nhập số điện thoại.');
      return;
    }
    const phoneRegex = /^(0[3|5|7|8|9])[0-9]{8}$/;
    if (!phoneRegex.test(trimmedPhone)) {
      setErrorMessage('Số điện thoại không hợp lệ (Phải gồm 10 chữ số bắt đầu bằng 03, 05, 07, 08, 09).');
      return;
    }

    // ─────────────────────────────────────────────────────────────
    // 3. Validation Ngày sinh (Bắt buộc, từ 6 đến 120 tuổi)
    // ─────────────────────────────────────────────────────────────
    if (!dateOfBirth) {
      setErrorMessage('Vui lòng chọn ngày sinh.');
      return;
    }
    const birthDate = new Date(dateOfBirth);
    if (isNaN(birthDate.getTime())) {
      setErrorMessage('Ngày sinh không hợp lệ.');
      return;
    }
    if (birthDate > today) {
      setErrorMessage('Ngày sinh không hợp lệ (không được lớn hơn ngày hiện tại).');
      return;
    }

    // Tính tuổi
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    if (age < 6) {
      setErrorMessage('Bạn phải từ đủ 6 tuổi trở lên để đăng ký tài khoản.');
      return;
    }
    if (age > 120) {
      setErrorMessage('Ngày sinh không hợp lệ (độ tuổi vượt quá 120 tuổi).');
      return;
    }

    // ─────────────────────────────────────────────────────────────
    // 4. Validation Giới tính (Bắt buộc)
    // ─────────────────────────────────────────────────────────────
    if (!gender || !['Nam', 'Nữ', 'Khác'].includes(gender)) {
      setErrorMessage('Vui lòng chọn giới tính hợp lệ (Nam, Nữ hoặc Khác).');
      return;
    }

    // ─────────────────────────────────────────────────────────────
    // 5. Validation Email (Bắt buộc, đúng định dạng Gmail @gmail.com)
    // ─────────────────────────────────────────────────────────────
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setErrorMessage('Vui lòng nhập địa chỉ email.');
      return;
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!emailRegex.test(trimmedEmail) || trimmedEmail.length > 254) {
      setErrorMessage('Địa chỉ email phải có định dạng Gmail hợp lệ (ví dụ: example@gmail.com).');
      return;
    }

    // ─────────────────────────────────────────────────────────────
    // 6. Validation Mật khẩu (Bắt buộc, >= 8 ký tự, đủ chữ hoa, thường, số, ký tự đặc biệt)
    // ─────────────────────────────────────────────────────────────
    if (!password) {
      setErrorMessage('Vui lòng nhập mật khẩu.');
      return;
    }
    if (password.length < 8 || password.length > 72) {
      setErrorMessage('Mật khẩu phải có độ dài tối thiểu từ 8 ký tự trở lên.');
      return;
    }
    if (!/[a-z]/.test(password)) {
      setErrorMessage('Mật khẩu phải chứa ít nhất 1 chữ thường.');
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setErrorMessage('Mật khẩu phải chứa ít nhất 1 chữ in hoa.');
      return;
    }
    if (!/[0-9]/.test(password)) {
      setErrorMessage('Mật khẩu phải chứa ít nhất 1 chữ số.');
      return;
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      setErrorMessage('Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt (ví dụ: @, #, $, !...).');
      return;
    }

    // ─────────────────────────────────────────────────────────────
    // 7. Validation Xác nhận mật khẩu (Khớp hoàn toàn, không copy paste)
    // ─────────────────────────────────────────────────────────────
    if (!confirmPassword) {
      setErrorMessage('Vui lòng nhập lại mật khẩu xác nhận.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận phải khớp hoàn toàn với trường mật khẩu.');
      return;
    }

    setIsLoading(true);

    try {
      await authService.register({
        fullName: trimmedFullName,
        phoneNumber: trimmedPhone,
        gender,
        dateOfBirth,
        email: trimmedEmail,
        password,
        confirmPassword,
      });

      setSuccessMessage('Đăng ký tài khoản thành công! Đang chuyển đến trang đăng nhập...');
    } catch (err: any) {
      setErrorMessage(err.message || 'Đăng ký thất bại. Vui lòng thử lại.');
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
        {/* Close / Back button */}
        <button
          onClick={() => navigate('/')}
          className="absolute top-5 right-5 text-secondary-text hover:text-primary-text p-1.5 rounded-full hover:bg-primary-bg transition-colors cursor-pointer"
          aria-label="Quay về trang chủ"
        >
          <X size={20} />
        </button>

        {/* Header matching LoginModal */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-accent/15 text-accent flex items-center justify-center mx-auto mb-3">
            <ShieldCheck size={28} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-primary-text">Đăng Ký</h2>
          <p className="text-xs text-secondary-text">Nhập thông tin tài khoản của bạn để đăng ký.</p>
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
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-secondary-text mb-2">
                HỌ VÀ TÊN
              </label>
              <div className="relative">
                <UserRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary-text" size={18} />
                <input
                  type="text"
                  name="fullName"
                  autoComplete="name"
                  maxLength={50}
                  value={fullName}
                  onKeyDown={handleFullNameKeyDown}
                  onChange={handleFullNameChange}
                  onPaste={handleFullNamePaste}
                  className="w-full bg-primary-bg border border-custom-border focus:border-accent rounded-xl pl-11 pr-4 py-3 text-sm text-primary-text outline-none transition-all"
                />
              </div>
            </div>

            {/* Số điện thoại */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-secondary-text mb-2">
                SỐ ĐIỆN THOẠI
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary-text" size={18} />
                <input
                  type="tel"
                  name="phoneNumber"
                  autoComplete="tel"
                  maxLength={10}
                  value={phoneNumber}
                  onKeyDown={handlePhoneKeyDown}
                  onChange={handlePhoneChange}
                  onPaste={handlePhonePaste}
                  className="w-full bg-primary-bg border border-custom-border focus:border-accent rounded-xl pl-11 pr-4 py-3 text-sm text-primary-text outline-none transition-all font-mono"
                />
              </div>
            </div>
          </div>

          {/* Row 2: Ngày sinh & Giới tính */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Ngày sinh */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-secondary-text mb-2">
                NGÀY SINH
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary-text pointer-events-none" size={18} />
                <input
                  type="date"
                  name="dateOfBirth"
                  max={maxBirthDate}
                  min={minBirthDate}
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full bg-primary-bg border border-custom-border focus:border-accent rounded-xl pl-11 pr-4 py-3 text-sm text-primary-text outline-none transition-all [color-scheme:dark]"
                />
              </div>
            </div>

            {/* Giới tính - Pill Segmented Switch */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-secondary-text mb-2">
                GIỚI TÍNH
              </label>
              <div className="grid grid-cols-3 gap-1.5 bg-primary-bg p-1.5 rounded-xl border border-custom-border h-[46px] items-center">
                {(['Nam', 'Nữ', 'Khác'] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setGender(opt)}
                    className={`h-full text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      gender === opt
                        ? 'bg-accent text-primary-bg font-semibold shadow-sm'
                        : 'text-secondary-text hover:text-primary-text hover:bg-secondary-bg'
                    }`}
                  >
                    {gender === opt && <Check size={13} className="stroke-[3]" />}
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Row 3: Email (Full Width) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-secondary-text mb-2">
              {t('common.email', { defaultValue: 'EMAIL' })}
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary-text" size={18} />
              <input
                type="email"
                name="email"
                autoComplete="email"
                maxLength={254}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-primary-bg border border-custom-border focus:border-accent rounded-xl pl-11 pr-4 py-3 text-sm text-primary-text outline-none transition-all"
              />
            </div>
          </div>

          {/* Row 4: Mật khẩu & Xác nhận mật khẩu */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Mật khẩu */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-secondary-text mb-2">
                {t('common.password', { defaultValue: 'MẬT KHẨU' })}
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary-text" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="new-password"
                  maxLength={72}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onCopy={(e) => {
                    e.preventDefault();
                    setErrorMessage('Không được phép sao chép mật khẩu vì lý do an toàn bảo mật.');
                  }}
                  onCut={(e) => {
                    e.preventDefault();
                  }}
                  className="w-full bg-primary-bg border border-custom-border focus:border-accent rounded-xl pl-11 pr-11 py-3 text-sm text-primary-text outline-none transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-secondary-text hover:text-primary-text p-1 cursor-pointer"
                  title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

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
                      Độ mạnh mật khẩu:{' '}
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
              <label className="block text-xs font-semibold uppercase tracking-wider text-secondary-text mb-2">
                NHẬP LẠI MẬT KHẨU
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary-text" size={18} />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  autoComplete="new-password"
                  maxLength={72}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onPaste={(e) => {
                    e.preventDefault();
                    setErrorMessage('Không được phép dán (paste). Vui lòng tự nhập lại mật khẩu để xác nhận.');
                  }}
                  onCopy={(e) => {
                    e.preventDefault();
                  }}
                  onCut={(e) => {
                    e.preventDefault();
                  }}
                  className={`w-full bg-primary-bg border rounded-xl pl-11 pr-11 py-3 text-sm text-primary-text outline-none transition-all font-mono ${
                    confirmPassword.length > 0
                      ? confirmPassword === password
                        ? 'border-emerald-500/60 focus:border-emerald-500'
                        : 'border-red-500/60 focus:border-red-500'
                      : 'border-custom-border focus:border-accent'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-secondary-text hover:text-primary-text p-1 cursor-pointer"
                  title={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Match indicator */}
              {confirmPassword.length > 0 && (
                <p
                  className={`text-xs mt-1 ${
                    confirmPassword === password ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {confirmPassword === password ? '✓ Mật khẩu khớp' : '✗ Mật khẩu chưa khớp'}
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
            {isLoading ? 'Đang xử lý...' : 'Đăng Ký'}
          </button>

          {/* Link sang Login */}
          <p className="text-center text-xs text-secondary-text pt-1">
            Đã có tài khoản?{' '}
            <Link
              to="/"
              className="text-accent hover:underline font-semibold cursor-pointer"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('ui:openLogin'));
              }}
            >
              Đăng nhập ngay
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
};
