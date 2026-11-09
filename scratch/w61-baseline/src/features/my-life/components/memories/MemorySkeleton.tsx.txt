import { Skeleton } from '@/shared/components/Skeleton';
import { useLanguage } from '@/shared/hooks/useLanguage';

export function MemorySkeleton({ module }: { module: 'timeline' | 'calendar' | 'library' }) {
  const { t } = useLanguage();
  return <div className={`memory-skeleton memory-skeleton--${module}`} role="status" aria-label={t('memories.loading')}>
    <span className="sr-only">{t('memories.loading')}</span>
    {Array.from({ length: module === 'calendar' ? 2 : 4 }, (_, i) => <div className="memory-skeleton__item" key={i}>
      <Skeleton className="memory-skeleton__visual"/><Skeleton variant="text" className="mt-4"/><Skeleton variant="text" className="mt-3 !w-1/2"/>
    </div>)}
  </div>;
}
