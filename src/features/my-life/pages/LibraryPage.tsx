import React from 'react';
import { LibraryTab } from '@/features/admin/components/family-tree/LibraryTab';
import { MyLifeWorkspaceLayout } from '@/shared/layouts/MyLifeWorkspaceLayout';
import { useWorkspaceToast } from '@/shared/hooks/useWorkspaceToast';

export const LibraryPage: React.FC = () => {
  const showToast = useWorkspaceToast();

  return (
    <MyLifeWorkspaceLayout backTo="/mylife" showDock contentScroll="hidden" contentClassName="px-3 py-2 sm:px-5 sm:py-3">
      <LibraryTab showToast={showToast} />
    </MyLifeWorkspaceLayout>
  );
};
