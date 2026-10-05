import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Lock, Mail, ShieldCheck, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { getApiErrorMessage } from '@/shared/api/apiClient';
import { Input, PasswordInput } from '@/shared/components/ui';
import { useLanguage } from '@/shared/hooks/useLanguage';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function waitForGoogleAuthorizationCode(popup: Window, expectedState: string): Promise<string> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (error?: Error, code?: string) => {
      if (settled) return;
      settled = true;
      window.clearInterval(poll);
      window.clearTimeout(timeout);
      if (!popup.closed) popup.close();
      if (error) reject(error);
      else resolve(code ?? '');
    };

    const poll = window.setInterval(() => {
      if (popup.closed) {
        finish(new Error('Google sign-in was cancelled.'));
        return;
      }

      try {
        const callbackUrl = new URL(popup.location.href);
        if (callbackUrl.origin !== window.location.origin) return;

        const providerError = callbackUrl.searchParams.get('error');
        if (providerError) {
          finish(new Error(`Google sign-in failed: ${providerError}.`));
          return;
        }

        const code = callbackUrl.searchParams.get('code');
        if (!code) return;

        if (callbackUrl.searchParams.get('state') !== expectedState) {
          finish(new Error('Google sign-in response could not be verified.'));
          return;
        }

        finish(undefined, code);
      } catch {
        // The popup is cross-origin until Google redirects it to this origin.
      }
    }, 400);

    const timeout = window.setTimeout(() => {
      finish(new Error('Google sign-in timed out. Please try again.'));
    }, 120_000);
  });
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  useEffect(() => {
    if (!errorMessage) return undefined;
    const timer = window.setTimeout(() => setErrorMessage(null), 3_000);
    return () => window.clearTimeout(timer);
  }, [errorMessage]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!isOpen) {
        setErrorMessage(null);
        return;
      }

      const remembered = authService.getRemembered();
      setEmail(remembered.rememberMe ? remembered.email : '');
      setPassword('');
      setRememberMe(remembered.rememberMe);
      setFieldErrors({});
    }, 0);

    return () => window.clearTimeout(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const localizeError = (rawError: string): string => {
    const error = rawError.toLowerCase();
    if (error.includes('credential') || error.includes('invalid email') || error.includes('401')) {
      return t('common.errors.invalidCredentials', { defaultValue: 'Email or password is incorrect.' });
    }
    if (error.includes('locked')) {
      return t('common.errors.accountLocked', { defaultValue: 'This account is locked. Please contact an administrator.' });
    }
    if (error.includes('connect') || error.includes('network') || error.includes('server')) {
      return t('common.errors.connectionError', { defaultValue: 'Unable to connect to the server. Please try again.' });
    }
    if (error.includes('expired')) {
      return t('common.errors.sessionExpired', { defaultValue: 'Your session has expired. Please sign in again.' });
    }
    return rawError || t('common.errors.defaultError', { defaultValue: 'Sign-in failed. Please try again.' });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);

    const nextErrors: { email?: string; password?: string } = {};
    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!normalizedEmail) {
      nextErrors.email = t('common.errors.emailRequired', { defaultValue: 'Please enter your email address.' });
    } else if (!emailRegex.test(normalizedEmail)) {
      nextErrors.email = t('common.errors.invalidEmailFormat', { defaultValue: 'Please enter a valid email address.' });
    }

    if (!password) {
      nextErrors.password = t('common.errors.passwordRequired', { defaultValue: 'Please enter your password.' });
    } else if (password.length < 8 || password.length > 72) {
      nextErrors.password = t('common.errors.passwordLength', { defaultValue: 'Password must be between 8 and 72 characters.' });
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    setFieldErrors({});
    setIsLoading(true);
    try {
      await login({ email: normalizedEmail, password, rememberMe });
      onClose();
      navigate('/Home');
    } catch (error) {
      setErrorMessage(localizeError(getApiErrorMessage(error)));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMessage(null);
    setIsGoogleLoading(true);

    try {
      const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();
      if (!googleClientId || googleClientId.startsWith('YOUR_GOOGLE_CLIENT_ID')) {
        throw new Error('Google sign-in is not configured for this site.');
      }

      const redirectUri = window.location.origin;
      const stateBytes = crypto.getRandomValues(new Uint8Array(24));
      const oauthState = Array.from(stateBytes, (value) => value.toString(16).padStart(2, '0')).join('');
      const authorizationUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authorizationUrl.search = new URLSearchParams({
        client_id: googleClientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid email profile',
        access_type: 'offline',
        prompt: 'select_account',
        state: oauthState,
      }).toString();

      const width = 500;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      const popup = window.open(
        authorizationUrl.toString(),
        'google_oauth',
        `width=${width},height=${height},left=${left},top=${top}`,
      );

      if (!popup) {
        throw new Error(t('common.errors.popupBlocked', { defaultValue: 'Unable to open the Google sign-in window. Please allow popups and try again.' }));
      }

      const code = await waitForGoogleAuthorizationCode(popup, oauthState);
      await loginWithGoogle(code, redirectUri);
      onClose();
      navigate('/Home');
    } catch (error) {
      const fallback = t('common.errors.googleLoginFailed', { defaultValue: 'Google sign-in failed. Please try again.' });
      setErrorMessage(localizeError(getApiErrorMessage(error, fallback)));
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden p-4"
        onClick={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 cursor-pointer bg-slate-950/70 backdrop-blur-sm"
        />
        <motion.div
          layout
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', duration: 0.3 }}
          onClick={(event) => event.stopPropagation()}
          className="relative z-10 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl border border-custom-border bg-secondary-bg p-8 font-sans text-primary-text shadow-2xl"
        >
          <button
            onClick={onClose}
            className="absolute right-5 top-5 cursor-pointer rounded-full p-1.5 text-secondary-text transition-colors hover:bg-primary-bg hover:text-primary-text"
            aria-label="Close"
          >
            <X size={20} />
          </button>

          <div className="mb-6 space-y-2 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 text-accent">
              <ShieldCheck size={28} />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-primary-text">
              {t('common.login', { defaultValue: 'Sign in' })}
            </h2>
            <p className="text-xs text-secondary-text">
              {t('common.loginDesc', { defaultValue: 'Enter your account details to continue.' })}
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <AnimatePresence>
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, height: 0, scale: 0.96 }}
                  animate={{ opacity: 1, height: 'auto', scale: 1 }}
                  exit={{ opacity: 0, height: 0, scale: 0.96 }}
                  className="overflow-hidden"
                >
                  <div className="mb-1 flex items-center gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-500">
                    <AlertCircle size={16} className="shrink-0" />
                    <span className="flex-1 leading-snug">{errorMessage}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <Input
              label={t('common.email', { defaultValue: 'Email' })}
              leftIcon={<Mail size={18} />}
              type="email"
              name="email"
              autoComplete="email"
              maxLength={254}
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (fieldErrors.email) setFieldErrors((previous) => ({ ...previous, email: undefined }));
              }}
              error={fieldErrors.email}
            />

            <PasswordInput
              label={t('common.password', { defaultValue: 'Password' })}
              leftIcon={<Lock size={18} />}
              name="password"
              autoComplete="current-password"
              maxLength={72}
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (fieldErrors.password) setFieldErrors((previous) => ({ ...previous, password: undefined }));
              }}
              error={fieldErrors.password}
            />

            <label className="flex cursor-pointer items-center gap-2 pt-1">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
                className="cursor-pointer rounded border-custom-border text-accent accent-accent focus:ring-accent"
              />
              <span className="text-xs text-secondary-text">
                {t('common.rememberMe', { defaultValue: 'Remember my email' })}
              </span>
            </label>

            <button
              type="submit"
              disabled={isLoading || isGoogleLoading}
              className="mt-2 w-full cursor-pointer rounded-xl bg-accent px-4 py-3.5 text-sm font-semibold text-primary-bg shadow-lg transition-all hover:opacity-90 disabled:opacity-50"
            >
              {isLoading ? t('common.loading', { defaultValue: 'Working...' }) : t('common.login', { defaultValue: 'Sign in' })}
            </button>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-custom-border/60" />
              <span className="mx-4 flex-shrink text-xs font-medium tracking-wide text-secondary-text/80">
                {t('common.orLoginWith', { defaultValue: 'or sign in with' })}
              </span>
              <div className="flex-grow border-t border-custom-border/60" />
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading || isGoogleLoading}
              title={t('common.loginWithGoogle', { defaultValue: 'Sign in with Google' })}
              className="group flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-custom-border bg-primary-bg/80 px-4 py-3 text-sm font-medium text-primary-text shadow-sm transition-all duration-200 hover:border-accent/40 hover:bg-primary-bg hover:shadow-md disabled:opacity-50"
            >
              {isGoogleLoading ? (
                <span>{t('common.loading', { defaultValue: 'Connecting to Google...' })}</span>
              ) : (
                <>
                  <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span className="text-xs font-semibold tracking-wide transition-colors group-hover:text-accent">
                    {t('common.loginWithGoogle', { defaultValue: 'Sign in with Google' })}
                  </span>
                </>
              )}
            </button>

            <p className="pt-1 text-center text-xs text-secondary-text">
              {t('common.noAccount', { defaultValue: 'Do not have an account?' })}{' '}
              <a
                href="/Register"
                className="cursor-pointer font-semibold text-accent hover:underline"
                onClick={(event) => {
                  event.preventDefault();
                  onClose();
                  navigate('/Register');
                }}
              >
                {t('common.register', { defaultValue: 'Register now' })}
              </a>
            </p>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
