import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/shared/hooks/useLanguage';
import bodyDuka from '@/shared/assets/body_duka.jpg';

export const About: React.FC = () => {
  const { t } = useLanguage();
  
  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
  };

  return (
    <section id="about" className="py-24 bg-white border-b border-gray-100 relative">

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[#111111] font-display uppercase">
            {t('about.title')}
          </h2>
          <span className="text-xs font-medium tracking-wide text-gray-500 mt-3 block">
            {t('about.subtitle')}
          </span>
          <div className="w-12 h-[2px] bg-[#111111] mx-auto mt-6" />
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Full-body character image */}
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={cardVariants}
            className="lg:col-span-5 flex justify-center relative"
          >
            <motion.div
              animate={{ 
                y: [0, -8, 0],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="relative w-72 sm:w-80 md:w-96 aspect-[2/3] overflow-hidden rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] group z-10 border border-gray-100"
            >
              <img 
                src={bodyDuka} 
                alt="Duka Standing Pose" 
                className="w-full h-full object-cover transition-all duration-700 ease-in-out scale-100 group-hover:scale-102 bg-[#fafafa]"
              />
            </motion.div>
          </motion.div>

          {/* Right Column: Bio Paragraphs */}
          <div className="lg:col-span-7 flex flex-col gap-6 text-left">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
              variants={cardVariants}
              className="flex flex-col gap-6"
            >
              <p className="text-gray-600 text-sm md:text-base leading-relaxed font-light">
                {t('about.bioPart1')}
              </p>
              <p className="text-gray-600 text-sm md:text-base leading-relaxed font-light">
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
