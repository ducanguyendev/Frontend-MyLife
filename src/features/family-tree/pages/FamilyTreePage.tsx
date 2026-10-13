import React from 'react';
import { useLanguage } from '@/shared/hooks/useLanguage';
import { useWorkspaceToast } from '@/shared/hooks/useWorkspaceToast';
import { UserWorkspaceHeader } from '@/shared/layouts/UserWorkspaceHeader';
import { FamilyTreeManager } from '@/features/admin/components/FamilyTreeManager';

export const FamilyTreePage: React.FC = () => {
  const { t } = useLanguage();
  const showToast = useWorkspaceToast();

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-primary-bg font-sans transition-colors duration-300">
      <UserWorkspaceHeader backTo="/mylife" />
      <main className="relative z-10 mx-auto w-[96%] max-w-[1400px] flex-1 pb-12 pt-5">
        <div className="glass-pill min-h-[700px] overflow-hidden rounded-3xl border border-custom-border p-4 shadow-xl sm:p-6">
          <h1 className="sr-only">{t('myLife.modules.familyTree.title')}</h1>
          <FamilyTreeManager showToast={showToast} />
        </div>
      </main>
    </div>
  );
};

export default FamilyTreePage;
