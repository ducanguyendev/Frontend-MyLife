import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../hooks/useLanguage';
import avatarDuka from '../assets/avatar_duka.jpg';
import { TechBackground } from '../components/TechBackground';

export const Hero: React.FC = () => {
  const { t } = useLanguage();

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      window.scrollTo({
        top: el.offsetTop - 80,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section 
      id="home" 
      className="min-h-screen relative flex items-center justify-center pt-28 pb-16 overflow-hidden bg-primary-bg"
    >
      {/* Background glow effects */}
      <div className="absolute top-1/4 right-10 w-96 h-96 rounded-full bg-accent/5 filter blur-3xl" />
      <div className="absolute bottom-1/4 left-10 w-[500px] h-[500px] rounded-full bg-yellow-500/5 filter blur-3xl" />
      
      {/* Interactive Tech background */}
      <TechBackground />
      
      <div className="max-w-7xl mx-auto px-6 md:px-12 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
        
        {/* Left Section */}
        <div className="lg:col-span-8 flex flex-col items-start text-left">
          <motion.span
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' as const }}
            className="text-sm font-light text-secondary-text mb-2"
          >
            {t('home.greet')}
          </motion.span>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: 'easeOut' as const }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light font-display tracking-tight text-primary-text mb-3 sm:whitespace-nowrap"
          >
            {t('home.name')}
          </motion.h1>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' as const }}
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-accent mb-6"
          >
            {t('home.title')}
          </motion.h2>

          {/* Social Icons row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex gap-4 mb-8 text-secondary-text"
          >
            {/* Instagram */}
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors" aria-label="Instagram">
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </a>
            {/* GitHub */}
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors" aria-label="GitHub">
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                <path d="M9 18c-4.51 2-5-2-7-2" />
              </svg>
            </a>
            {/* Facebook */}
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors" aria-label="Facebook">
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
              </svg>
            </a>
          </motion.div>

          {/* Action buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4, ease: 'easeOut' as const }}
            className="flex flex-wrap gap-4 mb-12"
          >
            <button
              onClick={() => scrollToSection('contact')}
              className="text-xs font-bold tracking-widest uppercase bg-accent text-black px-8 py-3.5 hover:bg-accent-hover transition-colors shadow-lg shadow-accent/15 cursor-pointer rounded"
            >
              {t('home.btnContact')}
            </button>
          </motion.div>

          {/* Horizontally-aligned stats box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5, ease: 'easeOut' as const }}
            className="flex items-center gap-6 border border-custom-border/60 bg-secondary-bg/60 p-4 rounded-xl shadow-md w-full max-w-lg"
          >
            <div className="flex-1 text-center">
              <div className="text-xl md:text-2xl font-bold text-accent">{t('home.statsExpVal')}</div>
              <div className="text-[10px] font-semibold tracking-wider text-secondary-text uppercase mt-0.5">{t('home.statsExp')}</div>
            </div>
            <div className="w-[1px] h-10 bg-custom-border" />
            <div className="flex-1 text-center">
              <div className="text-xl md:text-2xl font-bold text-accent">{t('home.statsProjVal')}</div>
              <div className="text-[10px] font-semibold tracking-wider text-secondary-text uppercase mt-0.5">{t('home.statsProj')}</div>
            </div>
            <div className="w-[1px] h-10 bg-custom-border" />
            <div className="flex-1 text-center">
              <div className="text-xl md:text-2xl font-bold text-accent">{t('home.statsClientsVal')}</div>
              <div className="text-[10px] font-semibold tracking-wider text-secondary-text uppercase mt-0.5">{t('home.statsClients')}</div>
            </div>
          </motion.div>
        </div>

        {/* Right Section: Circular Character Avatar */}
        <div className="lg:col-span-4 flex justify-center items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' as const }}
            className="relative w-72 sm:w-80 md:w-96 aspect-square rounded-full overflow-hidden shadow-2xl border-4 border-accent group"
          >
            <img
              src={avatarDuka}
              alt="Duka Avatar"
              className="w-full h-full object-cover rounded-full transition-all duration-700 ease-in-out scale-100 group-hover:scale-108"
            />
          </motion.div>
        </div>

      </div>
    </section>
  );
};
export default Hero;
