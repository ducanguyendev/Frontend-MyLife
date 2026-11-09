import { useMemo, useState } from 'react';
import { Globe, Loader2, LockKeyhole, Mail, Trash2, UnlockKeyhole } from 'lucide-react';
import { authService } from '@/features/auth/services/authService';
import { EmptyState, ErrorState, IconButton, Loading, StatusPill } from '@/design-system';
import { Button, Select, SelectItem } from '@/shared/components/ui';
import { SearchBar } from '@/shared/components/SearchBar';
import { useLanguage } from '@/shared/hooks/useLanguage';
import { adminErrorKey, loginProvider, selectAdminUsers, type AdminUser, type UserRoleFilter, type UserSort, type UserStatusFilter } from '../../services/adminConsoleService';
import type { AdminAction, AdminResource } from '../../hooks/useAdminConsole';
import { AdminResourceWarning, AdminSortHeading, AdminTable, formatAdminDate } from './AdminShared';

function UserAvatar({ user }: { user: AdminUser }) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const source = user.avatarUrl && user.avatarUrl !== 'none' ? authService.getDisplayAvatarUrl(user.avatarUrl, user.email) : authService.getAvatarUrl(user.email);
  return <span className="admin-user-avatar" aria-hidden="true">{source && failedSource !== source ? <img src={source} alt="" referrerPolicy="no-referrer" onError={() => setFailedSource(source)}/> : user.email.slice(0, 2).toLocaleUpperCase()}</span>;
}
export function AdminUsers({ resource, currentUserId, pending, retry, onRole, onStatus, onDelete }: {
  resource: AdminResource<AdminUser[]>; currentUserId?: number; pending: ReadonlyMap<number, AdminAction>; retry: () => void;
  onRole: (user: AdminUser, role: AdminUser['role']) => void; onStatus: (user: AdminUser) => void; onDelete: (user: AdminUser) => void;
}) {
  const { t, language } = useLanguage();
  const [query, setQuery] = useState(''), [role, setRole] = useState<UserRoleFilter>('all'), [status, setStatus] = useState<UserStatusFilter>('all'), [sort, setSort] = useState<UserSort>('created-desc');
  const filtered = useMemo(() => selectAdminUsers(resource.data ?? [], query, role, status, sort), [resource.data, query, role, status, sort]);
  const hasFilters = Boolean(query || role !== 'all' || status !== 'all');
  const clear = () => { setQuery(''); setRole('all'); setStatus('all'); };
  if (resource.loading && !resource.data) return <Loading label={t('admin.console.loading_users')}/>;
  if (resource.error && !resource.data) return <ErrorState message={t(adminErrorKey(resource.error, 'users_error'))} action={<Button variant="secondary" disabled={pending.size > 0} onClick={retry}>{t('admin.console.retry')}</Button>}/>;
  return <div className="admin-users" aria-busy={resource.loading || undefined}>
    <AdminResourceWarning error={resource.error} fallback="users_error" retry={retry} disabled={pending.size > 0}/>
    <div className="admin-filter-toolbar admin-filter-toolbar--users">
      <div className="admin-search-field"><label htmlFor="admin-user-search">{t('admin.console.search_users')}</label><SearchBar id="admin-user-search" value={query} onChange={setQuery} placeholder={t('admin.console.search_users_placeholder')} ariaLabel={t('admin.console.search_users')} clearLabel={t('admin.console.clear_search')}/></div>
      <Select label={t('admin.console.role_filter')} floatingLabel={false} variant="compact" value={role} onValueChange={value => setRole(value as UserRoleFilter)} aria-label={t('admin.console.role_filter')}><SelectItem value="all">{t('admin.console.all_roles')}</SelectItem><SelectItem value="ADMIN">Admin</SelectItem><SelectItem value="USER">User</SelectItem></Select>
      <Select label={t('admin.console.account_status')} floatingLabel={false} variant="compact" value={status} onValueChange={value => setStatus(value as UserStatusFilter)} aria-label={t('admin.console.account_status')}><SelectItem value="all">{t('admin.console.all_statuses')}</SelectItem><SelectItem value="active">{t('admin.console.active')}</SelectItem><SelectItem value="locked">{t('admin.console.locked')}</SelectItem></Select>
      <Select label={t('admin.console.sort')} floatingLabel={false} variant="compact" value={sort} onValueChange={value => setSort(value as UserSort)} aria-label={t('admin.console.sort_users')}><SelectItem value="created-desc">{t('admin.console.newest_accounts')}</SelectItem><SelectItem value="created-asc">{t('admin.console.oldest_accounts')}</SelectItem><SelectItem value="email-asc">{t('admin.console.email_asc')}</SelectItem><SelectItem value="email-desc">{t('admin.console.email_desc')}</SelectItem></Select>
    </div>
    <div className="admin-results"><p role="status" data-admin-user-count>{t('admin.console.user_count', { shown: filtered.length, total: resource.data?.length ?? 0 })}</p>{hasFilters && <Button variant="ghost" size="sm" onClick={clear}>{t('admin.console.clear_filters')}</Button>}</div>
    {!filtered.length ? <EmptyState title={t(hasFilters ? 'admin.console.no_matching_users' : 'admin.console.no_users')} description={t(hasFilters ? 'admin.console.adjust_filters' : 'admin.console.no_users_hint')} action={hasFilters ? <Button variant="secondary" onClick={clear}>{t('admin.console.clear_filters')}</Button> : undefined}/> :
      <AdminTable label={t('admin.console.users_table')}><table className="admin-users-table"><caption className="sr-only">{t('admin.console.users_table')}</caption><thead><tr>
        <AdminSortHeading label={t('admin.console.user_column')} direction={sort.startsWith('email') ? sort === 'email-asc' ? 'ascending' : 'descending' : undefined} onClick={() => setSort(sort === 'email-asc' ? 'email-desc' : 'email-asc')}/>
        <th scope="col">{t('admin.col_role')}</th><th scope="col">{t('admin.console.login_provider')}</th><th scope="col">{t('admin.col_status')}</th>
        <AdminSortHeading label={t('admin.console.created_date')} direction={sort.startsWith('created') ? sort === 'created-asc' ? 'ascending' : 'descending' : undefined} onClick={() => setSort(sort === 'created-desc' ? 'created-asc' : 'created-desc')}/><th scope="col" className="admin-actions-heading">{t('admin.col_action')}</th>
      </tr></thead><tbody>{filtered.map(user => {
        const busy = pending.has(user.id), provider = loginProvider(user), isSelf = currentUserId === user.id;
        return <tr key={user.id} data-admin-user={user.id} aria-busy={busy || undefined}>
          <td><div className="admin-user-identity"><UserAvatar user={user}/><div><span className="admin-user-email" title={user.email}>{user.email}</span>{isSelf && <small>{t('admin.console.you')}</small>}</div></div></td>
          <td><div className="admin-role-control"><Select value={user.role} disabled={busy || isSelf} onValueChange={value => { if (value === 'USER' || value === 'ADMIN') onRole(user, value); }} variant="compact" aria-label={t('admin.console.change_role', { email: user.email })}><SelectItem value="USER">User</SelectItem><SelectItem value="ADMIN">Admin</SelectItem></Select>{pending.get(user.id) === 'role' && <span role="status" aria-label={t('admin.console.updating')}><Loader2 size={15} className="animate-spin" aria-hidden="true"/></span>}</div></td>
          <td><span className="admin-provider">{provider === 'email' ? <Mail size={14} aria-hidden="true"/> : <Globe size={14} aria-hidden="true"/>}{provider === 'unknown' && user.authProviderName ? user.authProviderName : t(`admin.console.provider_${provider}`)}</span></td>
          <td><StatusPill tone={user.isActive ? 'success' : 'danger'}>{t(user.isActive ? 'admin.console.active' : 'admin.console.locked')}</StatusPill></td>
          <td><time dateTime={Number.isFinite(Date.parse(user.createdAt ?? '')) ? user.createdAt : undefined}>{formatAdminDate(user.createdAt, language)}</time></td>
          <td><div className="admin-row-actions">{user.role !== 'ADMIN' && <><IconButton variant="ghost" label={t(user.isActive ? 'admin.console.lock_user' : 'admin.console.unlock_user', { email: user.email })} disabled={busy || isSelf} onClick={() => onStatus(user)}>{pending.get(user.id) === 'status' ? <Loader2 size={17} className="animate-spin"/> : user.isActive ? <LockKeyhole size={17}/> : <UnlockKeyhole size={17}/>}</IconButton><IconButton variant="ghost" label={t('admin.console.delete_user', { email: user.email })} disabled={busy || isSelf} onClick={() => onDelete(user)}><Trash2 size={17}/></IconButton></>}{user.role === 'ADMIN' && <span className="admin-protected-label">{t('admin.console.protected_account')}</span>}</div></td>
        </tr>;
      })}</tbody></table></AdminTable>}
  </div>;
}
