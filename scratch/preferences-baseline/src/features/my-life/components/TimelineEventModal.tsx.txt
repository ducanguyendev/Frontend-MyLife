import { FormSectionHeader } from '@/shared/components/ui/FormSectionHeader';
import React, { useEffect, useMemo, useState } from 'react';
import { AlignLeft, CalendarClock, FileText } from 'lucide-react';
import { Button, DateInput, formatBackendToDob, formatDobToBackend, Input, Modal, Select, SelectItem, Textarea } from '@/shared/components/ui';
import { useLanguage } from '@/shared/hooks/useLanguage';
import type { FamilyMember } from '@/features/admin/components/family-tree/types';
import type { FamilyTimelineWrite } from '@/features/admin/services/familyV2Service';
import type { CreatableTimelineEventType } from './timeline/types';
import { getTimelineEventTypeTranslationKey } from './timeline/eventTypeTranslation';
import { getTimelinePillClass } from './timeline/timelinePillStyles';

interface TimelineEventModalProps {
  isOpen: boolean; form: FamilyTimelineWrite; members: FamilyMember[]; editing: boolean; saving: boolean;
  onClose: () => void; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void; onChange: (form: FamilyTimelineWrite) => void;
}
export const EVENT_TYPES: CreatableTimelineEventType[] = ['CUSTOM', 'MEMORY', 'ADDRESS_CHANGE', 'MARRIAGE'];
type EventType = CreatableTimelineEventType;

export function buildTimelineEventSuggestedTitle(type: EventType, first?: string, second?: string): string {
  if (type === 'ADDRESS_CHANGE') return first ? `${first} chuyển nơi ở` : '';
  if (type === 'MARRIAGE') return first ? `${first} kết hôn${second ? ` với ${second}` : ''}` : '';
  return '';
}

