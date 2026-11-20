import React from 'react';
import { useWorkspaceToast } from '@/shared/hooks/useWorkspaceToast';
import { MyLifeWorkspaceLayout } from '@/shared/layouts/MyLifeWorkspaceLayout';
import { FamilyTreeManager } from '@/features/admin/components/FamilyTreeManager';

export const FamilyTreePage: React.FC = () => {
  const showToast = useWorkspaceToast();

  return (
    <MyLifeWorkspaceLayout backTo="/mylife" showDock contentScroll="hidden">
      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-custom-border bg-[var(--surface-page)]">
        <FamilyTreeManager showToast={showToast} />
      </section>
    </MyLifeWorkspaceLayout>
  );
};

export default FamilyTreePage;
