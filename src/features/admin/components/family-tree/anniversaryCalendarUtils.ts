export interface CalendarDay {
  year: number;
  month: number;
  day: number;
  inMonth: boolean;
}

export const anniversaryDateParts = (date: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(date);
  if (!match) return null;
  const year = Number(match[1]); const month = Number(match[2]); const day = Number(match[3]);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) return null;
  return { year, month: month - 1, day };
};

export const anniversaryDateKey = (year: number, month: number, day: number) => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

export const getAnniversaryNavigationTarget = (date: string) => {
  const parts = anniversaryDateParts(date);
  if (!parts) return null;
  return { visibleMonth: { year: parts.year, month: parts.month }, selectedDate: anniversaryDateKey(parts.year, parts.month, parts.day) };
};

export const countAnniversaryEventsInMonth = (events: Array<{ nextSolarDate: string }>, year: number, month: number) => events.reduce((count, event) => {
  const parts = anniversaryDateParts(event.nextSolarDate);
  return count + (parts?.year === year && parts.month === month ? 1 : 0);
}, 0);

export type AnniversaryDayEventVisualType = 'death-anniversary' | 'family-event' | 'mixed' | 'none';

export const getDayEventVisual = (events: Array<{ eventType: string }>) => {
  const hasDeathAnniversary = events.some(event => event.eventType === 'DEATH_ANNIVERSARY');
  const hasFamilyEvent = events.some(event => event.eventType === 'FAMILY_EVENT');
  const hasOtherEvent = events.some(event => event.eventType !== 'DEATH_ANNIVERSARY' && event.eventType !== 'FAMILY_EVENT');
  const type: AnniversaryDayEventVisualType = hasOtherEvent || (hasDeathAnniversary && hasFamilyEvent) ? 'mixed'
    : hasDeathAnniversary ? 'death-anniversary' : hasFamilyEvent ? 'family-event' : 'none';
  return { count: events.length, type, hasDeathAnniversary, hasFamilyEvent };
};

export const getVietnamTodayKey = () => {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  return anniversaryDateKey(Number(parts.find(part => part.type === 'year')?.value), Number(parts.find(part => part.type === 'month')?.value) - 1, Number(parts.find(part => part.type === 'day')?.value));
};

export const getAnniversaryMonthGrid = (year: number, month: number): CalendarDay[] => {
  const firstWeekday = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const mondayOffset = (firstWeekday + 6) % 7;
  const dayCount = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cellCount = Math.ceil((mondayOffset + dayCount) / 7) * 7;
  return Array.from({ length: cellCount }, (_, index) => {
    const date = new Date(Date.UTC(year, month, index - mondayOffset + 1));
    return { year: date.getUTCFullYear(), month: date.getUTCMonth(), day: date.getUTCDate(), inMonth: date.getUTCMonth() === month };
  });
};
