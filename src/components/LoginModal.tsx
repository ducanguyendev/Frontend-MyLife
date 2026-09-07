import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { X, Lock, Mail, Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Tự động tắt thông báo lỗi sau đúng 3 giây
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        setErrorMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  // Lắng nghe sự kiện hết hạn phiên (Refresh Token > 2 phút hoặc bị thu hồi)
  useEffect(() => {
    const handleExpired = () => {
      setErrorMessage(t('common.errors.sessionExpired', { defaultValue: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.' }));
    };

    window.addEventListener('auth:expired', handleExpired);
    return () => window.removeEventListener('auth:expired', handleExpired);
  }, [t]);

  // Khi mở/đóng Modal: Nạp email và mật khẩu đã ghi nhớ (nếu có)
  useEffect(() => {
    if (isOpen) {
      const remembered = authService.getRemembered();
      if (remembered.rememberMe && remembered.email) {
        setEmail(remembered.email);
        setPassword(remembered.password);
        setRememberMe(true);
      } else {
        setEmail('');
        setPassword('');
        setRememberMe(false);
      }
    } else {
      setErrorMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getLocalizedErrorMessage = (rawError: string): string => {
    const lower = rawError.toLowerCase();
    if (lower.includes('chính xác') || lower.includes('credentials') || lower.includes('invalid') || lower.includes('401')) {
      return t('common.errors.invalidCredentials', { defaultValue: 'Email hoặc mật khẩu không chính xác.' });
    }
    if (lower.includes('khóa') || lower.includes('lock')) {
      return t('common.errors.accountLocked', { defaultValue: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.' });
    }
    if (lower.includes('8') && lower.includes('72')) {
      return t('common.errors.passwordLength', { defaultValue: 'Mật khẩu phải có độ dài từ 8 đến 72 ký tự.' });
    }
    if (lower.includes('kết nối') || lower.includes('failed to fetch') || lower.includes('500') || lower.includes('502')) {
      return t('common.errors.connectionError', { defaultValue: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại!' });
    }
    if (lower.includes('hết hạn') || lower.includes('expired')) {
      return t('common.errors.sessionExpired', { defaultValue: 'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.' });
    }
    return rawError || t('common.errors.defaultError', { defaultValue: 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // 1. Kiểm tra Email rỗng
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage(t('common.errors.emailRequired', { defaultValue: 'Vui lòng nhập địa chỉ email.' }));
      return;
    }

    // 2. Kiểm tra định dạng Email hợp lệ
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmedEmail) || trimmedEmail.length > 254) {
      setErrorMessage(t('common.errors.invalidEmailFormat', { defaultValue: 'Email không đúng định dạng. Vui lòng kiểm tra lại.' }));
      return;
    }

    // 3. Kiểm tra Mật khẩu rỗng
    if (!password) {
      setErrorMessage(t('common.errors.passwordRequired', { defaultValue: 'Vui lòng nhập mật khẩu.' }));
      return;
    }

    // 4. Ràng buộc kiểm tra mật khẩu (8 - 72 ký tự, không trim)
    if (password.length < 8 || password.length > 72) {
      setErrorMessage(t('common.errors.passwordLength', { defaultValue: 'Mật khẩu phải có độ dài từ 8 đến 72 ký tự.' }));
      return;
    }

    setIsLoading(true);

    try {
      await login({
        email: trimmedEmail.toLowerCase(),
        password,
        rememberMe,
      });

      onClose();
      navigate('/Home');
    } catch (err: any) {
      const errorMsg = getLocalizedErrorMessage(err.message || '');
      setErrorMessage(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMessage(null);
    setIsGoogleLoading(true);

    try {
      const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

      if (googleClientId && !googleClientId.startsWith('YOUR_GOOGLE_CLIENT_ID')) {
        const redirectUri = window.location.origin;
        const scope = 'openid email profile';
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
          googleClientId
        )}&redirect_uri=${encodeURIComponent(
          redirectUri
        )}&response_type=code&scope=${encodeURIComponent(
          scope
        )}&access_type=offline&prompt=select_account`;

        const width = 500;
        const height = 600;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        const popup = window.open(
          authUrl,
          'google_oauth',
          `width=${width},height=${height},left=${left},top=${top}`
        );

        if (!popup) {
          throw new Error('Không thể mở popup Google. Vui lòng cho phép mở popup trên trình duyệt.');
        }

        const checkPopup = setInterval(async () => {
          try {
            if (!popup || popup.closed) {
              clearInterval(checkPopup);
              setIsGoogleLoading(false);
              return;
            }

            if (popup.location.href.includes('code=')) {
              const urlParams = new URLSearchParams(popup.location.search);
              const code = urlParams.get('code');
              popup.close();
              clearInterval(checkPopup);

              if (code) {
                await loginWithGoogle(code, redirectUri);
                onClose();
                navigate('/Home');
              }
            }
          } catch {
            // Bỏ qua Cross-Origin khi popup đang ở Google
          }
        }, 500);
      } else {
        // Nhập địa chỉ Gmail để đăng nhập chính xác tài khoản của bạn:
        const inputGmail = window.prompt(
          'Nhập địa chỉ Gmail của bạn để tiếp tục đăng nhập với Google:',
          ''
        );

        if (!inputGmail || !inputGmail.trim()) {
          setIsGoogleLoading(false);
          return;
        }

        const normalizedGmail = inputGmail.trim().toLowerCase();
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(normalizedGmail)) {
          throw new Error('Địa chỉ Email không đúng định dạng. Vui lòng nhập đúng địa chỉ Gmail.');
        }

        await loginWithGoogle(normalizedGmail);
        onClose();
        navigate('/Home');
      }
    } catch (err: any) {
      const errorMsg = getLocalizedErrorMessage(err.message || t('common.errors.googleLoginFailed', { defaultValue: 'Đăng nhập bằng Google thất bại.' }));
      setErrorMessage(errorMsg);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm cursor-pointer"
        />

        {/* Modal Popup Card */}
        <motion.div
          layout
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', duration: 0.3 }}
          className="relative w-full max-w-md bg-secondary-bg border border-custom-border p-8 rounded-3xl shadow-2xl z-10 font-sans text-primary-text"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-secondary-text hover:text-primary-text p-1.5 rounded-full hover:bg-primary-bg transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={20} />
          </button>

          {/* Modal Header */}
          <div className="text-center space-y-2 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-accent/15 text-accent flex items-center justify-center mx-auto mb-3">
              <ShieldCheck size={28} />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-primary-text">
              {t('common.login', { defaultValue: 'Đăng Nhập' })}
            </h2>
            <p className="text-xs text-secondary-text">
              {t('common.loginDesc', { defaultValue: 'Nhập thông tin tài khoản của bạn để tiếp tục.' })}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
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

            {/* Email Input */}
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

            {/* Password Input */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-secondary-text mb-2">
                {t('common.password', { defaultValue: 'Mật Khẩu' })}
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary-text" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
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
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-custom-border text-accent focus:ring-accent accent-accent cursor-pointer"
                />
                <span className="text-xs text-secondary-text">
                  {t('common.rememberMe', { defaultValue: 'Nhớ mật khẩu' })}
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || isGoogleLoading}
              className="w-full py-3.5 px-4 bg-accent hover:opacity-90 text-primary-bg font-semibold text-sm rounded-xl transition-all shadow-lg cursor-pointer disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <span>{t('common.loading', { defaultValue: 'Đang xử lý...' })}</span>
              ) : (
                <span>{t('common.login', { defaultValue: 'Đăng Nhập' })}</span>
              )}
            </button>

            {/* Divider Line */}
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-custom-border/60"></div>
              <span className="flex-shrink mx-4 text-xs font-medium text-secondary-text/80 tracking-wide">
                {t('common.orLoginWith', { defaultValue: 'hoặc đăng nhập bằng' })}
              </span>
              <div className="flex-grow border-t border-custom-border/60"></div>
            </div>

            {/* Google Login Button */}
            <div className="flex items-center justify-center">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading || isGoogleLoading}
                title={t('common.loginWithGoogle', { defaultValue: 'Đăng nhập với Google' })}
                className="w-full py-3 px-4 rounded-xl border border-custom-border bg-primary-bg/80 hover:bg-primary-bg hover:border-accent/40 text-primary-text font-medium text-sm transition-all duration-200 flex items-center justify-center gap-3 shadow-sm hover:shadow-md cursor-pointer disabled:opacity-50 group"
              >
                {isGoogleLoading ? (
                  <span>{t('common.loading', { defaultValue: 'Đang kết nối Google...' })}</span>
                ) : (
                  <>
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span className="text-xs font-semibold tracking-wide group-hover:text-accent transition-colors">
                      {t('common.loginWithGoogle', { defaultValue: 'Đăng nhập với Google' })}
                    </span>
                  </>
                )}
              </button>
            </div>

            {/* Register Link */}
            <p className="text-center text-xs text-secondary-text pt-1">
              {t('common.noAccount', { defaultValue: 'Chưa có tài khoản?' })}{' '}
              <a
                href="/Register"
                className="text-accent hover:underline font-semibold cursor-pointer"
                onClick={(e) => { e.preventDefault(); onClose(); navigate('/Register'); }}
              >
                {t('common.register', { defaultValue: 'Đăng ký ngay' })}
              </a>
            </p>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
