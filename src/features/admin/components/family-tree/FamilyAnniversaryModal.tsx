import { useEffect, useMemo, useState } from 'react';
import { Button, Input, Modal, Select, Textarea } from '@/shared/components/ui';
import { useLanguage } from '@/shared/hooks/useLanguage';
import { anniversaryService, type AnniversaryEventType, type FamilyAnniversary, type FamilyAnniversaryPayload } from '../../services/anniversaryService';
import type { FamilyMember } from './types';

interface Props {
  anniversary?: FamilyAnniversary;
  members: FamilyMember[];
  onClose: () => void;
  onSubmit: (payload: FamilyAnniversaryPayload) => Promise<void>;
}

const vietnameseToday = () => Number(new Intl.DateTimeFormat('en', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric' }).format(new Date()));

export function FamilyAnniversaryModal({ anniversary, members, onClose, onSubmit }: Props) {
  const { t, language } = useLanguage();
  const [eventType, setEventType] = useState<AnniversaryEventType>(anniversary?.eventType ?? 'DEATH_ANNIVERSARY');
  const [title, setTitle] = useState(anniversary?.title ?? '');
  const [relatedMemberId, setRelatedMemberId] = useState(anniversary?.relatedMemberId ? String(anniversary.relatedMemberId) : '');
  const [lunarDay, setLunarDay] = useState(anniversary?.lunarDay ? String(anniversary.lunarDay) : '');
  const [lunarMonth, setLunarMonth] = useState(anniversary?.lunarMonth ? String(anniversary.lunarMonth) : '');
  const [isLeapMonth, setIsLeapMonth] = useState(anniversary?.isLeapMonth ?? false);
  const [place, setPlace] = useState(anniversary?.place ?? '');
  const [host, setHost] = useState(anniversary?.host ?? '');
  const [notes, setNotes] = useState(anniversary?.notes ?? '');
  const [preview, setPreview] = useState<string | null>(anniversary?.nextSolarDate ?? null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const selectedMember = useMemo(() => members.find(member => member.id === Number(relatedMemberId)), [members, relatedMemberId]);

  useEffect(() => {
    if (selectedMember && !title.trim()) setTitle(`${t('admin.anniversary_ui.death_prefix')} ${selectedMember.fullName}`);
  }, [selectedMember, title, t]);

  useEffect(() => {
    const day = Number(lunarDay); const month = Number(lunarMonth);
    if (!Number.isInteger(day) || day < 1 || day > 30 || !Number.isInteger(month) || month < 1 || month > 12) {
      setPreview(null); setPreviewError(null); return;
    }
    let active = true;
    const timer = window.setTimeout(async () => {
      try {
        const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());
        const year = vietnameseToday();
        let result: { solarDate: string } | null = null;
        for (let offset = 0; offset <= 4 && !result; offset++) {
          try {
            const candidate = await anniversaryService.convertLunarToSolar(day, month, year + offset, isLeapMonth);
            if (candidate.solarDate >= today) result = candidate;
          } catch { /* A leap month may not occur in every lunar year. */ }
        }
        if (!result) throw new Error('No upcoming occurrence');
        if (active) { setPreview(result.solarDate); setPreviewError(null); }
      } catch {
        if (active) { setPreview(null); setPreviewError('admin.anniversary_ui.invalid_lunar_date'); }
      }
    }, 350);
    return () => { active = false; window.clearTimeout(timer); };
  }, [lunarDay, lunarMonth, isLeapMonth]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSaving) return;
    if (title.trim().length < 2 || title.trim().length > 200) { setError('admin.anniversary_ui.invalid_title'); return; }
    if (!lunarDay || !lunarMonth) { setError('admin.anniversary_ui.invalid_lunar_date'); return; }
    setIsSaving(true); setError(null);
    try {
      await onSubmit({ eventType, title: title.trim(), relatedMemberId: relatedMemberId ? Number(relatedMemberId) : null,
        lunarDay: Number(lunarDay), lunarMonth: Number(lunarMonth), isLeapMonth,
        place: place.trim() || null, host: host.trim() || null, notes: notes.trim() || null });
    } catch { setError('admin.anniversary_ui.save_failed'); }
    finally { setIsSaving(false); }
  };

  const solarDate = preview ? new Intl.DateTimeFormat(language, { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(`${preview}T12:00:00Z`)) : '—';
  return <Modal isOpen title={t(anniversary ? 'admin.anniversary_ui.edit_title' : 'admin.anniversary_ui.add_title')}
    onClose={() => { if (!isSaving) onClose(); }} closeOnBackdropClick={!isSaving} closeOnEsc={!isSaving} maxWidth="xl">
    <form onSubmit={submit} noValidate className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select label={t('admin.anniversary_ui.event_type')} value={eventType} disabled={isSaving}
          onChange={e => setEventType(e.target.value as AnniversaryEventType)}>
          <option value="DEATH_ANNIVERSARY">{t('admin.anniversary_ui.death_anniversary')}</option>
          <option value="FAMILY_EVENT">{t('admin.anniversary_ui.family_event')}</option>
        </Select>
        <Select label={t('admin.anniversary_ui.related_member')} value={relatedMemberId} disabled={isSaving} includeEmptyOption={false}
          onChange={e => setRelatedMemberId(e.target.value)}>
          <option value="">{t('admin.anniversary_ui.no_related_member')}</option>
          {members.map(member => <option key={member.id} value={member.id}>{member.fullName}</option>)}
        </Select>
      </div>
      <Input label={t('admin.anniversary_ui.title')} value={title} maxLength={200} disabled={isSaving}
        error={error === 'admin.anniversary_ui.invalid_title' ? t(error) : null} onChange={e => setTitle(e.target.value)} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label={t('admin.anniversary_ui.lunar_day')} type="number" min={1} max={30} value={lunarDay} disabled={isSaving}
          onChange={e => setLunarDay(e.target.value)} />
        <Input label={t('admin.anniversary_ui.lunar_month')} type="number" min={1} max={12} value={lunarMonth} disabled={isSaving}
          onChange={e => setLunarMonth(e.target.value)} />
      </div>
      <label className="flex items-center gap-2 text-sm text-primary-text">
        <input type="checkbox" checked={isLeapMonth} disabled={isSaving} onChange={e => setIsLeapMonth(e.target.checked)} />
        {t('admin.anniversary_ui.leap_month')}
      </label>
      <div className="rounded-xl border border-custom-border bg-primary-bg p-3 text-sm">
        <span className="text-secondary-text">{t('admin.anniversary_ui.next_occurrence')}: </span>
        <strong className="text-primary-text">{solarDate}</strong>
        {previewError && <p role="alert" className="mt-1 text-xs text-error">{t(previewError)}</p>}
      </div>
      <Input label={t('admin.anniversary_ui.place')} value={place} maxLength={500} disabled={isSaving} onChange={e => setPlace(e.target.value)} />
      <Input label={t('admin.anniversary_ui.host')} value={host} maxLength={300} disabled={isSaving} onChange={e => setHost(e.target.value)} />
      <Textarea label={t('admin.anniversary_ui.notes')} rows={3} maxLength={2000} value={notes} disabled={isSaving} onChange={e => setNotes(e.target.value)} />
      {error && error !== 'admin.anniversary_ui.invalid_title' && <p role="alert" className="text-sm text-error">{error.startsWith('admin.') ? t(error) : error}</p>}
      <div className="flex justify-end gap-3 pt-2">
        <Button className="min-h-11" type="button" variant="secondary" disabled={isSaving} onClick={onClose}>{t('admin.anniversary_ui.cancel')}</Button>
        <Button className="min-h-11" type="submit" isLoading={isSaving}>{t('admin.anniversary_ui.save')}</Button>
      </div>
    </form>
  </Modal>;
}
