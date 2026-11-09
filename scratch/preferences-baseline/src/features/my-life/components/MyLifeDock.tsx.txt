import React from 'react';
import { MyLifeModuleNav } from './MyLifeModuleNav';
import './MyLifeDock.css';

export const MyLifeDock: React.FC = () => {
  return (
    <div className="mylife-dock-row">
      <MyLifeModuleNav variant="bottom" />
    </div>
  );
};

export default MyLifeDock;
