import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { myLifeModules } from '../config/myLifeModules';
import './MyLifeDock.css';

export const MyLifeDock: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="mylife-dock-row">
      <nav className="mylife-dock" aria-label={t('myLife.dock.label', { defaultValue: 'Điều hướng không gian MyLife' })}>
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
              className={({ isActive }) => `mylife-dock__link group ${isActive ? 'mylife-dock__link--active' : ''}`}
            >
              <Icon size={20} strokeWidth={1.9} aria-hidden="true" />
              <span className="mylife-dock__tooltip" aria-hidden="true">{label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};

export default MyLifeDock;
