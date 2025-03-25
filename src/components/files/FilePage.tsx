import React, { useState } from 'react';
import { FileUpload } from './FileUpload';
import { FileList } from './FileList';
import { AgentPanel } from '../agents/AgentPanel';
import { useFileStore } from '../../stores/fileStore';
import { useAgentStore } from '../../stores/agentStore';
import { notify } from '../../utils/notification';
import { checkAPIConfigured } from '../../api/openai/client';
import { AgentConfig } from '../../types/agent';
import { ExtendedAgentConfig, ExtendedAgentListItem } from '../../types/agentExtend';
import { ProcessingModal, ProcessingStatus } from '../processing/ProcessingModal';

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
  } = useFileStore();

  const { currentAgent, selectedAgentId } = useAgentStore();

  // 选中的文件ID列表
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  // 处理进度模态框状态
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  // 处理进度状态
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>({
    total: 0,
    processed: 0,
    success: 0,
    failed: 0,
    completed: false
  });

  // 处理文件选择
  const handleFileSelect = (id: string) => {
    setSelectedFiles(prev => 
      prev.includes(id) 
        ? prev.filter(fileId => fileId !== id)
        : [...prev, id]
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

  // 处理完成后点击"完成"按钮的回调
  const handleProcessingComplete = () => {
    // 关闭模态框
    setShowProcessingModal(false);
    
    // 显示处理结果通知，简化内容
    const { success, failed } = processingStatus;
    if (failed > 0) {
      // 只在有失败的情况下显示提示
      notify.warning(`完成：${success}/${failed+success}`);
    }
  };

  // 处理选中文件的函数
  const handleProcessFiles = async () => {
    // 验证是否选择了文件和智能体
    if (!selectedAgentId) {
      notify.error('请先选择智能体');
      return;
    }

    if (selectedFiles.length === 0) {
      notify.error('请选择文件');
      return;
    }

    // 检查API是否已配置
    if (!checkAPIConfigured()) {
      notify.error('请配置API密钥');
      return;
    }

    // 确保currentAgent存在
    if (!currentAgent && selectedAgentId) {
      // 获取当前选中的智能体
      const { agents, setCurrentAgent } = useAgentStore.getState();
      const selectedAgent = agents.find(a => a.id === selectedAgentId);
      
      if (selectedAgent) {
        // 将AgentListItem转换为ExtendedAgentConfig
        const agentConfig: ExtendedAgentConfig = {
          id: selectedAgent.id,
          name: selectedAgent.name,
          prompt: selectedAgent.prompt || '', // 确保有默认值
          description: selectedAgent.description,
          createdAt: selectedAgent.createdAt,
          updatedAt: selectedAgent.updatedAt,
          // 添加模型字段，如果存在则使用，否则使用默认值
          model: (selectedAgent as ExtendedAgentListItem).model || 'gpt-3.5-turbo',
          // 添加缺失的必要字段
          rules: {
            maxTokens: 8192,
            temperature: 0.7
          },
          isActive: true
        };
        
        setCurrentAgent(agentConfig as AgentConfig);
      } else {
        notify.error('无法获取智能体信息');
        return;
      }
    }
    
    // 初始化处理状态
    setProcessingStatus({
      total: selectedFiles.length,
      processed: 0,
      success: 0,
      failed: 0,
      completed: false
    });
    
    // 显示处理进度模态框
    setShowProcessingModal(true);

    try {
      // 创建处理任务数组
      const processingTasks = selectedFiles.map(async (fileId) => {
        try {
          // 获取文件信息
          const file = files.find(f => f.id === fileId);
          
          // 处理文件但不显示通知
          await processFileWithoutNotification(fileId);
          
          // 更新处理状态
          setProcessingStatus(prev => ({
            ...prev,
            processed: prev.processed + 1,
            success: prev.success + 1
          }));
          
          return { success: true, fileId, fileName: file?.name } as ProcessingTaskResult;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '处理失败';
          console.error(`处理文件 ${fileId} 失败:`, errorMessage);
          
          // 更新处理状态
          setProcessingStatus(prev => ({
            ...prev,
            processed: prev.processed + 1,
            failed: prev.failed + 1
          }));
          
          return { success: false, fileId, error: errorMessage } as ProcessingTaskResult;
        }
      });
      
      // 并行处理所有文件
      await Promise.allSettled(processingTasks);
      
      // 设置处理完成状态
      setProcessingStatus(prev => ({
        ...prev,
        completed: true
      }));
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '处理失败';
      // 关闭模态框并显示错误提示
      setShowProcessingModal(false);
      notify.error(`批量处理失败: ${errorMessage}`);
    }
  };

  // 处理清空文件列表或处理结果
  const handleClearFiles = (isProcessed: boolean) => {
    // 获取当前状态的所有文件
    const { files, updateFile, clearFiles } = useFileStore.getState();
    
    if (isProcessed) {
      // 如果是处理后文件列表，只清除处理结果，不删除文件
      files.forEach(file => {
        if (file.content !== undefined && file.content !== null && file.content !== '') {
          // 清除content字段，将状态重置为有效
          updateFile(file.id, {
            content: undefined,
            status: 'valid'
          });
        }
      });
      
      notify.success('已清空');
    } else {
      // 清除所有文件，使用clearFiles函数，会在其中显示提示
      clearFiles();
    }
    
    // 清空选择
    setSelectedFiles([]);
  };

  // 处理下载选中的处理后文件
  const handleDownloadFiles = (fileIds: string[]) => {
    // 获取当前状态的所有文件
    const { files } = useFileStore.getState();
    
    // 筛选出要下载的文件
    const filesToDownload = files.filter(file => 
      fileIds.includes(file.id) && file.content !== undefined && file.content !== null
    );
    
    // 下载每个选中的文件
    filesToDownload.forEach(file => {
      // 创建Blob对象
      const blob = new Blob([file.content || ''], { type: 'text/plain' });
      
      // 创建下载链接
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // 设置下载文件名，添加processed后缀
      const fileNameParts = file.name.split('.');
      const extension = fileNameParts.pop() || '';
      const baseName = fileNameParts.join('.');
      a.download = `${baseName}_processed.${extension}`;
      
      // 触发下载
      document.body.appendChild(a);
      a.click();
      
      // 清理
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  };

  // 处理单个文件的函数
  const handleProcessSingleFile = async (fileId: string) => {
    // 验证是否选择了智能体
    if (!selectedAgentId) {
      notify.error('请先选择智能体');
      return;
    }

    // 检查API是否已配置
    if (!checkAPIConfigured()) {
      notify.error('请配置API密钥');
      return;
    }

    // 确保currentAgent存在
    if (!currentAgent && selectedAgentId) {
      // 获取当前选中的智能体
      const { agents, setCurrentAgent } = useAgentStore.getState();
      const selectedAgent = agents.find(a => a.id === selectedAgentId);
      
      if (selectedAgent) {
        // 将AgentListItem转换为ExtendedAgentConfig
        const agentConfig: ExtendedAgentConfig = {
          id: selectedAgent.id,
          name: selectedAgent.name,
          prompt: selectedAgent.prompt || '', // 确保有默认值
          description: selectedAgent.description,
          createdAt: selectedAgent.createdAt,
          updatedAt: selectedAgent.updatedAt,
          // 添加模型字段，如果存在则使用，否则使用默认值
          model: (selectedAgent as ExtendedAgentListItem).model || 'gpt-3.5-turbo',
          // 添加缺失的必要字段
          rules: {
            maxTokens: 2048,
            temperature: 0.7
          },
          isActive: true
        };
        
        setCurrentAgent(agentConfig as AgentConfig);
      } else {
        notify.error('无法获取智能体信息');
        return;
      }
    }

    // 直接调用processFile函数处理单个文件，显示通知
    try {
      await processFile(fileId, true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '处理失败';
      notify.error(`处理失败: ${errorMessage}`);
    }
  };

  return (
    <div className="container mx-auto px-4">
      {/* 处理进度模态框 */}
      <ProcessingModal 
        isOpen={showProcessingModal}
        processingStatus={processingStatus}
        agentName={currentAgent?.name || '智能体'}
        onComplete={handleProcessingComplete}
      />

      {/* 标题 */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-blue-800">
          AI文档批量处理器
        </h1>
        <p className="mt-2 text-blue-600">
          支持上传各种格式的文件进行处理，文件大小限制为200KB
        </p>
      </div>

      {/* 文件上传组件 */}
      <div className="mb-6">
        <FileUpload
          onFilesSelected={(fileInfos) => {
            // 直接添加FileInfo数组
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

      {/* 文件列表 */}
      <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
        <FileList
          originalFiles={files} // 显示所有原始文件
          processedFiles={files.filter(file => file.content !== undefined && file.content !== null && file.content !== '')}
          onRemove={removeFile}
          onCancel={cancelProcessing}
          onRetry={(id) => processFile(id)}
          selectedFiles={selectedFiles}
          onSelectFile={handleFileSelect}
          onProcessFiles={handleProcessFiles}
          onDownloadFiles={handleDownloadFiles}
          onClearFiles={handleClearFiles}
          onProcessSingleFile={handleProcessSingleFile}
          className="mt-4"
        />
      </div>
    </div>
  );
};

export default FilePage; 