import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/context/AuthContext';
import { MyLifeWorkspaceLayout } from '@/shared/layouts/MyLifeWorkspaceLayout';
import { IllustrationSlot } from '@/shared/components/illustration/IllustrationSlot';
import { MyLifeModuleCard } from '../components/MyLifeModuleCard';
import { myLifeModules } from '../config/myLifeModules';
import { illustrationSlots } from '../config/illustrationSlots';
import './MyLifeHubPage.css';

const cardPlacement: Record<string, string> = {
  family: 'md:col-span-2 md:min-h-[280px] xl:col-span-6 xl:row-span-2',
  calendar: 'xl:col-span-6',
  library: 'xl:col-span-3',
  map: 'xl:col-span-3',
  timeline: 'xl:col-span-6',
};

export const MyLifeHubPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <MyLifeWorkspaceLayout backTo="/Home" contentClassName="my-life-hub-scroll px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
      <div className="my-life-hub mx-auto flex min-h-full w-full max-w-[1200px] flex-1 flex-col">
        <section className="my-life-hero mb-6 flex shrink-0 items-center overflow-hidden rounded-[2rem] border border-custom-border px-5 py-6 sm:px-8 md:mb-8 md:min-h-[286px] md:px-10">
          <div className="my-life-hero__copy relative z-10 max-w-[58%]">
            <p className="mb-2 text-[0.68rem] font-bold uppercase tracking-[0.22em] text-accent">{t('myLife.hubEyebrow')}</p>
            <h1 className="m-0 text-3xl font-black tracking-tight text-primary-text sm:text-4xl lg:text-[2.8rem]">{t('myLife.title')}</h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-secondary-text sm:text-base">{t('myLife.subtitle')}</p>
            {user?.name && <p className="my-life-hero__greeting mt-4 w-fit rounded-full border border-custom-border px-4 py-2 text-sm font-medium text-secondary-text">{t('myLife.greeting', { name: user.name })}</p>}
          </div>
          <IllustrationSlot definition={illustrationSlots.familyHero} />
        </section>

        <section aria-labelledby="my-life-modules-heading" className="flex flex-1 flex-col">
          <div className="mb-4 flex items-center gap-3">
            <span className="my-life-section__marker" aria-hidden="true" />
            <h2 id="my-life-modules-heading" className="m-0 text-lg font-bold tracking-tight text-primary-text">{t('myLife.modules.title')}</h2>
          </div>
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
