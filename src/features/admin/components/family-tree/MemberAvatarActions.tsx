import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';
import { Button, ConfirmDialog } from '@/shared/components/ui';
import { useLanguage } from '@/shared/hooks/useLanguage';
import { useWorkspaceToast } from '@/shared/hooks/useWorkspaceToast';
import { uploadMemberAvatar, deleteMemberAvatar } from '../../services/familyV2Service';
import { isValidMemberAvatar, MEMBER_AVATAR_ACCEPT } from './memberAvatar';
import type { FamilyMember } from './types';

export function MemberAvatarActions({ member, onChanged }: { member: FamilyMember; onChanged: (member: FamilyMember) => void }) {
  const { t } = useLanguage();
  const toast = useWorkspaceToast();
  const input = useRef<HTMLInputElement>(null);
  const pending = useRef(false);
  const active = useRef(true);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);

  const mutate = async (file?: File) => {
    if (pending.current) return;
    if (file && !isValidMemberAvatar(file)) { setMessage('admin.member_avatar_errors.invalid_file'); return; }
    pending.current = true; setBusy(true); setMessage(''); setConfirmDelete(false);
    try {
      const updated = file ? await uploadMemberAvatar(member.id, file) : await deleteMemberAvatar(member.id);
      if (active.current) { onChanged(updated); toast(t(file ? 'family.avatar.saved' : 'family.avatar.removed'), true); }
    } catch {
      if (active.current) { setMessage('family.avatar.failed'); toast(t('family.avatar.failed'), false); }
    } finally {
      pending.current = false;
      if (active.current) setBusy(false);
    }
  };

  return <div className="mt-3 grid min-w-0 gap-2" aria-busy={busy}>
    <div className="flex flex-wrap gap-2">
      <input ref={input} className="sr-only" tabIndex={-1} type="file" accept={MEMBER_AVATAR_ACCEPT} aria-label={t('admin.member_avatar_choose')} disabled={busy} onChange={event => {
        const file = event.currentTarget.files?.[0]; event.currentTarget.value = '';
        if (file) void mutate(file);
      }} />
      <Button variant="secondary" size="sm" disabled={busy} onClick={() => input.current?.click()} leftIcon={<ImagePlus size={15} />}>{t('admin.member_avatar_choose')}</Button>
      {(member.hasManagedAvatar || member.avatarUrl) && <Button variant="ghost" size="sm" disabled={busy} onClick={() => setConfirmDelete(true)} leftIcon={<Trash2 size={15} />}>{t('admin.member_avatar_remove')}</Button>}
    </div>
    {busy && <p role="status" className="m-0 text-xs text-secondary-text">{t('family.avatar.saving')}</p>}
    {message && <p role="alert" className="m-0 text-xs text-error">{t(message)}</p>}
    <ConfirmDialog isOpen={confirmDelete} title={t('family.avatar.removeTitle')} confirmLabel={t('admin.member_avatar_remove')} cancelLabel={t('admin.cancel')} onClose={() => setConfirmDelete(false)} onConfirm={() => { void mutate(); }}>{t('family.avatar.removeDescription')}</ConfirmDialog>
  </div>;
}
