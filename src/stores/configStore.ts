import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ConfigState {
  baseUrl: string;
  apiKey: string;
  isConfigured: boolean;
  setBaseUrl: (url: string) => void;
  setApiKey: (key: string) => void;
  setConfig: (config: { baseUrl: string; apiKey: string }) => void;
  resetConfig: () => void;
}

// 默认配置
const DEFAULT_BASE_URL = 'https://api.openai.com/v1';

export const useConfigStore = create<ConfigState>()(
  persist(
    (set) => ({
      baseUrl: DEFAULT_BASE_URL,
      apiKey: '',
      isConfigured: false,
      
      setBaseUrl: (baseUrl: string) => set({ baseUrl }),
      
      setApiKey: (apiKey: string) => set({ 
        apiKey,
        isConfigured: apiKey.trim() !== '' 
      }),
      
      setConfig: ({ baseUrl, apiKey }) => set({ 
        baseUrl: baseUrl || DEFAULT_BASE_URL,
        apiKey,
        isConfigured: apiKey.trim() !== '' 
      }),
      
      resetConfig: () => set({ 
        baseUrl: DEFAULT_BASE_URL, 
        apiKey: '',
        isConfigured: false 
      }),
    }),
    {
      name: 'rag-processor-config',
      // 加密存储API密钥（简单加密，实际应用可能需要更高级加密）
      partialize: (state) => ({
        baseUrl: state.baseUrl,
        apiKey: state.apiKey ? btoa(state.apiKey) : '',
        isConfigured: state.isConfigured
      }),
      // 解密存储的API密钥
      onRehydrateStorage: () => (state) => {
        if (state && state.apiKey) {
          try {
            state.apiKey = atob(state.apiKey);
          } catch (e) {
            console.error('无法解析加密的API密钥');
            state.apiKey = '';
            state.isConfigured = false;
          }
        }
      }
    }
  )
); 