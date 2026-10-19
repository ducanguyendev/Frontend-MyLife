import React from 'react';
import { MyLifeWorkspaceLayout } from '@/shared/layouts/MyLifeWorkspaceLayout';
import { useWorkspaceToast } from '@/shared/hooks/useWorkspaceToast';
import { AnniversaryTab } from '@/features/admin/components/family-tree/AnniversaryTab';

export const AnniversariesPage: React.FC = () => {
  const showToast = useWorkspaceToast();

  return (
    <MyLifeWorkspaceLayout backTo="/mylife" showDock contentScroll="hidden" contentClassName="px-3 py-3 sm:px-5 sm:py-4">
      <div className="flex h-full min-h-0 flex-1 flex-col">
        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-custom-border bg-secondary-bg/30">
          <AnniversaryTab showToast={showToast} />
        </section>
      </div>
    </MyLifeWorkspaceLayout>
  );
};
