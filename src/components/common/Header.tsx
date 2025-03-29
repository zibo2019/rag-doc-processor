import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ApiStatus } from './ApiStatus';
import { FileText, MonitorSmartphone, Settings } from 'lucide-react';

export const Header: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const linkClass = (path: string) => `
    relative px-4 py-2 text-sm font-medium transition-all duration-300 ease-in-out
    group flex items-center space-x-2 rounded-lg
    ${isActive(path)
      ? 'text-primary bg-primary/10'
      : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
    }
  `;

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo 区域 */}
          <div className="flex-shrink-0">
            <Link 
              to="/" 
              className="group flex items-center space-x-3 hover:opacity-80 transition-opacity duration-200"
            >
              {/* Logo 图标 - 使用主题 primary 颜色 */}
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/90 shadow-lg shadow-primary/20 group-hover:shadow-primary/30 transition-all duration-300">
                {/* 注意: 图标颜色可能需要调整为 primary-foreground 以确保对比度 */}
                <FileText className="h-6 w-6 text-primary-foreground" strokeWidth={2} />
              </div>
              {/* Logo 文字 */}
              <div className="flex flex-col">
                <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">AI文档批量处理器</span>
              </div>
            </Link>
          </div>

          {/* 导航菜单 - 使用 card 或其他合适的背景色 */}
          <div className="flex items-center space-x-4">
            <nav className="flex items-center space-x-2 bg-muted/50 rounded-lg p-1">
              <Link
                to="/"
                className={linkClass('/')}
              >
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 transition-transform group-hover:scale-110 duration-200" strokeWidth={2} />
                  <span>文档处理</span>
                </div>
              </Link>
              <Link
                to="/agents"
                className={linkClass('/agents')}
              >
                <div className="flex items-center space-x-2">
                  <MonitorSmartphone className="h-4 w-4 transition-transform group-hover:scale-110 duration-200" strokeWidth={2} />
                  <span>智能体管理</span>
                </div>
              </Link>
              <Link
                to="/settings"
                className={linkClass('/settings')}
              >
                <div className="flex items-center space-x-2">
                  <Settings className="h-4 w-4 transition-transform group-hover:scale-110 duration-200" strokeWidth={2} />
                  <span>设置</span>
                </div>
              </Link>
            </nav>

            {/* API状态 - 使用 card 或其他合适的背景色 */}
            <div className="p-1.5 bg-muted/50 rounded-lg">
              <ApiStatus />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}; 