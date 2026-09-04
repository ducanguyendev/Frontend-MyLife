import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Check, X, Home, ShoppingBag, BarChart3, MessageSquare, Ticket, Gamepad2, Sword, Trophy } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

// Asset Imports
import hottoysMain from '../assets/hottoys_main.png';
import hottoysScreenHome from '../assets/hottoys_screen_home.png';
import hottoysScreenFeatured from '../assets/hottoys_screen_featured.png';
import hottoysScreenCatalog from '../assets/hottoys_screen_catalog.png';
import hottoysScreenDashboard from '../assets/hottoys_screen_dashboard.png';

import hommeMain from '../assets/homme_main.jpg';
import hommeScreenCatalog from '../assets/homme_screen_catalog.jpg';
import hommeScreenVouchers from '../assets/homme_screen_vouchers.jpg';
import hommeScreenChat from '../assets/homme_screen_chat.jpg';

import treasureMain from '../assets/treasure_main.jpg';
import treasureScreenMenu from '../assets/treasure_screen_menu.jpg';
import treasureScreenLobby from '../assets/treasure_screen_lobby.jpg';
import treasureScreenGameplay from '../assets/treasure_screen_gameplay.jpg';
import treasureScreenVictory from '../assets/treasure_screen_victory.jpg';

export const Projects: React.FC = () => {
  const { t } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeProject, setActiveProject] = useState<'hottoys' | 'homme' | 'treasure'>('hottoys');
  const [activeTab, setActiveTab] = useState<string>('home');

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsModalOpen(false);
      }
    };
    if (isModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  // Prevent scroll when modal is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isModalOpen]);

  const openModal = (project: 'hottoys' | 'homme' | 'treasure') => {
    setActiveProject(project);
    if (project === 'hottoys') {
      setActiveTab('home');
    } else if (project === 'homme') {
      setActiveTab('catalog');
    } else {
      setActiveTab('lobby');
    }
    setIsModalOpen(true);
  };

  const hottoysTags = t('projects.hottoys.tags', { returnObjects: true }) as string[];
  const hottoysFeatures = t('projects.hottoys.features', { returnObjects: true }) as string[];

  const hommeTags = t('projects.homme.tags', { returnObjects: true }) as string[];
  const hommeFeatures = t('projects.homme.features', { returnObjects: true }) as string[];

  const treasureTags = t('projects.treasure.tags', { returnObjects: true }) as string[];
  const treasureFeatures = t('projects.treasure.features', { returnObjects: true }) as string[];

  return (
    <section id="projects" className="py-24 bg-secondary-bg relative overflow-hidden">
      {/* Background Visual Effects */}
      <div className="absolute top-1/4 left-[-15%] w-[450px] h-[450px] rounded-full bg-accent/5 filter blur-3xl pointer-events-none" />
      <div className="absolute top-2/3 right-[-10%] w-[550px] h-[550px] rounded-full bg-yellow-500/5 filter blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[20%] w-[400px] h-[400px] rounded-full bg-accent/5 filter blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        
        {/* Section Header */}
        <div className="text-center mb-24">
          <span className="text-xs font-semibold tracking-[0.3em] uppercase text-accent mb-2 block">
            {t('projects.subtitle')}
          </span>
          <h2 className="text-3xl md:text-5xl font-light tracking-tight text-primary-text font-display">
            {t('projects.title')}
          </h2>
          <div className="w-12 h-[1px] bg-accent mx-auto mt-6" />
        </div>

        {/* Projects Alternating Stack */}
        <div className="flex flex-col gap-32">
          
          {/* PROJECT 1: Hot Toys Store (Text Left, Mockup Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Details */}
            <div className="lg:col-span-6 flex flex-col items-start text-left">
              {/* Tech Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {Array.isArray(hottoysTags) && hottoysTags.map((tag) => (
                  <span 
                    key={tag} 
                    className="text-[10px] font-bold tracking-widest bg-primary-bg text-secondary-text px-3.5 py-1.5 rounded-full border border-custom-border/80 shadow-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Title */}
              <h3 className="text-3xl md:text-4xl font-light font-display tracking-tight text-primary-text mb-6">
                {t('projects.hottoys.title')}
              </h3>

              {/* Problem Statement */}
              <div className="border-l-2 border-accent pl-4 mb-6">
                <span className="text-[10px] font-bold tracking-[0.2em] text-accent uppercase block mb-1">
                  {t('projects.hottoys.problemStatementTag')}
                </span>
                <p className="text-secondary-text text-sm italic font-light leading-relaxed">
                  "{t('projects.hottoys.problemStatement')}"
                </p>
              </div>

              {/* Description */}
              <p className="text-secondary-text text-sm md:text-base leading-relaxed font-light mb-6">
                {t('projects.hottoys.description')}
              </p>

              {/* Features List */}
              <ul className="flex flex-col gap-3 mb-8">
                {Array.isArray(hottoysFeatures) && hottoysFeatures.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm font-light text-secondary-text">
                    <span className="text-accent mt-0.5 flex-shrink-0">
                      <Check size={16} />
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Buttons */}
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => openModal('hottoys')}
                  className="text-xs font-bold tracking-widest uppercase bg-accent text-black px-6 py-3.5 hover:bg-accent-hover transition-colors shadow-lg shadow-accent/15 cursor-pointer rounded flex items-center gap-2"
                >
                  <ExternalLink size={14} />
                  {t('projects.liveDemo')}
                </button>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold tracking-widest uppercase border border-custom-border text-primary-text px-6 py-3.5 hover:bg-primary-bg transition-colors cursor-pointer rounded flex items-center gap-2"
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                    <path d="M9 18c-4.51 2-5-2-7-2" />
                  </svg>
                  {t('projects.github')}
                </a>
              </div>
            </div>

            {/* Right Column: Browser Mockup */}
            <div className="lg:col-span-6 flex justify-center items-center">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.8 }}
                className="w-full max-w-xl bg-primary-bg border border-custom-border rounded-2xl shadow-2xl overflow-hidden flex flex-col text-left group"
              >
                {/* Browser Top bar */}
                <div className="bg-secondary-bg/80 border-b border-custom-border px-4 py-3 flex items-center justify-between select-none">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                  </div>
                  <div className="text-[10px] tracking-wider font-medium text-secondary-text/80 bg-primary-bg px-6 py-0.5 rounded-full border border-custom-border/60">
                    hottoys-ecommerce.local
                  </div>
                  <div className="w-12" />
                </div>
                {/* Image */}
                <div className="relative w-full aspect-[16/10] overflow-hidden">
                  <img
                    src={hottoysMain}
                    alt="Hot Toys Store Mockup"
                    className="w-full h-full object-cover transition-transform duration-750 group-hover:scale-103"
                  />
                </div>
              </motion.div>
            </div>

          </div>

          {/* PROJECT 2: HOMME Store (Mockup Left, Text Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Browser Mockup */}
            <div className="lg:col-span-6 order-2 lg:order-1 flex justify-center items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.8 }}
                className="w-full max-w-xl bg-primary-bg border border-custom-border rounded-2xl shadow-2xl overflow-hidden flex flex-col text-left group"
              >
                {/* Browser Top bar */}
                <div className="bg-secondary-bg/80 border-b border-custom-border px-4 py-3 flex items-center justify-between select-none">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                  </div>
                  <div className="text-[10px] tracking-wider font-medium text-secondary-text/80 bg-primary-bg px-6 py-0.5 rounded-full border border-custom-border/60">
                    homme-clothing.local
                  </div>
                  <div className="w-12" />
                </div>
                {/* Image */}
                <div className="relative w-full aspect-[16/10] overflow-hidden">
                  <img
                    src={hommeMain}
                    alt="HOMME Store Mockup"
                    className="w-full h-full object-cover transition-transform duration-750 group-hover:scale-103"
                  />
                </div>
              </motion.div>
            </div>

            {/* Right Column: Details */}
            <div className="lg:col-span-6 order-1 lg:order-2 flex flex-col items-start text-left">
              {/* Tech Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {Array.isArray(hommeTags) && hommeTags.map((tag) => (
                  <span 
                    key={tag} 
                    className="text-[10px] font-bold tracking-widest bg-primary-bg text-secondary-text px-3.5 py-1.5 rounded-full border border-custom-border/80 shadow-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Title */}
              <h3 className="text-3xl md:text-4xl font-light font-display tracking-tight text-primary-text mb-6">
                {t('projects.homme.title')}
              </h3>

              {/* Problem Statement */}
              <div className="border-l-2 border-accent pl-4 mb-6">
                <span className="text-[10px] font-bold tracking-[0.2em] text-accent uppercase block mb-1">
                  {t('projects.homme.problemStatementTag')}
                </span>
                <p className="text-secondary-text text-sm italic font-light leading-relaxed">
                  "{t('projects.homme.problemStatement')}"
                </p>
              </div>

              {/* Description */}
              <p className="text-secondary-text text-sm md:text-base leading-relaxed font-light mb-6">
                {t('projects.homme.description')}
              </p>

              {/* Features Checklist */}
              <ul className="flex flex-col gap-3 mb-8">
                {Array.isArray(hommeFeatures) && hommeFeatures.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm font-light text-secondary-text">
                    <span className="text-accent mt-0.5 flex-shrink-0">
                      <Check size={16} />
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Buttons */}
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => openModal('homme')}
                  className="text-xs font-bold tracking-widest uppercase bg-accent text-black px-6 py-3.5 hover:bg-accent-hover transition-colors shadow-lg shadow-accent/15 cursor-pointer rounded flex items-center gap-2"
                >
                  <ExternalLink size={14} />
                  {t('projects.liveDemo')}
                </button>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold tracking-widest uppercase border border-custom-border text-primary-text px-6 py-3.5 hover:bg-primary-bg transition-colors cursor-pointer rounded flex items-center gap-2"
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                    <path d="M9 18c-4.51 2-5-2-7-2" />
                  </svg>
                  {t('projects.github')}
                </a>
              </div>
            </div>

          </div>

          {/* PROJECT 3: Treasure Hunter (Text Left, Mockup Right - Desktop Application Style) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Details */}
            <div className="lg:col-span-6 flex flex-col items-start text-left">
              {/* Tech Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {Array.isArray(treasureTags) && treasureTags.map((tag) => (
                  <span 
                    key={tag} 
                    className="text-[10px] font-bold tracking-widest bg-primary-bg text-secondary-text px-3.5 py-1.5 rounded-full border border-custom-border/80 shadow-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Title */}
              <h3 className="text-3xl md:text-4xl font-light font-display tracking-tight text-primary-text mb-6">
                {t('projects.treasure.title')}
              </h3>

              {/* Problem Statement */}
              <div className="border-l-2 border-accent pl-4 mb-6">
                <span className="text-[10px] font-bold tracking-[0.2em] text-accent uppercase block mb-1">
                  {t('projects.treasure.problemStatementTag')}
                </span>
                <p className="text-secondary-text text-sm italic font-light leading-relaxed">
                  "{t('projects.treasure.problemStatement')}"
                </p>
              </div>

              {/* Description */}
              <p className="text-secondary-text text-sm md:text-base leading-relaxed font-light mb-6">
                {t('projects.treasure.description')}
              </p>

              {/* Features Checklist */}
              <ul className="flex flex-col gap-3 mb-8">
                {Array.isArray(treasureFeatures) && treasureFeatures.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm font-light text-secondary-text">
                    <span className="text-accent mt-0.5 flex-shrink-0">
                      <Check size={16} />
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Buttons */}
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => openModal('treasure')}
                  className="text-xs font-bold tracking-widest uppercase bg-accent text-black px-6 py-3.5 hover:bg-accent-hover transition-colors shadow-lg shadow-accent/15 cursor-pointer rounded flex items-center gap-2"
                >
                  <ExternalLink size={14} />
                  {t('projects.liveDemo')}
                </button>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold tracking-widest uppercase border border-custom-border text-primary-text px-6 py-3.5 hover:bg-primary-bg transition-colors cursor-pointer rounded flex items-center gap-2"
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                    <path d="M9 18c-4.51 2-5-2-7-2" />
                  </svg>
                  {t('projects.github')}
                </a>
              </div>
            </div>

            {/* Right Column: Desktop Application Shell Mockup */}
            <div className="lg:col-span-6 flex justify-center items-center">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.8 }}
                className="w-full max-w-xl bg-primary-bg border border-custom-border rounded-2xl shadow-2xl overflow-hidden flex flex-col text-left group"
              >
                {/* Desktop App Titlebar */}
                <div className="bg-secondary-bg/90 border-b border-custom-border px-4 py-3.5 flex items-center select-none relative">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-[10px] font-bold tracking-widest text-primary-text/80 uppercase">
                      Treasure Hunter 2D
                    </span>
                  </div>
                </div>
                {/* Game Screen Content */}
                <div className="relative w-full aspect-[16/10] overflow-hidden">
                  <img
                    src={treasureMain}
                    alt="Treasure Hunter Game Mockup"
                    className="w-full h-full object-cover transition-transform duration-750 group-hover:scale-103"
                  />
                </div>
              </motion.div>
            </div>

          </div>

        </div>

      </div>

      {/* Interactive System Screens Modal Popup */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            />

            {/* Modal Card Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="relative bg-primary-bg w-full max-w-5xl h-[85vh] rounded-2xl border border-custom-border shadow-2xl flex flex-col overflow-hidden z-10 text-left"
            >
              {/* Modal Header */}
              <div className="px-6 py-5 border-b border-custom-border flex items-center justify-between bg-secondary-bg/30">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                    <h3 className="text-base md:text-lg font-bold text-primary-text tracking-wide font-display">
                      {t(`projects.${activeProject}.modal.title`)}
                    </h3>
                  </div>
                  <span className="text-[9px] font-extrabold tracking-widest text-secondary-text/80 uppercase ml-5 block mt-0.5">
                    {t(`projects.${activeProject}.modal.techStack`)}
                  </span>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-secondary-text hover:text-primary-text p-2 hover:bg-secondary-bg rounded-full transition-colors cursor-pointer"
                  aria-label="Close modal"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Navigation Tabs */}
              <div className="px-6 py-3 border-b border-custom-border flex gap-2 overflow-x-auto no-scrollbar bg-secondary-bg/10 select-none">
                {activeProject === 'hottoys' && (
                  <>
                    {['home', 'catalog', 'stats'].map((tabKey) => (
                      <button
                        key={tabKey}
                        onClick={() => setActiveTab(tabKey)}
                        className={`text-[10px] font-bold tracking-widest uppercase px-4 py-2.5 rounded-lg border transition-all duration-300 cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                          activeTab === tabKey
                            ? 'bg-primary-text text-primary-bg border-primary-text shadow-sm'
                            : 'bg-transparent text-secondary-text border-transparent hover:border-custom-border hover:text-primary-text'
                        }`}
                      >
                        {tabKey === 'home' && <Home size={12} />}
                        {tabKey === 'catalog' && <ShoppingBag size={12} />}
                        {tabKey === 'stats' && <BarChart3 size={12} />}
                        {t(`projects.hottoys.modal.tabs.${tabKey}`)}
                      </button>
                    ))}
                  </>
                )}

                {activeProject === 'homme' && (
                  <>
                    {['catalog', 'vouchers', 'chat'].map((tabKey) => (
                      <button
                        key={tabKey}
                        onClick={() => setActiveTab(tabKey)}
                        className={`text-[10px] font-bold tracking-widest uppercase px-4 py-2.5 rounded-lg border transition-all duration-300 cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                          activeTab === tabKey
                            ? 'bg-primary-text text-primary-bg border-primary-text shadow-sm'
                            : 'bg-transparent text-secondary-text border-transparent hover:border-custom-border hover:text-primary-text'
                        }`}
                      >
                        {tabKey === 'catalog' && <ShoppingBag size={12} />}
                        {tabKey === 'vouchers' && <Ticket size={12} />}
                        {tabKey === 'chat' && <MessageSquare size={12} />}
                        {t(`projects.homme.modal.tabs.${tabKey}`)}
                      </button>
                    ))}
                  </>
                )}

                {activeProject === 'treasure' && (
                  <>
                    {['lobby', 'gameplay', 'victory'].map((tabKey) => (
                      <button
                        key={tabKey}
                        onClick={() => setActiveTab(tabKey)}
                        className={`text-[10px] font-bold tracking-widest uppercase px-4 py-2.5 rounded-lg border transition-all duration-300 cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                          activeTab === tabKey
                            ? 'bg-primary-text text-primary-bg border-primary-text shadow-sm'
                            : 'bg-transparent text-secondary-text border-transparent hover:border-custom-border hover:text-primary-text'
                        }`}
                      >
                        {tabKey === 'lobby' && <Gamepad2 size={12} />}
                        {tabKey === 'gameplay' && <Sword size={12} />}
                        {tabKey === 'victory' && <Trophy size={12} />}
                        {t(`projects.treasure.modal.tabs.${tabKey}`)}
                      </button>
                    ))}
                  </>
                )}
              </div>

              {/* Scrollable Tab Panels */}
              <div className="flex-grow overflow-y-auto p-6 md:p-10 no-scrollbar bg-primary-bg">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Hot Toys Content */}
                    {activeProject === 'hottoys' && (
                      <>
                        {activeTab === 'home' && (
                          <div className="flex flex-col gap-16">
                            {/* Homepage block */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                              <div className="lg:col-span-5 flex flex-col gap-3">
                                <span className="text-[10px] font-bold tracking-widest text-accent uppercase">
                                  {t('projects.hottoys.modal.screens.home.tag')}
                                </span>
                                <h4 className="text-xl font-bold text-primary-text">
                                  {t('projects.hottoys.modal.screens.home.title')}
                                </h4>
                                <p className="text-secondary-text text-sm font-light leading-relaxed">
                                  {t('projects.hottoys.modal.screens.home.desc')}
                                </p>
                                <p className="text-secondary-text text-sm font-light leading-relaxed">
                                  {t('projects.hottoys.modal.screens.home.desc2')}
                                </p>
                              </div>
                              <div className="lg:col-span-7">
                                <div className="w-full bg-secondary-bg border border-custom-border rounded-xl shadow-lg overflow-hidden flex flex-col">
                                  <div className="bg-secondary-bg border-b border-custom-border px-3 py-2.5 flex gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-red-500/70" />
                                    <span className="w-2 h-2 rounded-full bg-yellow-500/70" />
                                    <span className="w-2 h-2 rounded-full bg-green-500/70" />
                                  </div>
                                  <img src={hottoysScreenHome} alt="Welcome Home screen" className="w-full h-auto object-contain" />
                                </div>
                              </div>
                            </div>

                            {/* Featured Products block */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                              <div className="lg:col-span-7 order-2 lg:order-1">
                                <div className="w-full bg-secondary-bg border border-custom-border rounded-xl shadow-lg overflow-hidden flex flex-col">
                                  <div className="bg-secondary-bg border-b border-custom-border px-3 py-2.5 flex gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-red-500/70" />
                                    <span className="w-2 h-2 rounded-full bg-yellow-500/70" />
                                    <span className="w-2 h-2 rounded-full bg-green-500/70" />
                                  </div>
                                  <img src={hottoysScreenFeatured} alt="Featured Products screen" className="w-full h-auto object-contain" />
                                </div>
                              </div>
                              <div className="lg:col-span-5 order-1 lg:order-2 flex flex-col gap-3">
                                <span className="text-[10px] font-bold tracking-widest text-accent uppercase">
                                  {t('projects.hottoys.modal.screens.featured.tag')}
                                </span>
                                <h4 className="text-xl font-bold text-primary-text">
                                  {t('projects.hottoys.modal.screens.featured.title')}
                                </h4>
                                <p className="text-secondary-text text-sm font-light leading-relaxed">
                                  {t('projects.hottoys.modal.screens.featured.desc')}
                                </p>
                                <p className="text-secondary-text text-sm font-light leading-relaxed">
                                  {t('projects.hottoys.modal.screens.featured.desc2')}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {activeTab === 'catalog' && (
                          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                            <div className="lg:col-span-5 flex flex-col gap-3">
                              <span className="text-[10px] font-bold tracking-widest text-accent uppercase">
                                {t('projects.hottoys.modal.screens.catalog.tag')}
                              </span>
                              <h4 className="text-xl font-bold text-primary-text">
                                {t('projects.hottoys.modal.screens.catalog.title')}
                              </h4>
                              <p className="text-secondary-text text-sm font-light leading-relaxed">
                                {t('projects.hottoys.modal.screens.catalog.desc')}
                              </p>
                              <p className="text-secondary-text text-sm font-light leading-relaxed">
                                {t('projects.hottoys.modal.screens.catalog.desc2')}
                              </p>
                            </div>
                            <div className="lg:col-span-7">
                              <div className="w-full bg-secondary-bg border border-custom-border rounded-xl shadow-lg overflow-hidden flex flex-col">
                                <div className="bg-secondary-bg border-b border-custom-border px-3 py-2.5 flex gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-red-500/70" />
                                  <span className="w-2 h-2 rounded-full bg-yellow-500/70" />
                                  <span className="w-2 h-2 rounded-full bg-green-500/70" />
                                </div>
                                <img src={hottoysScreenCatalog} alt="Catalog search screen" className="w-full h-auto object-contain" />
                              </div>
                            </div>
                          </div>
                        )}

                        {activeTab === 'stats' && (
                          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                            <div className="lg:col-span-5 flex flex-col gap-3">
                              <span className="text-[10px] font-bold tracking-widest text-accent uppercase">
                                {t('projects.hottoys.modal.screens.stats.tag')}
                              </span>
                              <h4 className="text-xl font-bold text-primary-text">
                                {t('projects.hottoys.modal.screens.stats.title')}
                              </h4>
                              <p className="text-secondary-text text-sm font-light leading-relaxed">
                                {t('projects.hottoys.modal.screens.stats.desc')}
                              </p>
                              <p className="text-secondary-text text-sm font-light leading-relaxed">
                                {t('projects.hottoys.modal.screens.stats.desc2')}
                              </p>
                            </div>
                            <div className="lg:col-span-7">
                              <div className="w-full bg-secondary-bg border border-custom-border rounded-xl shadow-lg overflow-hidden flex flex-col">
                                <div className="bg-secondary-bg border-b border-custom-border px-3 py-2.5 flex gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-red-500/70" />
                                  <span className="w-2 h-2 rounded-full bg-yellow-500/70" />
                                  <span className="w-2 h-2 rounded-full bg-green-500/70" />
                                </div>
                                <img src={hottoysScreenDashboard} alt="Admin Dashboard screen" className="w-full h-auto object-contain" />
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {/* HOMME Store Content */}
                    {activeProject === 'homme' && (
                      <>
                        {activeTab === 'catalog' && (
                          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                            <div className="lg:col-span-5 flex flex-col gap-3">
                              <span className="text-[10px] font-bold tracking-widest text-accent uppercase">
                                {t('projects.homme.modal.screens.catalog.tag')}
                              </span>
                              <h4 className="text-xl font-bold text-primary-text">
                                {t('projects.homme.modal.screens.catalog.title')}
                              </h4>
                              <p className="text-secondary-text text-sm font-light leading-relaxed">
                                {t('projects.homme.modal.screens.catalog.desc')}
                              </p>
                              <p className="text-secondary-text text-sm font-light leading-relaxed">
                                {t('projects.homme.modal.screens.catalog.desc2')}
                              </p>
                            </div>
                            <div className="lg:col-span-7">
                              <div className="w-full bg-secondary-bg border border-custom-border rounded-xl shadow-lg overflow-hidden flex flex-col">
                                <div className="bg-secondary-bg border-b border-custom-border px-3 py-2.5 flex gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-red-500/70" />
                                  <span className="w-2 h-2 rounded-full bg-yellow-500/70" />
                                  <span className="w-2 h-2 rounded-full bg-green-500/70" />
                                </div>
                                <img src={hommeScreenCatalog} alt="HOMME Clothes Catalog screen" className="w-full h-auto object-contain" />
                              </div>
                            </div>
                          </div>
                        )}

                        {activeTab === 'vouchers' && (
                          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                            <div className="lg:col-span-5 flex flex-col gap-3">
                              <span className="text-[10px] font-bold tracking-widest text-accent uppercase">
                                {t('projects.homme.modal.screens.vouchers.tag')}
                              </span>
                              <h4 className="text-xl font-bold text-primary-text">
                                {t('projects.homme.modal.screens.vouchers.title')}
                              </h4>
                              <p className="text-secondary-text text-sm font-light leading-relaxed">
                                {t('projects.homme.modal.screens.vouchers.desc')}
                              </p>
                              <p className="text-secondary-text text-sm font-light leading-relaxed">
                                {t('projects.homme.modal.screens.vouchers.desc2')}
                              </p>
                            </div>
                            <div className="lg:col-span-7">
                              <div className="w-full bg-secondary-bg border border-custom-border rounded-xl shadow-lg overflow-hidden flex flex-col">
                                <div className="bg-secondary-bg border-b border-custom-border px-3 py-2.5 flex gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-red-500/70" />
                                  <span className="w-2 h-2 rounded-full bg-yellow-500/70" />
                                  <span className="w-2 h-2 rounded-full bg-green-500/70" />
                                </div>
                                <img src={hommeScreenVouchers} alt="Voucher Management admin screen" className="w-full h-auto object-contain" />
                              </div>
                            </div>
                          </div>
                        )}

                        {activeTab === 'chat' && (
                          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                            <div className="lg:col-span-5 flex flex-col gap-3">
                              <span className="text-[10px] font-bold tracking-widest text-accent uppercase">
                                {t('projects.homme.modal.screens.chat.tag')}
                              </span>
                              <h4 className="text-xl font-bold text-primary-text">
                                {t('projects.homme.modal.screens.chat.title')}
                              </h4>
                              <p className="text-secondary-text text-sm font-light leading-relaxed">
                                {t('projects.homme.modal.screens.chat.desc')}
                              </p>
                              <p className="text-secondary-text text-sm font-light leading-relaxed">
                                {t('projects.homme.modal.screens.chat.desc2')}
                              </p>
                            </div>
                            <div className="lg:col-span-7">
                              <div className="w-full bg-secondary-bg border border-custom-border rounded-xl shadow-lg overflow-hidden flex flex-col">
                                <div className="bg-secondary-bg border-b border-custom-border px-3 py-2.5 flex gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-red-500/70" />
                                  <span className="w-2 h-2 rounded-full bg-yellow-500/70" />
                                  <span className="w-2 h-2 rounded-full bg-green-500/70" />
                                </div>
                                <img src={hommeScreenChat} alt="Customer Service Chat Hub screen" className="w-full h-auto object-contain" />
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {/* Treasure Hunter Content */}
                    {activeProject === 'treasure' && (
                      <>
                        {activeTab === 'lobby' && (
                          <div className="flex flex-col gap-16">
                            {/* Start Menu block */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                              <div className="lg:col-span-5 flex flex-col gap-3">
                                <span className="text-[10px] font-bold tracking-widest text-accent uppercase">
                                  {t('projects.treasure.modal.screens.lobby.tag')}
                                </span>
                                <h4 className="text-xl font-bold text-primary-text">
                                  {t('projects.treasure.modal.screens.lobby.title')}
                                </h4>
                                <p className="text-secondary-text text-sm font-light leading-relaxed">
                                  {t('projects.treasure.modal.screens.lobby.desc')}
                                </p>
                                <p className="text-secondary-text text-sm font-light leading-relaxed">
                                  {t('projects.treasure.modal.screens.lobby.desc2')}
                                </p>
                              </div>
                              <div className="lg:col-span-7 flex flex-col gap-4">
                                <div className="w-full bg-secondary-bg border border-custom-border rounded-xl shadow-lg overflow-hidden flex flex-col">
                                  <div className="bg-secondary-bg border-b border-custom-border px-3 py-2 flex gap-1">
                                    <span className="w-2 h-2 rounded-full bg-red-500/70" />
                                    <span className="w-2 h-2 rounded-full bg-yellow-500/70" />
                                    <span className="w-2 h-2 rounded-full bg-green-500/70" />
                                  </div>
                                  <img src={treasureScreenMenu} alt="Treasure Hunter Main Menu" className="w-full h-auto object-contain" />
                                </div>
                                <div className="w-full max-w-md mx-auto bg-secondary-bg border border-custom-border rounded-xl shadow-lg overflow-hidden flex flex-col">
                                  <div className="bg-secondary-bg border-b border-custom-border px-3 py-1.5 flex gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500/70" />
                                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-500/70" />
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500/70" />
                                  </div>
                                  <img src={treasureScreenLobby} alt="Nickname setup dialog" className="w-full h-auto object-contain" />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {activeTab === 'gameplay' && (
                          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                            <div className="lg:col-span-5 flex flex-col gap-3">
                              <span className="text-[10px] font-bold tracking-widest text-accent uppercase">
                                {t('projects.treasure.modal.screens.gameplay.tag')}
                              </span>
                              <h4 className="text-xl font-bold text-primary-text">
                                {t('projects.treasure.modal.screens.gameplay.title')}
                              </h4>
                              <p className="text-secondary-text text-sm font-light leading-relaxed">
                                {t('projects.treasure.modal.screens.gameplay.desc')}
                              </p>
                              <p className="text-secondary-text text-sm font-light leading-relaxed">
                                {t('projects.treasure.modal.screens.gameplay.desc2')}
                              </p>
                            </div>
                            <div className="lg:col-span-7">
                              <div className="w-full bg-secondary-bg border border-custom-border rounded-xl shadow-lg overflow-hidden flex flex-col">
                                <div className="bg-secondary-bg border-b border-custom-border px-3 py-2 flex gap-1">
                                  <span className="w-2 h-2 rounded-full bg-red-500/70" />
                                  <span className="w-2 h-2 rounded-full bg-yellow-500/70" />
                                  <span className="w-2 h-2 rounded-full bg-green-500/70" />
                                </div>
                                <img src={treasureScreenGameplay} alt="2D gameplay exploration" className="w-full h-auto object-contain" />
                              </div>
                            </div>
                          </div>
                        )}

                        {activeTab === 'victory' && (
                          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                            <div className="lg:col-span-5 flex flex-col gap-3">
                              <span className="text-[10px] font-bold tracking-widest text-accent uppercase">
                                {t('projects.treasure.modal.screens.victory.tag')}
                              </span>
                              <h4 className="text-xl font-bold text-primary-text">
                                {t('projects.treasure.modal.screens.victory.title')}
                              </h4>
                              <p className="text-secondary-text text-sm font-light leading-relaxed">
                                {t('projects.treasure.modal.screens.victory.desc')}
                              </p>
                              <p className="text-secondary-text text-sm font-light leading-relaxed">
                                {t('projects.treasure.modal.screens.victory.desc2')}
                              </p>
                            </div>
                            <div className="lg:col-span-7">
                              <div className="w-full bg-secondary-bg border border-custom-border rounded-xl shadow-lg overflow-hidden flex flex-col">
                                <div className="bg-secondary-bg border-b border-custom-border px-3 py-2 flex gap-1">
                                  <span className="w-2 h-2 rounded-full bg-red-500/70" />
                                  <span className="w-2 h-2 rounded-full bg-yellow-500/70" />
                                  <span className="w-2 h-2 rounded-full bg-green-500/70" />
                                </div>
                                <img src={treasureScreenVictory} alt="Level completed congratulations" className="w-full h-auto object-contain" />
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-custom-border bg-secondary-bg/20 text-center text-[9px] font-bold tracking-[0.2em] text-secondary-text/80 select-none">
                {t(`projects.${activeProject}.modal.footer`)}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};
export default Projects;
