import React from 'react';
import { motion } from 'framer-motion';

interface ProjectMockupProps {
  type: 'browser' | 'desktop';
  label: string;
  image: string;
  alt: string;
  reverseLayout?: boolean;
}

export const ProjectMockup: React.FC<ProjectMockupProps> = ({
  type,
  label,
  image,
  alt,
  reverseLayout = false,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: reverseLayout ? -20 : 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.8 }}
      className="w-full max-w-xl bg-[#fafafa] border border-gray-200 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] overflow-hidden flex flex-col text-left group"
    >
      {type === 'browser' ? (
        /* Browser Top bar */
        <div className="bg-white/80 border-b border-gray-200 px-4 py-3 flex items-center justify-between select-none">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
          </div>
          <div className="text-[10px] tracking-wider font-medium text-gray-600/80 bg-[#fafafa] px-6 py-0.5 rounded-full border border-gray-200/60">
            {label}
          </div>
          <div className="w-12" />
        </div>
      ) : (
        /* Desktop App Titlebar */
        <div className="bg-white/90 border-b border-gray-200 px-4 py-3.5 flex items-center select-none relative">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-[10px] font-bold tracking-widest text-[#111111]/80 uppercase">
              {label}
            </span>
          </div>
        </div>
      )}

      {/* Screen / Image Content */}
      <div className="relative w-full aspect-[16/10] overflow-hidden">
        <img
          src={image}
          alt={alt}
          className="w-full h-full object-cover transition-transform duration-750 group-hover:scale-103"
        />
      </div>
    </motion.div>
  );
};
