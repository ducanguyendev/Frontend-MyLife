import { createContext, useContext, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

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
  const [notification, setNotification] = useState<NotificationOptions | null>(null);

  const showNotification = (options: NotificationOptions) => {
    setNotification(options);
    if (options.duration !== 0) {
      setTimeout(() => {
        setNotification(null);
      }, options.duration || 3000);
    }
  };

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="text-green-500 w-12 h-12 mb-4" />;
      case 'error':
        return <XCircle className="text-red-500 w-12 h-12 mb-4" />;
      case 'warning':
        return <AlertTriangle className="text-yellow-500 w-12 h-12 mb-4" />;
      case 'info':
        return <Info className="text-blue-500 w-12 h-12 mb-4" />;
    }
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <AnimatePresence>
        {notification && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm cursor-pointer"
              onClick={() => setNotification(null)}
            />
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              className="relative w-full max-w-sm bg-secondary-bg border border-custom-border p-6 rounded-2xl shadow-2xl z-10 flex flex-col items-center text-center"
            >
              {getIcon(notification.type || 'info')}
              <p className="text-primary-text font-semibold text-lg">
                {notification.message}
              </p>
              
              <button 
                onClick={() => setNotification(null)}
                className="mt-6 px-6 py-2 bg-primary-bg hover:bg-custom-border text-secondary-text hover:text-primary-text rounded-xl font-medium border border-custom-border transition-colors w-full"
              >
                Đóng
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </NotificationContext.Provider>
  );
};
