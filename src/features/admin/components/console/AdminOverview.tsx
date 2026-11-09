import { ArrowUpRight, CheckCircle2, Clock3, LayoutDashboard, LockKeyhole, LogIn, ShieldCheck, UserPlus, Users, XCircle } from 'lucide-react';
import { EmptyState, ErrorState, StatCard, Surface } from '@/design-system';
import { Button } from '@/shared/components/ui/Button';
import { useLanguage } from '@/shared/hooks/useLanguage';
import { accountProportions, adminErrorKey, type AdminStats } from '../../services/adminConsoleService';
import type { AdminResource } from '../../hooks/useAdminConsole';
import { AdminResourceWarning } from './AdminShared';

export function AdminOverview({ resource, retry, onOpen }: { resource: AdminResource<AdminStats>; retry: () => void; onOpen: (tab: 'users' | 'logs') => void }) {
  const { t, language } = useLanguage();
  const count = (value: number) => value.toLocaleString(language === 'vi' ? 'vi-VN' : 'en-GB');
  if (resource.loading && !resource.data) return <div className="admin-stat-grid" role="status" aria-label={t('admin.console.loading_stats')}>
    {Array.from({ length: 6 }, (_, index) => <div className="admin-stat-skeleton" key={index} aria-hidden="true"><span/><strong/><i/></div>)}
  </div>;
  if (resource.error && !resource.data) return <ErrorState message={t(adminErrorKey(resource.error, 'stats_error'))} action={<Button variant="secondary" onClick={retry}>{t('admin.console.retry')}</Button>}/>;
  if (!resource.data) return <EmptyState title={t('admin.console.no_stats')} action={<Button variant="secondary" onClick={retry}>{t('admin.console.retry')}</Button>}/>;
  const stats = resource.data, proportions = accountProportions(stats);
  const items = [
    { key: 'total_users', value: stats.totalUsers, Icon: Users, tone: 'brand' },
    { key: 'active_accounts', value: stats.totalActive, Icon: ShieldCheck, tone: 'success' },
    { key: 'locked_accounts', value: stats.totalLocked, Icon: LockKeyhole, tone: 'danger' },
    { key: 'success_logins', value: stats.last7Days.successLogins, Icon: LogIn, tone: 'success', week: true },
    { key: 'failed_logins', value: stats.last7Days.failedLogins, Icon: XCircle, tone: 'danger', week: true },
    { key: 'new_registrations', value: stats.last7Days.newRegistrations, Icon: UserPlus, tone: 'info', week: true },
  ];
  return <div className="admin-overview" aria-busy={resource.loading || undefined}>
    <AdminResourceWarning error={resource.error} fallback="stats_error" retry={retry}/>
    <div className="admin-stat-grid">{items.map(({ key, value, Icon, tone, week }) => <StatCard key={key} className={`admin-kpi admin-kpi--${tone}`} icon={<Icon size={20} aria-hidden="true"/>}
      label={<span className="admin-kpi__label">{t(`admin.console.${key}`)}{week && <small>{t('admin.console.last_seven_days')}</small>}</span>} value={count(value)}/>)}</div>
    <div className="admin-summary-grid">
      <Surface className="admin-summary">
        <div className="admin-section-heading"><div><span className="admin-overline">{t('admin.console.accounts')}</span><h2>{t('admin.console.account_health')}</h2></div><Users size={20} aria-hidden="true"/></div>
        <p className="admin-summary__description">{t('admin.console.account_health_hint')}</p>
        <dl className="admin-account-counts"><div><dt><span className="admin-dot admin-dot--success"/>{t('admin.console.active_accounts')}</dt><dd>{count(stats.totalActive)}</dd></div><div><dt><span className="admin-dot admin-dot--danger"/>{t('admin.console.locked_accounts')}</dt><dd>{count(stats.totalLocked)}</dd></div></dl>
        {proportions && <div className="admin-account-bar" role="img" aria-label={t('admin.console.account_ratio', { active: stats.totalActive, locked: stats.totalLocked, total: stats.totalUsers })}><span style={{ width: `${proportions.active}%` }}/><span style={{ width: `${proportions.locked}%` }}/></div>}
        <p className="admin-summary__footnote">{stats.totalUsers ? t('admin.console.account_total', { total: count(stats.totalUsers) }) : t('admin.console.no_accounts_yet')}</p>
      </Surface>
      <Surface className="admin-summary">
        <div className="admin-section-heading"><div><span className="admin-overline">{t('admin.console.last_seven_days')}</span><h2>{t('admin.console.login_activity')}</h2></div><Clock3 size={20} aria-hidden="true"/></div>
        <dl className="admin-activity-list">{items.slice(3).map(({ key, value, Icon, tone }) => <div key={key}><dt><span className={`admin-activity-icon admin-activity-icon--${tone}`}><Icon size={16} aria-hidden="true"/></span>{t(`admin.console.${key}`)}</dt><dd>{count(value)}</dd></div>)}</dl>
      </Surface>
    </div>
    <Surface className="admin-shortcuts"><div className="admin-section-heading"><div><span className="admin-overline">{t('admin.console.workspace')}</span><h2>{t('admin.console.shortcuts')}</h2></div><LayoutDashboard size={20} aria-hidden="true"/></div>
      <div className="admin-shortcuts__links"><button type="button" onClick={() => onOpen('users')}><span className="admin-shortcut-icon"><Users size={20}/></span><span><strong>{t('admin.console.users_title')}</strong><small>{t('admin.console.users_shortcut_hint')}</small></span><ArrowUpRight size={18}/></button><button type="button" onClick={() => onOpen('logs')}><span className="admin-shortcut-icon"><CheckCircle2 size={20}/></span><span><strong>{t('admin.console.logs_title')}</strong><small>{t('admin.console.logs_shortcut_hint')}</small></span><ArrowUpRight size={18}/></button></div>
    </Surface>
  </div>;
}
