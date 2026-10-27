import React from 'react';
import { illustrationSlots, type IllustrationSlotKey } from '../config/illustrationSlots';
import './IllustrationSlot.css';

interface IllustrationSlotProps {
  slot: IllustrationSlotKey;
}

/** Renders an optional, non-interactive illustration from the MyLife registry. */
export const IllustrationSlot: React.FC<IllustrationSlotProps> = ({ slot }) => {
  const definition = illustrationSlots[slot];
  const Artwork = definition?.Artwork;
  if (!definition || !Artwork) return null;

  return (
    <span className={`illustration-slot ${definition.className}`} aria-hidden={definition.decorative || undefined}>
      <Artwork />
    </span>
  );
};
