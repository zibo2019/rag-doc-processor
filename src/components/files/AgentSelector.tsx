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
        <h2 className="text-lg font-medium text-gray-900 mb-4">选择智能体</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-4 rounded-lg border-2 border-gray-200 animate-pulse"
            >
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (agents.length === 0) {
    return (
      <div className={`mb-6 ${className}`}>
        <h2 className="text-lg font-medium text-gray-900 mb-4">选择智能体</h2>
        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          暂无可用的智能体
        </div>
      </div>
    );
  }

  return (
    <div className={`mb-6 ${className}`}>
      <h2 className="text-lg font-medium text-gray-900 mb-4">选择智能体</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className={`
              p-4 rounded-lg border-2 cursor-pointer transition-all
              ${selectedAgentId === agent.id 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
              }
            `}
            onClick={() => onSelectAgent(agent.id)}
          >
            <div className="font-medium text-gray-900">{agent.name}</div>
            <div className="mt-1 text-sm text-gray-500 line-clamp-2">
              {agent.description || agent.prompt}
            </div>
            <div className="mt-2 text-xs text-gray-400">
              创建于 {new Date(agent.createdAt).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 