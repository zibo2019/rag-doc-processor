import { createOpenAIClient } from './client';
import { AgentConfig } from '@/types/agent';
import { FileInfo } from '@/types/file';
import { checkAPIConfigured } from './client';

/**
 * 使用OpenAI处理文件内容
 * @param fileInfo - 文件信息
 * @param agent - 智能体配置
 * @returns 处理后的文件内容
 */
export const processFileWithOpenAI = async (
  fileInfo: FileInfo,
  agent: AgentConfig
): Promise<string> => {
  // 检查API是否已配置
  if (!checkAPIConfigured()) {
    throw new Error('OpenAI API 尚未配置，请在设置中配置API密钥');
  }

  try {
    // 创建OpenAI客户端
    const openai = createOpenAIClient();
    
    // 获取文件原始内容
    const content = fileInfo.rawContent;
    if (!content) {
      throw new Error('文件内容为空');
    }

    // 构建完整的提示词
    const messages = [
      {
        role: 'system',
        content: agent.prompt
      },
      {
        role: 'user',
        content: `以下是需要处理的文档内容，请根据指示进行处理：\n\n${content}`
      }
    ];

    // 调用OpenAI API
    const response = await openai.chat.completions.create({
      model: agent.model || 'gpt-3.5-turbo',
      messages: messages,
      temperature: agent.rules.temperature || 0.7,
      max_tokens: agent.rules.maxTokens || 2000,
    });

    // 获取处理结果
    const processedContent = response.choices[0]?.message?.content;
    
    if (!processedContent) {
      throw new Error('API返回的处理结果为空');
    }

    return processedContent;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`处理文件失败: ${error.message}`);
    }
    throw new Error('处理文件时发生未知错误');
  }
}; 