import React from 'react';
import { Toaster as HotToaster } from 'react-hot-toast';

interface NotificationProviderProps {
  children: React.ReactNode;
}

/**
 * 统一的通知提供者组件
 * 
 * 封装了react-hot-toast的Toaster组件，并提供了统一的样式和位置配置
 * 应当在应用的根组件中使用，如_app.tsx或layout.tsx
 */
const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  return (
    <>
      {children}
      <HotToaster 
        position="top-center"
        reverseOrder={false}
        gutter={8}
        containerStyle={{
          top: 40,
          left: 20,
          right: 20,
        }}
        toastOptions={{
          // 定义默认样式
          duration: 3000,
          style: {
            background: '#fff',
            color: '#363636',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 3px 10px rgba(0, 0, 0, 0.1)',
            fontSize: '14px',
            maxWidth: '500px',
            backdropFilter: 'blur(8px)',
          },
          // 成功通知样式
          success: {
            iconTheme: {
              primary: '#22c55e',
              secondary: '#ffffff',
            },
          },
          // 错误通知样式
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#ffffff',
            },
          },
        }}
      />
    </>
  );
};

export default NotificationProvider; 