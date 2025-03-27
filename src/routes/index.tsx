import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '../components/layouts/MainLayout';

// 使用 React.lazy 懒加载页面组件
const FilePage = React.lazy(() => import('../components/files/FilePage'));
const AgentPage = React.lazy(() => import('../components/agents/AgentPage'));
const SettingsPage = React.lazy(() => import('../pages/Settings'));

// 加载状态组件
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-full">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
  </div>
);

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          {/* 使用 Suspense 包裹路由，提供加载状态 */}
          <Route
            index
            element={
              <Suspense fallback={<LoadingFallback />}>
                <FilePage />
              </Suspense>
            }
          />
          <Route
            path="agents"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <AgentPage />
              </Suspense>
            }
          />
          <Route
            path="settings"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <SettingsPage />
              </Suspense>
            }
          />
          {/* 404页面 - 重定向到首页 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}; 