import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../hooks/useLanguage';

export const NotFound: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-primary-bg flex flex-col justify-center items-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <span className="text-xs font-semibold tracking-[0.3em] uppercase text-accent mb-4 block">
          {t('common.errorTitle')}
        </span>
        
        <h1 className="text-6xl md:text-8xl font-light tracking-tight font-display text-primary-text mb-6">
          {t('common.notFound')}
        </h1>
        
        <p className="text-secondary-text text-sm md:text-base font-light max-w-md mx-auto mb-10 leading-relaxed">
          {t('common.notFoundDesc')}
        </p>

        <a
          href="/"
          className="text-xs font-semibold tracking-widest uppercase bg-accent text-primary-bg px-8 py-3.5 hover:bg-accent-hover transition-colors shadow-lg shadow-accent/20"
        >
          {t('common.btnBackHome')}
        </a>
      </motion.div>
    </div>
  );
};
export default NotFound;
