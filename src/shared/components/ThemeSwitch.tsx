import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../hooks/useLanguage';
import './ThemeSwitch.css';

export const ThemeSwitch: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();

  return (
    <label className="theme-switch" aria-label={theme === 'dark' ? t('common.themeSwitch.toLight') : t('common.themeSwitch.toDark')}>
      <input
        type="checkbox"
        className="theme-switch__input"
        checked={theme === 'dark'}
        onChange={toggleTheme}
        aria-label={theme === 'dark' ? t('common.themeSwitch.toLight') : t('common.themeSwitch.toDark')}
      />
      <span className="theme-switch__slider" aria-hidden="true">
        <span className="theme-switch__sun">
          <span className="theme-switch__sun-ray theme-switch__sun-ray--one" />
          <span className="theme-switch__sun-ray theme-switch__sun-ray--two" />
          <span className="theme-switch__sun-ray theme-switch__sun-ray--three" />
          <span className="theme-switch__sun-ray theme-switch__sun-ray--four" />
        </span>
        <span className="theme-switch__cloud theme-switch__cloud--one" />
        <span className="theme-switch__cloud theme-switch__cloud--two" />
        <span className="theme-switch__star theme-switch__star--one" />
        <span className="theme-switch__star theme-switch__star--two" />
        <span className="theme-switch__star theme-switch__star--three" />
        <span className="theme-switch__thumb">
          <span className="theme-switch__moon-dot theme-switch__moon-dot--one" />
          <span className="theme-switch__moon-dot theme-switch__moon-dot--two" />
          <span className="theme-switch__moon-dot theme-switch__moon-dot--three" />
        </span>
      </span>
    </label>
  );
};
