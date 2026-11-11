import React from 'react';
import { motion } from 'framer-motion';
import { Briefcase } from 'lucide-react';
import { useLanguage } from '@/shared/hooks/useLanguage';

interface ExperienceItem {
  id: string;
  roleKey: string;
  companyKey: string;
  durationKey: string;
  responsibilitiesKey: string;
}

export const Experience: React.FC = () => {
  const { t } = useLanguage();

  const experiences: ExperienceItem[] = [
    {
      id: 'exp1',
      roleKey: 'experience.items.exp1.role',
      companyKey: 'experience.items.exp1.company',
      durationKey: 'experience.items.exp1.duration',
      responsibilitiesKey: 'experience.items.exp1.responsibilities',
    },
    {
      id: 'exp2',
      roleKey: 'experience.items.exp2.role',
      companyKey: 'experience.items.exp2.company',
      durationKey: 'experience.items.exp2.duration',
      responsibilitiesKey: 'experience.items.exp2.responsibilities',
    },
    {
      id: 'exp3',
      roleKey: 'experience.items.exp3.role',
      companyKey: 'experience.items.exp3.company',
      durationKey: 'experience.items.exp3.duration',
      responsibilitiesKey: 'experience.items.exp3.responsibilities',
    },
  ];

  return (
    <section id="experience" className="py-24 bg-[#fafafa] dark:bg-secondary-bg relative">
      <div className="max-w-4xl mx-auto px-6 md:px-12 relative z-10">
        
        {/* Section Header */}
        <div className="text-center mb-20">
          <span className="text-xs font-semibold tracking-[0.3em] uppercase text-gray-500 dark:text-secondary-text mb-2 block">
            {t('experience.subtitle')}
          </span>
          <h2 className="text-3xl md:text-5xl font-light tracking-tight text-[#111111] dark:text-primary-text font-display">
            {t('experience.title')}
          </h2>
          <div className="w-12 h-[1px] bg-[#111111] dark:bg-accent mx-auto mt-6" />
        </div>

        {/* Timeline body */}
        <div className="relative border-l border-gray-200/70 dark:border-custom-border ml-4 md:ml-6 flex flex-col gap-12">
          
          {experiences.map((exp, index) => {
            // Retrieve array of responsibilities via t
            const responsibilities = t(exp.responsibilitiesKey, { returnObjects: true });
            const respList = Array.isArray(responsibilities) ? responsibilities : [];

            return (
              <motion.div
                key={exp.id}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                className="relative pl-8 md:pl-10 text-left group"
              >
                {/* Timeline Icon Point */}
                <span className="absolute -left-[17px] top-1 bg-white dark:bg-primary-bg border border-gray-200/80 dark:border-custom-border text-gray-600 dark:text-secondary-text p-2 rounded-full shadow group-hover:border-gray-200 dark:group-hover:border-custom-border group-hover:text-gray-500 dark:group-hover:text-primary-text transition-colors duration-300 z-10">
                  <Briefcase size={14} />
                </span>

                {/* Content Box */}
                <div>
                  <span className="text-xs font-bold text-gray-500 dark:text-secondary-text uppercase tracking-widest block mb-1.5">
                    {t(exp.durationKey)}
                  </span>
                  <h3 className="text-lg font-semibold text-[#111111] dark:text-primary-text mb-1">
                    {t(exp.roleKey)}
                  </h3>
                  <div className="text-sm font-medium text-gray-600 dark:text-secondary-text mb-4">
                    {t(exp.companyKey)}
                  </div>
                  
                  {/* Detailed descriptions */}
                  <ul className="list-none flex flex-col gap-2.5">
                    {respList.map((resp: string, i: number) => (
                      <li 
                        key={i} 
                        className="text-gray-600 dark:text-secondary-text text-sm font-light leading-relaxed flex items-start gap-2"
                      >
                        <span className="text-gray-500 dark:text-secondary-text mt-1.5 shrink-0 block w-1.5 h-1.5 bg-[#111111] dark:bg-accent rounded-full" />
                        <span>{resp}</span>
                      </li>
                    ))}
                  </ul>
                </div>

              </motion.div>
            );
          })}

        </div>

      </div>
    </section>
  );
};
export default Experience;
