import { useMemo, useState } from 'react';
import { EmptyState, ErrorState, Loading, StatusPill } from '@/design-system';
import { Button, Select, SelectItem } from '@/shared/components/ui';
import { SearchBar } from '@/shared/components/SearchBar';
import { useLanguage } from '@/shared/hooks/useLanguage';
import { adminErrorKey, selectAdminLogs, type LoginLog, type LogSort, type LogStatusFilter } from '../../services/adminConsoleService';
import type { AdminResource } from '../../hooks/useAdminConsole';
import { AdminResourceWarning, AdminSortHeading, AdminTable, formatAdminDate } from './AdminShared';

export function AdminLoginLogs({ resource, retry }: { resource: AdminResource<LoginLog[]>; retry: () => void }) {
  const { t, language } = useLanguage();
  const [query, setQuery] = useState(''), [status, setStatus] = useState<LogStatusFilter>('all'), [sort, setSort] = useState<LogSort>('newest');
  const filtered = useMemo(() => selectAdminLogs(resource.data ?? [], query, status, sort), [resource.data, query, status, sort]);
  const hasFilters = Boolean(query || status !== 'all');
  const clear = () => { setQuery(''); setStatus('all'); };
  if (resource.loading && !resource.data) return <Loading label={t('admin.console.loading_logs')}/>;
  if (resource.error && !resource.data) return <ErrorState message={t(adminErrorKey(resource.error, 'logs_error'))} action={<Button variant="secondary" onClick={retry}>{t('admin.console.retry')}</Button>}/>;
  const tones = { SUCCESS: 'success', FAILED: 'danger', REGISTERED: 'info' } as const;
  return <div className="admin-login-logs" aria-busy={resource.loading || undefined}>
    <AdminResourceWarning error={resource.error} fallback="logs_error" retry={retry}/>
    <p className="admin-data-scope">{t('admin.console.logs_scope')}</p>
    <div className="admin-filter-toolbar admin-filter-toolbar--logs">
      <div className="admin-search-field"><label htmlFor="admin-log-search">{t('admin.console.search_logs')}</label><SearchBar id="admin-log-search" value={query} onChange={setQuery} placeholder={t('admin.console.search_logs_placeholder')} ariaLabel={t('admin.console.search_logs')} clearLabel={t('admin.console.clear_search')}/></div>
      <Select label={t('admin.console.log_status')} floatingLabel={false} variant="compact" value={status} onValueChange={value => setStatus(value as LogStatusFilter)} aria-label={t('admin.console.log_status')}><SelectItem value="all">{t('admin.console.all_statuses')}</SelectItem><SelectItem value="SUCCESS">{t('admin.success')}</SelectItem><SelectItem value="FAILED">{t('admin.failed')}</SelectItem><SelectItem value="REGISTERED">{t('admin.registered')}</SelectItem></Select>
      <Select label={t('admin.console.sort')} floatingLabel={false} variant="compact" value={sort} onValueChange={value => setSort(value as LogSort)} aria-label={t('admin.console.sort_logs')}><SelectItem value="newest">{t('admin.console.newest_first')}</SelectItem><SelectItem value="oldest">{t('admin.console.oldest_first')}</SelectItem></Select>
    </div>
    <div className="admin-results"><p role="status" data-admin-log-count>{t('admin.console.log_count', { shown: filtered.length, total: resource.data?.length ?? 0 })}</p>{hasFilters && <Button variant="ghost" size="sm" onClick={clear}>{t('admin.console.clear_filters')}</Button>}</div>
    {!filtered.length ? <EmptyState title={t(hasFilters ? 'admin.console.no_matching_logs' : 'admin.console.no_logs')} description={hasFilters ? t('admin.console.adjust_filters') : undefined} action={hasFilters ? <Button variant="secondary" onClick={clear}>{t('admin.console.clear_filters')}</Button> : undefined}/> :
      <AdminTable label={t('admin.console.logs_table')}><table className="admin-logs-table"><caption className="sr-only">{t('admin.console.logs_table')}</caption><thead><tr><th scope="col">{t('admin.console.attempt_email')}</th><th scope="col">{t('admin.col_status')}</th><th scope="col">{t('admin.console.ip_address')}</th><AdminSortHeading label={t('admin.console.timestamp')} direction={sort === 'newest' ? 'descending' : 'ascending'} onClick={() => setSort(sort === 'newest' ? 'oldest' : 'newest')}/></tr></thead><tbody>{filtered.map(log => <tr key={log.id} data-admin-log={log.id}>
        <td><span className="admin-log-email" title={log.attemptEmail}>{log.attemptEmail || '—'}</span></td><td><StatusPill tone={tones[log.status as keyof typeof tones] ?? 'neutral'}>{log.status === 'SUCCESS' ? t('admin.success') : log.status === 'FAILED' ? t('admin.failed') : log.status === 'REGISTERED' ? t('admin.registered') : log.status || t('admin.console.unknown')}</StatusPill></td><td className="admin-ip">{log.ipAddress || '—'}</td><td><time dateTime={Number.isFinite(Date.parse(log.createdAt)) ? log.createdAt : undefined}>{formatAdminDate(log.createdAt, language)}</time></td>
      </tr>)}</tbody></table></AdminTable>}
  </div>;
}
