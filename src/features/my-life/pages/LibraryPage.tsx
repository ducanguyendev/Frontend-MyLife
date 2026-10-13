import React from 'react';
import { useTranslation } from 'react-i18next';
import { LibraryTab } from '@/features/admin/components/family-tree/LibraryTab';
import { MyLifeWorkspaceLayout } from '@/shared/layouts/MyLifeWorkspaceLayout';
import { useWorkspaceToast } from '@/shared/hooks/useWorkspaceToast';

export const LibraryPage: React.FC = () => {
  const { t } = useTranslation();
  const showToast = useWorkspaceToast();

  return (
    <MyLifeWorkspaceLayout backTo="/mylife" showDock contentClassName="px-3 py-3 sm:px-5 sm:py-4">
      <div className="flex min-h-full flex-1 flex-col">
        <div className="mb-4 max-w-2xl shrink-0 px-1">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-accent">MyLife</p>
          <h1 className="text-2xl font-black tracking-tight text-primary-text sm:text-3xl">{t('myLife.modules.library.title')}</h1>
          <p className="mt-2 text-sm leading-relaxed text-secondary-text">{t('myLife.modules.library.description')}</p>
        </div>
        <section className="glass-pill flex min-h-[240px] flex-1 flex-col overflow-hidden rounded-3xl border border-custom-border">
          <LibraryTab showToast={showToast} />
        </section>
      </div>
    </MyLifeWorkspaceLayout>
  );
};
