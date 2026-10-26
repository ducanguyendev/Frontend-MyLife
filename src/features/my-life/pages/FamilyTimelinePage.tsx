import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { MapPin, Trash2 } from 'lucide-react';
import { Button, FloatingAddButton } from '@/shared/components/ui';
import { useLanguage } from '@/shared/hooks/useLanguage';
import { useWorkspaceToast } from '@/shared/hooks/useWorkspaceToast';
import { MyLifeWorkspaceLayout } from '@/shared/layouts/MyLifeWorkspaceLayout';
import { deleteFamilyTimelineEvent, fetchFamilyMembers, fetchFamilyTimeline, saveFamilyTimelineEvent, type FamilyTimelineEvent, type FamilyTimelineWrite } from '@/features/admin/services/familyV2Service';
import type { FamilyMember } from '@/features/admin/components/family-tree/types';
import { TimelineEventModal } from '@/features/my-life/components/TimelineEventModal';

type Filter = 'ALL' | 'BIRTH' | 'MARRIAGE' | 'FAMILY' | 'LOCATION' | 'MEMORY' | 'OTHER';
const FILTER_TYPES: Record<Filter, string[]> = { ALL: [], BIRTH: ['BIRTH', 'DEATH'], MARRIAGE: ['MARRIAGE'], FAMILY: ['CHILD_BIRTH', 'CUSTOM'], LOCATION: ['ADDRESS_CHANGE'], MEMORY: ['MEMORY', 'ANNIVERSARY'], OTHER: [] };
const blank = (): FamilyTimelineWrite => ({ memberId: null, eventType: 'CUSTOM', title: '', description: null, eventDate: null, eventYear: null, isApproximate: false, location: null, latitude: null, longitude: null, relatedMemberId: null });

