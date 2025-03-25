import React, { useState } from 'react';
import { FileInfo } from '../../types/file';
import clsx from 'clsx';
import { FilePreview } from './FilePreview';

interface FileListProps {
  originalFiles: FileInfo[];  // 原始文件列表
  processedFiles: FileInfo[]; // 处理后的文件列表
  onRemove: (id: string) => void;
  onCancel: (id: string) => void;
  onRetry: (id: string) => void;
  selectedFiles?: string[];
  onSelectFile?: (id: string) => void;
  onProcessFiles?: () => void; // 处理选中文件的回调
  onDownloadFiles?: (ids: string[]) => void; // 下载选中文件的回调
  onClearFiles?: (isProcessed: boolean) => void; // 清空文件列表的回调
  onProcessSingleFile?: (id: string) => void; // 处理单个文件的回调
  className?: string;
}

/**
 * 格式化文件大小
 */
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * 获取状态标签样式
 */
const getStatusStyle = (status: FileInfo['status']) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'failed':
      return 'bg-red-100 text-red-800';
    case 'uploading':
      return 'bg-blue-100 text-blue-800';
    case 'pending':
      return 'bg-gray-100 text-gray-800';
    case 'validating':
      return 'bg-yellow-100 text-yellow-800';
    case 'valid':
      return 'bg-green-100 text-green-800';
    case 'invalid':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

/**
 * 获取状态文本
 */
const getStatusText = (status: FileInfo['status']): string => {
  const statusMap: Record<FileInfo['status'], string> = {
    pending: '等待处理',
    validating: '验证中',
    valid: '已上传',
    invalid: '验证失败',
    uploading: '处理中',
    completed: '已完成',
    failed: '失败'
  };
  return statusMap[status];
};

/**
 * 文件列表项组件
 */
const FileListItem: React.FC<{
  file: FileInfo;
  onRemove: (id: string) => void;
  onCancel: (id: string) => void;
  onRetry: (id: string) => void;
  onPreview: (file: FileInfo) => void;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  isProcessedView?: boolean; // 新增参数，标识是否为处理后视图
  onProcessSingle?: (id: string) => void; // 单个文件处理函数
  onDownloadSingle?: (id: string) => void; // 单个文件下载函数
}> = ({ file, onRemove, onCancel, onRetry, onPreview, isSelected, onSelect, isProcessedView, onProcessSingle, onDownloadSingle }) => (
  <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200">
    {/* 选择框 */}
    {onSelect && (
      <div className="mr-4">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect(file.id)}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
      </div>
    )}

    {/* 文件信息 */}
    <div 
      className="flex-1 min-w-0 mr-4 cursor-pointer"
      onClick={() => onPreview(file)}
    >
      <div className="flex items-center">
        <h3 className="text-sm font-medium text-gray-900 truncate">
          {file.name}
        </h3>
        <span
          className={clsx(
            'ml-2 px-2 py-0.5 text-xs rounded-full',
            getStatusStyle(file.status)
          )}
        >
          {getStatusText(file.status)}
        </span>
        {isProcessedView && (
          <span className="ml-2 px-2 py-0.5 text-xs bg-indigo-100 text-indigo-800 rounded-full">
            处理后
          </span>
        )}
      </div>
      <div className="mt-1 flex items-center text-sm text-gray-500">
        <span>{formatFileSize(file.size)}</span>
        {file.error && (
          <span className="ml-2 text-red-600 truncate">
            错误：{file.error}
          </span>
        )}
      </div>
    </div>

    {/* 操作按钮 */}
    <div className="flex items-center space-x-2">
      {file.status === 'uploading' && (
        <button
          onClick={() => onCancel(file.id)}
          className="px-2 py-1 text-sm text-red-600 hover:text-red-800"
        >
          取消
        </button>
      )}
      {file.status === 'failed' && (
        <button
          onClick={() => onRetry(file.id)}
          className="px-2 py-1 text-sm text-blue-600 hover:text-blue-800"
        >
          重试
        </button>
      )}
      
      {/* 原始文件处理按钮 */}
      {!isProcessedView && onProcessSingle && file.status !== 'uploading' && (
        <button
          onClick={() => onProcessSingle(file.id)}
          className="px-2 py-1 text-sm text-blue-600 hover:text-blue-800"
        >
          处理
        </button>
      )}
      
      {/* 处理后文件下载按钮 */}
      {isProcessedView && onDownloadSingle && file.status !== 'uploading' && (
        <button
          onClick={() => onDownloadSingle(file.id)}
          className="px-2 py-1 text-sm text-green-600 hover:text-green-800"
        >
          下载
        </button>
      )}
      
      {file.status !== 'uploading' && (
        <button
          onClick={() => onRemove(file.id)}
          className="px-2 py-1 text-sm text-gray-600 hover:text-gray-800"
        >
          删除
        </button>
      )}
      <button
        onClick={() => onPreview(file)}
        className="px-2 py-1 text-sm text-blue-600 hover:text-blue-800"
      >
        预览
      </button>
    </div>
  </div>
);

