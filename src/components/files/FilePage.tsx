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
// 引入JSZip和FileSaver
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

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

  // 选中的文件ID列表，分开保存原始文件和处理后文件的选择状态
  const [originalSelectedFiles, setOriginalSelectedFiles] = useState<string[]>([]);
  const [processedSelectedFiles, setProcessedSelectedFiles] = useState<string[]>([]);
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
  const handleFileSelect = (id: string, isProcessed: boolean) => {
    console.log(`选择文件: ${id}, 是处理后文件: ${isProcessed}`); // 添加调试输出
    
    if (isProcessed) {
      // 处理处理后文件的选择
      setProcessedSelectedFiles(prev => {
        const newSelection = prev.includes(id) 
          ? prev.filter(fileId => fileId !== id)
          : [...prev, id];
        console.log(`处理后文件选择更新: `, newSelection); // 添加调试输出
        return newSelection;
      });
    } else {
      // 处理原始文件的选择
      setOriginalSelectedFiles(prev => {
        const newSelection = prev.includes(id) 
          ? prev.filter(fileId => fileId !== id)
          : [...prev, id];
        console.log(`原始文件选择更新: `, newSelection); // 添加调试输出
        return newSelection;
      });
    }
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

    // 确保选择了要处理的文件
    const filesToProcess = originalSelectedFiles.filter(fileId => 
      files.some(file => file.id === fileId)
    );
    
    if (filesToProcess.length === 0) {
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
      total: filesToProcess.length,
      processed: 0,
      success: 0,
      failed: 0,
      completed: false
    });
    
    // 显示处理进度模态框
    setShowProcessingModal(true);

    try {
      // 创建处理任务数组
      const processingTasks = filesToProcess.map(async (fileId) => {
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
          
          // 更新文件状态和错误信息
          updateFile(fileId, {
            status: 'failed',
            error: errorMessage
          });
          
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
          // 清除content字段，将状态重置为有效，同时清除错误信息
          updateFile(file.id, {
            content: undefined,
            status: 'valid',
            error: undefined
          });
        }
      });
      
      notify.success('已清空');
    } else {
      // 清除所有文件，使用clearFiles函数，会在其中显示提示
      clearFiles();
    }
    
    // 清空选择
    setOriginalSelectedFiles([]);
    setProcessedSelectedFiles([]);
  };

  // 处理下载选中的处理后文件
  const handleDownloadFiles = (fileIds: string[]) => {
    // 获取当前状态的所有文件
    const { files } = useFileStore.getState();
    
    // 筛选出要下载的文件
    const filesToDownload = files.filter(file => 
      fileIds.includes(file.id) && file.content !== undefined && file.content !== null
    );
    
    // 如果只有一个文件，直接下载
    if (filesToDownload.length === 1) {
      const file = filesToDownload[0];
      // 创建Blob对象
      const blob = new Blob([file.content || ''], { type: 'text/plain' });
      
      // 设置下载文件名，添加processed后缀
      const fileNameParts = file.name.split('.');
      const extension = fileNameParts.pop() || '';
      const baseName = fileNameParts.join('.');
      const fileName = `${baseName}_processed.${extension}`;
      
      // 下载文件
      saveAs(blob, fileName);
      
      notify.success(`已下载文件: ${fileName}`);
    } 
    // 如果有多个文件，创建ZIP压缩包
    else if (filesToDownload.length > 1) {
      const zip = new JSZip();
      
      // 添加文件到压缩包
      filesToDownload.forEach(file => {
        const fileNameParts = file.name.split('.');
        const extension = fileNameParts.pop() || '';
        const baseName = fileNameParts.join('.');
        const fileName = `${baseName}_processed.${extension}`;
        
        // 将文件内容添加到压缩包
        zip.file(fileName, file.content || '');
      });
      
      // 生成压缩包并下载
      zip.generateAsync({ type: 'blob' })
        .then(content => {
          // 使用当前日期作为压缩包名称的一部分
          const date = new Date();
          const dateStr = `${date.getFullYear()}${(date.getMonth()+1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;
          const timeStr = `${date.getHours().toString().padStart(2, '0')}${date.getMinutes().toString().padStart(2, '0')}`;
          
          // 保存压缩包
          saveAs(content, `处理后文件_${dateStr}_${timeStr}.zip`);
          
          notify.success(`已下载${filesToDownload.length}个文件的压缩包`);
        })
        .catch(error => {
          console.error('创建压缩包失败:', error);
          notify.error('创建压缩包失败，请重试');
        });
    }
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
    <div className="min-h-screen bg-gray-50">
      {/* 处理进度模态框 */}
      <ProcessingModal 
        isOpen={showProcessingModal}
        processingStatus={processingStatus}
        agentName={currentAgent?.name || '智能体'}
        onComplete={handleProcessingComplete}
      />

      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* 主要内容区域 */}
        <div className="space-y-8">
          {/* 文件上传组件 */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <FileUpload
              onFilesSelected={(fileInfos) => {
                addFiles(fileInfos);
              }}
              onFileValidated={updateFile}
              validationConfig={validationConfig}
              className="bg-white"
            />
          </div>

          {/* 智能体选择面板 */}
          <AgentPanel 
              onAgentSelected={() => {
                // 智能体选择后无需额外操作
              }}
            />

          {/* 文件列表 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <FileList
              originalFiles={files}
              processedFiles={files.filter(f => f.content)}
              onRemove={removeFile}
              onCancel={cancelProcessing}
              onRetry={handleProcessSingleFile}
              originalSelectedFiles={originalSelectedFiles}
              processedSelectedFiles={processedSelectedFiles}
              onSelectFile={handleFileSelect}
              onProcessFiles={handleProcessFiles}
              onDownloadFiles={handleDownloadFiles}
              onClearFiles={handleClearFiles}
              onProcessSingleFile={handleProcessSingleFile}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilePage; 