import { BookOpen, CalendarDays, Clock3, MapPinned, Network } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { IllustrationSlotKey } from './illustrationSlots';

export interface MyLifeModule {
  id: string;
  titleKey: string;
  descriptionKey: string;
  actionKey: string;
  route: string;
  icon: LucideIcon;
  visualVariant: 'family' | 'calendar' | 'library' | 'map' | 'timeline';
  illustrationSlot: IllustrationSlotKey;
}

export const myLifeModules: MyLifeModule[] = [
  {
    id: 'familytree',
    titleKey: 'myLife.modules.familyTree.title',
    descriptionKey: 'myLife.modules.familyTree.description',
    actionKey: 'myLife.modules.familyTree.open',
    route: '/familytree',
    icon: Network,
    visualVariant: 'family',
    illustrationSlot: 'familyTree',
  },
  {
    id: 'anniversaries',
    titleKey: 'myLife.modules.anniversaries.title',
    descriptionKey: 'myLife.modules.anniversaries.description',
    actionKey: 'myLife.modules.anniversaries.open',
    route: '/anniversaries',
    icon: CalendarDays,
    visualVariant: 'calendar',
    illustrationSlot: 'anniversary',
  },
  {
    id: 'library',
    titleKey: 'myLife.modules.library.title',
    descriptionKey: 'myLife.modules.library.description',
    actionKey: 'myLife.modules.library.open',
    route: '/library',
    icon: BookOpen,
    visualVariant: 'library',
    illustrationSlot: 'library',
  },
  {
    id: 'map',
    titleKey: 'myLife.modules.map.title',
    descriptionKey: 'myLife.modules.map.description',
    actionKey: 'myLife.modules.map.open',
    route: '/map',
    icon: MapPinned,
    visualVariant: 'map',
    illustrationSlot: 'familyMap',
  },
  {
    id: 'timeline',
    titleKey: 'myLife.modules.timeline.title',
    descriptionKey: 'myLife.modules.timeline.description',
    actionKey: 'myLife.modules.timeline.open',
    route: '/timeline',
    icon: Clock3,
    visualVariant: 'timeline',
    illustrationSlot: 'timeline',
  },
];
