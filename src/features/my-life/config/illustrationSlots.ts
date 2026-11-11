import type { IllustrationDefinition } from '@/shared/components/illustration/types';
import {
  AnniversaryArtwork,
  FamilyHeroArtwork,
  FamilyMapArtwork,
  FamilyTreeArtwork,
  LibraryArtwork,
  TimelineArtwork,
} from '../components/MyLifeIllustrations';
import { sharedIllustrationSlots } from '@/shared/components/illustration/illustrationSlots';

export type IllustrationSlotKey =
  | 'familyHero'
  | 'familyTree'
  | 'anniversary'
  | 'library'
  | 'familyMap'
  | 'timeline'
  | 'memberCard'
  | 'memberProfile';

/** MyLife-owned decoration registry. No third-party assets or runtime requests are used. */
export const illustrationSlots: Partial<Record<IllustrationSlotKey, IllustrationDefinition>> = {
  ...sharedIllustrationSlots,
  familyHero: { Artwork: FamilyHeroArtwork, className: 'my-life-hero__art', decorative: true, source: 'inline-svg' },
  familyTree: { Artwork: FamilyTreeArtwork, className: 'my-life-module-card__art my-life-module-card__art--family', decorative: true, source: 'inline-svg' },
  anniversary: { Artwork: AnniversaryArtwork, className: 'my-life-module-card__art my-life-module-card__art--calendar', decorative: true, source: 'inline-svg' },
  library: { Artwork: LibraryArtwork, className: 'my-life-module-card__art my-life-module-card__art--library', decorative: true, source: 'inline-svg' },
  familyMap: { Artwork: FamilyMapArtwork, className: 'my-life-module-card__art my-life-module-card__art--map', decorative: true, source: 'inline-svg' },
  timeline: { Artwork: TimelineArtwork, className: 'my-life-module-card__art my-life-module-card__art--timeline', decorative: true, source: 'inline-svg' },
  memberProfile: { className: 'my-life-member-profile__illustration', decorative: true, source: 'inline-svg' },
};
