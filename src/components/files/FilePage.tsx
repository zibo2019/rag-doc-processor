import React, { useState } from 'react';
import { FileUpload } from './FileUpload';
import { FileList } from './FileList';
import { AgentPanel } from '../agents/AgentPanel';
import { useFileStore } from '../../stores/fileStore';
import { useAgentStore } from '../../stores/agentStore';
import { convertToFileInfo } from '../../utils/file';
import clsx from 'clsx';
import { notify } from '../../utils/notification';
import { checkAPIConfigured } from '../../api/openai/client';

// 定义处理任务的结果类型
interface ProcessingTaskResult {
  success: boolean;
  fileId: string;
  error?: string;
  fileName?: string;
}

const FilePage: React.FC = () => {
  const {
    files,
    validationConfig,
    addFiles,
    updateFile,
    removeFile,
    processFile,
    cancelProcessing,
    clearFiles
  } = useFileStore();

  const { currentAgent } = useAgentStore();

  // 选中的文件ID列表
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  // 处理中状态
  const [isProcessing, setIsProcessing] = useState(false);

  // 处理文件选择
  const handleFileSelect = (id: string) => {
    setSelectedFiles(prev => 
      prev.includes(id) 
        ? prev.filter(fileId => fileId !== id)
        : [...prev, id]
    );
  };

  // 处理全选/取消全选
  const handleSelectAll = () => {
    setSelectedFiles(prev => 
      prev.length === files.length 
        ? [] 
        : files.map(file => file.id)
    );
  };

  // 处理单个文件但不显示通知
  const processFileWithoutNotification = async (fileId: string): Promise<void> => {
    try {
      // 更新文件状态为处理中
      updateFile(fileId, { status: 'uploading' });
      
      // 调用processFile并传入false表示不显示通知
      return await processFile(fileId, false);
    } catch (error) {
      console.error('处理文件失败:', error);
      throw error;
    }
  };

  // 处理选中文件的函数
  const handleProcessFiles = async () => {
    // 验证是否选择了文件和智能体
    if (!currentAgent) {
      notify.error('请先选择一个智能体');
      return;
    }

    if (selectedFiles.length === 0) {
      notify.error('请选择至少一个文件');
      return;
    }

    // 检查API是否已配置
    if (!checkAPIConfigured()) {
      notify.error('OpenAI API 尚未配置，请在设置中配置API密钥');
      return;
    }

    // 设置处理中状态
    setIsProcessing(true);

    try {
      // 显示处理中的提示，只显示一条全局通知
      const toastId = notify.loading(`正在使用"${currentAgent.name}"处理${selectedFiles.length}个文件...`);
      
      // 创建处理任务数组，但不要在处理单个文件时创建单独的通知
      const processingTasks = selectedFiles.map(async (fileId) => {
        try {
          // 获取文件信息
          const file = files.find(f => f.id === fileId);
          
          // 处理文件但不显示通知
          await processFileWithoutNotification(fileId);
          
          return { success: true, fileId, fileName: file?.name } as ProcessingTaskResult;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '处理失败';
          console.error(`处理文件 ${fileId} 失败:`, errorMessage);
          return { success: false, fileId, error: errorMessage } as ProcessingTaskResult;
        }
      });
      
      // 并行处理所有文件
      const results = await Promise.allSettled(processingTasks);
      
      // 统计处理结果
      const successCount = results.filter(
        r => r.status === 'fulfilled' && (r.value as ProcessingTaskResult).success
      ).length;
      const failCount = selectedFiles.length - successCount;
      
      // 更新处理结果提示
      if (failCount === 0) {
        notify.update(toastId, `已成功处理 ${successCount} 个文件`, 'success');
      } else {
        notify.update(toastId, `处理完成: ${successCount} 成功, ${failCount} 失败`, 'warning');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '处理失败';
      notify.error(`批量处理文件时发生错误: ${errorMessage}`);
    } finally {
      // 重置处理中状态
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto px-4">
      {/* 标题 */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-blue-800">
          AI文档批量处理器
        </h1>
        <p className="mt-2 text-blue-600">
          支持上传 MD、TXT、HTML 格式的文件进行处理
        </p>
      </div>

      {/* 文件上传组件 */}
      <div className="mb-6">
        <FileUpload
          onFilesSelected={async (files) => {
            const fileInfoPromises = Array.from(files).map(file => convertToFileInfo(file));
            const fileInfos = await Promise.all(fileInfoPromises);
            addFiles(fileInfos);
          }}
          onFileValidated={updateFile}
          validationConfig={validationConfig}
          className="bg-white shadow-lg"
        />
      </div>

      {/* 智能体选择面板 */}
      <div className="mb-6">
        <AgentPanel 
          onAgentSelected={() => {
            // 智能体选择后无需额外操作，由AgentPanel组件内部更新state
          }}
        />
      </div>

      {/* 文件列表和操作按钮 */}
      <div className="space-y-4 bg-white p-6 rounded-lg shadow-lg">
        <div className="flex justify-between items-center">
          <div className="flex space-x-3">
            <button
              className={clsx(
                "px-6 py-2.5 rounded-full font-medium transition-all duration-200 shadow-sm",
                selectedFiles.length > 0 && currentAgent && !isProcessing
                  ? "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md"
                  : "bg-blue-100 text-blue-300 cursor-not-allowed"
              )}
              onClick={handleProcessFiles}
              disabled={selectedFiles.length === 0 || !currentAgent || isProcessing}
            >
              {isProcessing 
                ? "处理中..." 
                : `处理选中文件 (${selectedFiles.length})`
              }
            </button>
            <button
              className="px-6 py-2.5 bg-blue-500 text-white rounded-full font-medium hover:bg-blue-600 transition-all duration-200 shadow-sm hover:shadow-md"
              onClick={handleSelectAll}
            >
              {selectedFiles.length === files.length ? '取消全选' : '全选'}
            </button>
          </div>
          <button
            className="px-4 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full transition-all duration-200"
            onClick={() => {
              clearFiles();
              setSelectedFiles([]);
            }}
          >
            清空列表
          </button>
        </div>

        <FileList
          originalFiles={files}  // 传递所有文件作为原始文件
          processedFiles={files.filter(file => file.content)}  // 已处理的文件
          selectedFiles={selectedFiles}
          onSelectFile={handleFileSelect}
          onRemove={(id) => {
            removeFile(id);
            setSelectedFiles(prev => prev.filter(fileId => fileId !== id));
          }}
          onCancel={cancelProcessing}
          onRetry={processFile}
        />
      </div>
    </div>
  );
};

export default FilePage; 