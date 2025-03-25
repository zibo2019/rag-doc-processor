import React from 'react';
import { FileInfo } from '../../types/file';

interface FilePreviewProps {
  file: FileInfo;
  onClose: () => void;
  isOpen: boolean;
}

/**
 * 文件预览组件
 */
export const FilePreview: React.FC<FilePreviewProps> = ({
  file,
  onClose,
  isOpen
}) => {
  if (!isOpen) return null;

  // 判断文件是否有处理后的内容
  const hasProcessedContent = !!file.content;
  const originalContent = file.rawContent || '';
  const processedContent = file.content || '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 遮罩层 */}
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={onClose}
      />
      
      {/* 预览内容 - 全屏模式 */}
      <div className="relative w-[95vw] h-[90vh] bg-white rounded-lg shadow-xl overflow-hidden flex flex-col">
        {/* 预览头部 */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-medium">{file.name}</h3>
            {hasProcessedContent ? (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                已处理
              </span>
            ) : (
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                未处理
              </span>
            )}
          </div>
          
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* 预览内容 - 分栏显示 */}
        <div className="flex flex-1 overflow-hidden">
          {/* 左侧 - 原始内容 */}
          <div className="w-1/2 flex flex-col border-r">
            <div className="p-2 bg-gray-100 border-b text-center">
              <h4 className="font-medium text-gray-700">原始内容</h4>
            </div>
            <div className="p-4 overflow-auto flex-1">
              {originalContent ? (
                <pre className="whitespace-pre-wrap font-mono text-sm text-left">
                  {originalContent}
                </pre>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  无原始内容
                </div>
              )}
            </div>
          </div>
          
          {/* 右侧 - 处理后内容 */}
          <div className="w-1/2 flex flex-col">
            <div className="p-2 bg-gray-100 border-b text-center">
              <h4 className="font-medium text-gray-700">处理后内容</h4>
            </div>
            <div className="p-4 overflow-auto flex-1">
              {hasProcessedContent ? (
                <pre className="whitespace-pre-wrap font-mono text-sm text-left">
                  {processedContent}
                </pre>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  尚未处理
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 