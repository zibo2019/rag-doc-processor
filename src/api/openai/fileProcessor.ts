import { createOpenAIClient } from './client';
import { AgentConfig } from '@/types/agent';
import { FileInfo } from '@/types/file';
import { checkAPIConfigured } from './client';

/**
 * 带重试的OpenAI API调用
 * @param fn 需要重试的异步函数
 * @param maxRetries 最大重试次数
 * @param delay 重试间隔(ms)
 * @returns 原函数返回值
 */
async function withRetry<T>(fn: () => Promise<T>, maxRetries: number = 3, delay: number = 1000): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // 检查是否是可以重试的错误
      const isRateLimitError = error.message?.includes('rate limit') ||
                               error.message?.includes('429') ||
                               error.message?.includes('too many requests');

      const isServerError = error.message?.includes('500') ||
                            error.message?.includes('502') ||
                            error.message?.includes('503') ||
                            error.message?.includes('504');

      // 如果不是可重试的错误或者已经到达最大重试次数，则抛出
      if ((!isRateLimitError && !isServerError) || attempt === maxRetries) {
        throw error;
      }

      // 计算退避时间（指数退避）
      const backoffDelay = delay * Math.pow(2, attempt);
      console.log(`API请求失败(${error.message})，${attempt + 1}/${maxRetries}次重试，等待${backoffDelay}ms...`);

      // 等待一段时间后重试
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
    }
  }

  // 如果所有重试都失败了，抛出最后一个错误
  throw lastError;
}

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
        role: 'system' as const,
        content: agent.prompt
      },
      {
        role: 'user' as const,
        content: `以下是需要处理的文档内容，请根据指示进行处理：\n\n${content}`
      }
    ];

    // 带重试的API调用
    const response = await withRetry(async () => {
      return await openai.chat.completions.create({
        model: agent.model || 'gpt-3.5-turbo',
        messages: messages,
        temperature: agent.rules.temperature || 0.7,
        max_tokens: agent.rules.maxTokens || 2000,
      });
    }, 3, 1000);  // 3次重试，间隔1秒

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