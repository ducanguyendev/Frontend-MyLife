import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export type ModalMaxWidth = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: ModalMaxWidth;
  hideCloseButton?: boolean;
  className?: string;
  closeOnBackdropClick?: boolean;
  closeOnEsc?: boolean;
  backdropClassName?: string;
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
  description,
  children,
  footer,
  maxWidth = 'md',
  hideCloseButton = false,
  className = '',
  closeOnBackdropClick = true,
  closeOnEsc = true,
  backdropClassName = 'bg-black/60 backdrop-blur-xs',
}) => {
  const [mounted, setMounted] = useState(false);

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

  // Lock body and html scroll to guarantee outside interface never rolls
  useEffect(() => {
    if (!isOpen) return;

    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, [isOpen]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-hidden"
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
            transition={{ duration: 0.2 }}
            onClick={closeOnBackdropClick ? onClose : undefined}
            className={`fixed inset-0 ${backdropClassName}`}
            aria-hidden="true"
          />

          {/* Modal Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ type: 'spring', damping: 28, stiffness: 360 }}
            onClick={(e) => e.stopPropagation()}
            className={`relative w-full ${maxWidthMap[maxWidth]} flex flex-col min-h-0 bg-secondary-bg border border-custom-border rounded-2xl sm:rounded-3xl shadow-2xl z-10 overflow-hidden ${className}`}
            style={{ maxHeight: 'min(85vh, 720px)' }}
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            {(title || !hideCloseButton) && (
              <div className="shrink-0 flex items-center justify-between px-6 py-4 sm:py-5 border-b border-custom-border bg-secondary-bg z-10">
                <div className="pr-4">
                  {title && (
                    <h3 className="text-lg sm:text-xl font-bold text-primary-text leading-snug">
                      {title}
                    </h3>
                  )}
                  {description && (
                    <p className="text-xs text-secondary-text mt-1">
                      {description}
                    </p>
                  )}
                </div>

                {!hideCloseButton && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-2 rounded-xl text-secondary-text hover:text-primary-text hover:bg-custom-border/50 transition-colors cursor-pointer"
                    aria-label="Close modal"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            )}

            {/* Body */}
            <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 custom-scrollbar overscroll-contain">
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
