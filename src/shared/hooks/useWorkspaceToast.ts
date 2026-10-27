import { useCallback } from 'react';
import { useNotification } from '@/shared/contexts/NotificationContext';

export function useWorkspaceToast() {
  const { showNotification } = useNotification();
  return useCallback((message: string, success: boolean) => {
    showNotification({ message, type: success ? 'success' : 'error' });
  }, [showNotification]);
}
