import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';
import { authService } from '../services/authService';
import { X, Lock, Mail, Eye, EyeOff, UserRound, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Register: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Tự động tắt thông báo lỗi sau 3 giây
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(null), 3000);
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

  // Kiểm tra độ mạnh mật khẩu
  const passwordStrength = (() => {
    if (!password) return { score: 0, label: '', color: '' };
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    const map = [
      { label: '', color: '' },
      { label: 'Yếu', color: 'bg-red-500' },
      { label: 'Trung bình', color: 'bg-yellow-500' },
      { label: 'Khá', color: 'bg-blue-500' },
      { label: 'Mạnh', color: 'bg-emerald-500' },
    ];
    return { score, ...map[score] };
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // --- Validation phía Client ---
    const trimmedFullName = fullName.trim();
    if (!trimmedFullName || trimmedFullName.length < 2) {
      setErrorMessage('Vui lòng nhập họ và tên (ít nhất 2 ký tự).');
      return;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage('Vui lòng nhập địa chỉ email.');
      return;
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmedEmail) || trimmedEmail.length > 254) {
      setErrorMessage('Email không đúng định dạng. Vui lòng kiểm tra lại.');
      return;
    }

    if (!password) {
      setErrorMessage('Vui lòng nhập mật khẩu.');
      return;
    }
    if (password.length < 8 || password.length > 72) {
      setErrorMessage('Mật khẩu phải có độ dài từ 8 đến 72 ký tự.');
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setErrorMessage('Mật khẩu phải có ít nhất 1 chữ hoa.');
      return;
    }
    if (!/[0-9]/.test(password)) {
      setErrorMessage('Mật khẩu phải có ít nhất 1 chữ số.');
      return;
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      setErrorMessage('Mật khẩu phải có ít nhất 1 ký tự đặc biệt (vd: @, #, !).');
      return;
    }

    if (!confirmPassword) {
      setErrorMessage('Vui lòng nhập lại mật khẩu.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Mật khẩu nhập lại không khớp. Vui lòng kiểm tra lại.');
      return;
    }

    setIsLoading(true);

    try {
      await authService.register({
        fullName: trimmedFullName,
        email: trimmedEmail.toLowerCase(),
        password,
        confirmPassword,
      });

      setSuccessMessage('Đăng ký thành công! Đang chuyển đến trang đăng nhập...');
    } catch (err: any) {
      setErrorMessage(err.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative blobs */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-accent/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />

      <motion.div
        layout
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', duration: 0.45 }}
        className="relative w-full max-w-md bg-secondary-bg border border-custom-border p-8 rounded-3xl shadow-2xl z-10 font-sans text-primary-text"
      >
        {/* Close / Back button */}
        <button
          onClick={() => navigate('/')}
          className="absolute top-5 right-5 text-secondary-text hover:text-primary-text p-1.5 rounded-full hover:bg-primary-bg transition-colors cursor-pointer"
          aria-label="Quay về trang chủ"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-accent/15 text-accent flex items-center justify-center mx-auto mb-3">
            <ShieldCheck size={28} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-primary-text">Đăng Ký</h2>
          <p className="text-xs text-secondary-text">Tạo tài khoản mới để tiếp tục.</p>
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
                  <span className="flex-1 leading-snug">{errorMessage}</span>
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
                  <span className="flex-1 leading-snug">{successMessage}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-secondary-text mb-2">
              Họ và Tên
            </label>
            <div className="relative">
              <UserRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary-text" size={18} />
              <input
                type="text"
                name="fullName"
                autoComplete="name"
                maxLength={100}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-primary-bg border border-custom-border focus:border-accent rounded-xl pl-11 pr-4 py-3 text-sm text-primary-text outline-none transition-all"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-secondary-text mb-2">
              {t('common.email', { defaultValue: 'Email' })}
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

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-secondary-text mb-2">
              {t('common.password', { defaultValue: 'Mật Khẩu' })}
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

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-secondary-text mb-2">
              Nhập Lại Mật Khẩu
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

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading || !!successMessage}
            className="w-full py-3.5 px-4 bg-accent hover:opacity-90 text-primary-bg font-semibold text-sm rounded-xl transition-all shadow-lg cursor-pointer disabled:opacity-50 mt-2"
          >
            {isLoading ? 'Đang xử lý...' : 'Tạo Tài Khoản'}
          </button>

          {/* Link sang Login */}
          <p className="text-center text-xs text-secondary-text pt-1">
            Đã có tài khoản?{' '}
            <Link
              to="/"
              className="text-accent hover:underline font-semibold cursor-pointer"
              onClick={() => {
                // Trigger mở LoginModal qua custom event
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
