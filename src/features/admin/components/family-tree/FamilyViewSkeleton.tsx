import { Skeleton } from '@/shared/components/Skeleton';
import { useLanguage } from '@/shared/hooks/useLanguage';

/** Loading follows the selected representation without implying real members. */
export function FamilyViewSkeleton({ view }: { view: string }) {
  const { t } = useLanguage();
  return <div className={`family-loading family-loading--${view}`} role="status" aria-label={t('family.loading')}>
    <span className="sr-only">{t('family.loading')}</span>
    {Array.from({ length: view === 'mindmap' ? 3 : 6 }, (_, i) => <div className="family-loading__item" key={i}>
      <Skeleton variant="circle" className="family-loading__avatar"/><div><Skeleton variant="text"/><Skeleton variant="text" className="mt-3 !w-1/2"/></div>
    </div>)}
  </div>;
}
