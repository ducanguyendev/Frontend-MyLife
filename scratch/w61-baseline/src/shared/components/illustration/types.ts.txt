import type { ComponentType } from 'react';

export interface IllustrationDefinition {
  /** Replace this local renderer to change the artwork without changing its consumer. */
  Artwork?: ComponentType;
  className?: string;
  decorative: boolean;
  alt?: string;
  source: 'inline-svg';
}
