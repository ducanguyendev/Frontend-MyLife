import { useState } from 'react';
import { Clock3, LayoutDashboard, RefreshCw, Users } from 'lucide-react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useLanguage } from '@/shared/hooks/useLanguage';
import { useNotification } from '@/shared/contexts/NotificationContext';
import { MyLifeWorkspaceLayout } from '@/shared/layouts/MyLifeWorkspaceLayout';
import { Button } from '@/shared/components/ui/Button';
import { ConfirmDialog, InlineError, PageHeader, SegmentedControl } from '@/design-system';
import { useAdminConsole, type AdminAction } from '../hooks/useAdminConsole';
import { adminErrorKey, type AdminUser } from '../services/adminConsoleService';
import { AdminOverview } from '../components/console/AdminOverview';
import { AdminUsers } from '../components/console/AdminUsers';
import { AdminLoginLogs } from '../components/console/AdminLoginLogs';
import './AdminDashboard.css';

type AdminTab = 'dashboard' | 'users' | 'logs';
export const AdminDashboard = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { showNotification } = useNotification();
  const consoleData = useAdminConsole(user?.id);
  const { stats, users, logs, pending } = consoleData;
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);
  const [deleteError, setDeleteError] = useState<unknown>(null);
  const [actionError, setActionError] = useState<{ error: unknown; fallback: string } | null>(null);
  const loading = stats.loading || users.loading || logs.loading;
  const deleting = userToDelete != null && pending.get(userToDelete.id) === 'delete';
  const notify = async (target: AdminUser, action: AdminAction, role?: AdminUser['role']) => {
    if (action === 'delete') setDeleteError(null); else setActionError(null);
    const result = await consoleData.mutate(target, action, role);
    if (result.ok) {
      if (action === 'delete') setUserToDelete(null);
      showNotification({ type: 'success', message: t(`admin.console.${action === 'role' ? 'role_updated' : action === 'delete' ? 'user_deleted' : result.isActive ? 'user_unlocked' : 'user_locked'}`) });
    } else if (result.error) {
      const fallback = action === 'role' ? 'role_error' : action === 'delete' ? 'delete_error' : 'status_error';
      if (action === 'delete') setDeleteError(result.error); else setActionError({ error: result.error, fallback });
      showNotification({ type: 'error', message: t(adminErrorKey(result.error, fallback)) });
    }
  };
  const options = [
    { value: 'dashboard' as const, label: t('admin.console.overview_tab'), icon: <LayoutDashboard size={17}/> },
    { value: 'users' as const, label: t('admin.console.users_tab'), icon: <Users size={17}/> },
    { value: 'logs' as const, label: t('admin.console.logs_title'), icon: <Clock3 size={17}/> },
  ];
  return <MyLifeWorkspaceLayout backTo="/mylife">
    <div className="admin-console" data-admin-console>
      <PageHeader eyebrow={t('admin.console.eyebrow')} title={t(`admin.console.${activeTab === 'dashboard' ? 'overview_title' : activeTab === 'users' ? 'users_title' : 'logs_title'}`)} description={t(`admin.console.${activeTab}_description`)}
        badge={activeTab === 'users' && users.data ? <span className="admin-heading-count" aria-label={t('admin.console.loaded_users_badge', { count: users.data.length })}>{users.data.length}</span> : activeTab === 'logs' && logs.data ? <span className="admin-heading-count" aria-label={t('admin.console.loaded_logs_badge', { count: logs.data.length })}>{logs.data.length}</span> : undefined}
        actions={<Button variant="secondary" disabled={pending.size > 0} isLoading={loading} leftIcon={<RefreshCw size={16}/>} onClick={consoleData.refresh}>{t('admin.console.refresh')}</Button>}/>
      <SegmentedControl label={t('admin.console.navigation')} className="admin-console__tabs" value={activeTab} onChange={setActiveTab} options={options}/>
      {actionError && <div className="admin-action-error"><InlineError>{t(adminErrorKey(actionError.error, actionError.fallback))}</InlineError><Button size="sm" variant="ghost" onClick={() => setActionError(null)}>{t('admin.console.dismiss')}</Button></div>}
      <section className="admin-console__panel" hidden={activeTab !== 'dashboard'} aria-label={t('admin.console.overview_title')}>
        <AdminOverview resource={stats} users={users} logs={logs} retry={() => void stats.reload()} retryUsers={() => void users.reload()} retryLogs={() => void logs.reload()} usersBusy={pending.size > 0} onOpen={setActiveTab}/>
      </section>
      <section className="admin-console__panel" hidden={activeTab !== 'users'} aria-label={t('admin.console.users_title')}>
        <AdminUsers resource={users} currentUserId={user?.id} pending={pending} retry={() => void users.reload()} onRole={(target, role) => void notify(target, 'role', role)} onStatus={target => void notify(target, 'status')} onDelete={target => { setDeleteError(null); setUserToDelete(target); }}/>
      </section>
      <section className="admin-console__panel" hidden={activeTab !== 'logs'} aria-label={t('admin.console.logs_title')}>
        <AdminLoginLogs resource={logs} retry={() => void logs.reload()}/>
      </section>
    </div>
    <ConfirmDialog isOpen={userToDelete != null} title={t('admin.delete_user_title')} busy={deleting} confirmLabel={t('admin.delete_forever')} cancelLabel={t('admin.cancel')}
      onClose={() => { if (!deleting) { setUserToDelete(null); setDeleteError(null); } }} onConfirm={() => { if (userToDelete) void notify(userToDelete, 'delete'); }}>
      <div className="admin-delete-message"><p>{t('admin.console.delete_prompt')}</p><strong>{userToDelete?.email}</strong><p>{t('admin.console.delete_warning')}</p>{deleteError != null && <InlineError>{t(adminErrorKey(deleteError, 'delete_error'))}</InlineError>}</div>
    </ConfirmDialog>
  </MyLifeWorkspaceLayout>;
};
