import React, { useEffect, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { useLanguage } from '../hooks/useLanguage';

interface CounterProps {
  to: number;
  suffix?: string;
}

const AnimatedCounter: React.FC<CounterProps> = ({ to, suffix = '' }) => {
  const [count, setCount] = useState(0);
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  useEffect(() => {
    if (!isInView) return;

    let start = 0;
    const end = to;
    if (start === end) return;

    // Fast counters, complete in 1.5 seconds
    const duration = 1.5;
    const totalMiliseconds = duration * 1000;
    const stepTime = Math.max(Math.floor(totalMiliseconds / end), 15);
    
    const timer = setInterval(() => {
      start += Math.ceil(end / (totalMiliseconds / stepTime));
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [isInView, to]);

  return (
    <span ref={ref} className="text-4xl md:text-6xl font-bold font-display tracking-tight text-accent">
      {count}
      {suffix}
    </span>
  );
};

export const Stats: React.FC = () => {
  const { t } = useLanguage();

  const statsList = [
    { labelKey: 'common.stats.projects', value: 350, suffix: '+' },
    { labelKey: 'common.stats.clients', value: 200, suffix: '+' },
    { labelKey: 'common.stats.experience', value: 15, suffix: '' },
    { labelKey: 'common.stats.certificates', value: 12, suffix: '' },
  ];

  return (
    <section className="py-20 bg-secondary-bg border-y border-custom-border">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          {statsList.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1, ease: 'easeOut' as const }}
              className="bg-primary-bg border border-custom-border p-8 rounded-2xl shadow-sm text-center flex flex-col justify-center items-center"
            >
              <AnimatedCounter to={stat.value} suffix={stat.suffix} />
              <span className="text-xs font-semibold tracking-wider uppercase text-secondary-text mt-3">
                {t(stat.labelKey)}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
export default Stats;
