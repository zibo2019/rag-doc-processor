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
}> = ({ file, onRemove, onCancel, onRetry, onPreview, isSelected, onSelect, isProcessedView }) => (
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

export const FileList: React.FC<FileListProps> = ({
  originalFiles = [],
  processedFiles = [],
  onRemove,
  onCancel,
  onRetry,
  selectedFiles = [],
  onSelectFile,
  className,
}) => {
  // 预览状态
  const [previewFile, setPreviewFile] = useState<FileInfo | null>(null);

  // 添加类型保护，确保是数组
  const safeOriginalFiles = Array.isArray(originalFiles) ? originalFiles : [];
  const safeProcessedFiles = Array.isArray(processedFiles) ? processedFiles : [];

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
          <h2 className="text-lg font-medium text-gray-900 mb-4">原始文件</h2>
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
                  isSelected={selectedFiles.includes(file.id)}
                  onSelect={onSelectFile}
                  isProcessedView={false}
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
          <h2 className="text-lg font-medium text-gray-900 mb-4">处理后文件</h2>
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
                  isSelected={selectedFiles.includes(file.id)}
                  onSelect={onSelectFile}
                  isProcessedView={true}
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