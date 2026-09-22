import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/shared/hooks/useLanguage';
import { HeroNotifications } from '../components/HeroNotifications';

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
    <div id="home">
      {/* Section 1: Visual Hero Background */}
      <section className="h-[90vh] md:h-screen relative flex items-center justify-center overflow-hidden bg-black">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0 opacity-90 pointer-events-none"
        >
          <source src="/assets/cofounder/cofounder-2-hero.webm" type="video/webm" />
        </video>

        {/* Floating 3D Notifications on laptop */}
        <HeroNotifications />
      </section>

      {/* Section 2: Profile Intro - Styled like Cofounder */}
      <section className="bg-[#fafafa] py-20 md:py-32 px-6 md:px-12 border-b border-gray-200">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
          
          {/* Left Column: Intro Data */}
          <div className="flex-1 w-full flex flex-col items-start text-left">
            <motion.span
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="text-xs md:text-sm font-bold text-gray-400 uppercase tracking-[0.15em] mb-4"
            >
              {t('home.greet')}
            </motion.span>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.1, ease: 'easeOut' }}
              className="text-4xl sm:text-5xl md:text-[4rem] font-medium font-display tracking-tight text-[#111] mb-6 sm:whitespace-nowrap leading-[1.1]"
            >
              {t('home.name')}
            </motion.h1>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
              className="text-xl sm:text-2xl md:text-3xl font-normal text-gray-500 mb-10"
            >
              {t('home.title')}
            </motion.h2>

            {/* Social Icons row */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="flex gap-6 mb-12 text-gray-400"
            >
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#111] transition-colors" aria-label="Instagram">
                <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#111] transition-colors" aria-label="GitHub">
                <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                  <path d="M9 18c-4.51 2-5-2-7-2" />
                </svg>
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#111] transition-colors" aria-label="Facebook">
                <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </a>
            </motion.div>

            {/* Action buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.4, ease: 'easeOut' }}
            >
              <button
                onClick={() => scrollToSection('contact')}
                className="text-[15px] font-medium bg-[#111] text-white px-8 py-3.5 hover:bg-black transition-colors rounded-lg flex items-center gap-2 shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
              >
                {t('home.btnContact')}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>
            </motion.div>
          </div>

          {/* Right Column: Clean Stats Box */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.5, ease: 'easeOut' }}
            className="flex-1 w-full max-w-lg bg-white rounded-2xl p-10 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col gap-8"
          >
            <div className="flex flex-col gap-1.5">
              <div className="text-4xl font-semibold text-[#111] tracking-tight">{t('home.statsExpVal')}</div>
              <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">{t('home.statsExp')}</div>
            </div>
            <div className="h-px w-full bg-gray-100" />
            <div className="flex flex-col gap-1.5">
              <div className="text-4xl font-semibold text-[#111] tracking-tight">{t('home.statsProjVal')}</div>
              <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">{t('home.statsProj')}</div>
            </div>
            <div className="h-px w-full bg-gray-100" />
            <div className="flex flex-col gap-1.5">
              <div className="text-4xl font-semibold text-[#111] tracking-tight">{t('home.statsClientsVal')}</div>
              <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">{t('home.statsClients')}</div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Hero;
