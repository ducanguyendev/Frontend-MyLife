import { useMemo } from 'react';
import { ArrowUpRight, CheckCircle2, Clock3, LockKeyhole, LogIn, ShieldCheck, UserPlus, Users, XCircle } from 'lucide-react';
import { EmptyState, ErrorState, Loading, StatCard, StatusPill, Surface } from '@/design-system';
import { Button } from '@/shared/components/ui/Button';
import { useLanguage } from '@/shared/hooks/useLanguage';
import { adminErrorKey, selectAdminLogs, selectAdminUsers, type AdminStats, type AdminUser, type LoginLog } from '../../services/adminConsoleService';
import type { AdminResource } from '../../hooks/useAdminConsole';
import { AdminLogStatus, AdminResourceWarning, AdminUserAvatar, formatAdminDate } from './AdminShared';

interface Props {
  resource: AdminResource<AdminStats>;
  users: AdminResource<AdminUser[]>;
  logs: AdminResource<LoginLog[]>;
  retry: () => void;
  retryUsers: () => void;
  retryLogs: () => void;
  usersBusy: boolean;
  onOpen: (tab: 'users' | 'logs') => void;
}

export function AdminOverview({ resource, users, logs, retry, retryUsers, retryLogs, usersBusy, onOpen }: Props) {
  const { t, language } = useLanguage();
  const count = (value: number) => value.toLocaleString(language === 'vi' ? 'vi-VN' : 'en-GB');
  const recentUsers = useMemo(() => selectAdminUsers(users.data ?? [], '', 'all', 'all', 'created-desc').slice(0, 3), [users.data]);
  const recentLogs = useMemo(() => selectAdminLogs(logs.data ?? [], '', 'all', 'newest').slice(0, 3), [logs.data]);
  const stats = resource.data;
  const accountItems = stats ? [
    { key: 'total_users', value: stats.totalUsers, Icon: Users, tone: 'brand' },
    { key: 'active_accounts', value: stats.totalActive, Icon: ShieldCheck, tone: 'success' },
    { key: 'locked_accounts', value: stats.totalLocked, Icon: LockKeyhole, tone: 'danger' },
  ] : [];
  const weeklyItems = stats ? [
    { key: 'success_logins', value: stats.last7Days.successLogins, Icon: LogIn, tone: 'success' },
    { key: 'failed_logins', value: stats.last7Days.failedLogins, Icon: XCircle, tone: 'danger' },
    { key: 'new_registrations', value: stats.last7Days.newRegistrations, Icon: UserPlus, tone: 'brand' },
  ] : [];
  const previewState = (source: AdminResource<unknown[]>, errorKey: string, loadingKey: string, emptyKey: string, reload: () => void, disabled = false) => {
    if (source.loading && !source.data) return <Loading label={t(`admin.console.${loadingKey}`)}/>;
    if (source.error && !source.data) return <ErrorState message={t(adminErrorKey(source.error, errorKey))} action={<Button variant="secondary" size="sm" onClick={reload} disabled={disabled}>{t('admin.console.retry')}</Button>}/>;
    if (!source.data?.length) return <EmptyState title={t(`admin.console.${emptyKey}`)}/>;
    return null;
  };

  return <div className="admin-overview" aria-busy={resource.loading || undefined}>
    {resource.loading && !stats ? <div className="admin-stat-grid" role="status" aria-label={t('admin.console.loading_stats')}>
      {Array.from({ length: 3 }, (_, index) => <div className="admin-stat-skeleton" key={index} aria-hidden="true"><span/><strong/></div>)}
    </div> : stats ? <>
      <AdminResourceWarning error={resource.error} fallback="stats_error" retry={retry}/>
      <div className="admin-stat-grid">{accountItems.map(({ key, value, Icon, tone }) => <StatCard key={key} className={`admin-kpi admin-kpi--${tone}`} icon={<Icon size={20} aria-hidden="true"/>} label={<span className="admin-kpi__label">{t(`admin.console.${key}`)}</span>} value={count(value)}/>)}</div>
      <Surface className="admin-weekly">
        <div className="admin-section-heading"><h2>{t('admin.console.weekly_title')}</h2><Clock3 size={17} aria-hidden="true"/></div>
        <dl className="admin-weekly-metrics">{weeklyItems.map(({ key, value, Icon, tone }) => <div className={`admin-weekly-metric admin-weekly-metric--${tone}`} key={key}>
          <dt><Icon size={16} aria-hidden="true"/>{t(`admin.console.${key}`)}</dt><dd>{count(value)}</dd>
        </div>)}</dl>
      </Surface>
    </> : resource.error ? <ErrorState message={t(adminErrorKey(resource.error, 'stats_error'))} action={<Button variant="secondary" onClick={retry}>{t('admin.console.retry')}</Button>}/> : <EmptyState title={t('admin.console.no_stats')} action={<Button variant="secondary" onClick={retry}>{t('admin.console.retry')}</Button>}/>}

    <div className="admin-recent-grid">
      <Surface className="admin-recent-panel">
        <div className="admin-section-heading"><div><h2>{t('admin.console.recent_users')}</h2><p>{t('admin.console.preview_scope')}</p></div><Users size={18} aria-hidden="true"/></div>
        <AdminResourceWarning error={users.data ? users.error : null} fallback="users_error" retry={retryUsers} disabled={usersBusy}/>
        {previewState(users, 'users_error', 'loading_users', 'no_users', retryUsers, usersBusy) ?? <ul className="admin-recent-list">{recentUsers.map(user => <li key={user.id} data-admin-recent-user={user.id}>
          <AdminUserAvatar user={user}/><div className="admin-recent-copy"><strong title={user.email}>{user.email}</strong><time>{formatAdminDate(user.createdAt, language)}</time></div><StatusPill tone={user.isActive ? 'success' : 'danger'}>{t(user.isActive ? 'admin.console.active' : 'admin.console.locked')}</StatusPill>
        </li>)}</ul>}
        <button type="button" className="admin-preview-link" onClick={() => onOpen('users')}>{t('admin.console.view_all_users')}<ArrowUpRight size={16} aria-hidden="true"/></button>
      </Surface>
      <Surface className="admin-recent-panel">
        <div className="admin-section-heading"><div><h2>{t('admin.console.recent_logins')}</h2><p>{t('admin.console.preview_scope')}</p></div><CheckCircle2 size={18} aria-hidden="true"/></div>
        <AdminResourceWarning error={logs.data ? logs.error : null} fallback="logs_error" retry={retryLogs}/>
        {previewState(logs, 'logs_error', 'loading_logs', 'no_logs', retryLogs) ?? <ul className="admin-recent-list admin-recent-list--logs">{recentLogs.map(log => <li key={log.id} data-admin-recent-log={log.id}>
          <span className={`admin-login-mark${log.status === 'FAILED' ? ' is-failed' : ''}`} aria-hidden="true"><LogIn size={16}/></span><div className="admin-recent-copy"><strong title={log.attemptEmail}>{log.attemptEmail || '—'}</strong><time>{formatAdminDate(log.createdAt, language)}</time></div><AdminLogStatus status={log.status}/>
        </li>)}</ul>}
        <button type="button" className="admin-preview-link" onClick={() => onOpen('logs')}>{t('admin.console.view_login_history')}<ArrowUpRight size={16} aria-hidden="true"/></button>
      </Surface>
    </div>
  </div>;
}
