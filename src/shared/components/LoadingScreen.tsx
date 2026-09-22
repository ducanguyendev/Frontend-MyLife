import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../hooks/useLanguage';

export const LoadingScreen: React.FC = () => {
  const { t } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
      className="fixed inset-0 bg-primary-bg z-50 flex flex-col justify-center items-center pointer-events-none"
    >
      <div className="flex flex-col items-center gap-6">
        <motion.div
          initial={{ letterSpacing: '0.1em', opacity: 0.3 }}
          animate={{ letterSpacing: '0.3em', opacity: 1 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'easeInOut',
          }}
          className="text-lg font-bold font-display text-primary-text"
        >
          {t('common.logo')}
        </motion.div>
        
        {/* Minimal loading bar */}
        <div className="w-40 h-[1.5px] bg-custom-border overflow-hidden relative">
          <motion.div
            initial={{ left: '-100%', width: '100%' }}
            animate={{ left: '100%' }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute top-0 bottom-0 bg-accent"
          />
        </div>
      </div>
    </motion.div>
  );
};
export default LoadingScreen;
