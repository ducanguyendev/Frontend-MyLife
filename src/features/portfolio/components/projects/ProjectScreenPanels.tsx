import React from 'react';
import { useLanguage } from '@/shared/hooks/useLanguage';
import { ScreenPreviewBlock } from './ScreenPreviewBlock';
import { PROJECT_SCREEN_IMAGES } from './projectsData';
import type { ProjectKey } from './types';

interface ProjectScreenPanelsProps {
  projectKey: ProjectKey;
  activeTab: string;
}

export const ProjectScreenPanels: React.FC<ProjectScreenPanelsProps> = ({
  projectKey,
  activeTab,
}) => {
  const { t } = useLanguage();

  if (projectKey === 'hottoys') {
    if (activeTab === 'home') {
      return (
        <div className="flex flex-col gap-16">
          <ScreenPreviewBlock
            tag={t('projects.hottoys.modal.screens.home.tag')}
            title={t('projects.hottoys.modal.screens.home.title')}
            desc={t('projects.hottoys.modal.screens.home.desc')}
            desc2={t('projects.hottoys.modal.screens.home.desc2')}
            images={[{ src: PROJECT_SCREEN_IMAGES.hottoys.home, alt: 'Welcome Home screen' }]}
          />
          <ScreenPreviewBlock
            tag={t('projects.hottoys.modal.screens.featured.tag')}
            title={t('projects.hottoys.modal.screens.featured.title')}
            desc={t('projects.hottoys.modal.screens.featured.desc')}
            desc2={t('projects.hottoys.modal.screens.featured.desc2')}
            images={[{ src: PROJECT_SCREEN_IMAGES.hottoys.featured, alt: 'Featured Products screen' }]}
            reverse
          />
        </div>
      );
    }
    if (activeTab === 'catalog') {
      return (
        <ScreenPreviewBlock
          tag={t('projects.hottoys.modal.screens.catalog.tag')}
          title={t('projects.hottoys.modal.screens.catalog.title')}
          desc={t('projects.hottoys.modal.screens.catalog.desc')}
          desc2={t('projects.hottoys.modal.screens.catalog.desc2')}
          images={[{ src: PROJECT_SCREEN_IMAGES.hottoys.catalog, alt: 'Catalog search screen' }]}
        />
      );
    }
    if (activeTab === 'stats') {
      return (
        <ScreenPreviewBlock
          tag={t('projects.hottoys.modal.screens.stats.tag')}
          title={t('projects.hottoys.modal.screens.stats.title')}
          desc={t('projects.hottoys.modal.screens.stats.desc')}
          desc2={t('projects.hottoys.modal.screens.stats.desc2')}
          images={[{ src: PROJECT_SCREEN_IMAGES.hottoys.dashboard, alt: 'Admin Dashboard screen' }]}
        />
      );
    }
  }

  if (projectKey === 'homme') {
    if (activeTab === 'catalog') {
      return (
        <ScreenPreviewBlock
          tag={t('projects.homme.modal.screens.catalog.tag')}
          title={t('projects.homme.modal.screens.catalog.title')}
          desc={t('projects.homme.modal.screens.catalog.desc')}
          desc2={t('projects.homme.modal.screens.catalog.desc2')}
          images={[{ src: PROJECT_SCREEN_IMAGES.homme.catalog, alt: 'HOMME Clothes Catalog screen' }]}
        />
      );
    }
    if (activeTab === 'vouchers') {
      return (
        <ScreenPreviewBlock
          tag={t('projects.homme.modal.screens.vouchers.tag')}
          title={t('projects.homme.modal.screens.vouchers.title')}
          desc={t('projects.homme.modal.screens.vouchers.desc')}
          desc2={t('projects.homme.modal.screens.vouchers.desc2')}
          images={[{ src: PROJECT_SCREEN_IMAGES.homme.vouchers, alt: 'Voucher Management admin screen' }]}
        />
      );
    }
    if (activeTab === 'chat') {
      return (
        <ScreenPreviewBlock
          tag={t('projects.homme.modal.screens.chat.tag')}
          title={t('projects.homme.modal.screens.chat.title')}
          desc={t('projects.homme.modal.screens.chat.desc')}
          desc2={t('projects.homme.modal.screens.chat.desc2')}
          images={[{ src: PROJECT_SCREEN_IMAGES.homme.chat, alt: 'Customer Service Chat Hub screen' }]}
        />
      );
    }
  }

  if (projectKey === 'treasure') {
    if (activeTab === 'lobby') {
      return (
        <div className="flex flex-col gap-16">
          <ScreenPreviewBlock
            tag={t('projects.treasure.modal.screens.lobby.tag')}
            title={t('projects.treasure.modal.screens.lobby.title')}
            desc={t('projects.treasure.modal.screens.lobby.desc')}
            desc2={t('projects.treasure.modal.screens.lobby.desc2')}
            images={[
              { src: PROJECT_SCREEN_IMAGES.treasure.menu, alt: 'Treasure Hunter Main Menu' },
              { src: PROJECT_SCREEN_IMAGES.treasure.lobby, alt: 'Nickname setup dialog', maxWidthClass: 'max-w-md mx-auto' },
            ]}
          />
        </div>
      );
    }
    if (activeTab === 'gameplay') {
      return (
        <ScreenPreviewBlock
          tag={t('projects.treasure.modal.screens.gameplay.tag')}
          title={t('projects.treasure.modal.screens.gameplay.title')}
          desc={t('projects.treasure.modal.screens.gameplay.desc')}
          desc2={t('projects.treasure.modal.screens.gameplay.desc2')}
          images={[{ src: PROJECT_SCREEN_IMAGES.treasure.gameplay, alt: '2D gameplay exploration' }]}
        />
      );
    }
    if (activeTab === 'victory') {
      return (
        <ScreenPreviewBlock
          tag={t('projects.treasure.modal.screens.victory.tag')}
          title={t('projects.treasure.modal.screens.victory.title')}
          desc={t('projects.treasure.modal.screens.victory.desc')}
          desc2={t('projects.treasure.modal.screens.victory.desc2')}
          images={[{ src: PROJECT_SCREEN_IMAGES.treasure.victory, alt: 'Level completed congratulations' }]}
        />
      );
    }
  }

  return null;
};
