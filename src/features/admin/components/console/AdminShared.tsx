import { useState, type ReactNode } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { TableShell, InlineError, StatusPill } from '@/design-system';
import { authService } from '@/features/auth/services/authService';
import { Button } from '@/shared/components/ui/Button';
import { useLanguage } from '@/shared/hooks/useLanguage';
import { adminErrorKey, type AdminUser } from '../../services/adminConsoleService';

export function AdminUserAvatar({ user }: { user: AdminUser }) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const source = user.avatarUrl && user.avatarUrl !== 'none' ? authService.getDisplayAvatarUrl(user.avatarUrl, user.email) : authService.getAvatarUrl(user.email);
  return <span className="admin-user-avatar" aria-hidden="true">{source && failedSource !== source ? <img src={source} alt="" referrerPolicy="no-referrer" onError={() => setFailedSource(source)}/> : user.email.slice(0, 2).toLocaleUpperCase()}</span>;
}
export function AdminLogStatus({ status }: { status: string }) {
  const { t } = useLanguage();
  const tones = { SUCCESS: 'success', FAILED: 'danger', REGISTERED: 'info' } as const;
  return <StatusPill tone={tones[status as keyof typeof tones] ?? 'neutral'}>{status === 'SUCCESS' ? t('admin.success') : status === 'FAILED' ? t('admin.failed') : status === 'REGISTERED' ? t('admin.registered') : status || t('admin.console.unknown')}</StatusPill>;
}

export function AdminResourceWarning({ error, retry, disabled = false, fallback }: { error: unknown; retry: () => void; disabled?: boolean; fallback: string }) {
  const { t } = useLanguage();
  return error ? <div className="admin-resource-warning"><InlineError>{t(adminErrorKey(error, fallback))}</InlineError><Button variant="secondary" size="sm" disabled={disabled} onClick={retry}>{t('admin.console.retry')}</Button></div> : null;
}
export function AdminTable({ label, children }: { label: string; children: ReactNode }) {
  const { t } = useLanguage();
  return <><p className="admin-scroll-hint">{t('admin.console.scroll_hint')}</p><TableShell className="admin-table" role="region" aria-label={label} tabIndex={0} onKeyDown={event => {
    if (event.target !== event.currentTarget || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault(); event.currentTarget.querySelector('.ds-table-scroll')?.scrollBy({ left: event.key === 'ArrowRight' ? 160 : -160 });
  }}>{children}</TableShell></>;
}
export function AdminSortHeading({ label, direction, onClick }: { label: string; direction?: 'ascending' | 'descending'; onClick: () => void }) {
  return <th scope="col" aria-sort={direction ?? 'none'}><button type="button" className="admin-sort-heading" onClick={onClick}>{label}{direction === 'ascending' ? <ArrowUp size={14}/> : <ArrowDown size={14} className={direction ? '' : 'admin-sort-heading__idle'}/>}</button></th>;
}
export function formatAdminDate(value: string | undefined, language: string) {
  const date = value ? new Date(value) : null;
  return date && Number.isFinite(date.getTime()) ? date.toLocaleString(language === 'vi' ? 'vi-VN' : 'en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }) : '—';
}