/**
 * 功能按钮组组件
 */
const ActionButtons: React.FC<{
  type: 'original' | 'processed';
  fileCount: number;
  selectedCount: number;
  onSelectAll: () => void;
  onProcessFiles?: () => void;
  onDownloadFiles?: () => void;
  onClearFiles: () => void;
}> = ({ type, fileCount, selectedCount, onSelectAll, onProcessFiles, onDownloadFiles, onClearFiles }) => (
  <div className="flex items-center space-x-3 mb-3">
    <button
      onClick={onSelectAll}
      className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800 border border-blue-300 rounded-md hover:bg-blue-50 transition-colors duration-200"
    >
      {selectedCount === fileCount && fileCount > 0 ? '取消全选' : '全选'}
    </button>
    
    {type === 'original' && onProcessFiles && (
      <button
        onClick={onProcessFiles}
        disabled={selectedCount === 0}
        className={`px-3 py-1.5 text-sm text-white rounded-md transition-colors duration-200 ${
          selectedCount > 0 
            ? 'bg-blue-600 hover:bg-blue-700' 
            : 'bg-blue-300 cursor-not-allowed'
        }`}
      >
        处理选中文件
      </button>
    )}
    
    {type === 'processed' && onDownloadFiles && (
      <button
        onClick={onDownloadFiles}
        disabled={selectedCount === 0}
        className={`px-3 py-1.5 text-sm text-white rounded-md transition-colors duration-200 ${
          selectedCount > 0 
            ? 'bg-green-600 hover:bg-green-700' 
            : 'bg-green-300 cursor-not-allowed'
        }`}
      >
        下载选中文件
      </button>
    )}
    
    <button
      onClick={onClearFiles}
      disabled={fileCount === 0}
      className={`px-3 py-1.5 text-sm text-white rounded-md transition-colors duration-200 ${
        fileCount > 0 
          ? 'bg-red-600 hover:bg-red-700' 
          : 'bg-red-300 cursor-not-allowed'
      }`}
    >
      {type === 'original' ? '清空全部文件' : '清空处理结果'}
    </button>
  </div>
);

