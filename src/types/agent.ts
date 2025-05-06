import { z } from 'zod';

// 智能体基本信息的验证模式
export const agentBaseSchema = z.object({
  id: z.string().optional(), // 新建时可选
  name: z.string().min(2, '名称至少需要2个字符').max(50, '名称不能超过50个字符'),
  prompt: z.string().min(1, '提示词不能为空').max(8192, '提示词不能超过8192个字符'),
  description: z.string().max(200, '描述不能超过200个字符').optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  model: z.string().default('gpt-3.5-turbo').optional(), // 添加模型字段
});

// 智能体处理规则的验证模式
export const agentRuleSchema = z.object({
  maxTokens: z.number().min(100), // token 限制
  temperature: z.number().min(0).max(1), // 温度参数
});

// 完整的智能体配置验证模式
export const agentConfigSchema = agentBaseSchema.extend({
  rules: agentRuleSchema,
  isActive: z.boolean().default(true),
});

// 从验证模式生成类型
export type AgentBase = z.infer<typeof agentBaseSchema>;
export type AgentRule = z.infer<typeof agentRuleSchema>;
export type AgentConfig = z.infer<typeof agentConfigSchema>;

// 智能体状态枚举
export enum AgentStatus {
  IDLE = 'idle',
  PROCESSING = 'processing',
  SUCCESS = 'success',
  ERROR = 'error',
}

// 智能体列表项类型
export interface AgentListItem extends AgentBase {
  status: AgentStatus;
  lastUsed?: Date;
}