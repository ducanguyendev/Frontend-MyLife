import '../components/AuthPresentation.css';
import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/shared/hooks/useLanguage';
import { authService } from '../services/authService';
import { getApiErrorMessage } from '@/shared/api/apiClient';
import { PasswordInput } from '@/shared/components/ui';
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher';
import { AlertCircle, CheckCircle2, Lock, ShieldCheck, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function readErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== 'object' || !('payload' in error)) return undefined;
  const payload = (error as { payload?: unknown }).payload;
  if (!payload || typeof payload !== 'object' || !('code' in payload)) return undefined;
  const code = (payload as { code?: unknown }).code;
  return typeof code === 'string' ? code : undefined;
}

const passwordRule = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,72}$/;

export const ResetPassword: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ newPassword?: string; confirmPassword?: string }>({});
  const [view, setView] = useState<'form' | 'success' | 'invalid'>(token ? 'form' : 'invalid');

  // Same scoring as the registration form: length >= 8, lower, upper, digit, special.
  const passwordStrength = (() => {
    if (!newPassword) return { score: 0, label: '', color: '' };
    let score = 0;
    if (newPassword.length >= 8) score++;
    if (/[a-z]/.test(newPassword)) score++;
    if (/[A-Z]/.test(newPassword)) score++;
    if (/[0-9]/.test(newPassword)) score++;
    if (/[^A-Za-z0-9]/.test(newPassword)) score++;

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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);

    const nextErrors: { newPassword?: string; confirmPassword?: string } = {};
    if (!passwordRule.test(newPassword)) {
      nextErrors.newPassword = t('common.forgotPassword.passwordRules', { defaultValue: 'At least 8 characters, with upper and lower case letters, a number and a special character.' });
    }
    if (confirmPassword !== newPassword) {
      nextErrors.confirmPassword = t('common.forgotPassword.passwordMismatch', { defaultValue: 'The confirmation password does not match.' });
    }
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    setFieldErrors({});
    setIsLoading(true);
    try {
      await authService.resetPassword(token, newPassword, confirmPassword);
      setView('success');
    } catch (error) {
      if (readErrorCode(error) === 'AUTH_RESET_TOKEN_INVALID') {
        setView('invalid');
        return;
      }
      setErrorMessage(getApiErrorMessage(error, t('common.errors.defaultError', { defaultValue: 'Something went wrong. Please try again.' })));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-register min-h-screen bg-primary-bg flex items-center justify-center p-4 py-8 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-80 h-80 bg-accent/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />

      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', duration: 0.3 }}
        className="relative w-full max-w-md bg-secondary-bg border border-custom-border p-8 rounded-3xl shadow-2xl z-10 font-sans text-primary-text"
      >
        <div className="auth-register__utilities absolute top-5 right-5 flex items-center gap-3">
          <LanguageSwitcher />
          <button
            onClick={() => navigate('/')}
            className="auth-close text-secondary-text hover:text-primary-text rounded-full hover:bg-primary-bg transition-colors cursor-pointer"
            aria-label={t('common.registerPage.backHome', { defaultValue: 'Quay về trang chủ' })}
          >
            <X size={20} />
          </button>
        </div>

        <div className="text-center space-y-2 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-accent/15 text-accent flex items-center justify-center mx-auto mb-3">
            {view === 'success' ? <CheckCircle2 size={28} /> : view === 'invalid' ? <AlertCircle size={28} /> : <ShieldCheck size={28} />}
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-primary-text">
            {view === 'success'
              ? t('common.forgotPassword.successTitle', { defaultValue: 'Password reset successful' })
              : view === 'invalid'
                ? t('common.forgotPassword.title', { defaultValue: 'Forgot password' })
                : t('common.forgotPassword.resetTitle', { defaultValue: 'Set a new password' })}
          </h2>
          <p className="text-[length:var(--type-label)] text-secondary-text">
            {view === 'success'
              ? t('common.forgotPassword.successDesc', { defaultValue: 'You can now sign in with your new password.' })
              : view === 'invalid'
                ? t('common.forgotPassword.invalidToken', { defaultValue: 'This reset link is invalid or has expired. Please request a new one.' })
                : t('common.forgotPassword.resetDesc', { defaultValue: 'Enter a new password for your account.' })}
          </p>
        </div>

        {view === 'form' && (
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
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[var(--state-danger-soft)] border border-[var(--state-danger)] text-[var(--state-danger)] text-[length:var(--type-label)] mb-1">
                  <AlertCircle size={16} className="shrink-0" />
                  <span className="flex-1 leading-snug font-medium">{errorMessage}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <PasswordInput
              label={t('common.forgotPassword.newPassword', { defaultValue: 'New password' })}
              leftIcon={<Lock size={18} />}
              name="newPassword"
              autoComplete="new-password"
              maxLength={72}
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (fieldErrors.newPassword) setFieldErrors((prev) => ({ ...prev, newPassword: undefined }));
              }}
              error={fieldErrors.newPassword}
            />

            {newPassword.length > 0 && (
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
                  <p className="text-[length:var(--type-label)] text-secondary-text">
                    {t('common.registerPage.passwordStrength', { defaultValue: 'Độ mạnh mật khẩu:' })}{' '}
                    <span
                      className={
                        passwordStrength.score <= 1
                          ? 'text-[var(--state-danger)]'
                          : passwordStrength.score <= 2
                          ? 'text-[var(--state-warning)]'
                          : passwordStrength.score <= 3
                          ? 'text-[var(--state-info)]'
                          : 'text-[var(--state-success)]'
                      }
                    >
                      {passwordStrength.label}
                    </span>
                  </p>
                )}
              </div>
            )}
          </div>

          <PasswordInput
            label={t('common.forgotPassword.confirmPassword', { defaultValue: 'Confirm new password' })}
            leftIcon={<Lock size={18} />}
            name="confirmPassword"
            autoComplete="new-password"
            maxLength={72}
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (fieldErrors.confirmPassword) setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
            }}
            error={fieldErrors.confirmPassword}
          />

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 bg-accent hover:opacity-90 text-primary-bg font-semibold text-sm rounded-xl transition-all shadow-lg cursor-pointer disabled:opacity-50 mt-2"
          >
            {isLoading
              ? t('common.loading', { defaultValue: 'Working...' })
              : t('common.forgotPassword.resetButton', { defaultValue: 'Reset password' })}
          </button>
        </form>
        )}

        {view === 'success' && (
        <div className="space-y-4">
          <Link
            to="/"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('ui:openLogin'));
            }}
            className="block w-full py-3.5 px-4 bg-accent hover:opacity-90 text-primary-bg font-semibold text-sm rounded-xl transition-all shadow-lg cursor-pointer text-center"
          >
            {t('common.forgotPassword.loginNow', { defaultValue: 'Sign in now' })}
          </Link>
        </div>
        )}

        {view === 'invalid' && (
        <div className="space-y-4">
          <Link
            to="/"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('ui:openLogin'));
            }}
            className="block w-full py-3.5 px-4 bg-accent hover:opacity-90 text-primary-bg font-semibold text-sm rounded-xl transition-all shadow-lg cursor-pointer text-center"
          >
            {t('common.forgotPassword.requestNewLink', { defaultValue: 'Request a new link' })}
          </Link>
        </div>
        )}
      </motion.div>
    </div>
  );
};
