import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ShieldAlert, LogIn } from 'lucide-react';
import { useLanguage } from '@/shared/hooks/useLanguage';

interface SessionExpiredModalProps {
  isOpen: boolean;
  onConfirm: () => void;
}

export const SessionExpiredModal: React.FC<SessionExpiredModalProps> = ({
  isOpen,
  onConfirm,
}) => {
  const { t } = useLanguage();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-hidden">
        {/* Modal Backdrop - Non-dismissible */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
          aria-hidden="true"
        />

        {/* Modal Dialog Box */}
        <motion.div
          layout
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md bg-secondary-bg border border-custom-border p-6 sm:p-8 rounded-3xl shadow-2xl z-10 font-sans text-primary-text text-center flex flex-col items-center"
          role="alertdialog"
          aria-modal="true"
        >
          {/* Animated Icon Badge */}
          <div className="relative mb-5">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shadow-inner">
              <Clock size={32} className="animate-pulse" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md">
              <ShieldAlert size={14} />
            </div>
          </div>

          {/* Title & Message */}
          <h3 className="text-xl sm:text-2xl font-black tracking-tight text-primary-text mb-3">
            {t('common.sessionExpiredTitle', { defaultValue: 'Phiên đăng nhập đã hết hạn' })}
          </h3>
          <p className="text-xs sm:text-sm text-secondary-text leading-relaxed mb-6 max-w-sm">
            {t('common.sessionExpiredDesc', {
              defaultValue: 'Phiên làm việc của bạn đã kết thúc để đảm bảo an toàn bảo mật. Vui lòng bấm xác nhận để đăng nhập lại.',
            })}
          </p>

          {/* Mandatory Confirmation Button */}
          <button
            type="button"
            onClick={onConfirm}
            className="w-full py-3.5 px-6 rounded-2xl bg-accent hover:opacity-90 text-primary-bg font-bold text-sm tracking-wide transition-all duration-200 shadow-lg shadow-accent/20 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
          >
            <LogIn size={18} />
            <span>{t('common.confirmLoginAgain', { defaultValue: 'Xác nhận' })}</span>
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};