export const TimelineEventModal: React.FC<TimelineEventModalProps> = ({ isOpen, form, members, editing, saving, onClose, onSubmit, onChange }) => {
  const { t } = useLanguage();
  const [titleTouched, setTitleTouched] = useState(editing && Boolean(form.title));
  const [typeError, setTypeError] = useState('');
  const title = t(editing ? 'admin.family_v2.edit_event' : 'admin.family_v2.add_event');
  const memberName = useMemo(() => members.find(member => member.id === form.memberId)?.fullName, [form.memberId, members]);
  const relatedName = useMemo(() => members.find(member => member.id === form.relatedMemberId)?.fullName, [form.relatedMemberId, members]);
  const update = (patch: Partial<FamilyTimelineWrite>) => onChange({ ...form, ...patch });
  const type = form.eventType as EventType;
  const legacyEventType = editing && !EVENT_TYPES.includes(form.eventType as CreatableTimelineEventType) ? form.eventType : null;
  const eventTypeHelp = legacyEventType
    ? t('admin.family_v2.event_type_legacy_help')
    : t(`admin.family_v2.event_type_${type.toLowerCase()}_help`);

  useEffect(() => {
    if (!titleTouched && ['ADDRESS_CHANGE', 'MARRIAGE'].includes(type)) {
      const suggested = buildTimelineEventSuggestedTitle(type, memberName, relatedName);
      if (suggested && suggested !== form.title) update({ title: suggested });
    }
  }, [type, memberName, relatedName, titleTouched]);

  const personSelect = (field: 'memberId' | 'relatedMemberId', label: string, optional = false) => (
    <Select label={label} floatingLabel appearance="simple" value={form[field] === null ? 'none' : String(form[field])} disabled={saving} aria-label={label}
      helperText={optional ? t('admin.family_v2.optional_field') : t('admin.family_v2.recommended_field')}
      onValueChange={value => { update({ [field]: value === 'none' ? null : Number(value) }); setTypeError(''); }}>
      <SelectItem value="none">{t('admin.family_v2.none')}</SelectItem>
      {members.map(member => <SelectItem key={member.id} value={String(member.id)}>{member.fullName}</SelectItem>)}
    </Select>
  );
  const titleField = (label: string, fullWidth = true) => <Input containerClassName={fullWidth ? 'sm:col-span-2' : ''} label={label} floatingLabel placeholder={t('admin.family_v2.enter_title')} required minLength={2} maxLength={200} value={form.title} disabled={saving}
    onChange={event => { setTitleTouched(true); update({ title: event.target.value }); }} />;
  const dateFields = (dateLabel = t('admin.family_v2.event_date')) => <>
    <DateInput label={dateLabel} floatingLabel value={form.eventDate ? formatBackendToDob(form.eventDate) : ''} disabled={saving}
      onChange={event => { const eventDate = formatDobToBackend(event.target.value); update({ eventDate, eventYear: eventDate ? Number(eventDate.slice(0, 4)) : form.eventYear }); }} />
    <Input label={t('admin.family_v2.event_year')} floatingLabel placeholder="YYYY" type="number" min="1" max="9999" value={form.eventYear ?? ''} disabled={saving}
      onChange={event => update({ eventYear: event.target.value ? Number(event.target.value) : null })} />
  </>;
  const notesField = (label: string, placeholderKey = 'admin.family_v2.enter_notes') => <Textarea label={label} floatingLabel placeholder={t(placeholderKey)} className="min-h-[112px] w-full" maxLength={2000} rows={3} value={form.description ?? ''} disabled={saving}
    onChange={event => update({ description: event.target.value || null })} />;
  const locationField = (label: string, placeholderKey = 'admin.family_v2.enter_location') => <Input containerClassName="sm:col-span-2" label={label} floatingLabel placeholder={t(placeholderKey)} maxLength={500} value={form.location ?? ''} disabled={saving}
    onChange={event => update({ location: event.target.value || null })} />;
  const approximateField = <label className={`inline-flex min-h-10 w-fit cursor-pointer items-center gap-2 rounded-xl px-2 py-2 text-sm text-secondary-text transition-colors ${form.isApproximate ? 'bg-accent/5 text-primary-text' : ''}`}>
    <input type="checkbox" className="size-4 accent-[var(--accent)]" checked={form.isApproximate} disabled={saving} onChange={event => update({ isApproximate: event.target.checked })} />
    {t('admin.family_v2.approximate_date_short')}
  </label>;

  const primaryFields = () => {
    switch (type) {
      case 'MEMORY': return <>
        {titleField(t('admin.family_v2.memory_title'))}{personSelect('memberId', t('admin.family_v2.memory_member'))}
        {personSelect('relatedMemberId', t('admin.family_v2.memory_related'), true)}
      </>;
      case 'ADDRESS_CHANGE': return <>
        {personSelect('memberId', t('admin.family_v2.moved_member'))}{titleField(t('admin.family_v2.title'), false)}
      </>;
      case 'MARRIAGE': return <>
        {personSelect('memberId', t('admin.family_v2.marriage_person_one'))}{personSelect('relatedMemberId', t('admin.family_v2.marriage_person_two'))}
        {titleField(t('admin.family_v2.title'))}
      </>;
      default: return <>
        {titleField(t('admin.family_v2.title'))}{personSelect('memberId', t('admin.family_v2.member_optional'), true)}
        {personSelect('relatedMemberId', t('admin.family_v2.related_member_optional'), true)}
      </>;
    }
  };
  const dateLabel = type === 'MARRIAGE' ? t('admin.family_v2.marriage_date') : t('admin.family_v2.event_date');
  const locationLabel = type === 'ADDRESS_CHANGE' ? t('admin.family_v2.new_address')
    : type === 'MARRIAGE' ? t('admin.family_v2.marriage_place') : t('admin.family_v2.location');
  const locationPlaceholder = type === 'ADDRESS_CHANGE' ? 'admin.family_v2.enter_address'
    : type === 'MARRIAGE' ? 'admin.family_v2.enter_place' : 'admin.family_v2.enter_location';
  const contentLabel = type === 'MEMORY' ? t('admin.family_v2.memory_content')
    : type === 'ADDRESS_CHANGE' ? t('admin.family_v2.move_notes')
      : type === 'MARRIAGE' ? t('admin.family_v2.marriage_notes') : t('admin.family_v2.description');
  const contentPlaceholder = type === 'MEMORY' ? 'admin.family_v2.enter_memory_content' : 'admin.family_v2.enter_notes';
  const criticalError = form.eventDate || form.eventYear ? '' : t('admin.family_v2.date_or_year_required');
  const sameMarriageMember = type === 'MARRIAGE' && form.memberId !== null && form.memberId === form.relatedMemberId;
  const changeType = (eventType: string) => {
    if (eventType === form.eventType) return;
    setTypeError('');
    if (!titleTouched) update({ eventType, title: '' });
    else update({ eventType });
  };

  return <Modal isOpen={isOpen} title={title} description={t('admin.family_v2.timeline_event_modal_description')} ariaLabel={title} onClose={() => { if (!saving) onClose(); }} closeOnBackdropClick={!saving} closeOnEsc={!saving} maxWidth="full" className="memory-form memory-form--timeline"
    footer={<div className="flex w-full flex-wrap justify-end gap-2 sm:gap-3"><Button type="button" variant="secondary" disabled={saving} onClick={onClose}>{t('admin.cancel')}</Button>
      <Button type="submit" form="familyTimelineEventForm" isLoading={saving} disabled={saving || Boolean(criticalError) || sameMarriageMember || form.title.trim().length < 2}>{t('admin.family_v2.save_event')}</Button></div>}>
    <form id="familyTimelineEventForm" onSubmit={event => { if (sameMarriageMember) { event.preventDefault(); setTypeError(t('admin.family_v2.same_marriage_member_error')); return; } if (criticalError || form.title.trim().length < 2) { event.preventDefault(); setTypeError(criticalError || t('admin.family_v2.title_required')); return; } onSubmit(event); }} className="timeline-event-form">
      <section className="space-y-2" aria-labelledby="timeline-event-type-heading">
        <h4 id="timeline-event-type-heading" className="m-0 text-sm font-semibold text-primary-text">{t('admin.family_v2.event_type')}</h4>
        <div className="-mx-1 flex flex-nowrap gap-2 overflow-x-auto px-1 pb-1" role="group" aria-label={t('admin.family_v2.event_type')}>
          {EVENT_TYPES.map(eventType => <button key={eventType} type="button" aria-pressed={type === eventType} disabled={saving} onClick={() => changeType(eventType)} className={getTimelinePillClass(type === eventType)}>{t(getTimelineEventTypeTranslationKey(eventType))}</button>)}
        </div>
        {legacyEventType && <p className="m-0 text-xs text-secondary-text">{t('admin.family_v2.legacy_event_type')}: {t(getTimelineEventTypeTranslationKey(legacyEventType))}</p>}
        <p className="m-0 text-xs text-secondary-text">{eventTypeHelp}</p>
      </section>

      <section className="space-y-3 rounded-2xl border border-custom-border bg-secondary-bg/30 p-4 sm:p-5" aria-labelledby="timeline-event-primary-heading">
        <FormSectionHeader id="timeline-event-primary-heading" icon={<FileText size={17} aria-hidden="true"/>} title={t('admin.family_v2.event_section_primary')}/>
        <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">{primaryFields()}</div>
        {sameMarriageMember && <p role="alert" className="m-0 text-sm text-error">{t('admin.family_v2.same_marriage_member_error')}</p>}
      </section>

      <section className="space-y-3 rounded-2xl border border-custom-border bg-secondary-bg/30 p-4 sm:p-5" aria-labelledby="timeline-event-time-heading">
        <FormSectionHeader id="timeline-event-time-heading" icon={<CalendarClock size={17} aria-hidden="true"/>} title={t('admin.family_v2.event_section_time_location')}/>
        <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">{dateFields(dateLabel)}</div>
        {approximateField}<p className="memory-form__hint">{t('memories.approximateHelp')}</p>
        {locationField(locationLabel, locationPlaceholder)}
      </section>

      <section className="space-y-3 rounded-2xl border border-custom-border bg-secondary-bg/30 p-4 sm:p-5" aria-labelledby="timeline-event-content-heading">
        <FormSectionHeader id="timeline-event-content-heading" icon={<AlignLeft size={17} aria-hidden="true"/>} title={t('admin.family_v2.event_section_content')}/>
        {notesField(contentLabel, contentPlaceholder)}
      </section>
      {criticalError && <p role="alert" className="m-0 text-sm text-secondary-text">{criticalError}</p>}
      {typeError && <p role="alert" className="m-0 text-sm text-error">{typeError}</p>}
    </form>
  </Modal>;
};
