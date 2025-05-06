import { create } from 'zustand';
import { FileInfo, FileValidationConfig } from '../types/file';
import { readFileContent } from '../utils/file';
import { notify } from '../utils/notification';
import { useAgentStore } from './agentStore';
import { processFileWithOpenAI } from '../api/openai/fileProcessor';
import { checkAPIConfigured } from '../api/openai/client';

// 添加处理队列类型
interface ProcessQueue {
  pendingFiles: string[];  // 等待处理的文件ID队列
  isProcessing: boolean;   // 队列是否正在处理
}

interface FileStore {
  // 状态
  files: FileInfo[];                    // 文件列表
  isProcessing: boolean;               // 是否正在处理
  currentProcessingCount: number;      // 当前正在处理的文件数量
  validationConfig: FileValidationConfig; // 验证配置
  maxConcurrentProcessing: number;     // 最大并行处理数量
  processQueue: ProcessQueue;          // 处理队列

  // 动作
  addFiles: (files: FileInfo[]) => void;
  updateFile: (id: string, updates: Partial<FileInfo>) => void;
  removeFile: (id: string) => void;
  clearFiles: () => void;
  setProcessing: (isProcessing: boolean) => void;
  processFile: (id: string, showNotification?: boolean) => Promise<void>;
  cancelProcessing: (id: string) => void;
  updateValidationConfig: (config: Partial<FileValidationConfig>) => void;
  // 新增方法
  processNextInQueue: () => Promise<void>;
  checkAndFillQueue: () => void;
  // 初始化方法
  initializeProcessingQueue: () => void;
}

// 默认验证配置（注意：此常量已不再使用，配置直接在初始状态中定义）
// const DEFAULT_VALIDATION_CONFIG: FileValidationConfig = {
//   maxFileSize: 200 * 1024,        // 200KB
//   allowedTypes: [],               // 不限制文件类型
//   maxConcurrentUploads: 10,       // 增加最大并发数到10
//   autoSplitFiles: true,           // 默认启用自动分割
//   splitOverlapPercent: 8,         // 8%的重叠
//   maxChunkSize: 2000              // 分块大小为2000个token（约8000字符）
// };

export const useFileStore = create<FileStore>((set, get) => ({
  // 初始状态
  files: [],
  isProcessing: false,
  currentProcessingCount: 0,
  maxConcurrentProcessing: 5, // 设置最大并行处理数量为5
  processQueue: {
    pendingFiles: [],
    isProcessing: false
  },
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

  // 检查并填充处理队列
  checkAndFillQueue: () => {
    const { processQueue, currentProcessingCount, maxConcurrentProcessing } = get();

    // 如果有待处理的任务并且处理槽位有空闲，则立即启动处理
    if (processQueue.pendingFiles.length > 0 && currentProcessingCount < maxConcurrentProcessing) {
      // 计算可以填充的任务数量
      const availableSlots = maxConcurrentProcessing - currentProcessingCount;
      const tasksToProcess = Math.min(availableSlots, processQueue.pendingFiles.length);

      console.log(`检测到空闲处理槽位: ${availableSlots}, 启动${tasksToProcess}个任务`);

      // 立即启动处理下一个任务
      get().processNextInQueue();
    }
  },

  // 处理队列中的下一个文件
  processNextInQueue: async () => {
    const { processQueue, maxConcurrentProcessing, currentProcessingCount } = get();

    // 检查是否有待处理的文件，并且没有超过最大并发数
    if (processQueue.pendingFiles.length > 0 && currentProcessingCount < maxConcurrentProcessing) {
      // 获取队列中的下一个文件
      const nextFileId = processQueue.pendingFiles[0];

      // 从队列中移除该文件
      set((state) => ({
        processQueue: {
          ...state.processQueue,
          pendingFiles: state.processQueue.pendingFiles.slice(1)
        }
      }));

      // 处理该文件（不显示通知）
      try {
        await get().processFile(nextFileId, false);
      } catch (error) {
        console.error(`处理队列中的文件 ${nextFileId} 失败:`, error);
      }

      // 继续检查是否可以处理更多文件
      // 注意：这里不再递归调用，而是在完成处理后再检查队列状态
      setTimeout(() => {
        get().checkAndFillQueue();
      }, 100);
    } else if (processQueue.pendingFiles.length === 0) {
      // 队列已清空，设置处理状态为false
      set((state) => ({
        processQueue: {
          ...state.processQueue,
          isProcessing: false
        }
      }));
    }
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
      // 更新文件状态为等待中
      updateFile(id, {
        status: 'pending',
        error: '等待处理...'
      });

      // 添加到处理队列
      set((state) => ({
        processQueue: {
          pendingFiles: [...state.processQueue.pendingFiles, id],
          isProcessing: true
        }
      }));

      return;
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
        error: undefined, // 清除错误信息
        // 重新计算处理后的文件大小（以字节为单位）
        size: new Blob([processedContent]).size
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

      // 立即检查是否有等待中的文件需要处理
      setTimeout(() => {
        get().checkAndFillQueue();
      }, 50);
    }
  },

  // 取消处理
  cancelProcessing: (id) => {
    const { updateFile, files } = get();
    const file = files.find(f => f.id === id);
    if (file) {
      // 如果文件在处理队列中，则从队列中移除
      set((state) => ({
        processQueue: {
          ...state.processQueue,
          pendingFiles: state.processQueue.pendingFiles.filter(fileId => fileId !== id)
        }
      }));

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
  },

  // 初始化处理队列
  initializeProcessingQueue: () => {
    const { processQueue, files } = get();

    // 重置处理中的文件状态
    files.forEach(file => {
      if (file.status === 'uploading') {
        // 将正在处理的文件重置为等待状态
        get().updateFile(file.id, {
          status: 'pending',
          error: '处理被中断，等待重新处理...'
        });

        // 添加到处理队列
        if (!processQueue.pendingFiles.includes(file.id)) {
          set((state) => ({
            processQueue: {
              ...state.processQueue,
              pendingFiles: [...state.processQueue.pendingFiles, file.id]
            }
          }));
        }
      }
    });

    // 如果队列中有待处理的文件，设置队列为处理中状态
    if (processQueue.pendingFiles.length > 0) {
      set((state) => ({
        processQueue: {
          ...state.processQueue,
          isProcessing: true
        }
      }));

      // 检查并填充处理队列
      setTimeout(() => {
        get().checkAndFillQueue();
      }, 200);
    }
  }
}));