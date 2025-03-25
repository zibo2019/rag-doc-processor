import React, { useState } from 'react';
import { FileUpload } from './FileUpload';
import { FileList } from './FileList';
import { AgentPanel } from '../agents/AgentPanel';
import { useFileStore } from '../../stores/fileStore';
import { useAgentStore } from '../../stores/agentStore';
import { convertToFileInfo } from '../../utils/file';
import clsx from 'clsx';
import { notify } from '../../utils/notification';

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

  const { currentAgent, agents, selectedAgentId, setSelectedAgentId } = useAgentStore();

  // 选中的文件ID列表
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

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

  // 处理选中文件的函数
  const handleProcessFiles = () => {
    if (!currentAgent || selectedFiles.length === 0) {
      notify.error('请选择至少一个文件和一个智能体');
      return;
    }

    // 显示处理中的提示
    const toastId = notify.loading(`正在使用"${currentAgent.name}"处理${selectedFiles.length}个文件...`);

    // 逐个处理选中的文件
    selectedFiles.forEach(fileId => {
      processFile(fileId);
    });

    // 显示处理完成的提示
    notify.update(toastId, `已开始处理${selectedFiles.length}个文件`, 'success');
  };

  return (
    <div className="container mx-auto px-4">
      {/* 标题 */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-blue-800">
          文档处理器
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
          onAgentSelected={(agentId) => {
            // 只更新全局状态中的selectedAgentId，不显示通知
            setSelectedAgentId(agentId);
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
                selectedFiles.length > 0 && currentAgent
                  ? "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md"
                  : "bg-blue-100 text-blue-300 cursor-not-allowed"
              )}
              onClick={handleProcessFiles}
              disabled={selectedFiles.length === 0 || !currentAgent}
            >
              处理选中文件 ({selectedFiles.length})
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
          originalFiles={files.filter(file => !file.content)}  // 未处理的文件
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