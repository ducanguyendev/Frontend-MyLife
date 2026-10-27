import React from 'react';
import type { IllustrationDefinition } from './types';

const FamilyMemberCardArtwork: React.FC = () => (
  <svg viewBox="0 0 160 120" fill="none">
    <path d="M80 19v31M80 50 43 77M80 50l37 27M43 77v25M117 77v25M43 102h74" />
    <circle cx="80" cy="17" r="10" /><circle cx="80" cy="50" r="8" />
    <circle cx="43" cy="77" r="7" /><circle cx="117" cy="77" r="7" />
    <circle cx="43" cy="102" r="9" /><circle cx="117" cy="102" r="9" />
  </svg>
);

/** Small shared decorations used outside the MyLife dashboard feature. */
export const sharedIllustrationSlots = {
  memberCard: {
    Artwork: FamilyMemberCardArtwork,
    className: 'family-member-card__illustration',
    decorative: true,
    source: 'inline-svg',
  } satisfies IllustrationDefinition,
};
