import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../hooks/useLanguage';

interface CircularSkill {
  name: string;
  level: number;
  label: string;
  color: string;
}

export const Skills: React.FC = () => {
  const { t } = useLanguage();

  const circularSkills: CircularSkill[] = [
    { name: 'C# / C++', level: 95, label: 'C#', color: '#e5c158' },
    { name: 'Node.js / Go', level: 90, label: 'Go', color: '#e5c158' },
    { name: 'Unity / Unreal', level: 90, label: 'Un', color: '#e5c158' },
    { name: 'SQL / NoSQL', level: 85, label: 'Db', color: '#e5c158' },
    { name: 'Docker / Git', level: 80, label: 'Dk', color: '#e5c158' },
  ];

  // SVG parameters for circle
  const radius = 50;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;

  return (
    <section id="skills" className="py-24 bg-primary-bg">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        
        {/* Section Header */}
        <div className="text-center mb-20">
          <span className="text-xs font-semibold tracking-[0.3em] uppercase text-accent mb-2 block">
            {t('skills.subtitle')}
          </span>
          <h2 className="text-3xl md:text-5xl font-light tracking-tight text-primary-text font-display">
            {t('skills.title')}
          </h2>
          <div className="w-12 h-[1px] bg-accent mx-auto mt-6" />
        </div>

        {/* Circular Skills Row */}
        <div className="flex flex-wrap justify-center gap-12 md:gap-16">
          {circularSkills.map((skill, index) => {
            const strokeDashoffset = circumference - (skill.level / 100) * circumference;

            return (
              <motion.div
                key={skill.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex flex-col items-center gap-4 w-32"
              >
                {/* Circle Wrapper */}
                <div className="relative w-28 h-28 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    {/* Background Ring */}
                    <circle
                      cx="56"
                      cy="56"
                      r={radius}
                      className="stroke-custom-border/60"
                      strokeWidth={strokeWidth - 2}
                      fill="transparent"
                    />
                    {/* Animated Progress Ring */}
                    <motion.circle
                      cx="56"
                      cy="56"
                      r={radius}
                      stroke="var(--accent-color)"
                      strokeWidth={strokeWidth}
                      fill="transparent"
                      strokeDasharray={circumference}
                      initial={{ strokeDashoffset: circumference }}
                      whileInView={{ strokeDashoffset }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.2, delay: 0.2, ease: 'easeOut' as const }}
                      strokeLinecap="round"
                    />
                  </svg>

                  {/* Inner Label (Software Brand Style) */}
                  <div className="absolute font-semibold text-lg text-primary-text uppercase bg-secondary-bg w-20 h-20 rounded-full flex items-center justify-center border border-custom-border/80 shadow-md">
                    <span className="font-display font-bold tracking-wider">{skill.label}</span>
                  </div>
                </div>

                {/* Percentage & Name */}
                <div className="text-center">
                  <div className="text-sm font-semibold text-accent">{skill.level}%</div>
                  <div className="text-xs text-secondary-text font-light uppercase tracking-wider mt-1">{skill.name}</div>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
export default Skills;
