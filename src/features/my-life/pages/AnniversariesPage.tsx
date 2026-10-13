import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/ui';
import { MyLifeWorkspaceLayout } from '@/shared/layouts/MyLifeWorkspaceLayout';
import { useWorkspaceToast } from '@/shared/hooks/useWorkspaceToast';
import { useFamilyMembers } from '@/features/admin/components/family-tree/useFamilyMembers';
import { AnniversaryTab } from '@/features/admin/components/family-tree/AnniversaryTab';

export const AnniversariesPage: React.FC = () => {
  const { t } = useTranslation();
  const showToast = useWorkspaceToast();
  const { members, loading, loadError, fetchMembers } = useFamilyMembers();

  return (
    <MyLifeWorkspaceLayout backTo="/mylife" showDock contentClassName="px-3 py-3 sm:px-5 sm:py-4">
      <div className="flex min-h-full flex-1 flex-col">
        <div className="mb-4 max-w-2xl shrink-0">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-accent">MyLife</p>
          <h1 className="text-2xl font-black tracking-tight text-primary-text sm:text-3xl">{t('myLife.modules.anniversaries.title')}</h1>
          <p className="mt-2 text-sm leading-relaxed text-secondary-text">{t('myLife.modules.anniversaries.description')}</p>
        </div>
        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-custom-border bg-secondary-bg/30">
          {loading ? (
            <div role="status" className="flex min-h-48 flex-1 items-center justify-center text-secondary-text">{t('common.loading')}</div>
          ) : loadError ? (
            <div role="alert" className="flex min-h-48 flex-1 flex-col items-center justify-center py-8 text-center">
              <p className="mb-4 text-error">{t(loadError)}</p>
              <Button variant="secondary" onClick={() => void fetchMembers()}>{t('admin.library_ui.retry')}</Button>
            </div>
          ) : (
            <AnniversaryTab showToast={showToast} members={members} />
          )}
        </section>
      </div>
    </MyLifeWorkspaceLayout>
  );
};
