import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/context/AuthContext';
import { UserWorkspaceHeader } from '@/shared/layouts/UserWorkspaceHeader';
import { MyLifeModuleCard } from '../components/MyLifeModuleCard';
import { myLifeModules } from '../config/myLifeModules';

export const MyLifeHubPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-primary-bg font-sans text-primary-text transition-colors duration-300">
      <UserWorkspaceHeader backTo="/Home" />
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-5 pb-16 pt-14 sm:px-8 sm:pt-20 lg:px-10">
        <div className="mb-10 max-w-2xl">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-accent">MyLife</p>
          <h1 className="text-3xl font-black tracking-tight text-primary-text sm:text-4xl">{t('myLife.title')}</h1>
          <p className="mt-3 text-base leading-relaxed text-secondary-text sm:text-lg">{t('myLife.subtitle')}</p>
          {user?.name && <p className="mt-5 text-sm font-medium text-secondary-text">{t('myLife.greeting', { name: user.name })}</p>}
        </div>

        <section aria-labelledby="my-life-modules-heading">
          <h2 id="my-life-modules-heading" className="mb-5 text-xs font-bold uppercase tracking-[0.18em] text-secondary-text">
            {t('myLife.modules.title')}
          </h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {myLifeModules.map((module) => <MyLifeModuleCard key={module.id} module={module} />)}
          </div>
        </section>
      </main>
    </div>
  );
};
