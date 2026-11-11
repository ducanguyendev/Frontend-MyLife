/** Calendar-date presentation only. Never add the result to member data or payloads. */
export interface MemberAgeSource {
  readonly dateOfBirth?: string | null;
  readonly lifeStatus?: 'LIVING' | 'DECEASED';
  readonly deathDate?: string | null;
}

type CalendarDate = { year: number; month: number; day: number };
type ReferenceDate = string | Date;

export type MemberAgeDisplay =
  | { kind: 'living'; currentAge: number | null }
  | { kind: 'deceased'; ageAtDeath: number | null; currentEquivalentAge: number | null };

function parseCalendarDate(value: string | null | undefined): CalendarDate | null {
  if (typeof value !== 'string') return null;
  // API date-only strings and ISO date-times keep their literal calendar date.
  // A timezone suffix must not shift a birthday into the previous/next day.
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,7})?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)?)?$/.exec(value.trim());
  if (!match) return null;
  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText), month = Number(monthText), day = Number(dayText);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > days[month - 1]) return null;
  return { year, month, day };
}

function referenceCalendarDate(value: ReferenceDate): CalendarDate | null {
  if (typeof value === 'string') return parseCalendarDate(value);
  if (!(value instanceof Date) || !Number.isFinite(value.getTime())) return null;
  return { year: value.getFullYear(), month: value.getMonth() + 1, day: value.getDate() };
}

function compareDates(a: CalendarDate, b: CalendarDate): number {
  return a.year - b.year || a.month - b.month || a.day - b.day;
}

/** Completed years. Feb 29 birthdays advance on March 1 in a non-leap year. */
export function calculateAgeAtDate(dateOfBirth: string | null | undefined, referenceDate: ReferenceDate): number | null {
  const birth = parseCalendarDate(dateOfBirth);
  const reference = referenceCalendarDate(referenceDate);
  if (!birth || !reference || compareDates(reference, birth) < 0) return null;
  const beforeBirthday = reference.month < birth.month || (reference.month === birth.month && reference.day < birth.day);
  return reference.year - birth.year - (beforeBirthday ? 1 : 0);
}

export function getCurrentAge(dateOfBirth: string | null | undefined, now: ReferenceDate = new Date()): number | null {
  return calculateAgeAtDate(dateOfBirth, now);
}

export function getAgeAtDeath(dateOfBirth: string | null | undefined, deathDate: string | null | undefined): number | null {
  return deathDate ? calculateAgeAtDate(dateOfBirth, deathDate) : null;
}

export function getMemberAgeDisplay(member: MemberAgeSource, now: ReferenceDate = new Date()): MemberAgeDisplay {
  const currentAge = getCurrentAge(member.dateOfBirth, now);
  if (member.lifeStatus !== 'DECEASED') return { kind: 'living', currentAge };
  const death = parseCalendarDate(member.deathDate);
  const today = referenceCalendarDate(now);
  return {
    kind: 'deceased',
    ageAtDeath: currentAge !== null && death && today && compareDates(death, today) <= 0
      ? getAgeAtDeath(member.dateOfBirth, member.deathDate) : null,
    currentEquivalentAge: currentAge,
  };
}
