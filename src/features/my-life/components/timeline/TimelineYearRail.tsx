import type { TimelineYearGroup } from './timelineUtils';
import { useLanguage } from '@/shared/hooks/useLanguage';

export function TimelineYearRail({ groups }: { groups: TimelineYearGroup[] }) {
  const { t } = useLanguage();
  return <nav className="timeline-year-rail" aria-label={t('memories.yearIndex')}><span>{t('memories.years')}</span>
    {groups.map(group => <a key={group.year ?? 'unknown'} href={`#timeline-year-${group.year ?? 'unknown'}`} onClick={event => {
      event.preventDefault();
      const target = document.getElementById(`timeline-year-${group.year ?? 'unknown'}`);
      target?.scrollIntoView({ block:'start', behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
      target?.focus({ preventScroll:true });
    }}>{group.year ?? t('admin.family_v2.unknown_date')}</a>)}
  </nav>;
}
