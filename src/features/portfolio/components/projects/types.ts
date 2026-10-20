import type { LucideIcon } from 'lucide-react';

export type ProjectKey = 'hottoys' | 'homme' | 'treasure';

export interface ProjectTabConfig {
  key: string;
  icon: LucideIcon;
  labelKey: string;
}

export interface ProjectConfig {
  key: ProjectKey;
  titleKey: string;
  problemTagKey: string;
  problemKey: string;
  descKey: string;
  tagsKey: string;
  featuresKey: string;
  defaultTab: string;
  githubUrl: string;
  reverseLayout?: boolean;
  mockup: {
    type: 'browser' | 'desktop';
    label: string;
    image: string;
    alt: string;
  };
  tabs: ProjectTabConfig[];
}
