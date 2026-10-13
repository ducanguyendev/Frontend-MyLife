import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/ui';
import { UserWorkspaceHeader } from '@/shared/layouts/UserWorkspaceHeader';
import { useWorkspaceToast } from '@/shared/hooks/useWorkspaceToast';
import { useFamilyMembers } from '@/features/admin/components/family-tree/useFamilyMembers';
import { AnniversaryTab } from '@/features/admin/components/family-tree/AnniversaryTab';

export const AnniversariesPage: React.FC = () => {
  const { t } = useTranslation();
  const showToast = useWorkspaceToast();
  const { members, loading, loadError, fetchMembers } = useFamilyMembers();

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-primary-bg font-sans text-primary-text transition-colors duration-300">
      <UserWorkspaceHeader backTo="/mylife" />
      <main className="mx-auto w-full max-w-[1400px] flex-1 px-5 pb-12 pt-10 sm:px-8 sm:pt-14">
        <div className="mb-8 max-w-2xl">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-accent">MyLife</p>
          <h1 className="text-3xl font-black tracking-tight text-primary-text">{t('myLife.modules.anniversaries.title')}</h1>
          <p className="mt-2 text-sm leading-relaxed text-secondary-text">{t('myLife.modules.anniversaries.description')}</p>
        </div>
        {loading ? (
          <div role="status" className="flex min-h-48 items-center justify-center text-secondary-text">{t('common.loading')}</div>
        ) : loadError ? (
          <div role="alert" className="py-12 text-center">
            <p className="mb-4 text-error">{t(loadError)}</p>
            <Button variant="secondary" onClick={() => void fetchMembers()}>{t('admin.library_ui.retry')}</Button>
          </div>
        ) : (
          <AnniversaryTab showToast={showToast} members={members} />
        )}
      </main>
    </div>
  );
};
