import type { TimelineYearGroup } from './timelineUtils';
import type { FamilyTimelineEvent } from '@/features/admin/services/familyV2Service';
import { TimelineEventCard } from './TimelineEventCard';
import type { TFunction } from 'i18next';
import type { FamilyMember } from '@/features/admin/components/family-tree/types';

export function TimelineYearSection({ group, unknown, dateLabel, onEdit, onDelete, translate, members = [] }: { group: TimelineYearGroup; unknown: string; dateLabel: (event: FamilyTimelineEvent) => string; onEdit: (event: FamilyTimelineEvent) => void; onDelete: (event: FamilyTimelineEvent) => void; translate: TFunction; members?: FamilyMember[] }) {
 return <section className="timeline-year-section" aria-labelledby={`timeline-year-${group.year ?? 'unknown'}`}>
  <h2 id={`timeline-year-${group.year ?? 'unknown'}`} tabIndex={-1}>{group.year ?? unknown}<span aria-hidden="true"/></h2>
  <ol>{group.events.map(event => <TimelineEventCard key={`${event.sourceType}-${event.id}`} event={event} date={dateLabel(event)} onEdit={onEdit} onDelete={onDelete} translate={translate} relatedMemberName={members.find(member => member.id === event.relatedMemberId)?.fullName}/>)}</ol>
 </section>;
}
