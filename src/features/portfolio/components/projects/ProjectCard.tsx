import React from 'react';
import { ExternalLink, Check } from 'lucide-react';
import { useLanguage } from '@/shared/hooks/useLanguage';
import { ProjectMockup } from './ProjectMockup';
import type { ProjectConfig, ProjectKey } from './types';

interface ProjectCardProps {
  project: ProjectConfig;
  onOpenModal: (key: ProjectKey) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onOpenModal }) => {
  const { t } = useLanguage();

  const tags = t(project.tagsKey, { returnObjects: true }) as string[];
  const features = t(project.featuresKey, { returnObjects: true }) as string[];

  const detailsContent = (
    <div className={`lg:col-span-6 flex flex-col items-start text-left ${project.reverseLayout ? 'order-1 lg:order-2' : ''}`}>
      {/* Tech Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {Array.isArray(tags) && tags.map((tag) => (
          <span 
            key={tag} 
            className="text-[10px] font-bold tracking-widest bg-[#fafafa] text-gray-600 px-3.5 py-1.5 rounded-full border border-gray-200/80 shadow-sm"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Title */}
      <h3 className="text-3xl md:text-4xl font-light font-display tracking-tight text-[#111111] mb-6">
        {t(project.titleKey)}
      </h3>

      {/* Problem Statement */}
      <div className="border-l-2 border-gray-200 pl-4 mb-6">
        <span className="text-[10px] font-bold tracking-[0.2em] text-gray-500 uppercase block mb-1">
          {t(project.problemTagKey)}
        </span>
        <p className="text-gray-600 text-sm italic font-light leading-relaxed">
          "{t(project.problemKey)}"
        </p>
      </div>

      {/* Description */}
      <p className="text-gray-600 text-sm md:text-base leading-relaxed font-light mb-6">
        {t(project.descKey)}
      </p>

      {/* Features List */}
      <ul className="flex flex-col gap-3 mb-8">
        {Array.isArray(features) && features.map((feature, idx) => (
          <li key={idx} className="flex items-start gap-3 text-sm font-light text-gray-600">
            <span className="text-gray-500 mt-0.5 flex-shrink-0">
              <Check size={16} />
            </span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4">
        <button
          onClick={() => onOpenModal(project.key)}
          className="text-xs font-bold tracking-widest uppercase bg-[#111111] dark:bg-accent text-white dark:text-black px-6 py-3.5 hover:bg-[#111111]-hover dark:hover:bg-accent/80 transition-colors shadow-lg shadow-gray-200 dark:shadow-none cursor-pointer rounded flex items-center gap-2"
        >
          <ExternalLink size={14} />
          {t('projects.liveDemo')}
        </button>
        <a
          href={project.githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-bold tracking-widest uppercase border border-gray-200 text-[#111111] px-6 py-3.5 hover:bg-[#fafafa] transition-colors cursor-pointer rounded flex items-center gap-2"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
            <path d="M9 18c-4.51 2-5-2-7-2" />
          </svg>
          {t('projects.github')}
        </a>
      </div>
    </div>
  );

  const mockupContent = (
    <div className={`lg:col-span-6 flex justify-center items-center ${project.reverseLayout ? 'order-2 lg:order-1' : ''}`}>
      <ProjectMockup
        type={project.mockup.type}
        label={project.mockup.label}
        image={project.mockup.image}
        alt={project.mockup.alt}
        reverseLayout={project.reverseLayout}
      />
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
      {project.reverseLayout ? (
        <>
          {mockupContent}
          {detailsContent}
        </>
      ) : (
        <>
          {detailsContent}
          {mockupContent}
        </>
      )}
    </div>
  );
};
