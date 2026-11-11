import { useNavigate } from 'react-router-dom';
import { ArrowDown, ArrowRight, ArrowUp, BookOpen, Heart, Leaf, TreePine, CalendarDays, Images } from 'lucide-react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useLanguage } from '@/shared/hooks/useLanguage';
import { Button } from '@/shared/components/ui';
import { LandingHeader } from '../components/LandingHeader';
import { AlbumArchive, AnniversaryPreview, FamilyArchive, HeroArchive, MemoryTimeline, PlacesArchive } from '../components/ArchivePreviews';
import './MyLifeLandingPage.css';

export function MyLifeLandingPage() {
  const { t } = useLanguage();
  const { isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const openLogin = () => window.dispatchEvent(new CustomEvent('ui:openLogin'));
  const enter = () => navigate(isAuthenticated ? isAdmin ? '/Home/Admin' : '/mylife' : '/Register');
  const cta = t(isAuthenticated ? isAdmin ? 'landing.enterAdmin' : 'landing.enter' : 'landing.start');
  return <div className="mylife-landing" id="top">
    <a className="landing-skip" href="#landing-main">{t('appShell.skipContent')}</a>
    <LandingHeader onLogin={openLogin}/>
    <main id="landing-main" tabIndex={-1}>
      <section className="landing-hero landing-container" aria-labelledby="landing-title">
        <div className="landing-hero__copy"><p className="landing-eyebrow"><span/>{t('landing.eyebrow')}</p>
          <h1 id="landing-title">{t('landing.heroBegin')}<em>{t('landing.heroEnd')}</em></h1>
          <p className="landing-hero__description">{t('landing.heroDescription')}</p>
          <div className="landing-hero__actions"><Button size="lg" rightIcon={<ArrowRight size={17}/>} onClick={enter}>{cta}</Button><a className="landing-text-link" href="#story">{t('landing.explore')}<ArrowDown size={16}/></a></div>
          <p className="landing-hero__note"><Heart size={14} strokeWidth={1.5}/>{t('landing.heroNote')}</p>
        </div>
        <HeroArchive/>
      </section>

      <div className="landing-story-strip" id="story"><div className="landing-container"><span>MyLife <i>—</i> Living Family Archive</span><div><span><TreePine size={16}/>{t('landing.family')}</span><span><BookOpen size={16}/>{t('landing.memories')}</span><span><Leaf size={16}/>{t('landing.places')}</span></div></div></div>

      <section className="landing-section landing-container landing-family" id="family-story" aria-labelledby="family-story-title">
        <FamilyArchive/><div className="landing-section__copy"><p className="landing-eyebrow">{t('landing.chapterOne')}</p><h2 id="family-story-title">{t('landing.familyTitle')}</h2><p>{t('landing.familyDescription')}</p>
          <div className="landing-story-point"><TreePine size={20}/><div><h3>{t('landing.familyPointOne')}</h3><p>{t('landing.familyPointOneDescription')}</p></div></div>
          <div className="landing-story-point"><Heart size={20}/><div><h3>{t('landing.familyPointTwo')}</h3><p>{t('landing.familyPointTwoDescription')}</p></div></div>
        </div>
      </section>

      <section className="landing-memories" id="memories" aria-labelledby="memories-title"><div className="landing-container">
        <div className="landing-section__heading"><p className="landing-eyebrow">{t('landing.chapterTwo')}</p><h2 id="memories-title">{t('landing.memoriesTitle')}</h2><p>{t('landing.memoriesDescription')}</p></div>
        <div className="landing-memories__grid"><MemoryTimeline/><div className="landing-anniversary"><div className="landing-anniversary__intro"><CalendarDays size={21}/><h3>{t('landing.anniversaryTitle')}</h3><p>{t('landing.anniversaryDescription')}</p></div><AnniversaryPreview/><span className="landing-anniversary__footnote">{t('landing.anniversaryFootnote')}</span><span className="archive-example">{t('landing.sample')}</span></div></div>
      </div></section>

      <section className="landing-section landing-container landing-library" id="library-story" aria-labelledby="library-story-title"><div className="landing-section__copy"><p className="landing-eyebrow">{t('landing.chapterThree')}</p><h2 id="library-story-title">{t('landing.libraryTitle')}</h2><p>{t('landing.libraryDescription')}</p><ul className="landing-detail-list"><li><Images size={17}/>{t('landing.libraryDetailOne')}</li><li><BookOpen size={17}/>{t('landing.libraryDetailTwo')}</li></ul></div><AlbumArchive/></section>

      <section className="landing-container landing-places" id="places" aria-labelledby="places-title"><div className="landing-section__copy"><p className="landing-eyebrow">{t('landing.chapterFour')}</p><h2 id="places-title">{t('landing.mapTitle')}</h2><p>{t('landing.mapDescription')}</p></div><PlacesArchive/></section>

      <section className="landing-philosophy landing-container" aria-label={t('landing.philosophyNote')}><Leaf size={31} strokeWidth={1.2}/><p>{t('landing.philosophy')}</p><span>{t('landing.philosophyNote')}</span></section>

      <section className="landing-container landing-cta" aria-labelledby="landing-cta-title"><div><p className="landing-eyebrow">MYLIFE / LIVING FAMILY ARCHIVE</p><h2 id="landing-cta-title">{t('landing.ctaTitle')}</h2><p>{t('landing.ctaDescription')}</p></div><div className="landing-cta__actions"><Button size="lg" onClick={enter} rightIcon={<ArrowRight size={17}/>}>{isAuthenticated ? cta : t('landing.createAccount')}</Button>{!isAuthenticated && <Button variant="ghost" onClick={openLogin}>{t('landing.login')}</Button>}</div></section>
    </main>
    <footer className="landing-footer landing-container"><div><a className="landing-brand" href="#top"><Leaf size={22}/><span>MyLife<span className="landing-brand__dot">.</span></span></a><p>{t('landing.footerNote')}</p></div><span>Living Family Archive</span><a className="landing-text-link" href="#top">{t('landing.backTop')}<ArrowUp size={15}/></a></footer>
  </div>;
}
