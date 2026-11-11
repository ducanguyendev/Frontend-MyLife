import { useEffect } from 'react';
import { acquireBodyScrollLock } from '@/shared/utils/bodyScrollLock';

export function useBodyScrollLock(isLocked: boolean): void {
  useEffect(() => {
    if (!isLocked) return;
    return acquireBodyScrollLock();
  }, [isLocked]);
}
