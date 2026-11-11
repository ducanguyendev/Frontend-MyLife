import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { myLifeModules } from '../config/myLifeModules';
import './MyLifeModuleNav.css';

interface MyLifeModuleNavProps {
  variant: 'header' | 'bottom';
}

export const MyLifeModuleNav: React.FC<MyLifeModuleNavProps> = ({ variant }) => {
  const { t } = useTranslation();

  return (
    <nav
      className={`mylife-module-nav mylife-module-nav--${variant}`}
      aria-label={t('myLife.dock.label', { defaultValue: 'Điều hướng không gian MyLife' })}
    >
      {myLifeModules.map((module) => {
        const Icon = module.icon;
        const label = t(module.titleKey);

        return (
          <NavLink
            key={module.id}
            to={module.route}
            end
            aria-label={label}
            title={label}
            onKeyDown={event => {
              if (event.key === ' ') {
                event.preventDefault();
                event.currentTarget.click();
              }
            }}
            className={({ isActive }) => `mylife-module-nav__link group ${isActive ? 'mylife-module-nav__link--active' : ''}`}
          >
            <Icon size={20} strokeWidth={1.9} aria-hidden="true" />
            <span className="mylife-module-nav__tooltip" aria-hidden="true">{label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};

export default MyLifeModuleNav;
