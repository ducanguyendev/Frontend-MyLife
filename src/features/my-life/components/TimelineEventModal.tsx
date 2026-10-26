import React from 'react';
import { Button, Input, Modal, Select, SelectItem, Textarea } from '@/shared/components/ui';
import { useLanguage } from '@/shared/hooks/useLanguage';
import type { FamilyMember } from '@/features/admin/components/family-tree/types';
import type { FamilyTimelineWrite } from '@/features/admin/services/familyV2Service';

interface TimelineEventModalProps {
  isOpen: boolean;
  form: FamilyTimelineWrite;
  members: FamilyMember[];
  editing: boolean;
  saving: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onChange: (form: FamilyTimelineWrite) => void;
}

const EVENT_TYPES = ['CUSTOM', 'MEMORY', 'ADDRESS_CHANGE', 'MARRIAGE', 'CHILD_BIRTH'] as const;

export const TimelineEventModal: React.FC<TimelineEventModalProps> = ({ isOpen, form, members, editing, saving, onClose, onSubmit, onChange }) => {
  const { t } = useLanguage();
  const update = (patch: Partial<FamilyTimelineWrite>) => onChange({ ...form, ...patch });
  const title = t(editing ? 'admin.family_v2.edit_event' : 'admin.family_v2.add_event');

  return <Modal
    isOpen={isOpen}
    title={title}
    ariaLabel={title}
    onClose={() => { if (!saving) onClose(); }}
    closeOnBackdropClick={!saving}
    closeOnEsc={!saving}
    maxWidth="xl"
    className="!max-h-[min(90vh,760px)]"
    footer={<div className="flex w-full flex-wrap justify-end gap-2 sm:gap-3">
      <Button type="button" variant="secondary" disabled={saving} onClick={onClose}>{t('admin.cancel')}</Button>
      <Button type="submit" form="familyTimelineEventForm" isLoading={saving} disabled={!form.eventDate && !form.eventYear}>{t('admin.family_v2.save_event')}</Button>
    </div>}
  >
    <form id="familyTimelineEventForm" onSubmit={onSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Select appearance="simple" label={t('admin.family_v2.event_type')} value={form.eventType} disabled={saving}
        onValueChange={eventType => update({ eventType })}>
        {EVENT_TYPES.map(type => <SelectItem key={type} value={type}>{t(`admin.family_v2.type_${type.toLowerCase()}`)}</SelectItem>)}
      </Select>
      <Select appearance="simple" label={t('admin.family_v2.member_optional')} value={form.memberId === null ? 'whole-family' : String(form.memberId)} disabled={saving}
        onValueChange={value => update({ memberId: value === 'whole-family' ? null : Number(value) })}>
        <SelectItem value="whole-family">{t('admin.family_v2.whole_family')}</SelectItem>
        {members.map(member => <SelectItem key={member.id} value={String(member.id)}>{member.fullName}</SelectItem>)}
      </Select>
      <Input containerClassName="sm:col-span-1" label={t('admin.family_v2.title')} required minLength={2} maxLength={200} value={form.title} disabled={saving}
        onChange={event => update({ title: event.target.value })} />
      <Select appearance="simple" label={t('admin.family_v2.related_member_optional')} value={form.relatedMemberId === null ? 'no-related-member' : String(form.relatedMemberId)} disabled={saving}
        onValueChange={value => update({ relatedMemberId: value === 'no-related-member' ? null : Number(value) })}>
        <SelectItem value="no-related-member">{t('admin.family_v2.none')}</SelectItem>
        {members.map(member => <SelectItem key={member.id} value={String(member.id)}>{member.fullName}</SelectItem>)}
      </Select>
      <Input label={t('admin.family_v2.event_date')} type="date" value={form.eventDate ?? ''} disabled={saving}
        onChange={event => update({ eventDate: event.target.value || null, eventYear: event.target.value ? Number(event.target.value.slice(0, 4)) : form.eventYear })} />
      <Input label={t('admin.family_v2.event_year')} type="number" min="1" max="9999" value={form.eventYear ?? ''} disabled={saving}
        onChange={event => update({ eventYear: event.target.value ? Number(event.target.value) : null })} />
      <Textarea containerClassName="sm:col-span-2" label={t('admin.family_v2.description')} maxLength={2000} value={form.description ?? ''} disabled={saving}
        onChange={event => update({ description: event.target.value || null })} />
      <Input containerClassName="sm:col-span-2" label={t('admin.family_v2.location')} maxLength={500} value={form.location ?? ''} disabled={saving}
        onChange={event => update({ location: event.target.value || null })} />
      <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl px-1 text-sm text-secondary-text sm:col-span-2">
        <input type="checkbox" className="size-4 accent-[var(--accent)]" checked={form.isApproximate} disabled={saving}
          onChange={event => update({ isApproximate: event.target.checked })} />
        {t('admin.family_v2.approximate_date')}
      </label>
    </form>
  </Modal>;
};
