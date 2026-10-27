import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { MyLifeModule } from '../config/myLifeModules';
import { IllustrationSlot } from '@/shared/components/illustration/IllustrationSlot';
import { illustrationSlots } from '../config/illustrationSlots';

interface MyLifeModuleCardProps {
  module: MyLifeModule;
}

export const MyLifeModuleCard: React.FC<MyLifeModuleCardProps> = ({ module }) => {
  const { t } = useTranslation();
  const Icon = module.icon;

  const variantClass = `my-life-module-card--${module.visualVariant}`;

  return (
    <Link
      to={module.route}
      className={`my-life-module-card ${variantClass} group relative isolate flex h-full min-h-[290px] w-full flex-col overflow-hidden rounded-[1.75rem] border border-custom-border p-5 text-primary-text transition-all duration-[240ms] hover:-translate-y-0.5 md:p-6`}
    >
      <span className="my-life-module-card__visual">
        <IllustrationSlot definition={illustrationSlots[module.illustrationSlot]} />
        <span className="my-life-module-card__icon relative z-10 flex w-fit items-center justify-center rounded-2xl border border-custom-border/70 bg-secondary-bg/85 p-3 text-[var(--module-accent)] shadow-sm">
          <Icon size={22} aria-hidden="true" />
        </span>
      </span>
      <span className="my-life-module-card__content relative z-10 mt-auto block max-w-[24rem] pt-2">
        <span className="block text-lg font-bold tracking-tight md:text-xl">{t(module.titleKey)}</span>
        <span className="mt-2 block text-sm leading-relaxed text-secondary-text">{t(module.descriptionKey)}</span>
        <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--module-accent)]">
          {t(module.actionKey)}
          <ArrowRight size={16} className="transition-transform duration-[240ms] group-hover:translate-x-1" aria-hidden="true" />
        </span>
      </span>
    </Link>
  );
};
