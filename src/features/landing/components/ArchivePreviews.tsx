import { BookHeart, CalendarDays, Heart, Images, Leaf, MapPin, TreePine } from 'lucide-react';
import { useLanguage } from '@/shared/hooks/useLanguage';
import { Avatar } from '@/design-system/components/Foundations';
import { Card, Badge } from '@/shared/components/ui';

export function AnniversaryPreview({ compact = false }: { compact?: boolean }) {
  const { t } = useLanguage();
  return <Card padding="none" className={`archive-date ${compact ? 'archive-date--compact' : ''}`}>
    <div className="archive-date__calendar"><span>{t('landing.calendarMonth')}</span><strong>{t('landing.calendarDay')}</strong><Heart size={16} strokeWidth={1.5}/></div>
    <div className="archive-date__copy"><CalendarDays size={17} strokeWidth={1.5}/><p>{t('landing.calendarTitle')}</p><span>{t('landing.calendarNote')}</span></div>
  </Card>;
}

export function HeroArchive() {
  const { t } = useLanguage();
  return <figure className="hero-archive">
    <div className="hero-archive__backing" aria-hidden="true"><Leaf size={140} strokeWidth={.5}/></div>
    <div className="archive-photo hero-archive__photo"><img src="/assets/landing/family-archive.jpg" alt={t('landing.photoAlt')} width={1536} height={1024} fetchPriority="high"/><div className="archive-photo__caption"><span>{t('landing.photoTitle')}</span><small>{t('landing.photoDate')}</small></div></div>
    <div className="hero-archive__date"><AnniversaryPreview compact/></div>
    <Card padding="sm" className="hero-archive__family"><span className="hero-archive__family-icon"><TreePine size={18}/></span><div><p>{t('landing.familyMini')}</p><span>{t('landing.familyMiniNote')}</span><div className="hero-archive__avatars"><Avatar name={t('landing.grandfather')} size="sm"/><Avatar name={t('landing.grandmother')} size="sm"/><Avatar name={t('landing.mother')} size="sm"/></div></div></Card>
    <figcaption>{t('landing.sample')}</figcaption>
  </figure>;
}

function Person({ name, relation }: { name: string; relation: string }) {
  return <div className="archive-person"><Avatar name={name}/><div><strong>{name}</strong><span>{relation}</span></div></div>;
}

export function FamilyArchive() {
  const { t } = useLanguage();
  return <figure className="family-archive">
    <div className="family-archive__label"><TreePine size={17}/><span>{t('landing.family')}</span><Badge variant="outline">MyLife</Badge></div>
    <div className="family-archive__tree">
      <div className="family-archive__row"><Person name={t('landing.grandfather')} relation={t('landing.grandparents')}/><Person name={t('landing.grandmother')} relation={t('landing.grandparents')}/></div>
      <div className="family-archive__connector" aria-hidden="true"/>
      <div className="family-archive__row"><Person name={t('landing.mother')} relation={t('landing.parents')}/><Person name={t('landing.father')} relation={t('landing.parents')}/></div>
      <div className="family-archive__connector" aria-hidden="true"/>
      <div className="family-archive__row family-archive__row--child"><Person name={t('landing.child')} relation={t('landing.children')}/></div>
    </div>
    <figcaption>{t('landing.treeCaption')}<small>{t('landing.sample')}</small></figcaption>
  </figure>;
}

export function MemoryTimeline() {
  const { t } = useLanguage();
  return <div className="memory-timeline"><div className="memory-timeline__heading"><BookHeart size={20} strokeWidth={1.5}/><h3>{t('landing.timelineTitle')}</h3></div>
    <p>{t('landing.timelineDescription')}</p><ol>{['One','Two','Three'].map(key => <li key={key}><span>{t(`landing.timelineYear${key}`)}</span><strong>{t(`landing.timelineEvent${key}`)}</strong></li>)}</ol>
    <span className="archive-example">{t('landing.sample')}</span>
  </div>;
}

export function AlbumArchive() {
  const { t } = useLanguage();
  return <figure className="album-archive"><div className="album-archive__sheet" aria-hidden="true"/>
    <div className="archive-photo album-archive__photo"><img src="/assets/landing/garden-memory.jpg" alt={t('landing.gardenAlt')} width={1536} height={1024} loading="lazy"/><div className="archive-photo__caption"><span>{t('landing.albumName')}</span><small>{t('landing.albumDate')}</small></div></div>
    <div className="album-archive__tag"><Images size={17}/><span>{t('landing.albumLabel')}</span></div><figcaption>{t('landing.sample')}</figcaption>
  </figure>;
}

export function PlacesArchive() {
  const { t } = useLanguage();
  return <figure className="places-archive"><div className="places-archive__grid" aria-hidden="true"/>
    <svg className="places-archive__routes" viewBox="0 0 600 330" fill="none" aria-hidden="true"><path d="M130 220C140 50 320 40 355 145S475 300 510 220" stroke="currentColor" strokeWidth="1.5" strokeDasharray="5 7"/><path d="M60 290C190 290 155 60 290 60S365 280 570 80" stroke="currentColor" strokeWidth=".7" opacity=".3"/></svg>
    <span className="places-archive__label">{t('landing.mapLabel')}</span>
    <div className="places-archive__pin places-archive__pin--home"><span><Leaf size={21}/></span><strong>{t('landing.mapHome')}</strong></div>
    <div className="places-archive__pin places-archive__pin--one"><span><MapPin size={18}/></span><strong>{t('landing.mapCityOne')}</strong></div>
    <div className="places-archive__pin places-archive__pin--two"><span><MapPin size={18}/></span><strong>{t('landing.mapCityTwo')}</strong></div>
    <figcaption>{t('landing.sample')}</figcaption>
  </figure>;
}
