import React from 'react';
import type { IllustrationDefinition } from './types';
import './IllustrationSlot.css';

interface IllustrationSlotProps {
  definition?: IllustrationDefinition;
}

/** Shared non-interactive renderer for optional decorative artwork. */
export const IllustrationSlot: React.FC<IllustrationSlotProps> = ({ definition }) => {
  const Artwork = definition?.Artwork;
  if (!Artwork) return null;

  return (
    <span
      className={`illustration-slot ${definition.className ?? ''}`}
      aria-hidden={definition.decorative ? true : undefined}
      role={!definition.decorative && definition.alt ? 'img' : undefined}
      aria-label={!definition.decorative ? definition.alt : undefined}
    >
      <Artwork />
    </span>
  );
};
