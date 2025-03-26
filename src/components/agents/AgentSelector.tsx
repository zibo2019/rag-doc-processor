import React from 'react';
import { AgentListItem } from '../../types/agent';
import { ExtendedAgentListItem } from '../../types/agentExtend';

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
              className="flex-shrink-0 w-56 p-3 bg-white rounded-md shadow-sm"
            >
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
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
        {agents.map((agent) => {
          const extendedAgent = agent as ExtendedAgentListItem;
          return (
            <div
              key={agent.id}
              className={`
                group flex-shrink-0 w-56 p-3 bg-white rounded-md shadow-sm
                ${selectedAgentId === agent.id 
                  ? 'outline outline-2 outline-blue-500 shadow-md' 
                  : 'hover:outline hover:outline-1 hover:outline-blue-400'
                }
              `}
              onClick={() => onSelectAgent(agent.id)}
              role="button"
              tabIndex={0}
            >
              <div className="flex flex-col">
                <div className={`
                  font-medium text-sm truncate mb-1
                  ${selectedAgentId === agent.id 
                    ? 'text-blue-600' 
                    : 'text-gray-900 group-hover:text-blue-600'
                  }
                `}>
                  {agent.name}
                </div>
                <div className="text-xs text-gray-500 flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {extendedAgent.model || 'gpt-4o'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}; 