import React from 'react';
import { AgentListItem } from '../../types/agent';

interface AgentSelectorProps {
  agents: AgentListItem[];
  selectedAgentId: string | null;
  onSelectAgent: (agentId: string) => void;
  className?: string;
  isLoading?: boolean;
}

export const AgentSelector: React.FC<AgentSelectorProps> = ({
  agents,
  selectedAgentId,
  onSelectAgent,
  className,
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <div className={`mb-6 ${className}`}>
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <span className="mr-2">🤖</span>
          选择智能体
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-6 rounded-xl border-2 border-gray-100 shadow-sm bg-white animate-pulse"
            >
              <div className="h-6 bg-gray-200 rounded-full w-3/4 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-100 rounded-full w-full"></div>
                <div className="h-4 bg-gray-100 rounded-full w-5/6"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (agents.length === 0) {
    return (
      <div className={`mb-6 ${className}`}>
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <span className="mr-2">🤖</span>
          选择智能体
        </h2>
        <div className="text-center py-12 px-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <div className="text-gray-500 text-lg">暂无可用的智能体</div>
          <p className="text-gray-400 text-sm mt-2">请稍后再试或联系管理员</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`mb-6 ${className}`}>
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
        <span className="mr-2">🤖</span>
        选择智能体
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className={`
              group p-6 rounded-xl border-2 cursor-pointer transition-all duration-200
              hover:shadow-lg relative overflow-hidden
              ${
                selectedAgentId === agent.id
                  ? 'border-blue-500 bg-blue-50/50 shadow-blue-100'
                  : 'border-gray-100 hover:border-blue-300 hover:bg-gray-50/50'
              }
            `}
            onClick={() => agent.id && onSelectAgent(agent.id)}
          >
            <div className="font-semibold text-gray-900 text-lg mb-2">{agent.name}</div>
            <div className="text-sm text-gray-600 line-clamp-2 mb-3">
              {agent.description || agent.prompt}
            </div>
            <div className="text-xs text-gray-400 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              创建于 {agent.createdAt ? new Date(agent.createdAt).toLocaleDateString() : '未知时间'}
            </div>
            {selectedAgentId === agent.id && (
              <div className="absolute top-3 right-3">
                <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}; 