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
      <div className={`mx-4 my-2 ${className}`}>
        <div className="flex space-x-2 my-1">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex-shrink-0 w-44 p-2.5 bg-white rounded-md shadow-sm"
            >
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-1.5"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (agents.length === 0) {
    return (
      <div className={`mx-4 my-2 ${className}`}>
        <div className="text-center py-3 my-1 text-sm text-gray-500 bg-gray-50 rounded-md border border-dashed border-gray-200">
          暂无可用的智能体，请先创建智能体
        </div>
      </div>
    );
  }

  return (
    <div className={`mx-4 my-2 ${className}`}>
      <div className="flex space-x-2 my-1">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className={`
              group flex-shrink-0 w-44 p-2 bg-white rounded-md shadow-sm
              ${selectedAgentId === agent.id 
                ? 'outline outline-2 outline-blue-500 shadow-md' 
                : 'hover:outline hover:outline-1 hover:outline-blue-400'
              }
            `}
            onClick={() => onSelectAgent(agent.id)}
            role="button"
            tabIndex={0}
          >
            <div className="flex items-center">
              <div className={`
                font-medium text-sm truncate
                ${selectedAgentId === agent.id 
                  ? 'text-blue-600' 
                  : 'text-gray-900 group-hover:text-blue-600'
                }
              `}>
                {agent.name}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 