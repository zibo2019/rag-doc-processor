import React, { useEffect } from 'react';
import { useAgentStore } from '../../stores/agentStore';
import { AgentSelector } from './AgentSelector';
import { AgentConfig } from '../../types/agent';

interface AgentPanelProps {
  className?: string;
  onAgentSelected?: (agentId: string) => void;
}

export const AgentPanel: React.FC<AgentPanelProps> = ({ 
  className,
  onAgentSelected
}) => {
  const { 
    agents, 
    isLoading, 
    selectedAgentId, 
    setSelectedAgentId,
    setCurrentAgent
  } = useAgentStore();

  // 在组件加载时设置默认选中的智能体
  useEffect(() => {
    if (!isLoading && agents.length > 0 && !selectedAgentId) {
      // 如果没有选中的智能体，选择第一个，但不设置currentAgent
      const firstAgent = agents[0];
      setSelectedAgentId(firstAgent.id || null);
    }
  }, [agents, isLoading, selectedAgentId, setSelectedAgentId]);

  const handleAgentSelect = (agentId: string) => {
    setSelectedAgentId(agentId);
    
    // 找到选中的智能体实例
    const selectedAgent = agents.find(agent => agent.id === agentId);
    if (selectedAgent) {
      // 将AgentListItem转换为AgentConfig
      // 创建一个基本的AgentConfig结构，填充必要的字段
      const agentConfig: AgentConfig = {
        id: selectedAgent.id,
        name: selectedAgent.name,
        prompt: selectedAgent.prompt || '', // 确保有默认值
        description: selectedAgent.description,
        createdAt: selectedAgent.createdAt,
        updatedAt: selectedAgent.updatedAt,
        // 添加缺失的必要字段
        rules: {
          maxTokens: 2048,
          temperature: 0.7
        },
        isActive: true
      };
      
      setCurrentAgent(agentConfig);
      
      // 如果提供了回调函数，则调用它
      if (onAgentSelected) {
        onAgentSelected(agentId);
      }
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-100 ${className}`}>
      <div className="px-4 py-2.5 border-b border-gray-100">
        <h2 className="text-sm font-medium text-gray-700">选择智能体</h2>
      </div>
      <div className="relative p-3">
        <div className="overflow-x-auto -mx-3 px-3">
          <AgentSelector
            agents={agents}
            selectedAgentId={selectedAgentId}
            onSelectAgent={handleAgentSelect}
            isLoading={isLoading}
          />
        </div>
        {agents.length > 0 && (
          <>
            <div className="pointer-events-none absolute top-0 bottom-0 left-3 w-6 bg-gradient-to-r from-white to-transparent"></div>
            <div className="pointer-events-none absolute top-0 bottom-0 right-3 w-6 bg-gradient-to-l from-white to-transparent"></div>
          </>
        )}
      </div>
    </div>
  );
}; 