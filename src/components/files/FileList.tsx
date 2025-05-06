import React, { useState } from 'react';
import { FileInfo } from '../../types/file';
import clsx from 'clsx';
import { FilePreview } from './FilePreview';

interface FileListProps {
  originalFiles: FileInfo[];  // 原始文件列表
  processedFiles: FileInfo[]; // 处理后的文件列表
  onRemove: (id: string) => void;
  onCancel?: (id: string) => void; // 取消处理的回调
  onRetry?: (id: string) => Promise<void>; // 重试处理的回调
  originalSelectedFiles: string[]; // 存储原始文件选择状态
  processedSelectedFiles: string[]; // 存储处理后文件选择状态
  onSelectFile?: (id: string, isProcessed: boolean) => void; // 标识选择的是哪类文件
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
    case 'valid':
      return 'bg-blue-100 text-blue-800';
    case 'invalid':
      return 'bg-red-100 text-red-800';
    case 'validating':
      return 'bg-yellow-100 text-yellow-800';
    case 'pending':
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

/**
 * 获取状态文本
 */
const getStatusText = (status: FileInfo['status']): string => {
  const statusMap: Record<string, string> = {
    pending: '待处理',
    completed: '已完成',
    failed: '失败',
    uploading: '处理中',
    valid: '有效',
    invalid: '无效',
    validating: '验证中'
  };
  return statusMap[status] || '未知';
};

/**
 * 文件列表项组件
 */
const FileListItem = ({
  file,
  onRemove,
  onPreview,
  isSelected,
  onSelect,
  isProcessedView,
  onProcessSingle,
  onDownloadSingle
}: {
  file: FileInfo;
  onRemove: (id: string) => void;
  onPreview: (file: FileInfo) => void;
  isSelected?: boolean;
  onSelect?: (id: string, isProcessed: boolean) => void;
  isProcessedView?: boolean;
  onProcessSingle?: (id: string) => void;
  onDownloadSingle?: (id: string) => void;
}) => {
  // 计算正确的文件大小
  const fileSize = React.useMemo(() => {
    // 如果是处理后的视图，并且文件有处理后的内容，则使用处理后内容的大小
    if (isProcessedView && file.content) {
      return new Blob([file.content]).size;
    }
    // 如果是原始文件视图且有原始内容，使用原始内容的大小
    if (!isProcessedView && file.rawContent) {
      return new Blob([file.rawContent]).size;
    }
    // 否则使用文件本身的大小（作为后备选项）
    return file.size;
  }, [file, isProcessedView]);

  // 计算文件大小变化百分比
  const sizeDifference = React.useMemo(() => {
    // 只在处理后视图且有原始内容和处理后内容时计算
    if (isProcessedView && file.content && file.rawContent) {
      const originalSize = new Blob([file.rawContent]).size;
      const processedSize = new Blob([file.content]).size;

      if (originalSize === 0) return null;

      const diff = processedSize - originalSize;
      const percentChange = (diff / originalSize) * 100;

      return {
        diff,
        percentChange: Math.round(percentChange * 100) / 100, // 保留两位小数
        isReduction: diff < 0
      };
    }
    return null;
  }, [file, isProcessedView]);

  return (
    <div className={clsx(
      'group relative flex items-center p-4 bg-white rounded-lg border transition-all duration-200',
      {
        'border-blue-200 bg-blue-50': isSelected,
        'border-gray-200 hover:border-gray-300': !isSelected
      }
    )}>
      {/* 选择框 */}
      {onSelect && (
        <div className="mr-4">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect(file.id, !!isProcessedView)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
        </div>
      )}

      {/* 文件图标 */}
      <div className="mr-4">
        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      </div>

      {/* 文件信息 */}
      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onPreview(file)}>
        <div className="flex items-center space-x-2">
          <h3 className="text-sm font-medium text-gray-900 truncate">
            {file.name}
          </h3>
          {/* 只在原始文件视图中显示状态 */}
          {!isProcessedView && (
            <span className={clsx(
              'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full',
              getStatusStyle(file.status)
            )}>
              {getStatusText(file.status)}
            </span>
          )}
        </div>
        <div className="mt-1 flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <span className="text-gray-500">{formatFileSize(fileSize)}</span>
            {isProcessedView && sizeDifference && (
              <span className={clsx(
                'inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded-full',
                sizeDifference.isReduction ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              )}>
                {sizeDifference.isReduction ? '↓' : '↑'} {Math.abs(sizeDifference.percentChange)}%
              </span>
            )}
          </div>
          {file.error && (
            <span className="text-red-600 truncate flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {file.error}
            </span>
          )}
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex items-center space-x-2 ml-4">
        {/* 预览按钮 */}
        <button
          onClick={() => onPreview(file)}
          className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-blue-700 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          预览
        </button>

        {/* 原始文件的处理按钮 */}
        {!isProcessedView && onProcessSingle && (
          <button
            onClick={() => onProcessSingle(file.id)}
            className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-blue-700 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            处理
          </button>
        )}

        {/* 处理后文件的下载按钮 */}
        {isProcessedView && onDownloadSingle && (
          <button
            onClick={() => onDownloadSingle(file.id)}
            className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-green-700 hover:text-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            下载
          </button>
        )}

        {/* 删除按钮 */}
        <button
          onClick={() => onRemove(file.id)}
          className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          删除
        </button>
      </div>
    </div>
  );
};

