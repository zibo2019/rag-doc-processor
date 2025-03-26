import React from 'react';
import { useAgentStore } from '../../stores/agentStore';
import { AgentStatus } from '../../types/agent';
import { ExtendedAgentListItem } from '../../types/agentExtend';

interface AgentListProps {
  onShowForm?: () => void;
}

export const AgentList: React.FC<AgentListProps> = ({ onShowForm }) => {
  const { agents, deleteAgent, setCurrentAgent, updateAgent } = useAgentStore();

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
  
  // 处理启用/禁用状态切换
  const handleToggleActive = (agentId: string, currentStatus?: boolean) => {
    // 切换状态
    updateAgent(agentId, { isActive: !currentStatus });
  };
  
  // 截取提示词，限制为3行
  const truncatePrompt = (prompt: string, lines = 3) => {
    if (!prompt) return '';
    const promptLines = prompt.split('\n');
    if (promptLines.length <= lines) {
      return prompt;
    }
    return promptLines.slice(0, lines).join('\n') + '...';
  };

  return (
    <div>
      <ul className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent) => {
          // 将agent视为扩展类型以访问模型字段
          const extendedAgent = agent as ExtendedAgentListItem;
          const isActive = extendedAgent.isActive !== false; // 如果未定义则默认为启用
          
          return (
            <li key={agent.id} className="border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 bg-white">
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
                    
                    <span
                      className={`ml-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {isActive ? '已启用' : '已禁用'}
                    </span>
                  </div>
                  <div className="flex space-x-2 items-center">
                    {/* 启用/禁用开关 */}
                    <button
                      onClick={() => handleToggleActive(agent.id!, isActive)}
                      className={`inline-flex items-center rounded-md border px-2.5 py-1.5 text-xs font-medium ${
                        isActive
                          ? 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                          : 'border-transparent bg-blue-100 text-blue-700 hover:bg-blue-200'
                      }`}
                    >
                      {isActive ? '禁用' : '启用'}
                    </button>
                    
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
                
                {/* 提示词预览 */}
                <div className="mt-2 border-t border-gray-100 pt-2">
                  <pre className="mt-1 text-xs text-gray-700 bg-gray-50 p-2 rounded whitespace-pre-wrap max-h-24 overflow-y-auto">
                    {truncatePrompt(agent.prompt)}
                  </pre>
                </div>
                
                <div className="mt-2 sm:flex sm:justify-between border-t border-gray-100 pt-2">
                  <div className="flex flex-wrap items-center text-sm text-gray-500 gap-x-4 gap-y-1">
                    <p>
                      最后使用：
                      {formatDate(agent.lastUsed)}
                    </p>
                    
                    {extendedAgent.model && (
                      <p className="flex items-center">
                        <span className="mr-1">模型：</span>
                        <span className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-800">
                          {extendedAgent.model}
                        </span>
                      </p>
                    )}
                    
                    {extendedAgent.rules && (
                      <>
                        <p className="flex items-center">
                          <span className="mr-1">最大Token数：</span>
                          <span className="rounded bg-purple-100 px-2 py-0.5 text-xs text-purple-800">
                            {extendedAgent.rules.maxTokens || 2048}
                          </span>
                        </p>
                        <p className="flex items-center">
                          <span className="mr-1">温度参数：</span>
                          <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-800">
                            {extendedAgent.rules.temperature?.toFixed(1) || 0.7}
                          </span>
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
        {agents.length === 0 && (
          <li className="px-4 py-8 text-center text-sm text-gray-500 border border-dashed border-gray-200 rounded-lg">
            暂无智能体，请点击创建按钮添加新的智能体
          </li>
        )}
      </ul>
    </div>
  );
}; 