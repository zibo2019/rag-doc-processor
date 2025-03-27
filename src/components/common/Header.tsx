import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ApiStatus } from './ApiStatus';

export const Header: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const linkClass = (path: string) => `
    relative px-4 py-2 text-sm font-medium transition-all duration-300 ease-in-out
    group flex items-center space-x-2 rounded-lg
    ${isActive(path)
      ? 'text-indigo-600 bg-indigo-50'
      : 'text-gray-600 hover:text-indigo-600 hover:bg-indigo-50/50'
    }
  `;

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo 区域 */}
          <div className="flex-shrink-0">
            <Link 
              to="/" 
              className="group flex items-center space-x-3 hover:opacity-80 transition-opacity duration-200"
            >
              {/* Logo 图标 */}
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg shadow-indigo-200 group-hover:shadow-indigo-300 transition-all duration-300">
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              {/* Logo 文字 */}
              <div className="flex flex-col">
                <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">AI文档批量处理器</span>
              </div>
            </Link>
          </div>

          {/* 导航菜单 */}
          <div className="flex items-center space-x-4">
            <nav className="flex items-center space-x-2 bg-gray-50/50 rounded-lg p-1">
              <Link
                to="/"
                className={linkClass('/')}
              >
                <div className="flex items-center space-x-2">
                  <svg
                    className="h-4 w-4 transition-transform group-hover:scale-110 duration-200"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span>文档处理</span>
                </div>
              </Link>
              <Link
                to="/agents"
                className={linkClass('/agents')}
              >
                <div className="flex items-center space-x-2">
                  <svg
                    className="h-4 w-4 transition-transform group-hover:scale-110 duration-200"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <span>智能体管理</span>
                </div>
              </Link>
              <Link
                to="/settings"
                className={linkClass('/settings')}
              >
                <div className="flex items-center space-x-2">
                  <svg
                    className="h-4 w-4 transition-transform group-hover:scale-110 duration-200"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span>设置</span>
                </div>
              </Link>
            </nav>

            {/* API状态 */}
            <div className="p-1.5 bg-gray-50 rounded-lg">
              <ApiStatus />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}; 