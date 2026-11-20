import React from 'react';
import { LibraryTab } from '@/features/admin/components/family-tree/LibraryTab';
import { MyLifeWorkspaceLayout } from '@/shared/layouts/MyLifeWorkspaceLayout';
import { useWorkspaceToast } from '@/shared/hooks/useWorkspaceToast';

export const LibraryPage: React.FC = () => {
  const showToast = useWorkspaceToast();

  return (
    <MyLifeWorkspaceLayout backTo="/mylife" showDock contentScroll="auto">
      <LibraryTab showToast={showToast} />
    </MyLifeWorkspaceLayout>
  );
};
