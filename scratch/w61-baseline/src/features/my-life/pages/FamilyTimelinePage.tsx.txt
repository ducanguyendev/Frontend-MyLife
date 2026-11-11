import { Plus } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, PageHeader, ErrorState, EmptyState, ConfirmDialog } from '@/shared/components/ui';
import { useLanguage } from '@/shared/hooks/useLanguage';
import { useWorkspaceToast } from '@/shared/hooks/useWorkspaceToast';
import { MyLifeWorkspaceLayout } from '@/shared/layouts/MyLifeWorkspaceLayout';
import { deleteFamilyTimelineEvent, fetchFamilyMembers, fetchFamilyTimeline, saveFamilyTimelineEvent, type FamilyTimelineEvent, type FamilyTimelineWrite } from '@/features/admin/services/familyV2Service';
import type { FamilyMember } from '@/features/admin/components/family-tree/types';
import { TimelineEventModal } from '@/features/my-life/components/TimelineEventModal';
import { TimelineFilterBar } from '@/features/my-life/components/timeline/TimelineFilterBar';
import { TimelineYearSection } from '@/features/my-life/components/timeline/TimelineYearSection';
import { groupTimelineEventsByYear } from '@/features/my-life/components/timeline/timelineUtils';
import { getDefaultEventTypeForFilter, isDerivedOnlyEventType, matchesTimelineFilter, type Filter } from '@/features/my-life/components/timeline/types';
import { formatTimelineDate } from '@/features/my-life/components/timeline/timelinePresentation';
import { TimelineYearRail } from '../components/timeline/TimelineYearRail';
import { MemorySkeleton } from '../components/memories/MemorySkeleton';
import '../components/memories/Memories.css';

const blank = (eventType: NonNullable<ReturnType<typeof getDefaultEventTypeForFilter>> = 'CUSTOM'): FamilyTimelineWrite => ({ memberId: null, eventType, title: '', description: null, eventDate: null, eventYear: null, isApproximate: false, location: null, latitude: null, longitude: null, relatedMemberId: null });

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
  const [pendingDelete, setPendingDelete] = useState<FamilyTimelineEvent | null>(null);
  const closeForm = () => { if (saving) return; setForm(null); setEditingId(undefined); };
  const defaultEventType = getDefaultEventTypeForFilter(filter);
  const openCreateModal = () => {
    if (!defaultEventType) return;
    setEditingId(undefined);
    setForm(blank(defaultEventType));
  };

  const load = useCallback(async (signal?: AbortSignal) => {
    try { const [data, people] = await Promise.all([fetchFamilyTimeline(signal), fetchFamilyMembers(signal)]); if (!signal?.aborted) { setEvents(data); setMembers(people); setError(false); } }
    catch { if (!signal?.aborted) setError(true); }
    finally { if (!signal?.aborted) setLoading(false); }
  }, []);
  useEffect(() => { const controller = new AbortController(); void load(controller.signal); return () => controller.abort(); }, [load]);

  const filtered = useMemo(() => events.filter(event => matchesTimelineFilter(event.eventType, filter)), [events, filter]);
  const yearGroups = useMemo(() => groupTimelineEventsByYear(filtered), [filtered]);
  const beginEdit = (event: FamilyTimelineEvent) => {
    if (event.isDerived || isDerivedOnlyEventType(event.eventType)) return;
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
    if (event.isDerived || isDerivedOnlyEventType(event.eventType)) return;
    try { await deleteFamilyTimelineEvent(event.id); await load(); toast(t('admin.family_v2.event_deleted'), true); }
    catch { toast(t('admin.family_v2.event_delete_error'), false); }
  };
  const dateLabel = (event: FamilyTimelineEvent) => event.eventDate
    ? formatTimelineDate(event.eventDate, language)
    : event.eventYear ? (event.isApproximate ? t('admin.family_v2.approximate_year', { year: event.eventYear }) : String(event.eventYear)) : t('admin.family_v2.unknown_date');

  return <MyLifeWorkspaceLayout backTo="/mylife" showDock>
    <div className="memory-page memory-page--timeline">
      <PageHeader eyebrow={t('appShell.memories')} title={t('appShell.timeline')} description={t('memories.timelineDescription')} actions={defaultEventType && (events.length > 0 || loading || error) ? <Button leftIcon={<Plus size={16}/>} onClick={openCreateModal}>{t('admin.family_v2.add_event')}</Button> : undefined}/>
      <div className="memory-toolbar"><TimelineFilterBar value={filter} onChange={setFilter} label={t('admin.family_v2.timeline_filters')} translate={t}/></div>
      {filter === 'BIRTH' && <p className="m-0 text-sm text-secondary-text" role="status">{t('admin.family_v2.birth_death_auto_hint')}</p>}
      {filter === 'OTHER' && <p className="m-0 text-sm text-secondary-text" role="status">{t('admin.family_v2.other_events_readonly_hint')}</p>}
      {loading ? <MemorySkeleton module="timeline"/>
        : error ? <ErrorState message={t('admin.family_v2.timeline_error')} action={<Button variant="secondary" onClick={() => { setLoading(true); void load(); }}>{t('admin.family_v2.retry')}</Button>}/>
          : filtered.length === 0 ? <EmptyState title={t(events.length ? 'memories.noTimelineResults' : 'memories.emptyTimeline')} description={t(events.length ? 'memories.clearTimelineFilters' : 'memories.emptyTimelineDescription')} action={events.length ? <Button variant="secondary" onClick={() => setFilter('ALL')}>{t('memories.clearFilters')}</Button> : defaultEventType ? <Button onClick={openCreateModal}>{t('admin.family_v2.add_event')}</Button> : undefined}/>
            : <div className="timeline-layout"><TimelineYearRail groups={yearGroups}/><div className="timeline-years">{yearGroups.map(group => <TimelineYearSection key={group.year ?? 'unknown'} group={group} unknown={t('admin.family_v2.unknown_date')} dateLabel={dateLabel} onEdit={beginEdit} onDelete={setPendingDelete} translate={t} members={members}/>)}</div></div>}
    </div>
    {form && <TimelineEventModal isOpen form={form} members={members} editing={editingId !== undefined} saving={saving}
      onClose={closeForm} onSubmit={event => void save(event)} onChange={setForm} />}
    <ConfirmDialog isOpen={!!pendingDelete} title={t('memories.deleteEventTitle')} confirmLabel={t('admin.family_v2.delete_event')} cancelLabel={t('admin.cancel')} onClose={() => setPendingDelete(null)} onConfirm={() => { if (pendingDelete) void remove(pendingDelete); setPendingDelete(null); }}>{t('memories.deleteEventDescription', { title:pendingDelete?.title ?? '' })}</ConfirmDialog>
  </MyLifeWorkspaceLayout>;
};
