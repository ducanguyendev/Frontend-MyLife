import { BookOpen, CalendarDays, MapPinned, Network } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface MyLifeModule {
  id: string;
  titleKey: string;
  descriptionKey: string;
  actionKey: string;
  route: string;
  icon: LucideIcon;
}

export const myLifeModules: MyLifeModule[] = [
  {
    id: 'familytree',
    titleKey: 'myLife.modules.familyTree.title',
    descriptionKey: 'myLife.modules.familyTree.description',
    actionKey: 'myLife.modules.familyTree.open',
    route: '/familytree',
    icon: Network,
  },
  {
    id: 'anniversaries',
    titleKey: 'myLife.modules.anniversaries.title',
    descriptionKey: 'myLife.modules.anniversaries.description',
    actionKey: 'myLife.modules.anniversaries.open',
    route: '/anniversaries',
    icon: CalendarDays,
  },
  {
    id: 'library',
    titleKey: 'myLife.modules.library.title',
    descriptionKey: 'myLife.modules.library.description',
    actionKey: 'myLife.modules.library.open',
    route: '/library',
    icon: BookOpen,
  },
  {
    id: 'map',
    titleKey: 'myLife.modules.map.title',
    descriptionKey: 'myLife.modules.map.description',
    actionKey: 'myLife.modules.map.open',
    route: '/map',
    icon: MapPinned,
  },
];
