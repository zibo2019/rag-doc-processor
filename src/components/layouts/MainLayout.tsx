import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '../common/Header';

export const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1 py-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}; 