import React, { useState } from 'react';
import { useLanguage } from '@/shared/hooks/useLanguage';
import { 
  PROJECT_CONFIGS, 
  ProjectCard, 
  ProjectDetailModal, 
  type ProjectKey 
} from '../components/projects';

export const Projects: React.FC = () => {
  const { t } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeProject, setActiveProject] = useState<ProjectKey>('hottoys');
  const [activeTab, setActiveTab] = useState<string>('home');

  const currentProjectConfig = PROJECT_CONFIGS.find((p) => p.key === activeProject) || PROJECT_CONFIGS[0];

  const handleOpenModal = (projectKey: ProjectKey) => {
    setActiveProject(projectKey);
    const targetConfig = PROJECT_CONFIGS.find((p) => p.key === projectKey);
    setActiveTab(targetConfig?.defaultTab || 'home');
    setIsModalOpen(true);
  };

  return (
    <section id="projects" className="py-24 bg-white relative overflow-hidden">
      {/* Background Visual Effects */}
      <div className="absolute top-1/4 left-[-15%] w-[450px] h-[450px] rounded-full bg-[#111111]/5 filter blur-3xl pointer-events-none" />
      <div className="absolute top-2/3 right-[-10%] w-[550px] h-[550px] rounded-full bg-gray-100/50 filter blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[20%] w-[400px] h-[400px] rounded-full bg-[#111111]/5 filter blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-24">
          <span className="text-xs font-semibold tracking-[0.3em] uppercase text-gray-500 mb-2 block">
            {t('projects.subtitle')}
          </span>
          <h2 className="text-3xl md:text-5xl font-light tracking-tight text-[#111111] font-display">
            {t('projects.title')}
          </h2>
          <div className="w-12 h-[1px] bg-[#111111] mx-auto mt-6" />
        </div>

        {/* Projects Alternating Stack */}
        <div className="flex flex-col gap-32">
          {PROJECT_CONFIGS.map((project) => (
            <ProjectCard
              key={project.key}
              project={project}
              onOpenModal={handleOpenModal}
            />
          ))}
        </div>
      </div>

      {/* Interactive System Screens Modal Popup */}
      <ProjectDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        activeProject={activeProject}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        projectConfig={currentProjectConfig}
      />
    </section>
  );
};

export default Projects;
