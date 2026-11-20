import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Notification {
  id: string;
  status: 'Task Completed' | 'Task Running';
  label: string;
}

const NOTIFICATIONS: Notification[] = [
  { id: '1', status: 'Task Completed', label: 'SEO Optimization' },
  { id: '2', status: 'Task Completed', label: 'Marketing Campaign' },
  { id: '3', status: 'Task Completed', label: 'New webpage' },
  { id: '4', status: 'Task Running', label: 'Bug fix' },
  { id: '5', status: 'Task Completed', label: 'Database indexing' },
];

interface ActiveNotification extends Notification {
  instanceId: string;
}

export const HeroNotifications: React.FC = () => {
  const [activeItems, setActiveItems] = useState<ActiveNotification[]>([]);

  useEffect(() => {
    // Add items sequentially to create the "popping up" effect
    let currentIndex = 0;
    const interval = setInterval(() => {
      setActiveItems((prev) => {
        // Create a truly unique instance of the notification
        const newItem: ActiveNotification = {
          ...NOTIFICATIONS[currentIndex],
          instanceId: Math.random().toString(36).substring(2, 9) + Date.now().toString(36)
        };
        // Add new item to the bottom, remove from the top if > 3
        const next = [...prev, newItem].slice(-3);
        return next;
      });
      currentIndex = (currentIndex + 1) % NOTIFICATIONS.length;
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div 
      className="absolute right-0 hidden md:block" 
      style={{
        top: 'max(350px, 46dvh)',
        right: '23%', // roughly 0.23 ratio from the right
        transformStyle: 'preserve-3d',
        perspective: '300px',
        transform: 'rotateY(-12deg) rotateX(-2deg) rotateZ(2deg) scale(0.88) skewX(1deg) translateY(-80%)',
        zIndex: 10,
        pointerEvents: 'none'
      }}
    >
      <div className="relative flex flex-col items-end gap-3" style={{ transformStyle: 'preserve-3d' }}>
        <AnimatePresence initial={false} mode="popLayout">
          {activeItems.map((notif, index) => (
            <motion.div
              key={notif.instanceId}
              initial={{ opacity: 0, y: 40, scale: 0.9, rotateX: -15 }}
              animate={{ 
                opacity: index === 0 && activeItems.length === 3 ? 0.6 : 1, // Top item slightly faded
                y: 0, 
                scale: 1, 
                rotateX: 0,
                filter: `blur(0px)`
              }}
              exit={{ opacity: 0, y: -40, scale: 0.85, filter: 'blur(4px)' }}
              transition={{ 
                type: 'spring', 
                stiffness: 400, 
                damping: 30,
                mass: 1 
              }}
              layout
              className="px-4 py-3 rounded-[14px]"
              style={{
                background: 'linear-gradient(180deg, rgba(20, 25, 35, 0.5) 0%, rgba(10, 15, 25, 0.6) 100%)',
                backdropFilter: 'blur(16px) saturate(1.2)',
                WebkitBackdropFilter: 'blur(16px) saturate(1.2)',
                boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.25), 0 8px 32px rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.08)'
              }}
            >
              <div className="flex items-center gap-2.5 whitespace-nowrap">
                <span className="flex items-center gap-2 font-medium text-[13px] tracking-wide" style={{ color: 'rgba(255,255,255,0.65)' }}>
                  <span 
                    className="w-1.5 h-1.5 rounded-full inline-block shrink-0" 
                    style={{ 
                      backgroundColor: notif.status === 'Task Completed' ? '#84cc16' : '#eab308',
                      boxShadow: `0 0 8px ${notif.status === 'Task Completed' ? 'rgba(132, 204, 22, 0.6)' : 'rgba(234, 179, 8, 0.6)'}`
                    }}
                  />
                  {notif.status}
                </span>
                <span className="font-semibold text-[13px] text-white italic tracking-wide">
                  {notif.label}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
