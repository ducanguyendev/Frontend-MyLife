import React from 'react';
import { BookOpen, CalendarDays, Clock3, MapPinned, Network } from 'lucide-react';

export const FamilyTreeArtwork: React.FC = () => <>
  <svg className="my-life-module-card__network" viewBox="0 0 340 250" fill="none">
    <path d="M170 45v52M170 97 95 145M170 97l75 48M95 145v48M245 145v48M95 193h150" />
    <circle cx="170" cy="38" r="22" /><circle cx="170" cy="97" r="16" />
    <circle cx="95" cy="145" r="15" /><circle cx="245" cy="145" r="15" />
    <circle cx="95" cy="193" r="19" /><circle cx="245" cy="193" r="19" />
  </svg>
  <Network className="my-life-module-card__art-icon" size={25} />
</>;

export const AnniversaryArtwork: React.FC = () => (
  <div className="my-life-module-card__calendar-grid"><CalendarDays size={30} />{Array.from({ length: 12 }, (_, index) => <i key={index} />)}</div>
);

export const LibraryArtwork: React.FC = () => <>
  <span className="my-life-module-card__photo my-life-module-card__photo--back" />
  <span className="my-life-module-card__photo my-life-module-card__photo--front"><BookOpen size={34} /></span>
</>;

export const FamilyMapArtwork: React.FC = () => <>
  <span className="my-life-module-card__map-ring my-life-module-card__map-ring--outer" />
  <span className="my-life-module-card__map-ring my-life-module-card__map-ring--inner" />
  <MapPinned className="my-life-module-card__map-pin" size={34} />
</>;

export const TimelineArtwork: React.FC = () => <>
  <svg className="my-life-module-card__timeline" viewBox="0 0 240 140" fill="none">
    <path d="M22 104C58 104 59 36 98 36s40 68 78 68 35-45 47-45" />
    <circle cx="22" cy="104" r="8" /><circle cx="98" cy="36" r="8" />
    <circle cx="176" cy="104" r="8" /><circle cx="223" cy="59" r="8" />
  </svg>
  <Clock3 className="my-life-module-card__timeline-icon" size={34} />
</>;

export const MemberCardArtwork: React.FC = () => (
  <svg viewBox="0 0 160 120" fill="none">
    <path d="M80 19v31M80 50 43 77M80 50l37 27M43 77v25M117 77v25M43 102h74" />
    <circle cx="80" cy="17" r="10" /><circle cx="80" cy="50" r="8" />
    <circle cx="43" cy="77" r="7" /><circle cx="117" cy="77" r="7" />
    <circle cx="43" cy="102" r="9" /><circle cx="117" cy="102" r="9" />
  </svg>
);
