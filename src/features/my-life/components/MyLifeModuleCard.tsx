import React from 'react';
import { ArrowRight, BookOpen, CalendarDays, MapPinned, Network } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { MyLifeModule } from '../config/myLifeModules';

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
      className={`my-life-module-card ${variantClass} group relative isolate flex h-full min-h-[230px] w-full flex-col overflow-hidden rounded-[1.75rem] border border-custom-border p-5 text-primary-text shadow-sm transition-all duration-[240ms] hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent md:p-6`}
    >
      <span className="my-life-module-card__wash" aria-hidden="true" />
      <span className={`my-life-module-card__art my-life-module-card__art--${module.visualVariant}`} aria-hidden="true">
        {module.visualVariant === 'family' && <>
          <svg className="my-life-module-card__network" viewBox="0 0 340 250" fill="none">
            <path d="M170 45v52M170 97 95 145M170 97l75 48M95 145v48M245 145v48M95 193h150" />
            <circle cx="170" cy="38" r="22" /><circle cx="170" cy="97" r="16" />
            <circle cx="95" cy="145" r="15" /><circle cx="245" cy="145" r="15" />
            <circle cx="95" cy="193" r="19" /><circle cx="245" cy="193" r="19" />
          </svg>
          <Network className="my-life-module-card__art-icon" size={25} />
        </>}
        {module.visualVariant === 'calendar' && <>
          <div className="my-life-module-card__calendar-grid"><CalendarDays size={30} />{Array.from({ length: 12 }, (_, index) => <i key={index} />)}</div>
        </>}
        {module.visualVariant === 'library' && <>
          <span className="my-life-module-card__photo my-life-module-card__photo--back" />
          <span className="my-life-module-card__photo my-life-module-card__photo--front"><BookOpen size={34} /></span>
        </>}
        {module.visualVariant === 'map' && <>
          <span className="my-life-module-card__map-ring my-life-module-card__map-ring--outer" />
          <span className="my-life-module-card__map-ring my-life-module-card__map-ring--inner" />
          <MapPinned className="my-life-module-card__map-pin" size={34} />
        </>}
      </span>
      <span className="relative z-10 flex w-fit items-center justify-center rounded-2xl border border-custom-border/70 bg-secondary-bg/75 p-3 text-[var(--module-accent)] shadow-sm backdrop-blur-sm">
        <Icon size={22} aria-hidden="true" />
      </span>
      <span className="relative z-10 mt-auto block max-w-[24rem] pt-8">
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
