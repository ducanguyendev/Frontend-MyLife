import type { FamilyTimelineEvent } from '@/features/admin/services/familyV2Service';

export type TimelineYearGroup = { year: number | null; events: FamilyTimelineEvent[] };

export function timelineSortValue(event: FamilyTimelineEvent): number {
  if (event.eventDate) return new Date(`${event.eventDate.slice(0, 10)}T00:00:00Z`).getTime();
  if (event.eventYear) return Date.UTC(event.eventYear, 0, 1);
  return Number.MAX_SAFE_INTEGER;
}

export function groupTimelineEventsByYear(events: FamilyTimelineEvent[]): TimelineYearGroup[] {
  const sorted = events.map((event, index) => ({ event, index })).sort((a, b) => timelineSortValue(a.event) - timelineSortValue(b.event) || a.index - b.index);
  const groups = new Map<number | null, FamilyTimelineEvent[]>();
  for (const { event } of sorted) {
    const year = event.eventDate ? Number(event.eventDate.slice(0, 4)) : event.eventYear ?? null;
    const group = groups.get(year) ?? [];
    group.push(event);
    groups.set(year, group);
  }
  return [...groups].sort(([a], [b]) => a === null ? 1 : b === null ? -1 : a - b).map(([year, groupedEvents]) => ({ year, events: groupedEvents }));
}
