import OpenAI from 'openai';
import { useConfigStore } from '@/stores/configStore';

// 创建OpenAI客户端实例
export const createOpenAIClient = () => {
  const { baseUrl, apiKey, isConfigured } = useConfigStore.getState();
  
  if (!isConfigured) {
    throw new Error('OpenAI API 尚未配置，请在设置中配置API密钥');
  }
  
  return new OpenAI({
    apiKey: apiKey,
    baseURL: baseUrl,
    dangerouslyAllowBrowser: true, // 允许在浏览器环境中使用
  });
};

// 检查API配置状态
export const checkAPIConfigured = (): boolean => {
  const { isConfigured } = useConfigStore.getState();
  return isConfigured;
};

// 获取当前API配置
export const getAPIConfig = () => {
  const { baseUrl, apiKey, isConfigured } = useConfigStore.getState();
  return {
    baseUrl,
    apiKey: apiKey ? '已配置' : '未配置', // 不返回实际的API密钥
    isConfigured
  };
}; 