import React, { useState, useEffect } from 'react';
import { AgentForm } from './AgentForm';
import { AgentList } from './AgentList';
import { useAgentStore } from '../../stores/agentStore';

const AgentPage: React.FC = () => {
  const [isFormVisible, setIsFormVisible] = useState(false);
  const { currentAgent, setCurrentAgent } = useAgentStore();

  // 当currentAgent变化时，如果非空则自动显示表单
  useEffect(() => {
    if (currentAgent) {
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

  return (
    <div className="container mx-auto px-4">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">智能体管理</h1>
        <button
          onClick={() => setIsFormVisible(true)}
          className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          创建智能体
        </button>
      </div>

      {/* 表单弹窗 */}
      {isFormVisible && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={handleCancel}
            />

            <div className="inline-block transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-[60%] sm:p-6 sm:align-middle">
              <div>
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  {currentAgent ? '编辑智能体' : '创建智能体'}
                </h3>
                <div className="mt-4">
                  <AgentForm
                    initialData={currentAgent || undefined}
                    onSubmit={handleSubmit}
                    onCancel={handleCancel}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 智能体列表 */}
      <div className="mt-8">
        <AgentList onShowForm={() => setIsFormVisible(true)} />
      </div>
    </div>
  );
};

export default AgentPage; 