export const FileList: React.FC<FileListProps> = ({
  originalFiles = [],
  processedFiles = [],
  onRemove,
  onCancel,
  onRetry,
  selectedFiles = [],
  onSelectFile,
  onProcessFiles,
  onDownloadFiles,
  onClearFiles,
  onProcessSingleFile,
  className,
}) => {
  // 预览状态
  const [previewFile, setPreviewFile] = useState<FileInfo | null>(null);
  
  // 独立的原始文件和处理后文件选择状态
  const [originalSelectedFiles, setOriginalSelectedFiles] = useState<string[]>([]);
  const [processedSelectedFiles, setProcessedSelectedFiles] = useState<string[]>([]);

  // 添加类型保护，确保是数组
  const safeOriginalFiles = Array.isArray(originalFiles) ? originalFiles : [];
  const safeProcessedFiles = Array.isArray(processedFiles) ? processedFiles : [];

  // 处理原始文件的选择
  const handleOriginalFileSelect = (id: string) => {
    setOriginalSelectedFiles(prev => 
      prev.includes(id) 
        ? prev.filter(fileId => fileId !== id)
        : [...prev, id]
    );
    // 同时更新父组件的选择状态
    if (onSelectFile) onSelectFile(id);
  };

  // 处理处理后文件的选择
  const handleProcessedFileSelect = (id: string) => {
    setProcessedSelectedFiles(prev => 
      prev.includes(id) 
        ? prev.filter(fileId => fileId !== id)
        : [...prev, id]
    );
    // 同时更新父组件的选择状态
    if (onSelectFile) onSelectFile(id);
  };

  // 原始文件全选/取消全选
  const handleOriginalSelectAll = () => {
    const newSelection = originalSelectedFiles.length === safeOriginalFiles.length 
      ? [] 
      : safeOriginalFiles.map(file => file.id);
    
    setOriginalSelectedFiles(newSelection);
    
    // 更新父组件的选择状态
    if (onSelectFile && newSelection.length > originalSelectedFiles.length) {
      newSelection.forEach(id => {
        if (!selectedFiles.includes(id)) {
          onSelectFile(id);
        }
      });
    } else if (onSelectFile && newSelection.length < originalSelectedFiles.length) {
      originalSelectedFiles.forEach(id => {
        if (selectedFiles.includes(id)) {
          onSelectFile(id);
        }
      });
    }
  };

  // 处理后文件全选/取消全选
  const handleProcessedSelectAll = () => {
    const newSelection = processedSelectedFiles.length === safeProcessedFiles.length 
      ? [] 
      : safeProcessedFiles.map(file => file.id);
    
    setProcessedSelectedFiles(newSelection);
    
    // 更新父组件的选择状态
    if (onSelectFile && newSelection.length > processedSelectedFiles.length) {
      newSelection.forEach(id => {
        if (!selectedFiles.includes(id)) {
          onSelectFile(id);
        }
      });
    } else if (onSelectFile && newSelection.length < processedSelectedFiles.length) {
      processedSelectedFiles.forEach(id => {
        if (selectedFiles.includes(id)) {
          onSelectFile(id);
        }
      });
    }
  };

  // 下载选中的处理后文件
  const handleDownloadSelectedFiles = () => {
    if (onDownloadFiles && processedSelectedFiles.length > 0) {
      onDownloadFiles(processedSelectedFiles);
    }
  };

  // 下载单个文件
  const handleDownloadSingleFile = (id: string) => {
    if (onDownloadFiles) {
      onDownloadFiles([id]);
    }
  };

  if (safeOriginalFiles.length === 0 && safeProcessedFiles.length === 0) {
    return (
      <div className={clsx('text-center py-8 text-gray-500', className)}>
        暂无文件
      </div>
    );
  }

  return (
    <div className={clsx('', className)}>
      <div className="grid grid-cols-2 gap-6">
        {/* 原始文件列表 */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">原始文件</h2>
            <span className="text-sm text-gray-600">
              {safeOriginalFiles.length}个文件 / 已选{originalSelectedFiles.length}个
            </span>
          </div>
          
          {/* 原始文件操作按钮 */}
          {safeOriginalFiles.length > 0 && (
            <ActionButtons
              type="original"
              fileCount={safeOriginalFiles.length}
              selectedCount={originalSelectedFiles.length}
              onSelectAll={handleOriginalSelectAll}
              onProcessFiles={onProcessFiles}
              onClearFiles={() => onClearFiles && onClearFiles(false)}
            />
          )}
          
          <div className="space-y-4">
            {safeOriginalFiles.length > 0 ? (
              safeOriginalFiles.map((file) => (
                <FileListItem
                  key={file.id}
                  file={file}
                  onRemove={onRemove}
                  onCancel={onCancel}
                  onRetry={onRetry}
                  onPreview={setPreviewFile}
                  isSelected={originalSelectedFiles.includes(file.id)}
                  onSelect={handleOriginalFileSelect}
                  isProcessedView={false}
                  onProcessSingle={onProcessSingleFile}
                />
              ))
            ) : (
              <div className="text-center py-4 text-gray-500">
                暂无原始文件
              </div>
            )}
          </div>
        </div>

        {/* 处理后文件列表 */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">处理后文件</h2>
            <span className="text-sm text-gray-600">
              {safeProcessedFiles.length}个文件 / 已选{processedSelectedFiles.length}个
            </span>
          </div>
          
          {/* 处理后文件操作按钮 */}
          {safeProcessedFiles.length > 0 && (
            <ActionButtons
              type="processed"
              fileCount={safeProcessedFiles.length}
              selectedCount={processedSelectedFiles.length}
              onSelectAll={handleProcessedSelectAll}
              onDownloadFiles={handleDownloadSelectedFiles}
              onClearFiles={() => onClearFiles && onClearFiles(true)}
            />
          )}
          
          <div className="space-y-4">
            {safeProcessedFiles.length > 0 ? (
              safeProcessedFiles.map((file) => (
                <FileListItem
                  key={file.id}
                  file={file}
                  onRemove={onRemove}
                  onCancel={onCancel}
                  onRetry={onRetry}
                  onPreview={setPreviewFile}
                  isSelected={processedSelectedFiles.includes(file.id)}
                  onSelect={handleProcessedFileSelect}
                  isProcessedView={true}
                  onDownloadSingle={handleDownloadSingleFile}
                />
              ))
            ) : (
              <div className="text-center py-4 text-gray-500">
                暂无处理后文件
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 预览弹窗 */}
      {previewFile && (
        <FilePreview
          file={previewFile}
          isOpen={true}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </div>
  );
}; 