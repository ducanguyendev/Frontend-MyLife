import { useLanguage } from '@/shared/hooks/useLanguage';
import { anniversaryDateParts } from '@/features/admin/components/family-tree/anniversaryCalendarUtils';

export function AnniversaryDateTile({ date }: { date: string }) {
  const { language } = useLanguage();
  const parts = anniversaryDateParts(date);
  if (!parts) return null;
  const value = new Date(Date.UTC(parts.year, parts.month, parts.day, 12));
  return <time dateTime={date} className="anniversary-date-tile"><span>{new Intl.DateTimeFormat(language === 'vi' ? 'vi-VN' : 'en', { month:'short', timeZone:'UTC' }).format(value)}</span><strong>{parts.day}</strong><small>{parts.year}</small></time>;
}
