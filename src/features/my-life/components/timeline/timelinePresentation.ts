import type { TFunction } from 'i18next';
import type { FamilyTimelineEvent } from '@/features/admin/services/familyV2Service';

export function getTimelineEventDisplayTitle(event: FamilyTimelineEvent, translate: TFunction): string {
  if (!event.isDerived) return event.title;
  const name = event.memberName?.trim();
  if (event.eventType === 'BIRTH') return translate('admin.family_v2.derived_birth_title', { name: name || translate('admin.family_v2.derived_birth_fallback') });
  if (event.eventType === 'DEATH') return translate('admin.family_v2.derived_death_title', { name: name || translate('admin.family_v2.derived_death_fallback') });
  return event.title;
}

export function formatTimelineDate(date: string, locale: 'vi' | 'en'): string {
  const [year, month, day] = date.slice(0, 10).split('-').map(Number);
  if (!year || !month || !day) return date;
  return new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)));
}
