import React from 'react';
import { useTranslation } from 'react-i18next';
import { FamilyMapTab } from '@/features/admin/components/family-tree/FamilyMapTab';
import { MyLifeWorkspaceLayout } from '@/shared/layouts/MyLifeWorkspaceLayout';

export const FamilyMapPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <MyLifeWorkspaceLayout backTo="/mylife" showDock contentClassName="px-3 py-3 sm:px-5 sm:py-4">
      <div className="min-h-full">
        <div className="mb-4 max-w-2xl px-1">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-accent">MyLife</p>
          <h1 className="text-2xl font-black tracking-tight text-primary-text sm:text-3xl">{t('myLife.modules.map.title')}</h1>
          <p className="mt-2 text-sm leading-relaxed text-secondary-text">{t('myLife.modules.map.description')}</p>
        </div>
        <FamilyMapTab />
      </div>
    </MyLifeWorkspaceLayout>
  );
};
