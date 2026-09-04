import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Vector SVG Vietnam Flag
const VietnamFlag: React.FC<{ className?: string }> = ({ className = "w-5 h-3.5" }) => (
  <svg className={`${className} rounded-[2px] shadow-sm shrink-0 object-cover`} viewBox="0 0 900 600">
    <rect width="900" height="600" fill="#da251d" />
    <polygon
      points="450,150 491,277 625,277 517,356 558,483 450,404 342,483 383,356 275,277 409,277"
      fill="#ffff00"
    />
  </svg>
);

// Vector SVG UK/US English Flag
const USFlag: React.FC<{ className?: string }> = ({ className = "w-5 h-3.5" }) => (
  <svg className={`${className} rounded-[2px] shadow-sm shrink-0 object-cover`} viewBox="0 0 741 390">
    <rect width="741" height="390" fill="#b22234"/>
    <path d="M0,60H741M0,120H741M0,180H741M0,240H741M0,300H741M0,360H741" stroke="#fff" strokeWidth="30"/>
    <rect width="296.4" height="210" fill="#3c3b6e"/>
    <g fill="#fff">
      <circle cx="29.64" cy="21" r="9"/>
      <circle cx="88.92" cy="21" r="9"/>
      <circle cx="148.2" cy="21" r="9"/>
      <circle cx="207.48" cy="21" r="9"/>
      <circle cx="266.76" cy="21" r="9"/>
      <circle cx="59.28" cy="42" r="9"/>
      <circle cx="118.56" cy="42" r="9"/>
      <circle cx="177.84" cy="42" r="9"/>
      <circle cx="237.12" cy="42" r="9"/>
      <circle cx="29.64" cy="63" r="9"/>
      <circle cx="88.92" cy="63" r="9"/>
      <circle cx="148.2" cy="63" r="9"/>
      <circle cx="207.48" cy="63" r="9"/>
      <circle cx="266.76" cy="63" r="9"/>
      <circle cx="59.28" cy="84" r="9"/>
      <circle cx="118.56" cy="84" r="9"/>
      <circle cx="177.84" cy="84" r="9"/>
      <circle cx="237.12" cy="84" r="9"/>
      <circle cx="29.64" cy="105" r="9"/>
      <circle cx="88.92" cy="105" r="9"/>
      <circle cx="148.2" cy="105" r="9"/>
      <circle cx="207.48" cy="105" r="9"/>
      <circle cx="266.76" cy="105" r="9"/>
    </g>
  </svg>
);

interface LanguageSwitcherProps {
  isMobile?: boolean;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ isMobile = false }) => {
  const { language, setLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages = [
    { code: 'vi', label: t('navigation.langVi'), flagIcon: <VietnamFlag /> },
    { code: 'en', label: t('navigation.langEn'), flagIcon: <USFlag /> },
  ];

  const currentLang = languages.find((lang) => lang.code === language) || languages[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLangSelect = (code: string) => {
    setLanguage(code as 'vi' | 'en');
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent, code: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleLangSelect(code);
    }
  };

  if (isMobile) {
    return (
      <div className="flex flex-col gap-2 w-full mt-4">
        <span className="text-[10px] font-bold tracking-widest uppercase text-secondary-text">Language / Ngôn ngữ</span>
        <div className="flex gap-4">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code as 'vi' | 'en')}
              className={`flex-1 flex items-center justify-center gap-2.5 py-2.5 rounded-lg border text-sm font-semibold transition-all ${
                language === lang.code
                  ? 'bg-accent text-primary-bg border-accent'
                  : 'bg-secondary-bg text-primary-text border-custom-border'
              }`}
              aria-label={`Switch to ${lang.label}`}
            >
              {lang.flagIcon}
              <span>{lang.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 border border-custom-border px-2.5 py-2 hover:bg-secondary-bg transition-colors duration-300 rounded cursor-pointer text-primary-text focus:outline-none focus:ring-1 focus:ring-accent"
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label="Select language"
      >
        {currentLang.flagIcon}
        <ChevronDown size={12} className={`text-secondary-text transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>


      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-44 bg-secondary-bg border border-custom-border rounded-lg shadow-xl overflow-hidden z-50"
            role="menu"
          >
            <div className="py-1">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLangSelect(lang.code)}
                  onKeyDown={(e) => handleKeyDown(e, lang.code)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left text-xs font-semibold tracking-wider uppercase hover:bg-primary-bg transition-colors text-primary-text cursor-pointer ${
                    language === lang.code ? 'text-accent font-bold bg-primary-bg/50' : ''
                  }`}
                  role="menuitem"
                  tabIndex={0}
                >
                  {lang.flagIcon}
                  <span>{lang.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LanguageSwitcher;
