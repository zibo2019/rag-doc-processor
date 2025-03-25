import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AgentConfig, AgentListItem, AgentStatus } from '../types/agent';
import { ExtendedAgentConfig, ExtendedAgentListItem } from '../types/agentExtend';
import { notify } from '../utils/notification';

interface AgentStore {
  agents: AgentListItem[];
  currentAgent: AgentConfig | null;
  selectedAgentId: string | null;
  isLoading: boolean;
  error: string | null;

  // 获取智能体列表
  fetchAgents: () => Promise<void>;
  setAgents: (agents: AgentListItem[]) => void;
  addAgent: (agent: AgentConfig) => void;
  updateAgent: (id: string, agent: Partial<AgentConfig>) => void;
  deleteAgent: (id: string) => void;
  setCurrentAgent: (agent: AgentConfig | null) => void;
  setSelectedAgentId: (id: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

// 从localStorage加载数据
const loadFromStorage = () => {
  try {
    const storedData = localStorage.getItem('agent-store');
    if (storedData) {
      const { state } = JSON.parse(storedData);
      
      // 转换日期字符串为Date对象
      const agents = state.agents || [];
      agents.forEach((agent: any) => {
        if (agent.createdAt) agent.createdAt = new Date(agent.createdAt);
        if (agent.updatedAt) agent.updatedAt = new Date(agent.updatedAt);
        if (agent.lastUsed) agent.lastUsed = new Date(agent.lastUsed);
      });
      
      // 无论如何都不加载currentAgent
      return {
        agents,
        selectedAgentId: state.selectedAgentId || null,
        currentAgent: null // 始终返回null
      };
    }
  } catch (error) {
    console.error('从localStorage加载数据失败:', error);
  }
  return {
    agents: [],
    selectedAgentId: null,
    currentAgent: null
  };
};

export const useAgentStore = create<AgentStore>()(
  persist(
    (set) => {
      // 加载初始状态，但确保currentAgent初始为null
      const { agents, selectedAgentId } = loadFromStorage();
      const initialState = {
        agents,
        selectedAgentId,
        currentAgent: null // 确保初始状态下currentAgent为null
      };

      return {
        ...initialState,
        isLoading: false,
        error: null,

        fetchAgents: async () => {
          set({ isLoading: true, error: null });
          try {
            const { agents, selectedAgentId } = loadFromStorage();
            set({ 
              agents, 
              selectedAgentId,
              currentAgent: null, // 明确设置为null，而不是从localStorage加载
              isLoading: false 
            });
          } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
            notify.error('获取智能体列表失败：' + (error as Error).message);
          }
        },

        setAgents: (agents) => set({ agents }),
        
        addAgent: (agent) => {
          try {
            // 数据验证
            if (!agent.name?.trim()) {
              notify.error('智能体名称不能为空');
              return;
            }
            if (!agent.prompt?.trim()) {
              notify.error('提示词不能为空');
              return;
            }

            // 处理扩展的智能体配置，确保保留model字段
            const extendedAgent = agent as ExtendedAgentConfig;
            
            // 生成唯一ID
            const newAgent: ExtendedAgentListItem = {
              ...agent,
              id: crypto.randomUUID(),
              status: AgentStatus.IDLE,
              createdAt: new Date(),
              updatedAt: new Date(),
              // 保留model字段
              model: extendedAgent.model,
              // 保存规则信息
              rules: extendedAgent.rules,
              // 保存启用状态
              isActive: extendedAgent.isActive
            };

            set((state) => ({
              agents: [...state.agents, newAgent],
              error: null,
            }));
            notify.success('智能体创建成功');
          } catch (error) {
            notify.error('创建智能体失败：' + (error as Error).message);
            set({ error: (error as Error).message });
          }
        },

        updateAgent: (id, agent) => {
          try {
            // 数据验证
            if (agent.name !== undefined && !agent.name.trim()) {
              notify.error('智能体名称不能为空');
              return;
            }
            if (agent.prompt !== undefined && !agent.prompt.trim()) {
              notify.error('提示词不能为空');
              return;
            }

            // 处理扩展的智能体配置，确保保留model字段
            const extendedAgent = agent as Partial<ExtendedAgentConfig>;

            set((state) => {
              const index = state.agents.findIndex((a) => a.id === id);
              if (index === -1) {
                notify.error('未找到要更新的智能体');
                return state;
              }

              // 更新智能体
              const updatedAgents = [...state.agents];
              updatedAgents[index] = {
                ...updatedAgents[index],
                ...agent,
                // 保留model字段
                model: extendedAgent.model !== undefined 
                  ? extendedAgent.model 
                  : (updatedAgents[index] as ExtendedAgentListItem).model,
                // 保存规则信息
                rules: extendedAgent.rules !== undefined
                  ? extendedAgent.rules
                  : (updatedAgents[index] as ExtendedAgentListItem).rules,
                // 保存启用状态
                isActive: extendedAgent.isActive !== undefined
                  ? extendedAgent.isActive
                  : (updatedAgents[index] as ExtendedAgentListItem).isActive,
                updatedAt: new Date(),
              };

              // 如果更新的是当前编辑的智能体，同步更新
              let updatedCurrentAgent = state.currentAgent;
              if (state.currentAgent && state.currentAgent.id === id) {
                updatedCurrentAgent = {
                  ...state.currentAgent,
                  ...agent,
                  // 保留model字段
                  model: extendedAgent.model !== undefined 
                    ? extendedAgent.model 
                    : (state.currentAgent as ExtendedAgentConfig).model,
                  // 保存规则信息
                  rules: extendedAgent.rules !== undefined
                    ? extendedAgent.rules
                    : (state.currentAgent as ExtendedAgentConfig).rules,
                  updatedAt: new Date(),
                };
              }

              return {
                ...state,
                agents: updatedAgents,
                currentAgent: updatedCurrentAgent,
                error: null,
              };
            });
            notify.success('智能体更新成功');
          } catch (error) {
            notify.error('更新智能体失败：' + (error as Error).message);
            set({ error: (error as Error).message });
          }
        },

        deleteAgent: (id) => {
          try {
            set((state) => {
              // 如果删除的是当前选中的智能体，清除选中状态
              if (state.selectedAgentId === id) {
                return {
                  agents: state.agents.filter((agent) => agent.id !== id),
                  selectedAgentId: null,
                  currentAgent: null,
                  error: null,
                };
              }
              
              return {
                agents: state.agents.filter((agent) => agent.id !== id),
                error: null,
              };
            });
            notify.success('智能体删除成功');
          } catch (error) {
            notify.error('删除智能体失败：' + (error as Error).message);
            set({ error: (error as Error).message });
          }
        },

        setCurrentAgent: (agent) => {
          set({ 
            currentAgent: agent,
            selectedAgentId: agent?.id || null
          });
        },

        setSelectedAgentId: (id) => set({ selectedAgentId: id }),
        setLoading: (isLoading) => set({ isLoading }),
        setError: (error) => set({ error }),
      };
    },
    {
      name: 'agent-store',
      partialize: (state) => ({ 
        agents: state.agents,
        selectedAgentId: state.selectedAgentId,
        // 不持久化currentAgent状态，避免页面重新加载时自动打开编辑模态框
        // currentAgent: state.currentAgent
      }),
    }
  )
); 