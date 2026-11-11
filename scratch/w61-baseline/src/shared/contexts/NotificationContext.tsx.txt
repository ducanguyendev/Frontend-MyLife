import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface NotificationOptions {
  message: string;
  type?: NotificationType;
  duration?: number;
}

interface NotificationContextType {
  showNotification: (options: NotificationOptions) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { t } = useLanguage();
  const [notification, setNotification] = useState<NotificationOptions | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const showNotification = useCallback((options: NotificationOptions) => {
    if (timer.current) clearTimeout(timer.current);
    setNotification(options);
    if (options.duration !== 0) timer.current = setTimeout(() => setNotification(null), options.duration || 4000);
  }, []);

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="text-[var(--state-success)] size-5" />;
      case 'error':
        return <XCircle className="text-[var(--state-danger)] size-5" />;
      case 'warning':
        return <AlertTriangle className="text-[var(--state-warning)] size-5" />;
      case 'info':
        return <Info className="text-[var(--state-info)] size-5" />;
    }
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <AnimatePresence>
        {notification && (
          <motion.div className="ds-toast" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: .17 }}
            role={notification.type === 'error' ? 'alert' : 'status'} aria-live={notification.type === 'error' ? 'assertive' : 'polite'}>
            {getIcon(notification.type || 'info')}<p>{notification.message}</p>
            <button type="button" onClick={() => { if (timer.current) clearTimeout(timer.current); setNotification(null); }} aria-label={t('appShell.dismiss')} title={t('appShell.dismiss')}><X size={16}/></button>
          </motion.div>
        )}
      </AnimatePresence>
    </NotificationContext.Provider>
  );
};
