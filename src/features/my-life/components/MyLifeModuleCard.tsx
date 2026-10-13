import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { MyLifeModule } from '../config/myLifeModules';

interface MyLifeModuleCardProps {
  module: MyLifeModule;
}

export const MyLifeModuleCard: React.FC<MyLifeModuleCardProps> = ({ module }) => {
  const { t } = useTranslation();
  const Icon = module.icon;

  return (
    <Link
      to={module.route}
      className="group flex min-h-[200px] w-full max-w-[320px] flex-col rounded-3xl border border-custom-border bg-secondary-bg p-6 text-primary-text shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-accent/50 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
    >
      <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/12 text-accent">
        <Icon size={23} aria-hidden="true" />
      </span>
      <span className="text-lg font-bold tracking-tight">{t(module.titleKey)}</span>
      <span className="mt-2 text-sm leading-relaxed text-secondary-text">{t(module.descriptionKey)}</span>
      <span className="mt-auto flex items-center gap-2 pt-5 text-sm font-semibold text-accent">
        {t(module.actionKey)}
        <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
      </span>
    </Link>
  );
};
