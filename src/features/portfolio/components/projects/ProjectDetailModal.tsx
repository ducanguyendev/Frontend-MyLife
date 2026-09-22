import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useLanguage } from '@/shared/hooks/useLanguage';
import { ProjectScreenPanels } from './ProjectScreenPanels';
import type { ProjectConfig, ProjectKey } from './types';

interface ProjectDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProject: ProjectKey;
  activeTab: string;
  onTabChange: (tab: string) => void;
  projectConfig: ProjectConfig;
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  isOpen,
  onClose,
  activeProject,
  activeTab,
  onTabChange,
  projectConfig,
}) => {
  const { t } = useLanguage();

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
          />

          {/* Modal Card Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="relative bg-[#fafafa] w-full max-w-5xl h-[85vh] rounded-2xl border border-gray-200 shadow-[0_8px_30px_rgb(0,0,0,0.06)] flex flex-col overflow-hidden z-10 text-left"
          >
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between bg-white/30">
              <div>
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-[#111111] animate-pulse" />
                  <h3 className="text-base md:text-lg font-bold text-[#111111] tracking-wide font-display">
                    {t(`projects.${activeProject}.modal.title`)}
                  </h3>
                </div>
                <span className="text-[9px] font-extrabold tracking-widest text-gray-600/80 uppercase ml-5 block mt-0.5">
                  {t(`projects.${activeProject}.modal.techStack`)}
                </span>
              </div>
              <button
                onClick={onClose}
                className="text-gray-600 hover:text-[#111111] p-2 hover:bg-white rounded-full transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="px-6 py-3 border-b border-gray-200 flex gap-2 overflow-x-auto no-scrollbar bg-white/10 select-none">
              {projectConfig.tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => onTabChange(tab.key)}
                    className={`text-[10px] font-bold tracking-widest uppercase px-4 py-2.5 rounded-lg border transition-all duration-300 cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                      isActive
                        ? 'bg-[#111111] text-white border-primary-text shadow-sm'
                        : 'bg-transparent text-gray-600 border-transparent hover:border-gray-200 hover:text-[#111111]'
                    }`}
                  >
                    <Icon size={12} />
                    {t(tab.labelKey)}
                  </button>
                );
              })}
            </div>

            {/* Scrollable Tab Panels */}
            <div className="flex-grow overflow-y-auto p-6 md:p-10 no-scrollbar bg-[#fafafa]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3 }}
                >
                  <ProjectScreenPanels
                    projectKey={activeProject}
                    activeTab={activeTab}
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-white/20 text-center text-[9px] font-bold tracking-[0.2em] text-gray-600/80 select-none">
              {t(`projects.${activeProject}.modal.footer`)}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
