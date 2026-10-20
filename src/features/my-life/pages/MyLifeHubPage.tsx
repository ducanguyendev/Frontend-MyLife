import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/context/AuthContext';
import { MyLifeWorkspaceLayout } from '@/shared/layouts/MyLifeWorkspaceLayout';
import { MyLifeModuleCard } from '../components/MyLifeModuleCard';
import { myLifeModules } from '../config/myLifeModules';
import './MyLifeHubPage.css';

const cardPlacement: Record<string, string> = {
  family: 'md:col-span-2 md:min-h-[280px] xl:col-span-6 xl:row-span-2',
  calendar: 'xl:col-span-6',
  library: 'xl:col-span-3',
  map: 'xl:col-span-3',
};

export const MyLifeHubPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <MyLifeWorkspaceLayout backTo="/Home" contentClassName="my-life-hub-scroll px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
      <div className="my-life-hub mx-auto flex min-h-full w-full max-w-[1200px] flex-1 flex-col">
        <div className="mb-5 flex shrink-0 flex-col justify-between gap-4 sm:mb-6 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <p className="mb-2 text-[0.68rem] font-bold uppercase tracking-[0.22em] text-accent">{t('myLife.hubEyebrow')}</p>
            <h1 className="text-3xl font-black tracking-tight text-primary-text sm:text-4xl">{t('myLife.title')}</h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-secondary-text sm:text-base">{t('myLife.subtitle')}</p>
          </div>
          {user?.name && (
            <p className="w-fit shrink-0 rounded-full border border-custom-border bg-secondary-bg/75 px-4 py-2 text-sm font-medium text-secondary-text shadow-sm backdrop-blur-sm">
              {t('myLife.greeting', { name: user.name })}
            </p>
          )}
        </div>

        <section aria-labelledby="my-life-modules-heading" className="flex flex-1 flex-col">
          <h2 id="my-life-modules-heading" className="sr-only">{t('myLife.hubSectionTitle')}</h2>
          <div className="grid flex-1 grid-cols-1 auto-rows-[minmax(230px,auto)] gap-4 md:grid-cols-2 xl:min-h-[528px] xl:grid-cols-12 xl:grid-rows-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            {myLifeModules.map((module) => (
              <div className={`flex min-h-0 min-w-0 ${cardPlacement[module.visualVariant] ?? ''}`} key={module.id}>
                <MyLifeModuleCard module={module} />
              </div>
            ))}
          </div>
        </section>
      </div>
    </MyLifeWorkspaceLayout>
  );
};
