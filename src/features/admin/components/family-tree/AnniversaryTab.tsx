import { useCallback, useEffect, useMemo, useState } from 'react';
import { BellRing, CalendarDays, Loader2, MapPin, Pencil, Plus, Trash2, Users } from 'lucide-react';
import { Button, Card, Modal } from '@/shared/components/ui';
import { SearchBar } from '@/shared/components/SearchBar';
import { useLanguage } from '@/shared/hooks/useLanguage';
import { anniversaryService, type FamilyAnniversary, type FamilyAnniversaryPayload } from '../../services/anniversaryService';
import { FamilyAnniversaryModal } from './FamilyAnniversaryModal';
import { removeVietnameseTones, type FamilyMember } from './types';

interface Props {
  showToast: (text: string, ok: boolean) => void;
  members: FamilyMember[];
}

export const AnniversaryTab: React.FC<Props> = ({ showToast, members }) => {
  const { t, language } = useLanguage();
  const [items, setItems] = useState<FamilyAnniversary[]>([]);
  const [search, setSearch] = useState('');
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

  const filtered = useMemo(() => {
    const query = removeVietnameseTones(search.trim()).toLocaleLowerCase();
    if (!query) return items;
    return items.filter(item => [item.title, item.relatedMemberName, item.place, item.host, item.notes]
      .some(value => value && removeVietnameseTones(value).toLocaleLowerCase().includes(query)));
  }, [items, search]);

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

  const dateFormat = new Intl.DateTimeFormat(language === 'vi' ? 'vi-VN' : 'en-US', { dateStyle: 'long', timeZone: 'UTC' });
  const upcoming = items[0];
  const eventLabel = (item: FamilyAnniversary) => t(item.eventType === 'DEATH_ANNIVERSARY' ? 'admin.anniversary_ui.death_anniversary' : 'admin.anniversary_ui.family_event');
  const upcomingBadge = loading
    ? t('admin.anniversary_ui.banner_loading')
    : loadError
      ? t('admin.anniversary_ui.banner_unavailable')
      : upcoming
        ? upcoming.daysUntil === 0
          ? t('admin.anniversary_ui.banner_today', { title: upcoming.title })
          : t('admin.anniversary_ui.banner_upcoming', { title: upcoming.title, count: upcoming.daysUntil })
        : t('admin.anniversary_ui.banner_empty');

  return <div className="flex-1 flex flex-col overflow-y-auto p-4 md:p-6 custom-scrollbar space-y-6">
    <section className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 md:p-6 shadow-sm space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
            <BellRing size={22} aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-primary-text mb-1">{t('admin.anniversary_ui.banner_title')}</h3>
            <p className="text-secondary-text text-sm">{t('admin.anniversary_ui.banner_desc')}</p>
          </div>
        </div>
        <div aria-live="polite" className="max-w-full lg:max-w-[min(42vw,34rem)] rounded-full border border-amber-500/30 bg-secondary-bg/80 px-4 py-2 text-sm font-semibold text-primary-text truncate">
          {upcomingBadge}
        </div>
      </div>
      <div className="flex flex-col sm:flex-row items-stretch gap-3 sm:justify-end">
        <SearchBar className="w-full sm:flex-1 sm:max-w-md" ariaLabel={t('admin.anniversary_ui.search')}
          placeholder={t('admin.anniversary_ui.search')} value={search} onChange={setSearch} />
        <Button className="min-h-11 w-full sm:w-auto" leftIcon={<Plus size={17} />} onClick={() => setEditing(null)}>{t('admin.anniversary_ui.add')}</Button>
      </div>
    </section>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card padding="sm" className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-accent/10 text-accent flex items-center justify-center"><CalendarDays size={22} /></div>
        <div><p className="text-xs text-secondary-text uppercase font-semibold">{t('admin.anniversary_ui.total')}</p>
          <p className="text-base font-bold text-primary-text">{t('admin.anniversary_ui.event_count', { count: items.length })}</p></div>
      </Card>
      <Card padding="sm" className="flex items-center gap-4 min-w-0">
        <div className="w-12 h-12 shrink-0 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center"><CalendarDays size={22} /></div>
        <div className="min-w-0"><p className="text-xs text-secondary-text uppercase font-semibold">{t('admin.anniversary_ui.nearest')}</p>
          <p className="text-base font-bold text-primary-text truncate">{upcoming?.title ?? t('admin.anniversary_ui.none')}</p>
          {upcoming && <p className="text-xs text-secondary-text">{upcoming.daysUntil === 0 ? t('admin.anniversary_ui.today') : t('admin.anniversary_ui.days_left', { count: upcoming.daysUntil })}</p>}</div>
      </Card>
    </div>

    {loading ? <div role="status" className="flex justify-center items-center gap-2 py-16 text-secondary-text"><Loader2 className="animate-spin" size={20} />{t('admin.anniversary_ui.loading')}</div>
      : loadError ? <div role="alert" className="rounded-2xl border border-error/30 bg-error/5 p-6 text-center">
        <p className="text-primary-text mb-3">{t('admin.anniversary_ui.load_failed')}</p>
        <Button className="min-h-11" variant="outline" onClick={() => void load()}>{t('admin.anniversary_ui.retry')}</Button>
      </div>
      : filtered.length === 0 ? <div className="rounded-2xl border border-dashed border-custom-border bg-secondary-bg/50 p-10 text-center">
        <CalendarDays className="mx-auto mb-3 text-secondary-text" size={30} />
        <p className="font-semibold text-primary-text">{search ? t('admin.anniversary_ui.no_results') : t('admin.anniversary_ui.empty')}</p>
        {!search && <p className="mt-1 text-sm text-secondary-text">{t('admin.anniversary_ui.empty_desc')}</p>}
        {!search && <Button className="mt-4 min-h-11" leftIcon={<Plus size={16} />} onClick={() => setEditing(null)}>{t('admin.anniversary_ui.add_first')}</Button>}
      </div>
      : <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map(item => <article key={item.id} className="bg-secondary-bg border border-custom-border rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${item.daysUntil === 0 ? 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' : 'text-accent bg-accent/10 border-accent/20'}`}>
                {item.daysUntil === 0 ? t('admin.anniversary_ui.today') : t('admin.anniversary_ui.days_left', { count: item.daysUntil })}
              </span>
              <h4 className="text-lg font-bold text-primary-text mt-2 break-words">{item.title}</h4>
              <p className="text-xs text-secondary-text mt-0.5">{item.relatedMemberName ? `${item.relatedMemberName}${item.relatedMemberGeneration ? ` · ${t('admin.generation')} ${item.relatedMemberGeneration}` : ''}${item.relatedMemberRole ? ` · ${item.relatedMemberRole}` : ''}` : eventLabel(item)}</p>
            </div>
            <div className="text-right shrink-0 bg-primary-bg px-3 py-2 rounded-xl border border-custom-border">
              <p className="text-xs font-semibold text-accent">{t('admin.anniversary_ui.lunar_date', { day: item.lunarDay, month: item.lunarMonth })}{item.isLeapMonth ? ` · ${t('admin.anniversary_ui.leap_month_short')}` : ''}</p>
              <p className="text-[11px] text-secondary-text mt-0.5">{dateFormat.format(new Date(`${item.nextSolarDate}T12:00:00Z`))}</p>
            </div>
          </div>
          <p className="text-xs text-secondary-text">{eventLabel(item)}</p>
          {(item.place || item.host) && <div className="space-y-2 text-xs text-secondary-text border-t border-custom-border/60 pt-3">
            {item.place && <div className="flex items-start gap-2"><MapPin size={15} className="text-accent shrink-0 mt-0.5" /><span><strong className="text-primary-text">{t('admin.anniversary_place')}</strong> {item.place}</span></div>}
            {item.host && <div className="flex items-start gap-2"><Users size={15} className="text-blue-400 shrink-0 mt-0.5" /><span><strong className="text-primary-text">{t('admin.anniversary_host')}</strong> {item.host}</span></div>}
          </div>}
          {item.notes && <p className="bg-primary-bg/70 p-3 rounded-xl border border-custom-border text-xs text-secondary-text whitespace-pre-wrap">{item.notes}</p>}
          <div className="flex justify-end gap-2 border-t border-custom-border/60 pt-3">
            <Button className="min-h-11" variant="ghost" leftIcon={<Pencil size={14} />} onClick={() => setEditing(item)}>{t('admin.anniversary_ui.edit')}</Button>
            <Button className="min-h-11 text-error hover:text-error" variant="ghost" leftIcon={<Trash2 size={14} />} onClick={() => setDeleting(item)}>{t('admin.anniversary_ui.delete')}</Button>
          </div>
        </article>)}
      </div>}

    {editing !== undefined && <FamilyAnniversaryModal anniversary={editing ?? undefined} members={members} onClose={() => setEditing(undefined)} onSubmit={save} />}
    <Modal isOpen={!!deleting} title={t('admin.anniversary_ui.delete_title')} onClose={() => !isDeleting && setDeleting(null)} maxWidth="sm" closeOnBackdropClick={!isDeleting} closeOnEsc={!isDeleting}>
      <div className="space-y-5"><p className="text-sm text-secondary-text">{t('admin.anniversary_ui.delete_confirm', { title: deleting?.title ?? '' })}</p>
        <div className="flex justify-end gap-3"><Button className="min-h-11" variant="secondary" disabled={isDeleting} onClick={() => setDeleting(null)}>{t('admin.anniversary_ui.cancel')}</Button>
          <Button className="min-h-11" variant="danger" isLoading={isDeleting} onClick={() => void confirmDelete()}>{t('admin.anniversary_ui.delete')}</Button></div></div>
    </Modal>
  </div>;
};
