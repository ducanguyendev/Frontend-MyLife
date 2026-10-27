import React, { useEffect, useMemo, useState } from 'react';
import { Button, DateInput, formatBackendToDob, formatDobToBackend, Input, Modal, Select, SelectItem, Textarea } from '@/shared/components/ui';
import { useLanguage } from '@/shared/hooks/useLanguage';
import type { FamilyMember } from '@/features/admin/components/family-tree/types';
import type { FamilyTimelineWrite } from '@/features/admin/services/familyV2Service';

interface TimelineEventModalProps {
  isOpen: boolean; form: FamilyTimelineWrite; members: FamilyMember[]; editing: boolean; saving: boolean;
  onClose: () => void; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void; onChange: (form: FamilyTimelineWrite) => void;
}
const EVENT_TYPES = ['CUSTOM', 'MEMORY', 'ADDRESS_CHANGE', 'MARRIAGE', 'CHILD_BIRTH'] as const;
type EventType = typeof EVENT_TYPES[number];

export function buildTimelineEventSuggestedTitle(type: EventType, first?: string, second?: string): string {
  if (type === 'ADDRESS_CHANGE') return first ? `${first} chuyển nơi ở` : '';
  if (type === 'MARRIAGE') return first ? `${first} kết hôn${second ? ` với ${second}` : ''}` : '';
  if (type === 'CHILD_BIRTH') return first ? `${first} chào đời` : 'Con chào đời';
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

  useEffect(() => {
    if (!titleTouched && ['ADDRESS_CHANGE', 'MARRIAGE', 'CHILD_BIRTH'].includes(type)) {
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
  const titleField = (label: string) => <Input label={label} floatingLabelAlways placeholder={t('admin.family_v2.enter_title')} required minLength={2} maxLength={200} value={form.title} disabled={saving}
    onChange={event => { setTitleTouched(true); update({ title: event.target.value }); }} />;
  const dateFields = (dateLabel = t('admin.family_v2.event_date')) => <>
    <DateInput label={dateLabel} floatingLabelAlways value={form.eventDate ? formatBackendToDob(form.eventDate) : ''} disabled={saving}
      onChange={event => { const eventDate = formatDobToBackend(event.target.value); update({ eventDate, eventYear: eventDate ? Number(eventDate.slice(0, 4)) : form.eventYear }); }} />
    <Input label={t('admin.family_v2.event_year')} floatingLabelAlways placeholder="YYYY" type="number" min="1" max="9999" value={form.eventYear ?? ''} disabled={saving}
      onChange={event => update({ eventYear: event.target.value ? Number(event.target.value) : null })} />
  </>;
  const notesField = (label: string, placeholderKey = 'admin.family_v2.enter_notes') => <Textarea containerClassName="sm:col-span-2" label={label} floatingLabelAlways placeholder={t(placeholderKey)} className="min-h-[112px]" maxLength={2000} rows={3} value={form.description ?? ''} disabled={saving}
    onChange={event => update({ description: event.target.value || null })} />;
  const locationField = (label: string, full = false, placeholderKey = 'admin.family_v2.enter_location') => <Input containerClassName={full ? 'sm:col-span-2' : ''} label={label} floatingLabelAlways placeholder={t(placeholderKey)} maxLength={500} value={form.location ?? ''} disabled={saving}
    onChange={event => update({ location: event.target.value || null })} />;
  const approximateField = <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl px-1 text-sm text-secondary-text sm:col-span-2">
    <input type="checkbox" className="size-4 accent-[var(--accent)]" checked={form.isApproximate} disabled={saving} onChange={event => update({ isApproximate: event.target.checked })} />
    {t('admin.family_v2.approximate_date')}
  </label>;

  const semanticFields = () => {
    switch (type) {
      case 'MEMORY': return <>
        {titleField(t('admin.family_v2.memory_title'))}{personSelect('memberId', t('admin.family_v2.memory_member'))}
        {personSelect('relatedMemberId', t('admin.family_v2.memory_related'), true)}{dateFields()}
        {notesField(t('admin.family_v2.memory_content'), 'admin.family_v2.enter_memory_content')}{locationField(t('admin.family_v2.location'), true)}{approximateField}
      </>;
      case 'ADDRESS_CHANGE': return <>
        {personSelect('memberId', t('admin.family_v2.moved_member'))}{titleField(t('admin.family_v2.title'))}
        {dateFields()}{locationField(t('admin.family_v2.new_address'), true, 'admin.family_v2.enter_address')}{notesField(t('admin.family_v2.move_notes'))}{approximateField}
      </>;
      case 'MARRIAGE': return <>
        {personSelect('memberId', t('admin.family_v2.marriage_person_one'))}{personSelect('relatedMemberId', t('admin.family_v2.marriage_person_two'))}
        {titleField(t('admin.family_v2.title'))}
        {dateFields(t('admin.family_v2.marriage_date'))}{locationField(t('admin.family_v2.marriage_place'), false, 'admin.family_v2.enter_place')}{notesField(t('admin.family_v2.marriage_notes'))}
        {approximateField}{form.memberId !== null && form.memberId === form.relatedMemberId && <p role="alert" className="m-0 text-sm text-error sm:col-span-2">{t('admin.family_v2.same_marriage_member_error')}</p>}
      </>;
      case 'CHILD_BIRTH': return <>
        {personSelect('memberId', t('admin.family_v2.child_member'))}{personSelect('relatedMemberId', t('admin.family_v2.parent_or_relative'), true)}
        {titleField(t('admin.family_v2.title'))}
        {dateFields(t('admin.family_v2.birth_date'))}{locationField(t('admin.family_v2.birth_place'), false, 'admin.family_v2.enter_place')}{notesField(t('admin.family_v2.birth_notes'))}{approximateField}
      </>;
      default: return <>
        {titleField(t('admin.family_v2.title'))}{personSelect('memberId', t('admin.family_v2.member_optional'), true)}
        {personSelect('relatedMemberId', t('admin.family_v2.related_member_optional'), true)}{dateFields()}
        {notesField(t('admin.family_v2.description'))}{locationField(t('admin.family_v2.location'), true)}{approximateField}
      </>;
    }
  };
  const criticalError = form.eventDate || form.eventYear ? '' : t('admin.family_v2.date_or_year_required');
  const sameMarriageMember = type === 'MARRIAGE' && form.memberId !== null && form.memberId === form.relatedMemberId;
  const changeType = (eventType: string) => { setTypeError(''); if (!titleTouched) update({ eventType, title: '' }); else update({ eventType }); };

  return <Modal isOpen={isOpen} title={title} ariaLabel={title} onClose={() => { if (!saving) onClose(); }} closeOnBackdropClick={!saving} closeOnEsc={!saving} maxWidth="xl" className="!max-h-[min(90vh,760px)]"
    footer={<div className="flex w-full flex-wrap justify-end gap-2 sm:gap-3"><Button type="button" variant="secondary" disabled={saving} onClick={onClose}>{t('admin.cancel')}</Button>
      <Button type="submit" form="familyTimelineEventForm" isLoading={saving} disabled={saving || Boolean(criticalError) || sameMarriageMember || form.title.trim().length < 2}>{t('admin.family_v2.save_event')}</Button></div>}>
    <form id="familyTimelineEventForm" onSubmit={event => { if (sameMarriageMember) { event.preventDefault(); setTypeError(t('admin.family_v2.same_marriage_member_error')); return; } if (criticalError || form.title.trim().length < 2) { event.preventDefault(); setTypeError(criticalError || t('admin.family_v2.title_required')); return; } onSubmit(event); }} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Select label={t('admin.family_v2.event_type')} floatingLabel appearance="simple" value={form.eventType} disabled={saving} onValueChange={changeType}>
        {EVENT_TYPES.map(eventType => <SelectItem key={eventType} value={eventType}>{t(`admin.family_v2.type_${eventType.toLowerCase()}`)}</SelectItem>)}
      </Select>
      <p className="m-0 self-center text-xs text-secondary-text sm:pt-5">{t(`admin.family_v2.event_type_${type.toLowerCase()}_help`)}</p>
      {semanticFields()}
      {criticalError && <p role="alert" className="m-0 text-sm text-secondary-text sm:col-span-2">{criticalError}</p>}
      {typeError && <p role="alert" className="m-0 text-sm text-error sm:col-span-2">{typeError}</p>}
    </form>
  </Modal>;
};
