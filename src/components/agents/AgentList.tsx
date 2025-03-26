import React from 'react';
import { useAgentStore } from '../../stores/agentStore';
import { AgentStatus } from '../../types/agent';
import { ExtendedAgentListItem, ExtendedAgentConfig } from '../../types/agentExtend';

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

  const handleEdit = (agent: ExtendedAgentListItem) => {
    // 确保agent有必要的字段
    const agentConfig: ExtendedAgentConfig = {
      id: agent.id,
      name: agent.name,
      prompt: agent.prompt || '',
      description: agent.description,
      createdAt: agent.createdAt,
      updatedAt: agent.updatedAt,
      model: agent.model || 'gpt-4o',
      rules: {
        maxTokens: agent.rules?.maxTokens || 8192,
        temperature: agent.rules?.temperature || 0.7
      },
      isActive: agent.isActive !== false
    };
    setCurrentAgent(agentConfig);
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
      <ul className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent) => {
          const extendedAgent = agent as ExtendedAgentListItem;
          const isActive = extendedAgent.isActive !== false;
          
          return (
            <li key={agent.id} className="group relative flex flex-col bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200">
              {/* 卡片头部：标题和状态 */}
              <div className="px-6 pt-6 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {/* 状态指示点 */}
                    <div className={`w-2.5 h-2.5 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <h3 className="text-base font-medium text-gray-900">{agent.name}</h3>
                  </div>
                  {/* 快捷操作按钮 */}
                  <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleToggleActive(agent.id!, isActive)}
                      className="p-1 rounded-full hover:bg-gray-100"
                      title={isActive ? '禁用' : '启用'}
                    >
                      <svg className={`w-5 h-5 ${isActive ? 'text-green-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleEdit(agent)}
                      className="p-1 rounded-full hover:bg-gray-100"
                      title="编辑"
                    >
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => deleteAgent(agent.id!)}
                      className="p-1 rounded-full hover:bg-gray-100"
                      title="删除"
                    >
                      <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                {/* 状态标签 */}
                <div className="mt-2 flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(agent.status)}`}>
                    {agent.status}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {isActive ? '已启用' : '已禁用'}
                  </span>
                </div>
              </div>

              {/* 提示词预览 */}
              <div className="px-6 py-4 border-t border-gray-100">
                <pre className="text-xs text-gray-600 bg-gray-50 p-3 rounded-md whitespace-pre-wrap max-h-20 overflow-y-auto">
                  {truncatePrompt(agent.prompt)}
                </pre>
              </div>

              {/* 元数据信息 */}
              <div className="px-6 py-4 bg-gray-50 rounded-b-lg border-t border-gray-100">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-3">
                    <div className="flex items-center text-gray-500">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-gray-600">最后使用：</span>
                      <span className="ml-1 text-gray-900">{formatDate(agent.lastUsed)}</span>
                    </div>
                    {extendedAgent.model && (
                      <div className="flex items-center text-gray-500">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="text-gray-600">模型：</span>
                        <span className="ml-1 text-gray-900">{extendedAgent.model}</span>
                      </div>
                    )}
                  </div>
                  {extendedAgent.rules && (
                    <div className="space-y-3">
                      <div className="flex items-center text-gray-500">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        <span className="text-gray-600">最大Token：</span>
                        <span className="ml-1 text-gray-900">{extendedAgent.rules.maxTokens || 2048}</span>
                      </div>
                      <div className="flex items-center text-gray-500">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                        <span className="text-gray-600">温度：</span>
                        <span className="ml-1 text-gray-900">{extendedAgent.rules.temperature?.toFixed(1) || 0.7}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </li>
          );
        })}
        {agents.length === 0 && (
          <li className="col-span-full px-6 py-12 text-center bg-white rounded-lg border-2 border-dashed border-gray-300">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">暂无智能体</h3>
            <p className="mt-1 text-sm text-gray-500">点击创建按钮添加新的智能体</p>
          </li>
        )}
      </ul>
    </div>
  );
}; 