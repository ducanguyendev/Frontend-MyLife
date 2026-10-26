import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, FloatingAddButton } from '@/shared/components/ui';
import { useLanguage } from '@/shared/hooks/useLanguage';
import { useWorkspaceToast } from '@/shared/hooks/useWorkspaceToast';
import { MyLifeWorkspaceLayout } from '@/shared/layouts/MyLifeWorkspaceLayout';
import { deleteFamilyTimelineEvent, fetchFamilyMembers, fetchFamilyTimeline, saveFamilyTimelineEvent, type FamilyTimelineEvent, type FamilyTimelineWrite } from '@/features/admin/services/familyV2Service';
import type { FamilyMember } from '@/features/admin/components/family-tree/types';
import { TimelineEventModal } from '@/features/my-life/components/TimelineEventModal';
import { TimelineFilterBar } from '@/features/my-life/components/timeline/TimelineFilterBar';
import { TimelineYearSection } from '@/features/my-life/components/timeline/TimelineYearSection';
import { groupTimelineEventsByYear } from '@/features/my-life/components/timeline/timelineUtils';
import { FILTER_TYPES, type Filter } from '@/features/my-life/components/timeline/types';

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
  const yearGroups = useMemo(() => groupTimelineEventsByYear(filtered), [filtered]);
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
      <TimelineFilterBar value={filter} onChange={setFilter} label={t('admin.family_v2.timeline_filters')} translate={t} />
      {loading ? <div role="status" className="p-10 text-center text-secondary-text">{t('admin.family_v2.loading_timeline')}</div>
        : error ? <div role="alert" className="p-10 text-center text-secondary-text">{t('admin.family_v2.timeline_error')} <Button variant="secondary" onClick={() => { setLoading(true); void load(); }}>{t('admin.family_v2.retry')}</Button></div>
          : filtered.length === 0 ? <p className="rounded-2xl border border-custom-border p-10 text-center text-secondary-text">{t('admin.family_v2.empty_timeline')}</p>
            : <div className="space-y-7">{yearGroups.map(group => <TimelineYearSection key={group.year ?? 'unknown'} group={group} unknown={t('admin.family_v2.unknown_date')} dateLabel={dateLabel} onEdit={beginEdit} onDelete={event => void remove(event)} translate={t} />)}</div>}
    </main>
    {form && <TimelineEventModal isOpen form={form} members={members} editing={editingId !== undefined} saving={saving}
      onClose={closeForm} onSubmit={event => void save(event)} onChange={setForm} />}
  </MyLifeWorkspaceLayout>;
};