export const FamilyTimelinePage: React.FC = () => {
  const { t, language } = useLanguage();
  const toast = useWorkspaceToast();
  const [events, setEvents] = useState<FamilyTimelineEvent[]>([]);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [form, setForm] = useState<FamilyTimelineWrite | null>(null);
  const [editingId, setEditingId] = useState<number | undefined>();
  const [saving, setSaving] = useState(false);
  const closeForm = () => { if (saving) return; setForm(null); setEditingId(undefined); };
  const openCreateModal = () => { setEditingId(undefined); setForm(blank()); };

  const load = useCallback(async (signal?: AbortSignal) => {
    try { const [data, people] = await Promise.all([fetchFamilyTimeline(signal), fetchFamilyMembers(signal)]); if (!signal?.aborted) { setEvents(data); setMembers(people); setError(false); } }
    catch { if (!signal?.aborted) setError(true); }
    finally { if (!signal?.aborted) setLoading(false); }
  }, []);
  useEffect(() => { const controller = new AbortController(); void load(controller.signal); return () => controller.abort(); }, [load]);

  const categorizedTypes = useMemo(() => Object.entries(FILTER_TYPES).filter(([key]) => key !== 'ALL' && key !== 'OTHER').flatMap(([, values]) => values), []);
  const filtered = useMemo(() => events.filter(event => {
    if (filter === 'ALL') return true;
    if (filter === 'OTHER') return !categorizedTypes.includes(event.eventType);
    return FILTER_TYPES[filter].includes(event.eventType);
  }), [categorizedTypes, events, filter]);
  const beginEdit = (event: FamilyTimelineEvent) => {
    setEditingId(event.id); setForm({ memberId: event.memberId, eventType: event.eventType, title: event.title, description: event.description,
      eventDate: event.eventDate?.slice(0, 10) ?? null, eventYear: event.eventYear, isApproximate: event.isApproximate, location: event.location,
      latitude: event.latitude, longitude: event.longitude, relatedMemberId: event.relatedMemberId });
  };
  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!form) return;
    setSaving(true);
    try { await saveFamilyTimelineEvent({ ...form, title: form.title.trim(), eventYear: form.eventDate ? Number(form.eventDate.slice(0, 4)) : form.eventYear }, editingId); setForm(null); setEditingId(undefined); await load(); toast(t('admin.family_v2.event_saved'), true); }
    catch { toast(t('admin.family_v2.event_save_error'), false); }
    finally { setSaving(false); }
  };
  const remove = async (event: FamilyTimelineEvent) => {
    if (event.isDerived) return;
    try { await deleteFamilyTimelineEvent(event.id); await load(); toast(t('admin.family_v2.event_deleted'), true); }
    catch { toast(t('admin.family_v2.event_delete_error'), false); }
  };
  const dateLabel = (event: FamilyTimelineEvent) => event.eventDate
    ? new Date(`${event.eventDate.slice(0, 10)}T00:00:00Z`).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-GB', { timeZone: 'UTC' })
    : event.eventYear ? `${event.isApproximate ? `${t('admin.family_v2.approximate_date')} ` : ''}${event.eventYear}` : t('admin.family_v2.unknown_date');

  return <MyLifeWorkspaceLayout backTo="/mylife" showDock contentClassName="px-3 py-4 sm:px-5 sm:py-5">
    <main className="mx-auto w-full max-w-5xl space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3"><div className="min-w-0"><p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-accent">MyLife</p><h1 className="m-0 text-2xl font-black text-primary-text sm:text-3xl">{t('admin.family_v2.timeline')}</h1><p className="mt-1 text-sm text-secondary-text">{t('admin.family_v2.timeline_description')}</p></div>
        <div className="flex shrink-0 items-center justify-end"><FloatingAddButton ariaLabel={t('admin.family_v2.add_event')} tooltip={t('admin.family_v2.add_event')} onClick={openCreateModal} /></div>
      </header>
      <div className="flex flex-wrap gap-2" role="group" aria-label={t('admin.family_v2.timeline_filters')}>
        {(Object.keys(FILTER_TYPES) as Filter[]).map(key => <button key={key} type="button" onClick={() => setFilter(key)} aria-pressed={filter === key} className={`rounded-full border px-3 py-1.5 text-sm ${filter === key ? 'border-accent bg-accent/10 text-accent' : 'border-custom-border text-secondary-text'}`}>{t(`admin.family_v2.filter_${key.toLowerCase()}`)}</button>)}
      </div>
      {loading ? <div role="status" className="p-10 text-center text-secondary-text">{t('admin.family_v2.loading_timeline')}</div>
        : error ? <div role="alert" className="p-10 text-center text-secondary-text">{t('admin.family_v2.timeline_error')} <Button variant="secondary" onClick={() => { setLoading(true); void load(); }}>{t('admin.family_v2.retry')}</Button></div>
          : filtered.length === 0 ? <p className="rounded-2xl border border-custom-border p-10 text-center text-secondary-text">{t('admin.family_v2.empty_timeline')}</p>
            : <ol className="m-0 space-y-4 border-l-2 border-accent/25 pl-5 sm:pl-7">{filtered.map(event => <li key={`${event.sourceType}-${event.id}`} className="relative list-none rounded-2xl border border-custom-border bg-secondary-bg p-4 sm:p-5">
              <span className="absolute -left-[1.83rem] top-5 h-3 w-3 rounded-full border-2 border-primary-bg bg-accent sm:-left-[2.33rem]" />
              <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="m-0 text-xs font-semibold text-accent">{dateLabel(event)}</p><h2 className="mb-1 mt-1 break-words text-base font-bold text-primary-text">{event.title}</h2>{event.memberName && <p className="m-0 text-sm text-secondary-text">{event.memberName}</p>}{event.description && <p className="mt-2 whitespace-pre-wrap text-sm text-secondary-text">{event.description}</p>}{event.location && <p className="mt-2 inline-flex items-center gap-1 text-sm text-secondary-text"><MapPin size={14} aria-hidden="true" />{event.location}{event.latitude !== null && event.longitude !== null && <a className="ml-2 text-accent underline" href={`https://www.openstreetmap.org/?mlat=${event.latitude}&mlon=${event.longitude}#map=14/${event.latitude}/${event.longitude}`} target="_blank" rel="noreferrer">{t('admin.family_v2.view_on_map')}</a>}</p>}</div>
                {!event.isDerived && <div className="flex shrink-0 gap-2"><Button variant="secondary" size="sm" onClick={() => beginEdit(event)}>{t('admin.family_v2.edit_event')}</Button><button type="button" onClick={() => void remove(event)} aria-label={t('admin.family_v2.delete_event')} className="rounded-lg border border-custom-border p-2 text-secondary-text hover:text-error"><Trash2 size={16} /></button></div>}</div>
              </li>)}</ol>}
    </main>
    {form && <TimelineEventModal isOpen form={form} members={members} editing={editingId !== undefined} saving={saving}
      onClose={closeForm} onSubmit={event => void save(event)} onChange={setForm} />}
  </MyLifeWorkspaceLayout>;
};
