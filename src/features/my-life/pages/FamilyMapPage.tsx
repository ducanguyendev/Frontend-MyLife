import React from 'react';
import { FamilyMapTab } from '@/features/admin/components/family-tree/FamilyMapTab';
import { MyLifeWorkspaceLayout } from '@/shared/layouts/MyLifeWorkspaceLayout';

export const FamilyMapPage: React.FC = () => (
  <MyLifeWorkspaceLayout
    backTo="/mylife"
    showDock
    contentScroll="hidden"
    contentClassName="min-h-0 px-3 pb-2 pt-2 sm:px-5 sm:pt-3"
  >
    <FamilyMapTab />
  </MyLifeWorkspaceLayout>
);
