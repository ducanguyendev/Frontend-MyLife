import React from 'react';
import { useTranslation } from 'react-i18next';
import { LibraryTab } from '@/features/admin/components/family-tree/LibraryTab';
import { UserWorkspaceHeader } from '@/shared/layouts/UserWorkspaceHeader';
import { useWorkspaceToast } from '@/shared/hooks/useWorkspaceToast';

export const LibraryPage: React.FC = () => {
  const { t } = useTranslation();
  const showToast = useWorkspaceToast();

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-primary-bg font-sans text-primary-text transition-colors duration-300">
      <UserWorkspaceHeader backTo="/mylife" />
      <main className="mx-auto w-[96%] max-w-[1400px] flex-1 pb-12 pt-10 sm:pt-14">
        <div className="mb-8 max-w-2xl px-1">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-accent">MyLife</p>
          <h1 className="text-3xl font-black tracking-tight text-primary-text">{t('myLife.modules.library.title')}</h1>
          <p className="mt-2 text-sm leading-relaxed text-secondary-text">{t('myLife.modules.library.description')}</p>
        </div>
        <div className="glass-pill min-h-[600px] overflow-hidden rounded-3xl border border-custom-border">
          <LibraryTab showToast={showToast} />
        </div>
      </main>
    </div>
  );
};
