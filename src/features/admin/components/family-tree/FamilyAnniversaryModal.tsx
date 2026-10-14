import { useEffect, useMemo, useState } from 'react';
import { CalendarClock, CalendarDays, Loader2, Plus, Users } from 'lucide-react';
import { Button, DateInput, Input, Modal, Select, SelectItem, Textarea, formatBackendToDob, formatDobToBackend, validateCalendarDate } from '@/shared/components/ui';
import { useLanguage } from '@/shared/hooks/useLanguage';
import { anniversaryService, type AnniversaryEventType, type FamilyAnniversary, type FamilyAnniversaryPayload } from '../../services/anniversaryService';
import type { FamilyMember } from './types';

interface Props {
  anniversary?: FamilyAnniversary;
  members: FamilyMember[];
  onClose: () => void;
  onSubmit: (payload: FamilyAnniversaryPayload) => Promise<void>;
}

const NO_RELATED_MEMBER = '__no_related_member__';

function errorCode(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') return undefined;
  return (error as { payload?: { code?: string } }).payload?.code;
}

export function FamilyAnniversaryModal({ anniversary, members, onClose, onSubmit }: Props) {
  const { t, language } = useLanguage();
  const [eventType, setEventType] = useState<AnniversaryEventType>(anniversary?.eventType ?? 'DEATH_ANNIVERSARY');
  const [title, setTitle] = useState(anniversary?.title ?? '');
  const [relatedMemberId, setRelatedMemberId] = useState(anniversary?.relatedMemberId ? String(anniversary.relatedMemberId) : '');
  const [lunarDay, setLunarDay] = useState(anniversary?.lunarDay ? String(anniversary.lunarDay) : '');
  const [lunarMonth, setLunarMonth] = useState(anniversary?.lunarMonth ? String(anniversary.lunarMonth) : '');
  const [lunarYear, setLunarYear] = useState(anniversary?.lunarYear ? String(anniversary.lunarYear) : '');
  const [originalSolarDate, setOriginalSolarDate] = useState(anniversary?.originalSolarDate ? formatBackendToDob(anniversary.originalSolarDate) : '');
  const [isLeapMonth, setIsLeapMonth] = useState(anniversary?.isLeapMonth ?? false);
  const [place, setPlace] = useState(anniversary?.place ?? '');
  const [host, setHost] = useState(anniversary?.host ?? '');
  const [notes, setNotes] = useState(anniversary?.notes ?? '');
  const [occurrence, setOccurrence] = useState<{ date: string; daysUntil: number; solarYear: number; isCurrentYearPassed: boolean } | null>(
    anniversary ? { date: anniversary.nextSolarDate, daysUntil: anniversary.daysUntil, solarYear: Number(anniversary.nextSolarDate.slice(0, 4)), isCurrentYearPassed: false } : null,
  );
  const [occurrenceLoading, setOccurrenceLoading] = useState(false);
  const [occurrenceError, setOccurrenceError] = useState<string | null>(null);
  const [dateCheck, setDateCheck] = useState<{ status: 'matched' | 'mismatch'; convertedDate?: string } | null>(null);
  const [dateCheckLoading, setDateCheckLoading] = useState(false);
  const [dateCheckError, setDateCheckError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const selectedMember = useMemo(() => members.find(member => member.id === Number(relatedMemberId)), [members, relatedMemberId]);
  const isDeathAnniversary = eventType === 'DEATH_ANNIVERSARY';
  const solarDateValue = formatDobToBackend(originalSolarDate);
  const validSolarDate = validateCalendarDate(originalSolarDate, { required: true, allowFuture: true });
  const day = /^\d+$/.test(lunarDay) ? Number(lunarDay) : NaN;
  const month = /^\d+$/.test(lunarMonth) ? Number(lunarMonth) : NaN;
  const year = /^\d{4}$/.test(lunarYear) ? Number(lunarYear) : NaN;
  const validLunarParts = Number.isInteger(day) && day >= 1 && day <= 30 && Number.isInteger(month) && month >= 1 && month <= 12;

  useEffect(() => {
    if (isDeathAnniversary && selectedMember && !title.trim()) {
      setTitle(`${t('admin.anniversary_ui.death_prefix')} ${selectedMember.fullName}`);
    }
  }, [eventType, isDeathAnniversary, selectedMember, title, t]);

  useEffect(() => {
    if (!validLunarParts) {
      setOccurrence(null);
      setOccurrenceLoading(false);
      setOccurrenceError(null);
      return;
    }
    const controller = new AbortController();
    setOccurrenceLoading(true);
    setOccurrenceError(null);
    const timer = window.setTimeout(async () => {
      try {
        const result = await anniversaryService.getNextOccurrence(day, month, isLeapMonth, controller.signal);
        if (controller.signal.aborted) return;
        setOccurrence({ date: result.nextSolarDate, daysUntil: result.daysUntil, solarYear: result.solarYear, isCurrentYearPassed: result.isCurrentYearPassed });
      } catch (requestError) {
        if (controller.signal.aborted) return;
        setOccurrence(null);
        setOccurrenceError(errorCode(requestError) === 'FAMILY_ANNIVERSARY_INVALID_LUNAR_DATE'
          ? 'admin.anniversary_ui.invalid_lunar_date' : 'admin.anniversary_ui.preview_failed');
      } finally {
        if (!controller.signal.aborted) setOccurrenceLoading(false);
      }
    }, 350);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [day, isLeapMonth, month, validLunarParts]);

  useEffect(() => {
    if (!validSolarDate.valid || !solarDateValue || !validLunarParts || !Number.isInteger(year) || year < 1800 || year > 2200) {
      setDateCheck(null);
      setDateCheckLoading(false);
      setDateCheckError(null);
      return;
    }
    const controller = new AbortController();
    setDateCheckLoading(true);
    setDateCheckError(null);
    const timer = window.setTimeout(async () => {
      try {
        const result = await anniversaryService.convertLunarToSolar(day, month, year, isLeapMonth, controller.signal);
        if (controller.signal.aborted) return;
        setDateCheck(result.solarDate === solarDateValue
          ? { status: 'matched' }
          : { status: 'mismatch', convertedDate: result.solarDate });
      } catch (requestError) {
        if (controller.signal.aborted) return;
        setDateCheck(null);
        setDateCheckError(errorCode(requestError) === 'FAMILY_ANNIVERSARY_INVALID_LUNAR_DATE'
          ? 'admin.anniversary_ui.invalid_lunar_date' : 'admin.anniversary_ui.preview_failed');
      } finally {
        if (!controller.signal.aborted) setDateCheckLoading(false);
      }
    }, 350);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [day, isLeapMonth, month, solarDateValue, validLunarParts, validSolarDate.valid, year]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSaving) return;
    setError(null);
    if (title.trim().length < 2 || title.trim().length > 200) { setError('admin.anniversary_ui.invalid_title'); return; }
    if (!validLunarParts) { setError('admin.anniversary_ui.invalid_lunar_date'); return; }
    const hasSolar = Boolean(originalSolarDate.trim());
    const hasYear = Boolean(lunarYear.trim());
    if (isDeathAnniversary && (!hasSolar || !hasYear)) { setError('admin.anniversary_ui.original_date_required'); return; }
    if (hasSolar !== hasYear) { setError('admin.anniversary_ui.original_date_required'); return; }
    if (hasSolar && !validSolarDate.valid) { setError('admin.anniversary_ui.invalid_solar_date'); return; }
    if (hasYear && (!Number.isInteger(year) || year < 1800 || year > 2200)) { setError('admin.anniversary_ui.invalid_lunar_year'); return; }
    if (hasSolar && hasYear && (dateCheckLoading || dateCheck?.status !== 'matched')) {
      if (dateCheck?.status === 'mismatch') { setError('admin.anniversary_ui.date_mismatch'); return; }
      if (dateCheckError === 'admin.anniversary_ui.invalid_lunar_date') { setError(dateCheckError); return; }
      if (!dateCheckError) { setError('admin.anniversary_ui.date_check_pending'); return; }
    }

    setIsSaving(true);
    try {
      await onSubmit({
        eventType, title: title.trim(), relatedMemberId: relatedMemberId ? Number(relatedMemberId) : null,
        lunarDay: day, lunarMonth: month, isLeapMonth,
        originalSolarDate: hasSolar ? solarDateValue : null, lunarYear: hasYear ? year : null,
        place: place.trim() || null, host: host.trim() || null, notes: notes.trim() || null,
      });
    } catch (saveError) {
      const code = errorCode(saveError);
      setError(code === 'FAMILY_ANNIVERSARY_DATE_MISMATCH' ? 'admin.anniversary_ui.date_mismatch'
        : code === 'FAMILY_ANNIVERSARY_INVALID_LUNAR_DATE' ? 'admin.anniversary_ui.invalid_lunar_date'
          : code === 'FAMILY_ANNIVERSARY_ORIGINAL_DATE_REQUIRED' ? 'admin.anniversary_ui.original_date_required'
            : 'admin.anniversary_ui.save_failed');
    } finally { setIsSaving(false); }
  };

  const dateFormat = new Intl.DateTimeFormat(language === 'vi' ? 'vi-VN' : 'en-US', { dateStyle: 'long', timeZone: 'UTC' });
  const formatIsoDate = (isoDate: string) => dateFormat.format(new Date(`${isoDate}T12:00:00Z`));
  const ariaLabel = t(anniversary ? 'admin.anniversary_ui.edit_title' : 'admin.anniversary_ui.add_title');

  return <Modal isOpen showTitle={false} ariaLabel={ariaLabel}
    onClose={() => { if (!isSaving) onClose(); }} closeOnBackdropClick={!isSaving} closeOnEsc={!isSaving} maxWidth="xl"
    footer={<div className="flex w-full items-center justify-end gap-3">
      <Button type="button" variant="secondary" disabled={isSaving} onClick={onClose}>{t('admin.anniversary_ui.cancel')}</Button>
      <Button type="submit" form="familyAnniversaryForm" isLoading={isSaving}>{t(anniversary ? 'admin.anniversary_ui.save' : 'admin.anniversary_ui.add_action')}</Button>
    </div>}>
    <form id="familyAnniversaryForm" onSubmit={submit} noValidate className="space-y-3">
      <section className="overflow-visible rounded-xl border border-custom-border/70 bg-secondary-bg/30">
        <h2 className="flex items-center gap-2 border-b border-custom-border/50 px-3.5 py-3 text-sm font-semibold text-primary-text">
          <Users size={16} className="text-accent" aria-hidden="true" />{t('admin.anniversary_ui.event_information')}
        </h2>
        <div className="grid grid-cols-1 gap-3 p-3.5 sm:grid-cols-2">
          <Select appearance="simple" label={t('admin.anniversary_ui.event_type')} value={eventType} disabled={isSaving}
            onValueChange={value => { setEventType(value as AnniversaryEventType); setError(null); }}>
            <SelectItem value="DEATH_ANNIVERSARY">{t('admin.anniversary_ui.death_anniversary')}</SelectItem>
            <SelectItem value="FAMILY_EVENT">{t('admin.anniversary_ui.family_event')}</SelectItem>
          </Select>
          <Select appearance="simple" label={t('admin.anniversary_ui.related_member')} value={relatedMemberId || undefined} disabled={isSaving}
            placeholder={t('admin.anniversary_ui.no_related_member')}
            onValueChange={value => setRelatedMemberId(value === NO_RELATED_MEMBER ? '' : value)}>
            <SelectItem value={NO_RELATED_MEMBER}>{t('admin.anniversary_ui.no_related_member')}</SelectItem>
            {members.map(member => <SelectItem key={member.id} value={String(member.id)}>{member.fullName}</SelectItem>)}
          </Select>
          <Input containerClassName="sm:col-span-2" label={t('admin.anniversary_ui.title')} value={title} maxLength={200} disabled={isSaving}
            error={error === 'admin.anniversary_ui.invalid_title' ? t(error) : null} onChange={event => setTitle(event.target.value)} />
        </div>
      </section>

      <section className="overflow-visible rounded-xl border border-custom-border/70 bg-secondary-bg/30">
        <h2 className="flex items-center gap-2 border-b border-custom-border/50 px-3.5 py-3 text-sm font-semibold text-primary-text">
          {isDeathAnniversary ? <CalendarClock size={16} className="text-accent" aria-hidden="true" /> : <CalendarDays size={16} className="text-accent" aria-hidden="true" />}
          {t(isDeathAnniversary ? 'admin.anniversary_ui.date_of_death' : 'admin.anniversary_ui.event_date')}
        </h2>
        <div className="space-y-3.5 p-3.5">
          <DateInput label={t(isDeathAnniversary ? 'admin.anniversary_ui.solar_death_date' : 'admin.anniversary_ui.solar_event_date')}
            value={originalSolarDate} onValueChange={value => { setOriginalSolarDate(value); setDateCheck(null); setError(null); }} disabled={isSaving} />
          <div>
            <p className="mb-2 text-xs font-semibold text-secondary-text">{t(isDeathAnniversary ? 'admin.anniversary_ui.lunar_death_date' : 'admin.anniversary_ui.lunar_event_date')}</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Input label={t('admin.anniversary_ui.lunar_day')} type="number" inputMode="numeric" min={1} max={30} value={lunarDay} disabled={isSaving}
                onChange={event => { setLunarDay(event.target.value); setDateCheck(null); setError(null); }} />
              <Input label={t('admin.anniversary_ui.lunar_month')} type="number" inputMode="numeric" min={1} max={12} value={lunarMonth} disabled={isSaving}
                onChange={event => { setLunarMonth(event.target.value); setDateCheck(null); setError(null); }} />
              <Input containerClassName="col-span-2 sm:col-span-1" label={t('admin.anniversary_ui.lunar_year')} type="number" inputMode="numeric" min={1800} max={2200} value={lunarYear} disabled={isSaving}
                onChange={event => { setLunarYear(event.target.value); setDateCheck(null); setError(null); }} />
            </div>
          </div>
          <label className="flex w-fit cursor-pointer items-center gap-2 rounded-lg px-1 py-1 text-sm text-primary-text">
            <input type="checkbox" checked={isLeapMonth} disabled={isSaving} onChange={event => { setIsLeapMonth(event.target.checked); setDateCheck(null); setError(null); }} />
            {t('admin.anniversary_ui.leap_month')}
          </label>

          <div className="space-y-2 rounded-xl border border-custom-border bg-primary-bg p-3 text-sm" aria-live="polite">
            {dateCheckLoading ? <p className="flex items-center gap-2 text-secondary-text"><Loader2 size={14} className="animate-spin" />{t('admin.anniversary_ui.checking_dates')}</p>
              : dateCheck?.status === 'matched' ? <p className="font-medium text-emerald-600 dark:text-emerald-400">✓ {t('admin.anniversary_ui.dates_match')}</p>
                : dateCheck?.status === 'mismatch' ? <p role="alert" className="text-sm text-error">{t('admin.anniversary_ui.date_mismatch')} {dateCheck.convertedDate && <span>{t('admin.anniversary_ui.converted_date', { date: formatIsoDate(dateCheck.convertedDate) })}</span>}</p>
                  : dateCheckError ? <p role="alert" className="text-sm text-error">{t(dateCheckError)}</p>
                    : <p className="text-xs text-secondary-text">{t('admin.anniversary_ui.date_pair_hint')}</p>}
          </div>

          <div className="rounded-xl border border-custom-border bg-primary-bg p-3 text-sm" aria-live="polite">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-secondary-text">
              <CalendarDays size={14} aria-hidden="true" />{t('admin.anniversary_ui.next_occurrence')}
            </div>
            {occurrenceLoading ? <p className="mt-2 flex items-center gap-2 text-sm text-secondary-text"><Loader2 size={14} className="animate-spin" />{t('admin.anniversary_ui.preview_loading')}</p>
              : occurrenceError ? <p role="alert" className="mt-2 text-sm text-error">{t(occurrenceError)}</p>
                : occurrence ? <div className="mt-1.5">
                  <strong className="text-base text-primary-text">{occurrence.daysUntil === 0 ? t('admin.anniversary_ui.today') : formatIsoDate(occurrence.date)}</strong>
                  <p className="mt-0.5 text-xs text-secondary-text">{occurrence.daysUntil === 0 ? t('admin.anniversary_ui.today') : t('admin.anniversary_ui.days_left', { count: occurrence.daysUntil })}</p>
                  {occurrence.daysUntil > 0 && <p className="mt-1 text-xs text-secondary-text">{t(occurrence.isCurrentYearPassed ? 'admin.anniversary_ui.current_year_passed' : 'admin.anniversary_ui.current_year_upcoming', { date: formatIsoDate(occurrence.date) })}</p>}
                </div> : <p className="mt-1.5 text-xs text-secondary-text">{t('admin.anniversary_ui.enter_lunar_date')}</p>}
          </div>
        </div>
      </section>

      <section className="overflow-visible rounded-xl border border-custom-border/70 bg-secondary-bg/30">
        <h2 className="flex items-center gap-2 border-b border-custom-border/50 px-3.5 py-3 text-sm font-semibold text-primary-text">
          <Plus size={16} className="text-accent" aria-hidden="true" />{t('admin.anniversary_ui.organization_notes')}
        </h2>
        <div className="space-y-3 p-3.5">
          <Input label={t('admin.anniversary_ui.place')} value={place} maxLength={500} disabled={isSaving} onChange={event => setPlace(event.target.value)} />
          <Input label={t('admin.anniversary_ui.host')} value={host} maxLength={300} disabled={isSaving} onChange={event => setHost(event.target.value)} />
          <Textarea label={t('admin.anniversary_ui.notes')} rows={3} maxLength={2000} value={notes} disabled={isSaving} onChange={event => setNotes(event.target.value)} />
        </div>
      </section>
      {error && <p role="alert" className="text-sm text-error">{t(error)}</p>}
    </form>
  </Modal>;
}
