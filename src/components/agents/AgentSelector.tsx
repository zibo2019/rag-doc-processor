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
        <div className="flex space-x-3 my-1 pb-1">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex-shrink-0 w-64 p-4 bg-white rounded-lg shadow-sm animate-pulse"
            >
              <div className="h-5 bg-gray-200 rounded-full w-3/4 mb-3"></div>
              <div className="flex items-center space-x-2 mb-2">
                <div className="h-4 w-4 bg-gray-200 rounded-full"></div>
                <div className="h-4 bg-gray-200 rounded-full w-1/2"></div>
              </div>
              <div className="h-3 bg-gray-100 rounded-full w-1/3 mt-2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (agents.length === 0) {
    return (
      <div className={`mx-4 my-2 ${className}`}>
        <div className="text-center py-4 my-1 text-sm text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
          <svg className="w-6 h-6 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          暂无可用的智能体，请先创建智能体
        </div>
      </div>
    );
  }

  return (
    <div className={`mx-4 my-2 ${className}`}>
      <div className="flex space-x-3 my-1 pb-1 snap-x snap-mandatory">
        {agents.map((agent) => {
          const extendedAgent = agent as ExtendedAgentListItem;
          const isSelected = selectedAgentId === agent.id;
          return (
            <div
              key={agent.id}
              className={`
                group flex-shrink-0 w-64 p-4 bg-white rounded-lg transition-all duration-200 snap-start
                ${isSelected
                  ? 'ring-2 ring-blue-500 shadow-md'
                  : 'hover:ring-1 hover:ring-blue-400 shadow-sm hover:shadow'}
              `}
              onClick={() => onSelectAgent(agent.id)}
              role="button"
              tabIndex={0}
              aria-selected={isSelected}
            >
              <div className="flex flex-col">
                <div className={`
                  font-medium text-base truncate mb-2
                  ${isSelected
                    ? 'text-blue-600'
                    : 'text-gray-800 group-hover:text-blue-600'}
                `}>
                  {agent.name}
                </div>

                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs text-gray-500 flex items-center">
                    <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="font-medium">{extendedAgent.model || 'gpt-4o'}</span>
                  </div>

                  {isSelected && (
                    <div className="flex-shrink-0 text-blue-500">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>

                {agent.description && (
                  <div className="text-xs text-gray-500 line-clamp-1 mt-1">
                    {agent.description}
                  </div>
                )}

                {/* 温度和Token参数指示器 */}
                {extendedAgent.rules && (
                  <div className="flex items-center space-x-2 mt-2 text-xs text-gray-400">
                    <div className="flex items-center" title="温度参数">
                      <svg className="w-3 h-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                      {extendedAgent.rules.temperature}
                    </div>
                    <div className="flex items-center" title="最大Token数">
                      <svg className="w-3 h-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                      {(extendedAgent.rules.maxTokens / 1000).toFixed(1)}K
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};