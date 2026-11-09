import React from 'react';
import { MyLifeWorkspaceLayout } from '@/shared/layouts/MyLifeWorkspaceLayout';
import { useWorkspaceToast } from '@/shared/hooks/useWorkspaceToast';
import { AnniversaryTab } from '@/features/admin/components/family-tree/AnniversaryTab';

export const AnniversariesPage: React.FC = () => {
  const showToast = useWorkspaceToast();

  return (
    <MyLifeWorkspaceLayout backTo="/mylife" showDock contentScroll="auto">
      <div className="flex min-h-0 flex-1 flex-col">
        <section className="flex min-h-0 flex-1 flex-col">
          <AnniversaryTab showToast={showToast} />
        </section>
      </div>
    </MyLifeWorkspaceLayout>
  );
};
