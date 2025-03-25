import { AgentConfig, AgentListItem, AgentRule, agentBaseSchema, agentConfigSchema } from './agent';
import { z } from 'zod';

// 扩展基本智能体模式，添加模型字段
export const extendedAgentBaseSchema = agentBaseSchema.extend({
  model: z.string().default('gpt-4o').optional(),
});

// 扩展完整智能体配置模式
export const extendedAgentConfigSchema = agentConfigSchema.extend({
  model: z.string().default('gpt-4o').optional(),
});

// 扩展智能体配置类型
export interface ExtendedAgentConfig extends AgentConfig {
  model?: string;
}

// 扩展智能体列表项类型
export interface ExtendedAgentListItem extends AgentListItem {
  model?: string;
  rules?: AgentRule;
  isActive?: boolean;
} 