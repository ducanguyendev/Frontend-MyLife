import { normalizeDisplayText } from '@/shared/utils/normalizeDisplayText';
import React, { useEffect, useState, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useLanguage } from '@/shared/hooks/useLanguage';
import { X } from 'lucide-react';
import { useBodyScrollLock } from '@/shared/hooks/useBodyScrollLock';

export type ModalMaxWidth = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  showTitle?: boolean;
  ariaLabel?: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: ModalMaxWidth;
  hideCloseButton?: boolean;
  className?: string;
  closeOnBackdropClick?: boolean;
  closeOnEsc?: boolean;
  backdropClassName?: string;
  reducedMotion?: boolean;
  placement?: 'center' | 'drawer';
}

const maxWidthMap: Record<ModalMaxWidth, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  full: 'max-w-5xl',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  showTitle = true,
  ariaLabel,
  description,
  children,
  footer,
  maxWidth = 'md',
  hideCloseButton = false,
  className = '',
  closeOnBackdropClick = true,
  closeOnEsc = true,
  backdropClassName = 'bg-black/60 backdrop-blur-xs',
  reducedMotion = false,
  placement = 'center',
}) => {
  const [mounted, setMounted] = useState(false);
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();
  const prefersReducedMotion = useReducedMotion();
  const motionReduced = reducedMotion || prefersReducedMotion;
  useEffect(() => {
    if (!isOpen || !mounted) return;
    const previous = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    const selector = 'button:not([disabled]), input:not([disabled]), select:not([disabled]), [role="combobox"]:not([aria-disabled="true"]), textarea:not([disabled]), a[href], [tabindex="0"]';
    // Focus once on opening; never steal focus from a user already interacting.
    if (dialog && !dialog.contains(document.activeElement)) {
      (dialog.querySelector<HTMLElement>('input:not([disabled]), [role="combobox"]:not([aria-disabled="true"]), textarea:not([disabled])') ?? dialog.querySelector<HTMLElement>(selector) ?? dialog).focus();
    }
    const keepFocus = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !dialog?.contains(document.activeElement)) return;
      const controls = Array.from(dialog.querySelectorAll<HTMLElement>(selector)).filter(el => el.getClientRects().length > 0);
      const first = controls[0]; const last = controls.at(-1);
      if (!first) { event.preventDefault(); dialog.focus(); }
      else if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', keepFocus);
    return () => { window.removeEventListener('keydown', keepFocus); if (previous?.isConnected) previous.focus(); };
  }, [isOpen, mounted]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle ESC key
  useEffect(() => {
    if (!closeOnEsc || !isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, closeOnEsc]);

  useBodyScrollLock(isOpen);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          className={`fixed inset-0 z-50 flex overflow-hidden ${placement === 'drawer' ? 'items-stretch justify-start' : 'items-center justify-center p-3 sm:p-5'}`}
          onClick={(e) => {
            if (e.target === e.currentTarget && closeOnBackdropClick) {
              onClose();
            }
          }}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: motionReduced ? 0.01 : 0.17 }}
            onClick={closeOnBackdropClick ? onClose : undefined}
            className={`fixed inset-0 ${backdropClassName}`}
            aria-hidden="true"
          />

          {/* Modal Dialog */}
          <motion.div
            initial={motionReduced ? { opacity: 0 } : placement === 'drawer' ? { opacity: 0, x: -30 } : { opacity: 0, scale: 0.98, y: 8 }}
            animate={motionReduced ? { opacity: 1 } : { opacity: 1, scale: 1, x: 0, y: 0 }}
            exit={motionReduced ? { opacity: 0 } : placement === 'drawer' ? { opacity: 0, x: -30 } : { opacity: 0, scale: 0.98, y: 8 }}
            transition={{ duration: motionReduced ? 0.01 : 0.26, ease: [.2, .7, .2, 1] }}
            onClick={(e) => e.stopPropagation()}
            className={`ds-modal relative w-full ${maxWidthMap[maxWidth]} flex flex-col min-h-0 border border-custom-border z-10 overflow-hidden ${placement === 'drawer' ? 'ds-drawer' : 'rounded-2xl sm:rounded-3xl'} ${className}`}
            style={{ maxHeight: placement === 'drawer' ? '100dvh' : 'min(90dvh, 850px)' }}
            ref={dialogRef} tabIndex={-1}
            role="dialog" aria-labelledby={showTitle && title ? titleId : undefined} aria-label={showTitle && title ? undefined : ariaLabel ?? t('common.dialog')}
            aria-modal="true"
          >
            {/* Header */}
            {((showTitle && (title || description)) || !hideCloseButton) && (
              <div className={`shrink-0 flex items-center ${showTitle ? 'justify-between px-6 py-4 sm:py-5 border-b' : 'justify-end px-4 py-2'} border-custom-border bg-secondary-bg z-10`}>
                {showTitle && <div className="min-w-0 pr-4">
                  {title && <h3 id={titleId} className="text-lg sm:text-xl font-bold text-primary-text leading-snug">{typeof title === 'string' ? normalizeDisplayText(title) : title}</h3>}
                  {description && <p className="text-[length:var(--type-label)] leading-relaxed text-secondary-text mt-1">{description}</p>}
                </div>}

                {!hideCloseButton && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex size-11 shrink-0 items-center justify-center rounded-xl text-secondary-text hover:text-primary-text hover:bg-custom-border/50 transition-colors cursor-pointer"
                    aria-label={t('admin.close')}
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            )}

            {/* Body */}
            <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 custom-scrollbar">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="shrink-0 flex items-center justify-end gap-3 px-6 py-4 border-t border-custom-border bg-primary-bg/70 backdrop-blur-sm z-10">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
