import React, { useState, useEffect, useRef } from 'react';
import { AgentForm } from './AgentForm';
import { AgentList } from './AgentList';
import { useAgentStore } from '../../stores/agentStore';
import { useLocation } from 'react-router-dom';

const AgentPage: React.FC = () => {
  // 添加一个标记，控制是否允许打开模态框
  const allowModalOpen = useRef(false);
  const [isFormVisible, setIsFormVisible] = useState<boolean>(false);
  const { currentAgent, setCurrentAgent } = useAgentStore();
  const location = useLocation();

  // 重置状态并延迟允许打开模态框
  useEffect(() => {
    // 手动清除localStorage中可能存在的currentAgent
    try {
      const storedData = localStorage.getItem('agent-store');
      if (storedData) {
        const data = JSON.parse(storedData);
        if (data.state && data.state.currentAgent) {
          data.state.currentAgent = null;
          localStorage.setItem('agent-store', JSON.stringify(data));
        }
      }
    } catch (e) {
      console.error('清除localStorage数据失败:', e);
    }
    
    setCurrentAgent(null);
    setIsFormVisible(false);
    
    // 初始化时禁止自动打开模态框
    allowModalOpen.current = false;
    
    // 1秒后才允许响应模态框打开请求
    const timer = setTimeout(() => {
      allowModalOpen.current = true;
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // 监听路由变化
  useEffect(() => {
    if (location.pathname === '/agents') {
      // 清除状态
      setCurrentAgent(null);
      setIsFormVisible(false);
      // 路由变化时暂时禁止自动打开模态框
      allowModalOpen.current = false;
      
      // 延迟后才允许打开模态框
      const timer = setTimeout(() => {
        allowModalOpen.current = true;
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

  // 当currentAgent变化时的处理逻辑
  useEffect(() => {
    // 只有允许打开模态框且currentAgent存在时，才显示表单
    if (allowModalOpen.current && currentAgent) {
      setIsFormVisible(true);
    }
  }, [currentAgent]);

  const handleCancel = () => {
    setIsFormVisible(false);
    setCurrentAgent(null);
  };

  const handleSubmit = () => {
    setIsFormVisible(false);
    setCurrentAgent(null);
  };

  // 自定义打开模态框的处理函数
  const handleOpenModal = () => {
    // 用户手动操作时，始终允许打开
    allowModalOpen.current = true;
    setIsFormVisible(true);
  };

  // 组件卸载时清理
  useEffect(() => {
    // 组件卸载时清除状态
    return () => {
      setCurrentAgent(null);
    };
  }, []);

  return (
    <div className="container mx-auto px-4">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">智能体管理</h1>
        <button
          onClick={handleOpenModal}
          className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          创建智能体
        </button>
      </div>

      {/* 表单弹窗 */}
      {isFormVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* 遮罩层 */}
          <div 
            className="absolute inset-0 bg-black/50" 
            onClick={handleCancel}
          />
          
          {/* 模态框内容 - 全屏模式 */}
          <div className="relative w-[95vw] h-[90vh] bg-white rounded-lg shadow-xl overflow-hidden flex flex-col">
            {/* 模态框头部 */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-medium">
                {currentAgent ? '编辑智能体' : '创建智能体'}
              </h3>
              
              <button
                onClick={handleCancel}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* 表单内容 */}
            <div className="p-6 overflow-auto flex-1">
              <AgentForm
                initialData={currentAgent || undefined}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
              />
            </div>
          </div>
        </div>
      )}

      {/* 智能体列表 */}
      <div className="mt-8">
        <AgentList 
          onShowForm={() => {
            // 用户点击编辑按钮，明确允许打开模态框
            allowModalOpen.current = true;
            setIsFormVisible(true);
          }} 
        />
      </div>
    </div>
  );
};

export default AgentPage; 