import React from 'react';
import NotificationProvider from '../ui/NotificationProvider';

interface LayoutProps {
  children: React.ReactNode;
}

/**
 * 全局布局组件
 * 
 * 包含通知提供者和其他全局UI元素
 */
const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <NotificationProvider>
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    </NotificationProvider>
  );
};

export default Layout; 