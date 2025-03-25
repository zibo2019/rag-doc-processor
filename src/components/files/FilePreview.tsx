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

  // 获取要显示的内容
  const displayContent = file.rawContent || file.content;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 遮罩层 */}
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={onClose}
      />
      
      {/* 预览内容 */}
      <div className="relative w-full max-w-4xl max-h-[80vh] bg-white rounded-lg shadow-xl overflow-hidden">
        {/* 预览头部 */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-medium">{file.name}</h3>
            {file.content && file.content !== file.rawContent && (
              <span className="text-xs text-gray-500">
                (处理完成后内容可能会有变化)
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

        {/* 预览内容 */}
        <div className="p-6 overflow-auto max-h-[calc(80vh-8rem)]">
          {displayContent ? (
            <pre className="whitespace-pre-wrap font-mono text-sm text-left">
              {displayContent}
            </pre>
          ) : (
            <div className="text-left text-gray-500">
              无法读取文件内容
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 