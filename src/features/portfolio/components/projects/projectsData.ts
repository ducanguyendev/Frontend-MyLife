import { 
  Home, 
  ShoppingBag, 
  BarChart3, 
  Ticket, 
  MessageSquare, 
  Gamepad2, 
  Sword, 
  Trophy 
} from 'lucide-react';
import type { ProjectConfig } from './types';

// Asset Imports
import hottoysMain from '@/shared/assets/hottoys_main.png';
import hottoysScreenHome from '@/shared/assets/hottoys_screen_home.png';
import hottoysScreenFeatured from '@/shared/assets/hottoys_screen_featured.png';
import hottoysScreenCatalog from '@/shared/assets/hottoys_screen_catalog.png';
import hottoysScreenDashboard from '@/shared/assets/hottoys_screen_dashboard.png';

import hommeMain from '@/shared/assets/homme_main.jpg';
import hommeScreenCatalog from '@/shared/assets/homme_screen_catalog.jpg';
import hommeScreenVouchers from '@/shared/assets/homme_screen_vouchers.jpg';
import hommeScreenChat from '@/shared/assets/homme_screen_chat.jpg';

import treasureMain from '@/shared/assets/treasure_main.jpg';
import treasureScreenMenu from '@/shared/assets/treasure_screen_menu.jpg';
import treasureScreenLobby from '@/shared/assets/treasure_screen_lobby.jpg';
import treasureScreenGameplay from '@/shared/assets/treasure_screen_gameplay.jpg';
import treasureScreenVictory from '@/shared/assets/treasure_screen_victory.jpg';

export const PROJECT_CONFIGS: ProjectConfig[] = [
  {
    key: 'hottoys',
    titleKey: 'projects.hottoys.title',
    problemTagKey: 'projects.hottoys.problemStatementTag',
    problemKey: 'projects.hottoys.problemStatement',
    descKey: 'projects.hottoys.description',
    tagsKey: 'projects.hottoys.tags',
    featuresKey: 'projects.hottoys.features',
    defaultTab: 'home',
    githubUrl: 'https://github.com',
    reverseLayout: false,
    mockup: {
      type: 'browser',
      label: 'hottoys-ecommerce.local',
      image: hottoysMain,
      alt: 'Hot Toys Store Mockup',
    },
    tabs: [
      { key: 'home', icon: Home, labelKey: 'projects.hottoys.modal.tabs.home' },
      { key: 'catalog', icon: ShoppingBag, labelKey: 'projects.hottoys.modal.tabs.catalog' },
      { key: 'stats', icon: BarChart3, labelKey: 'projects.hottoys.modal.tabs.stats' },
    ],
  },
  {
    key: 'homme',
    titleKey: 'projects.homme.title',
    problemTagKey: 'projects.homme.problemStatementTag',
    problemKey: 'projects.homme.problemStatement',
    descKey: 'projects.homme.description',
    tagsKey: 'projects.homme.tags',
    featuresKey: 'projects.homme.features',
    defaultTab: 'catalog',
    githubUrl: 'https://github.com',
    reverseLayout: true,
    mockup: {
      type: 'browser',
      label: 'homme-clothing.local',
      image: hommeMain,
      alt: 'HOMME Store Mockup',
    },
    tabs: [
      { key: 'catalog', icon: ShoppingBag, labelKey: 'projects.homme.modal.tabs.catalog' },
      { key: 'vouchers', icon: Ticket, labelKey: 'projects.homme.modal.tabs.vouchers' },
      { key: 'chat', icon: MessageSquare, labelKey: 'projects.homme.modal.tabs.chat' },
    ],
  },
  {
    key: 'treasure',
    titleKey: 'projects.treasure.title',
    problemTagKey: 'projects.treasure.problemStatementTag',
    problemKey: 'projects.treasure.problemStatement',
    descKey: 'projects.treasure.description',
    tagsKey: 'projects.treasure.tags',
    featuresKey: 'projects.treasure.features',
    defaultTab: 'lobby',
    githubUrl: 'https://github.com',
    reverseLayout: false,
    mockup: {
      type: 'desktop',
      label: 'Treasure Hunter 2D',
      image: treasureMain,
      alt: 'Treasure Hunter Game Mockup',
    },
    tabs: [
      { key: 'lobby', icon: Gamepad2, labelKey: 'projects.treasure.modal.tabs.lobby' },
      { key: 'gameplay', icon: Sword, labelKey: 'projects.treasure.modal.tabs.gameplay' },
      { key: 'victory', icon: Trophy, labelKey: 'projects.treasure.modal.tabs.victory' },
    ],
  },
];

export const PROJECT_SCREEN_IMAGES = {
  hottoys: {
    home: hottoysScreenHome,
    featured: hottoysScreenFeatured,
    catalog: hottoysScreenCatalog,
    dashboard: hottoysScreenDashboard,
  },
  homme: {
    catalog: hommeScreenCatalog,
    vouchers: hommeScreenVouchers,
    chat: hommeScreenChat,
  },
  treasure: {
    menu: treasureScreenMenu,
    lobby: treasureScreenLobby,
    gameplay: treasureScreenGameplay,
    victory: treasureScreenVictory,
  },
};
