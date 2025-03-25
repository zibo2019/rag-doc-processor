import React, { useEffect } from 'react';
import { useAgentStore } from '../../stores/agentStore';
import { AgentSelector } from './AgentSelector';
import { AgentConfig } from '../../types/agent';
import { ExtendedAgentConfig, ExtendedAgentListItem } from '../../types/agentExtend';

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

  // 过滤出启用的智能体
  const activeAgents = agents.filter(agent => {
    const extendedAgent = agent as ExtendedAgentListItem;
    // 如果 isActive 未定义或为 true，则视为启用状态
    return extendedAgent.isActive !== false;
  });
  
  // 在组件加载时设置默认选中的智能体
  useEffect(() => {
    if (!isLoading && activeAgents.length > 0 && !selectedAgentId) {
      // 如果没有选中的智能体，选择第一个启用的智能体
      const firstAgent = activeAgents[0];
      setSelectedAgentId(firstAgent.id || null);
      
      // 同时设置currentAgent
      const agentConfig: ExtendedAgentConfig = {
        id: firstAgent.id,
        name: firstAgent.name,
        prompt: firstAgent.prompt || '', // 确保有默认值
        description: firstAgent.description,
        createdAt: firstAgent.createdAt,
        updatedAt: firstAgent.updatedAt,
        // 添加模型字段，如果存在则使用，否则使用默认值
        model: (firstAgent as ExtendedAgentListItem).model || 'gpt-4o',
        // 添加缺失的必要字段
        rules: {
          maxTokens: 8192,
          temperature: 0.7
        },
        isActive: true
      };
      
      setCurrentAgent(agentConfig as AgentConfig);
    }
  }, [activeAgents, isLoading, selectedAgentId, setSelectedAgentId, setCurrentAgent]);

  const handleAgentSelect = (agentId: string) => {
    setSelectedAgentId(agentId);
    
    // 找到选中的智能体实例
    const selectedAgent = activeAgents.find(agent => agent.id === agentId);
    if (selectedAgent) {
      // 将AgentListItem转换为ExtendedAgentConfig
      // 创建一个基本的ExtendedAgentConfig结构，填充必要的字段
      const agentConfig: ExtendedAgentConfig = {
        id: selectedAgent.id,
        name: selectedAgent.name,
        prompt: selectedAgent.prompt || '', // 确保有默认值
        description: selectedAgent.description,
        createdAt: selectedAgent.createdAt,
        updatedAt: selectedAgent.updatedAt,
        // 添加模型字段，如果存在则使用，否则使用默认值
        model: (selectedAgent as ExtendedAgentListItem).model || 'gpt-4o',
        // 添加缺失的必要字段
        rules: {
          maxTokens: 8192,
          temperature: 0.7
        },
        isActive: true
      };
      
      setCurrentAgent(agentConfig as AgentConfig);
      
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
            agents={activeAgents}
            selectedAgentId={selectedAgentId}
            onSelectAgent={handleAgentSelect}
            isLoading={isLoading}
          />
        </div>
        {activeAgents.length > 0 && (
          <>
            <div className="pointer-events-none absolute top-0 bottom-0 left-3 w-6 bg-gradient-to-r from-white to-transparent"></div>
            <div className="pointer-events-none absolute top-0 bottom-0 right-3 w-6 bg-gradient-to-l from-white to-transparent"></div>
          </>
        )}
      </div>
    </div>
  );
}; 