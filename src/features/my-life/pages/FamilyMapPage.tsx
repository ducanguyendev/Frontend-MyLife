import React, { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { MyLifeWorkspaceLayout } from '@/shared/layouts/MyLifeWorkspaceLayout';

const FamilyMapTab = lazy(() => import('@/features/admin/components/family-tree/FamilyMapTab').then(module => ({ default: module.FamilyMapTab })));

export const FamilyMapPage: React.FC = () => (
  <MyLifeWorkspaceLayout
    backTo="/mylife"
    showDock
    contentScroll="hidden"

  >
    <Suspense fallback={<div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-accent" size={28} aria-hidden="true" /></div>}>
      <FamilyMapTab />
    </Suspense>
  </MyLifeWorkspaceLayout>
);
