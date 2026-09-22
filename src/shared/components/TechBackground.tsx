import React from 'react';

export const TechBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden select-none z-0">
      {/* Background Image Grid Layer */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
        style={{ 
          backgroundImage: `url('/hud_background.png')`,
          opacity: 'var(--hud-opacity)' as any,
          filter: 'var(--hud-filter)'
        }}
      />
      
      {/* Dynamic Animated Pulse Grid Overlay */}
      <div 
        className="absolute inset-0 bg-[linear-gradient(to_right,var(--accent-color)_1px,transparent_1px),linear-gradient(to_bottom,var(--accent-color)_1px,transparent_1px)] bg-[size:5rem_5rem] opacity-[0.03] animate-[pulse_6s_infinite_ease-in-out]" 
      />

      {/* Cybernetic scanning light effect */}
      <div 
        className="absolute w-full h-[2px] bg-gradient-to-r from-transparent via-accent/30 to-transparent top-0 animate-[scan_8s_infinite_linear]"
        style={{
          boxShadow: '0 0 10px var(--accent-color)'
        }}
      />

      {/* Ambient gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary-bg/10 via-transparent to-primary-bg pointer-events-none" />
    </div>
  );
};
export default TechBackground;
