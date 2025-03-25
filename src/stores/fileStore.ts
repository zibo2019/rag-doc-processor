import { create } from 'zustand';
import { FileInfo, FileValidationConfig } from '../types/file';
import { readFileContent } from '../utils/file';
import { notify } from '../utils/notification';
import { useAgentStore } from './agentStore';
import { processFileWithOpenAI } from '../api/openai/fileProcessor';
import { checkAPIConfigured } from '../api/openai/client';

interface FileStore {
  // 状态
  files: FileInfo[];                    // 文件列表
  isProcessing: boolean;               // 是否正在处理
  currentProcessingCount: number;      // 当前正在处理的文件数量
  validationConfig: FileValidationConfig; // 验证配置
  maxConcurrentProcessing: number;     // 最大并行处理数量

  // 动作
  addFiles: (files: FileInfo[]) => void;
  updateFile: (id: string, updates: Partial<FileInfo>) => void;
  removeFile: (id: string) => void;
  clearFiles: () => void;
  setProcessing: (isProcessing: boolean) => void;
  processFile: (id: string, showNotification?: boolean) => Promise<void>;
  cancelProcessing: (id: string) => void;
  updateValidationConfig: (config: Partial<FileValidationConfig>) => void;
}

// 默认验证配置
const DEFAULT_VALIDATION_CONFIG: FileValidationConfig = {
  maxFileSize: 200 * 1024,        // 200KB
  allowedTypes: [],               // 不限制文件类型
  maxConcurrentUploads: 10,       // 增加最大并发数到10
  autoSplitFiles: true,           // 默认启用自动分割
  splitOverlapPercent: 8,         // 8%的重叠
  maxChunkSize: 2000              // 分块大小为2000个token（约8000字符）
};

export const useFileStore = create<FileStore>((set, get) => ({
  // 初始状态
  files: [],
  isProcessing: false,
  currentProcessingCount: 0,
  maxConcurrentProcessing: 5, // 设置最大并行处理数量为5
  validationConfig: {
    maxFileSize: 200 * 1024,        // 200KB
    allowedTypes: [],               // 不限制文件类型
    maxConcurrentUploads: 5,
    autoSplitFiles: true,           // 默认启用自动分割
    splitOverlapPercent: 8,         // 8%的重叠
    maxChunkSize: 2000              // 分块大小为2000个token（约8000字符）
  },

  // 添加文件
  addFiles: (newFiles) => {
    set((state) => ({
      files: [...state.files, ...newFiles]
    }));
  },

  // 更新文件
  updateFile: (id, updates) => {
    set((state) => ({
      files: state.files.map((file) =>
        file.id === id ? { ...file, ...updates } : file
      )
    }));
  },

  // 移除文件
  removeFile: (id) => {
    const { files } = get();
    const file = files.find(f => f.id === id);
    if (file) {
      set((state) => ({
        files: state.files.filter((f) => f.id !== id)
      }));
    }
  },

  // 清空文件列表
  clearFiles: () => {
    set({ files: [] });
    notify.success('已清空');
  },

  // 设置处理状态
  setProcessing: (isProcessing) => {
    set({ isProcessing });
  },

  // 处理文件
  processFile: async (id, showNotification = true) => {
    const { files, updateFile, maxConcurrentProcessing } = get();
    const fileInfo = files.find((f) => f.id === id);
    
    if (!fileInfo) {
      if (showNotification) notify.error('文件不存在');
      return;
    }
    
    // 获取当前选中的智能体
    const { currentAgent } = useAgentStore.getState();
    
    if (!currentAgent) {
      if (showNotification) notify.error('请先选择智能体');
      return;
    }
    
    // 检查API是否已配置
    if (!checkAPIConfigured()) {
      if (showNotification) notify.error('请配置API密钥');
      updateFile(id, {
        status: 'failed',
        error: 'API未配置'
      });
      return;
    }
    
    // 检查是否超过最大并发数
    if (get().currentProcessingCount >= maxConcurrentProcessing) {
      // 更新文件状态为等待中，但不显示提示
      updateFile(id, {
        status: 'pending',
        error: '等待处理...'
      });

      // 创建一个Promise来等待处理槽位
      return new Promise<void>((resolve) => {
        const checkAndProcess = setInterval(() => {
          if (get().currentProcessingCount < maxConcurrentProcessing) {
            clearInterval(checkAndProcess);
            // 递归调用processFile
            resolve(get().processFile(id, showNotification));
          }
        }, 500);
      });
    }

    // 更新处理计数
    set((state) => ({
      currentProcessingCount: state.currentProcessingCount + 1
    }));

    // 显示加载提示
    const toastId = showNotification ? notify.loading(`处理中...`) : null;

    try {
      // 更新状态为处理中
      updateFile(id, { 
        status: 'uploading',
        error: undefined // 清除之前的错误信息
      });

      // 确保文件内容已加载
      if (!fileInfo.rawContent) {
        // 获取原始文件对象
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        const file = fileInput?.files ? Array.from(fileInput.files).find(f => f.name === fileInfo.name) : null;

        if (!file) {
          throw new Error('无法获取内容');
        }

        // 读取文件内容
        const fileContent = await readFileContent(file);
        updateFile(id, { rawContent: fileContent });
        fileInfo.rawContent = fileContent;
      }
      
      // 使用OpenAI API处理文件内容
      const processedContent = await processFileWithOpenAI(fileInfo, currentAgent);
      
      // 更新文件内容和状态
      updateFile(id, {
        content: processedContent,
        status: 'completed',
        error: undefined // 清除错误信息
      });

      // 更新提示，只在单独处理时显示完成提示
      if (showNotification && toastId) {
        notify.update(toastId, `处理完成`, 'success');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '处理失败';
      updateFile(id, {
        status: 'failed',
        error: errorMessage // 确保错误信息设置正确
      });
      // 更新提示，错误情况一定要提示
      if (showNotification && toastId) {
        notify.update(toastId, `处理失败`, 'error');
      }
    } finally {
      // 更新处理计数
      set((state) => ({
        currentProcessingCount: state.currentProcessingCount - 1
      }));
    }
  },

  // 取消处理
  cancelProcessing: (id) => {
    const { updateFile, files } = get();
    const file = files.find(f => f.id === id);
    if (file) {
      updateFile(id, {
        status: 'failed',
        error: '已取消'
      });
      // 取消处理不显示提示
    }
  },

  // 更新验证配置
  updateValidationConfig: (config) => {
    set((state) => ({
      validationConfig: { ...state.validationConfig, ...config }
    }));
  }
})); 