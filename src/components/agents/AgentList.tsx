import React from 'react';
import { useAgentStore } from '../../stores/agentStore';
import { AgentStatus } from '../../types/agent';

interface AgentListProps {
  onShowForm?: () => void;
}

export const AgentList: React.FC<AgentListProps> = ({ onShowForm }) => {
  const { agents, deleteAgent, setCurrentAgent } = useAgentStore();

  const getStatusColor = (status: AgentStatus) => {
    switch (status) {
      case AgentStatus.PROCESSING:
        return 'bg-yellow-100 text-yellow-800';
      case AgentStatus.SUCCESS:
        return 'bg-green-100 text-green-800';
      case AgentStatus.ERROR:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date?: Date) => {
    if (!date) return '未知';
    return new Date(date).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleEdit = (agent: any) => {
    setCurrentAgent(agent);
    if (onShowForm) {
      onShowForm();
    }
  };

  return (
    <div className="overflow-hidden bg-white shadow sm:rounded-md">
      <ul className="divide-y divide-gray-200">
        {agents.map((agent) => (
          <li key={agent.id}>
            <div className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <p className="truncate text-sm font-medium text-indigo-600">
                    {agent.name}
                  </p>
                  <span
                    className={`ml-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
                      agent.status
                    )}`}
                  >
                    {agent.status}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(agent)}
                    className="inline-flex items-center rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => deleteAgent(agent.id!)}
                    className="inline-flex items-center rounded-md border border-transparent bg-red-100 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-200"
                  >
                    删除
                  </button>
                </div>
              </div>
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <p>
                  最后使用：
                  {formatDate(agent.lastUsed)}
                </p>
              </div>
            </div>
          </li>
        ))}
        {agents.length === 0 && (
          <li className="px-4 py-8 text-center text-sm text-gray-500">
            暂无智能体，请点击创建按钮添加新的智能体
          </li>
        )}
      </ul>
    </div>
  );
}; 