/**
 * 功能按钮组组件
 */
const ActionButtons = ({
  type,
  fileCount,
  selectedCount,
  onSelectAll,
  onProcessFiles,
  onDownloadFiles,
  onClearFiles
}: {
  type: 'original' | 'processed';
  fileCount: number;
  selectedCount: number;
  onSelectAll: () => void;
  onProcessFiles?: () => void;
  onDownloadFiles?: () => void;
  onClearFiles: () => void;
}) => (
  <div className="flex items-center space-x-3 mb-3">
    {/* 全选按钮 */}
    <button
      onClick={onSelectAll}
      className="inline-flex items-center px-2.5 py-1.5 text-sm text-blue-700 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
    >
      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
      {selectedCount === fileCount && fileCount > 0 ? '取消全选' : '全选'}
    </button>

    {/* 处理/下载按钮 */}
    {type === 'original' && onProcessFiles && (
      <button
        onClick={onProcessFiles}
        disabled={selectedCount === 0}
        className={`inline-flex items-center px-2.5 py-1.5 text-sm ${
          selectedCount > 0
            ? 'text-blue-700 hover:text-blue-800'
            : 'text-blue-400 cursor-not-allowed'
        } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        处理选中文件
      </button>
    )}

    {type === 'processed' && onDownloadFiles && (
      <button
        onClick={onDownloadFiles}
        disabled={selectedCount === 0}
        className={`inline-flex items-center px-2.5 py-1.5 text-sm ${
          selectedCount > 0
            ? 'text-green-700 hover:text-green-800'
            : 'text-green-400 cursor-not-allowed'
        } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        下载选中文件
      </button>
    )}

    {/* 清空按钮 */}
    <button
      onClick={onClearFiles}
      disabled={fileCount === 0}
      className={`inline-flex items-center px-2.5 py-1.5 text-sm ${
        fileCount > 0
          ? 'text-red-700 hover:text-red-800'
          : 'text-red-400 cursor-not-allowed'
      } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500`}
    >
      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
      {type === 'original' ? '清空全部文件' : '清空处理结果'}
    </button>
  </div>
);

export const FileList: React.FC<FileListProps> = ({
  originalFiles = [],
  processedFiles = [],
  onRemove,
  originalSelectedFiles = [],
  processedSelectedFiles = [],
  onSelectFile,
  onProcessFiles,
  onDownloadFiles,
  onClearFiles,
  onProcessSingleFile,
  className,
}) => {
  // 预览状态
  const [previewFile, setPreviewFile] = useState<FileInfo | null>(null);

  // 添加类型保护，确保是数组
  const safeOriginalFiles = Array.isArray(originalFiles) ? originalFiles : [];
  const safeProcessedFiles = Array.isArray(processedFiles) ? processedFiles : [];

  // 处理原始文件的选择
  const handleOriginalFileSelect = (id: string) => {
    if (onSelectFile) {
      onSelectFile(id, false);
    }
  };

  // 处理处理后文件的选择
  const handleProcessedFileSelect = (id: string) => {
    if (onSelectFile) {
      onSelectFile(id, true);
    }
  };

  // 原始文件全选/取消全选
  const handleOriginalSelectAll = () => {
    const allSelected = safeOriginalFiles.every(file => originalSelectedFiles.includes(file.id));

    if (allSelected) {
      // 取消全选 - 从选中列表中移除所有原始文件
      safeOriginalFiles.forEach(file => {
        if (onSelectFile) onSelectFile(file.id, false);
      });
    } else {
      // 全选 - 将所有未选中的原始文件添加到选中列表
      safeOriginalFiles.forEach(file => {
        // 只有未选中的文件才需要添加
        if (!originalSelectedFiles.includes(file.id) && onSelectFile) {
          onSelectFile(file.id, false);
        }
      });
    }
  };

  // 处理后文件全选/取消全选
  const handleProcessedSelectAll = () => {
    const allSelected = safeProcessedFiles.every(file => processedSelectedFiles.includes(file.id));

    if (allSelected) {
      // 取消全选 - 从选中列表中移除所有处理后文件
      safeProcessedFiles.forEach(file => {
        if (onSelectFile) onSelectFile(file.id, true);
      });
    } else {
      // 全选 - 将所有未选中的处理后文件添加到选中列表
      safeProcessedFiles.forEach(file => {
        // 只有未选中的文件才需要添加
        if (!processedSelectedFiles.includes(file.id) && onSelectFile) {
          onSelectFile(file.id, true);
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