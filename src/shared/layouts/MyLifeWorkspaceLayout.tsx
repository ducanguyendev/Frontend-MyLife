import React from 'react';
import { AppShell } from './app-shell/AppShell';

export interface MyLifeWorkspaceLayoutProps {
  backTo: string;
  breadcrumbName?: string;
  showDock?: boolean;
  children: React.ReactNode;
  contentClassName?: string;
  contentScroll?: 'auto' | 'hidden';
}

export const MyLifeWorkspaceLayout: React.FC<MyLifeWorkspaceLayoutProps> = ({
  children, breadcrumbName,
  contentClassName = '',
  contentScroll = 'auto',
}) => (
  <AppShell breadcrumbName={breadcrumbName} contentScroll={contentScroll} contentClassName={contentClassName}>{children}</AppShell>
);

export default MyLifeWorkspaceLayout;
