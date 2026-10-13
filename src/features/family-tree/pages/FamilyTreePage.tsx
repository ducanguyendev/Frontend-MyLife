import React from 'react';
import { useLanguage } from '@/shared/hooks/useLanguage';
import { useWorkspaceToast } from '@/shared/hooks/useWorkspaceToast';
import { MyLifeWorkspaceLayout } from '@/shared/layouts/MyLifeWorkspaceLayout';
import { FamilyTreeManager } from '@/features/admin/components/FamilyTreeManager';

export const FamilyTreePage: React.FC = () => {
  const { t } = useLanguage();
  const showToast = useWorkspaceToast();

  return (
    <MyLifeWorkspaceLayout backTo="/mylife" showDock contentScroll="hidden" contentClassName="px-2 py-2 sm:px-4 sm:py-3">
      <section className="glass-pill flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-custom-border shadow-xl">
        <h1 className="sr-only">{t('myLife.modules.familyTree.title')}</h1>
        <FamilyTreeManager showToast={showToast} />
      </section>
    </MyLifeWorkspaceLayout>
  );
};

export default FamilyTreePage;
