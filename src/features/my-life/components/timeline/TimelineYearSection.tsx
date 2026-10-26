import type { TimelineYearGroup } from './timelineUtils';
import type { FamilyTimelineEvent } from '@/features/admin/services/familyV2Service';
import { TimelineEventCard } from './TimelineEventCard';

export function TimelineYearSection({ group, unknown, dateLabel, onEdit, onDelete, translate }: { group: TimelineYearGroup; unknown: string; dateLabel: (event: FamilyTimelineEvent) => string; onEdit: (event: FamilyTimelineEvent) => void; onDelete: (event: FamilyTimelineEvent) => void; translate: (key: string) => string }) {
 return <section aria-labelledby={`timeline-year-${group.year ?? 'unknown'}`} className="space-y-3">
  <h2 id={`timeline-year-${group.year ?? 'unknown'}`} className="m-0 text-xl font-black text-primary-text sm:text-2xl">{group.year ?? unknown}</h2>
  <ol className="m-0 space-y-3 border-l-2 border-accent/25 pl-5 sm:pl-7">{group.events.map(event => <TimelineEventCard key={`${event.sourceType}-${event.id}`} event={event} date={dateLabel(event)} onEdit={onEdit} onDelete={onDelete} translate={translate} />)}</ol>
 </section>;
}
