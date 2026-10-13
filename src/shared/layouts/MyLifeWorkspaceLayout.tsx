import React from 'react';
import { UserWorkspaceHeader } from './UserWorkspaceHeader';
import { MyLifeDock } from '@/features/my-life/components/MyLifeDock';

export interface MyLifeWorkspaceLayoutProps {
  backTo: string;
  showDock?: boolean;
  children: React.ReactNode;
  contentClassName?: string;
  contentScroll?: 'auto' | 'hidden';
}

export const MyLifeWorkspaceLayout: React.FC<MyLifeWorkspaceLayoutProps> = ({
  backTo,
  showDock = false,
  children,
  contentClassName = '',
  contentScroll = 'auto',
}) => (
  <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-primary-bg font-sans text-primary-text transition-colors duration-300">
    <div className="z-40 w-full shrink-0 py-3">
      <UserWorkspaceHeader backTo={backTo} />
    </div>
    <main className={`mx-auto flex min-h-0 w-full max-w-[1400px] flex-1 flex-col ${contentScroll === 'auto' ? 'overflow-y-auto overscroll-contain' : 'overflow-hidden'} custom-scrollbar ${contentClassName}`}>
      {children}
    </main>
    {showDock && <MyLifeDock />}
  </div>
);

export default MyLifeWorkspaceLayout;
