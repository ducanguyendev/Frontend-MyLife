import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../hooks/useLanguage';
import bodyDuka from '../assets/body_duka.jpg';

export const About: React.FC = () => {
  const { t } = useLanguage();
  
  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
  };

  return (
    <section id="about" className="py-24 bg-secondary-bg border-y border-custom-border relative">

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-primary-text font-display uppercase">
            {t('about.title')}
          </h2>
          <span className="text-xs font-light tracking-wide text-secondary-text mt-3 block">
            {t('about.subtitle')}
          </span>
          <div className="w-12 h-[1px] bg-accent mx-auto mt-6" />
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Full-body character image with subtle aura glow */}
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={cardVariants}
            className="lg:col-span-5 flex justify-center relative"
          >
            {/* Glowing background aura */}
            <div className="absolute w-72 h-96 rounded-full bg-accent/20 filter blur-3xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            
            <motion.div
              animate={{ 
                y: [0, -12, 0],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="relative w-72 sm:w-80 md:w-96 aspect-[2/3] overflow-hidden rounded-3xl shadow-2xl group z-10 border border-custom-border/50"
            >
              <img 
                src={bodyDuka} 
                alt="Duka Standing Pose" 
                className="w-full h-full object-cover transition-all duration-700 ease-in-out scale-100 group-hover:scale-105"
              />
            </motion.div>
          </motion.div>

          {/* Right Column: Bio Paragraphs & Download CV */}
          <div className="lg:col-span-7 flex flex-col gap-6 text-left">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
              variants={cardVariants}
              className="flex flex-col gap-6"
            >
              <p className="text-secondary-text text-sm md:text-base leading-relaxed font-light">
                {t('about.bioPart1')}
              </p>
              <p className="text-secondary-text text-sm md:text-base leading-relaxed font-light">
                {t('about.bioPart2')}
              </p>
            </motion.div>

            {/* No Download CV CTA */}
          </div>

        </div>

      </div>
    </section>
  );
};
export default About;
