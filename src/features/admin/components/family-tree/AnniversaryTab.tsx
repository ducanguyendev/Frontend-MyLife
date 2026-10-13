import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Loader2, MapPin, Pencil, Plus, RotateCcw, Trash2, Users, X } from 'lucide-react';
import { Button, Modal } from '@/shared/components/ui';
import { SearchBar } from '@/shared/components/SearchBar';
import { useLanguage } from '@/shared/hooks/useLanguage';
import { anniversaryService, type FamilyAnniversary, type FamilyAnniversaryPayload } from '../../services/anniversaryService';
import { FamilyAnniversaryModal } from './FamilyAnniversaryModal';
import { removeVietnameseTones, type FamilyMember } from './types';
import { anniversaryDateKey, anniversaryDateParts, getAnniversaryMonthGrid, getVietnamTodayKey } from './anniversaryCalendarUtils';

interface Props {
  showToast: (text: string, ok: boolean) => void;
  members: FamilyMember[];
}

export const AnniversaryTab: React.FC<Props> = ({ showToast, members }) => {
  const { t, language } = useLanguage();
  const [items, setItems] = useState<FamilyAnniversary[]>([]);
  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [visibleMonth, setVisibleMonth] = useState<{ year: number; month: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [editing, setEditing] = useState<FamilyAnniversary | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<FamilyAnniversary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setLoadError(false);
    try {
      const data = await anniversaryService.getAnniversaries(signal);
      if (!signal?.aborted) setItems(data);
    } catch {
      if (!signal?.aborted) setLoadError(true);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const firstDate = items.length ? anniversaryDateParts(items[0].nextSolarDate) : null;
  const todayKey = getVietnamTodayKey();
  const today = anniversaryDateParts(todayKey)!;
  const currentMonth = visibleMonth ?? (firstDate ? { year: firstDate.year, month: firstDate.month } : { year: today.year, month: today.month });
  const cells = useMemo(() => getAnniversaryMonthGrid(currentMonth.year, currentMonth.month), [currentMonth.year, currentMonth.month]);
  const monthLabel = new Intl.DateTimeFormat(language === 'vi' ? 'vi-VN' : 'en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(currentMonth.year, currentMonth.month, 1, 12)));
  const fullDateFormat = new Intl.DateTimeFormat(language === 'vi' ? 'vi-VN' : 'en-US', { dateStyle: 'full', timeZone: 'UTC' });
  const dateFormat = new Intl.DateTimeFormat(language === 'vi' ? 'vi-VN' : 'en-US', { dateStyle: 'long', timeZone: 'UTC' });
  const weekdayLabels = Array.from({ length: 7 }, (_, index) => new Intl.DateTimeFormat(language === 'vi' ? 'vi-VN' : 'en-US', { weekday: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(2024, 0, index + 1, 12))));
  const eventsByDate = useMemo(() => {
    const grouped = new Map<string, FamilyAnniversary[]>();
    for (const item of items) {
      const parts = anniversaryDateParts(item.nextSolarDate);
      if (!parts) continue;
      const key = anniversaryDateKey(parts.year, parts.month, parts.day);
      grouped.set(key, [...(grouped.get(key) ?? []), item]);
    }
    return grouped;
  }, [items]);

  const filtered = useMemo(() => {
    const query = removeVietnameseTones(search.trim()).toLocaleLowerCase();
    const textFiltered = query ? items.filter(item => [item.title, item.relatedMemberName, item.place, item.host, item.notes]
      .some(value => value && removeVietnameseTones(value).toLocaleLowerCase().includes(query))) : items;
    return selectedDate ? textFiltered.filter(item => {
      const parts = anniversaryDateParts(item.nextSolarDate);
      return parts && anniversaryDateKey(parts.year, parts.month, parts.day) === selectedDate;
    }) : textFiltered;
  }, [items, search, selectedDate]);

  const moveMonth = (delta: number) => {
    const next = new Date(Date.UTC(currentMonth.year, currentMonth.month + delta, 1));
    setVisibleMonth({ year: next.getUTCFullYear(), month: next.getUTCMonth() });
  };
  const selectDay = (key: string) => setSelectedDate(current => current === key ? null : key);
  const clearDateFilter = () => setSelectedDate(null);

  const save = async (payload: FamilyAnniversaryPayload) => {
    if (editing) await anniversaryService.updateAnniversary(editing.id, payload);
    else await anniversaryService.createAnniversary(payload);
    setEditing(undefined);
    await load();
    showToast(t(editing ? 'admin.anniversary_ui.updated' : 'admin.anniversary_ui.created'), true);
  };

  const confirmDelete = async () => {
    if (!deleting || isDeleting) return;
    setIsDeleting(true);
    try {
      await anniversaryService.deleteAnniversary(deleting.id);
      setItems(current => current.filter(item => item.id !== deleting.id));
      setDeleting(null);
      showToast(t('admin.anniversary_ui.deleted'), true);
    } catch {
      showToast(t('admin.anniversary_ui.delete_failed'), false);
    } finally {
      setIsDeleting(false);
    }
  };

  const eventLabel = (item: FamilyAnniversary) => t(item.eventType === 'DEATH_ANNIVERSARY' ? 'admin.anniversary_ui.death_anniversary' : 'admin.anniversary_ui.family_event');
  const hasFilters = Boolean(search.trim() || selectedDate);

  return <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain p-3 custom-scrollbar xl:overflow-hidden sm:p-4">
    <header className="mb-3 flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-xl font-black tracking-tight text-primary-text sm:text-2xl">{t('myLife.modules.anniversaries.title')}</h1>
        <p className="mt-0.5 text-xs text-secondary-text sm:text-sm">{t('myLife.modules.anniversaries.description')}</p>
      </div>
      <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto sm:min-w-[22rem]">
        <SearchBar className="min-w-0 flex-1" ariaLabel={t('admin.anniversary_ui.search')} placeholder={t('admin.anniversary_ui.search')} value={search} onChange={setSearch} />
        <Button className="min-h-10 shrink-0 px-3" leftIcon={<Plus size={16} />} onClick={() => setEditing(null)}>{t('admin.anniversary_ui.add')}</Button>
      </div>
    </header>

    <main className="flex min-h-0 flex-1 flex-col gap-3 xl:grid xl:grid-cols-[minmax(290px,0.4fr)_minmax(0,0.6fr)]">
      <section aria-label={t('admin.anniversary_ui.calendar')} className="shrink-0 rounded-2xl border border-custom-border bg-secondary-bg p-3 sm:p-4 xl:flex xl:min-h-0 xl:flex-col">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <CalendarDays size={18} className="shrink-0 text-accent" aria-hidden="true" />
            <h2 className="truncate font-bold capitalize text-primary-text">{monthLabel}</h2>
            <span className="hidden rounded-full bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent sm:inline-flex">{t('admin.anniversary_ui.event_count', { count: items.length })}</span>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button variant="ghost" className="min-h-9 px-2" aria-label={t('admin.anniversary_ui.previous_month')} onClick={() => moveMonth(-1)}><ChevronLeft size={18} /></Button>
            <Button variant="ghost" className="min-h-9 px-2" aria-label={t('admin.anniversary_ui.next_month')} onClick={() => moveMonth(1)}><ChevronRight size={18} /></Button>
            <Button variant="outline" className="min-h-9 px-2 text-xs" leftIcon={<RotateCcw size={13} />} onClick={() => { setVisibleMonth({ year: today.year, month: today.month }); clearDateFilter(); }}>{t('admin.anniversary_ui.today')}</Button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1" role="grid" aria-label={monthLabel}>
          {weekdayLabels.map((label, index) => <div key={`${label}-${index}`} role="columnheader" className="py-1 text-center text-[10px] font-semibold uppercase text-secondary-text sm:text-xs">{label}</div>)}
          {cells.map(({ year, month, day, inMonth }) => {
            const key = anniversaryDateKey(year, month, day);
            const dayEvents = eventsByDate.get(key) ?? [];
            const isToday = key === todayKey;
            const isSelected = key === selectedDate;
            return <button key={key} type="button" role="gridcell" aria-label={`${fullDateFormat.format(new Date(Date.UTC(year, month, day, 12)))}${dayEvents.length ? `, ${t('admin.anniversary_ui.event_count', { count: dayEvents.length })}` : ''}${isToday ? `, ${t('admin.anniversary_ui.today')}` : ''}`} aria-pressed={isSelected} onClick={() => selectDay(key)} className={`relative flex aspect-square min-h-9 flex-col items-center justify-center rounded-lg text-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 ${inMonth ? 'text-primary-text' : 'text-secondary-text/40'} ${isToday ? 'ring-1 ring-inset ring-accent/50' : ''} ${isSelected ? 'bg-accent text-white shadow-sm' : dayEvents.length ? 'bg-accent/10 font-bold text-accent hover:bg-accent/20' : 'hover:bg-primary-bg'}`}>
              <span>{day}</span>
              {dayEvents.length > 0 && <span aria-hidden="true" className={`absolute bottom-1 flex h-1.5 min-w-1.5 items-center justify-center rounded-full ${isSelected ? 'bg-white' : 'bg-accent'} ${dayEvents.length > 1 ? 'px-1 text-[8px] leading-none text-white' : ''}`}>{dayEvents.length > 1 ? dayEvents.length : ''}</span>}
            </button>;
          })}
        </div>
        <div className="mt-3 flex min-h-6 flex-wrap items-center justify-between gap-2 border-t border-custom-border pt-2 text-xs text-secondary-text">
          <span>{t('admin.anniversary_ui.calendar_solar')}</span>
          {selectedDate && <button type="button" onClick={clearDateFilter} className="inline-flex items-center gap-1 rounded-md px-2 py-1 font-semibold text-accent transition-colors duration-200 hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"><X size={13} />{t('admin.anniversary_ui.clear_date')}</button>}
        </div>
      </section>

      <section aria-labelledby="anniversary-events-heading" className="flex min-h-[18rem] flex-1 flex-col overflow-hidden rounded-2xl border border-custom-border bg-primary-bg xl:min-h-0">
        <header className="flex shrink-0 items-center justify-between gap-2 border-b border-custom-border px-4 py-3">
          <div className="min-w-0">
            <h2 id="anniversary-events-heading" className="font-bold text-primary-text">{t('admin.anniversary_ui.upcoming_events')}</h2>
            <p className="text-xs text-secondary-text">{selectedDate ? dateFormat.format(new Date(`${selectedDate}T12:00:00Z`)) : t('admin.anniversary_ui.event_count', { count: filtered.length })}</p>
          </div>
          {selectedDate && <button type="button" onClick={clearDateFilter} aria-label={t('admin.anniversary_ui.clear_date')} className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-accent transition-colors duration-200 hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"><X size={14} />{t('admin.anniversary_ui.all_events')}</button>}
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 custom-scrollbar sm:p-4">
          {loading ? <div role="status" className="flex min-h-40 items-center justify-center gap-2 text-sm text-secondary-text"><Loader2 className="animate-spin" size={18} />{t('admin.anniversary_ui.loading')}</div>
            : loadError ? <div role="alert" className="flex min-h-40 flex-col items-center justify-center text-center"><p className="mb-3 text-sm text-primary-text">{t('admin.anniversary_ui.load_failed')}</p><Button className="min-h-10" variant="outline" onClick={() => void load()}>{t('admin.anniversary_ui.retry')}</Button></div>
              : filtered.length === 0 ? <div className="flex min-h-40 flex-col items-center justify-center px-4 text-center">
                <CalendarDays className="mb-2 text-secondary-text" size={28} aria-hidden="true" />
                <p className="font-semibold text-primary-text">{selectedDate ? t('admin.anniversary_ui.no_events_date') : hasFilters ? t('admin.anniversary_ui.no_results') : t('admin.anniversary_ui.empty')}</p>
                {!hasFilters && !items.length && <><p className="mt-1 text-sm text-secondary-text">{t('admin.anniversary_ui.empty_desc')}</p><Button className="mt-3 min-h-10" leftIcon={<Plus size={15} />} onClick={() => setEditing(null)}>{t('admin.anniversary_ui.add_first')}</Button></>}
                {hasFilters && <button type="button" onClick={() => { setSearch(''); clearDateFilter(); }} className="mt-2 rounded-md px-2 py-1 text-sm font-semibold text-accent hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50">{t('admin.anniversary_ui.clear_filters')}</button>}
              </div>
                : <div className="space-y-2.5">{filtered.map(item => <article key={item.id} className="rounded-xl border border-custom-border bg-secondary-bg p-3 shadow-sm transition-colors duration-300 hover:border-accent/30 sm:p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${item.daysUntil === 0 ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : item.eventType === 'DEATH_ANNIVERSARY' ? 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400' : 'border-accent/20 bg-accent/10 text-accent'}`}>{item.daysUntil === 0 ? t('admin.anniversary_ui.today') : t('admin.anniversary_ui.days_left', { count: item.daysUntil })}</span>
                        <span className="text-[11px] text-secondary-text">{eventLabel(item)}</span>
                      </div>
                      <h3 className="break-words text-sm font-bold text-primary-text sm:text-base">{item.title}</h3>
                      {item.relatedMemberName && <p className="mt-0.5 truncate text-xs text-secondary-text">{item.relatedMemberName}{item.relatedMemberGeneration ? ` · ${t('admin.generation')} ${item.relatedMemberGeneration}` : ''}{item.relatedMemberRole ? ` · ${item.relatedMemberRole}` : ''}</p>}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs font-bold text-accent">{t('admin.anniversary_ui.lunar_date', { day: item.lunarDay, month: item.lunarMonth })}{item.isLeapMonth ? ` · ${t('admin.anniversary_ui.leap_month_short')}` : ''}</p>
                      <p className="mt-0.5 text-[11px] text-secondary-text">{dateFormat.format(new Date(`${item.nextSolarDate}T12:00:00Z`))}</p>
                    </div>
                  </div>
                  {(item.place || item.host || item.notes) && <div className="mt-2 space-y-1.5 border-t border-custom-border/60 pt-2 text-xs text-secondary-text">
                    {item.place && <p className="flex items-start gap-1.5"><MapPin size={13} className="mt-0.5 shrink-0 text-accent" /><span><strong className="text-primary-text">{t('admin.anniversary_place')}</strong> {item.place}</span></p>}
                    {item.host && <p className="flex items-start gap-1.5"><Users size={13} className="mt-0.5 shrink-0 text-blue-400" /><span><strong className="text-primary-text">{t('admin.anniversary_host')}</strong> {item.host}</span></p>}
                    {item.notes && <p className="whitespace-pre-wrap break-words text-secondary-text">{item.notes}</p>}
                  </div>}
                  <div className="mt-2 flex justify-end gap-1 border-t border-custom-border/60 pt-1.5">
                    <Button className="min-h-9 px-2 text-xs" variant="ghost" leftIcon={<Pencil size={13} />} onClick={() => setEditing(item)}>{t('admin.anniversary_ui.edit')}</Button>
                    <Button className="min-h-9 px-2 text-xs text-error hover:text-error" variant="ghost" leftIcon={<Trash2 size={13} />} onClick={() => setDeleting(item)}>{t('admin.anniversary_ui.delete')}</Button>
                  </div>
                </article>)}</div>}
        </div>
      </section>
    </main>

    {editing !== undefined && <FamilyAnniversaryModal anniversary={editing ?? undefined} members={members} onClose={() => setEditing(undefined)} onSubmit={save} />}
    <Modal isOpen={!!deleting} title={t('admin.anniversary_ui.delete_title')} onClose={() => !isDeleting && setDeleting(null)} maxWidth="sm" closeOnBackdropClick={!isDeleting} closeOnEsc={!isDeleting}>
      <div className="space-y-5"><p className="text-sm text-secondary-text">{t('admin.anniversary_ui.delete_confirm', { title: deleting?.title ?? '' })}</p>
        <div className="flex justify-end gap-3"><Button className="min-h-11" variant="secondary" disabled={isDeleting} onClick={() => setDeleting(null)}>{t('admin.anniversary_ui.cancel')}</Button>
          <Button className="min-h-11" variant="danger" isLoading={isDeleting} onClick={() => void confirmDelete()}>{t('admin.anniversary_ui.delete')}</Button></div></div>
    </Modal>
  </div>;
};
