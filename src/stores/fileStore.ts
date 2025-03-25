import { create } from 'zustand';
import { FileInfo, FileValidationConfig } from '../types/file';
import { readFileContent } from '../utils/file';
import { notify } from '../utils/notification';

interface FileStore {
  // 状态
  files: FileInfo[];                    // 文件列表
  isProcessing: boolean;               // 是否正在处理
  currentProcessingCount: number;      // 当前正在处理的文件数量
  validationConfig: FileValidationConfig; // 验证配置

  // 动作
  addFiles: (files: FileInfo[]) => void;
  updateFile: (id: string, updates: Partial<FileInfo>) => void;
  removeFile: (id: string) => void;
  clearFiles: () => void;
  setProcessing: (isProcessing: boolean) => void;
  processFile: (id: string) => Promise<void>;
  cancelProcessing: (id: string) => void;
}

// 默认验证配置
const DEFAULT_VALIDATION_CONFIG: FileValidationConfig = {
  maxFileSize: 2 * 1024 * 1024,        // 2MB
  allowedTypes: ['md', 'txt', 'html'],  // 允许的文件类型
  maxConcurrentUploads: 10             // 增加最大并发数到10
};

export const useFileStore = create<FileStore>((set, get) => ({
  // 初始状态
  files: [],
  isProcessing: false,
  currentProcessingCount: 0,
  validationConfig: DEFAULT_VALIDATION_CONFIG,

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
      notify.success(`已删除文件 "${file.name}"`);
    }
  },

  // 清空文件列表
  clearFiles: () => {
    set({ files: [] });
    notify.success('已清空文件列表');
  },

  // 设置处理状态
  setProcessing: (isProcessing) => {
    set({ isProcessing });
  },

  // 处理文件
  processFile: async (id) => {
    const { files, updateFile, validationConfig } = get();
    const fileInfo = files.find((f) => f.id === id);
    
    if (!fileInfo) {
      notify.error('文件不存在');
      return;
    }
    
    // 检查是否超过最大并发数
    if (get().currentProcessingCount >= validationConfig.maxConcurrentUploads) {
      // 不再显示错误提示，而是等待处理
      updateFile(id, {
        status: 'pending',
        error: '等待处理中...'
      });

      // 等待其他文件处理完成后自动处理
      const checkAndProcess = setInterval(() => {
        if (get().currentProcessingCount < validationConfig.maxConcurrentUploads) {
          clearInterval(checkAndProcess);
          get().processFile(id);
        }
      }, 500);

      return;
    }

    // 更新处理计数
    set((state) => ({
      currentProcessingCount: state.currentProcessingCount + 1
    }));

    // 显示加载提示
    const toastId = notify.loading(`正在处理文件 "${fileInfo.name}"...`);

    try {
      // 更新状态为处理中
      updateFile(id, { status: 'uploading' });

      // 获取原始文件对象
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = fileInput?.files ? Array.from(fileInput.files).find(f => f.name === fileInfo.name) : null;

      if (!file) {
        throw new Error('无法获取文件内容');
      }

      // 读取文件内容
      const fileContent = await readFileContent(file);
      
      // 更新文件内容和状态
      updateFile(id, {
        content: fileContent,
        status: 'completed'
      });

      // 更新提示
      notify.update(toastId, `文件 "${fileInfo.name}" 处理完成`, 'success');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '处理失败';
      updateFile(id, {
        status: 'failed',
        error: errorMessage
      });
      // 更新提示
      notify.update(toastId, `文件 "${fileInfo.name}" ${errorMessage}`, 'error');
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
        error: '用户取消'
      });
      notify.success(`已取消处理文件 "${file.name}"`);
    }
  }
})); 