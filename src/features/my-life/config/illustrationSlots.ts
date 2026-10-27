import type { ComponentType } from 'react';
import {
  AnniversaryArtwork,
  FamilyMapArtwork,
  FamilyTreeArtwork,
  LibraryArtwork,
  MemberCardArtwork,
  TimelineArtwork,
} from '../components/MyLifeIllustrations';

export type IllustrationSlotKey =
  | 'familyTree'
  | 'anniversary'
  | 'library'
  | 'familyMap'
  | 'timeline'
  | 'memberCard'
  | 'memberProfile';

export interface IllustrationSlot {
  /** Hand-authored local SVG/Lucide artwork. Replace this renderer to swap the visual. */
  Artwork?: ComponentType;
  className: string;
  decorative: boolean;
  alt?: string;
  source: 'inline-svg';
}

/** MyLife-owned decoration registry. No third-party assets or runtime requests are used. */
export const illustrationSlots: Partial<Record<IllustrationSlotKey, IllustrationSlot>> = {
  familyTree: { Artwork: FamilyTreeArtwork, className: 'my-life-module-card__art my-life-module-card__art--family', decorative: true, source: 'inline-svg' },
  anniversary: { Artwork: AnniversaryArtwork, className: 'my-life-module-card__art my-life-module-card__art--calendar', decorative: true, source: 'inline-svg' },
  library: { Artwork: LibraryArtwork, className: 'my-life-module-card__art my-life-module-card__art--library', decorative: true, source: 'inline-svg' },
  familyMap: { Artwork: FamilyMapArtwork, className: 'my-life-module-card__art my-life-module-card__art--map', decorative: true, source: 'inline-svg' },
  timeline: { Artwork: TimelineArtwork, className: 'my-life-module-card__art my-life-module-card__art--timeline', decorative: true, source: 'inline-svg' },
  memberCard: { Artwork: MemberCardArtwork, className: 'family-member-card__illustration', decorative: true, source: 'inline-svg' },
  memberProfile: { className: 'my-life-member-profile__illustration', decorative: true, source: 'inline-svg' },
};
