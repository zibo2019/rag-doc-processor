import React, { useCallback, useRef, useState } from 'react';
import { FileUploadProps, FileInfo } from '../../types/file';
import { convertToFileInfo, validateFile } from '../../utils/file';
import { showError, showSuccess } from '../../utils/notification';
import clsx from 'clsx';

/**
 * 文件上传组件
 */
export const FileUpload: React.FC<FileUploadProps> = ({
  onFilesSelected,
  onFileValidated,
  validationConfig,
  disabled = false,
  className
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 处理文件选择
  const handleFileSelect = useCallback(
    (files: FileList | null) => {
      if (!files?.length) return;

      const fileArray = Array.from(files);
      
      // 检查文件数量
      if (fileArray.length > 50) {
        showError('一次最多只能上传50个文件');
        return;
      }

      onFilesSelected(files);
      showSuccess(`已选择 ${fileArray.length} 个文件`);

      // 验证每个文件
      fileArray.forEach(async (file) => {
        const fileInfo = convertToFileInfo(file);
        const validation = validateFile(file, validationConfig);

        if (!validation.isValid) {
          onFileValidated(fileInfo.id, {
            ...fileInfo,
            status: 'invalid',
            error: validation.error
          });
          showError(`文件 "${file.name}" ${validation.error}`);
          return;
        }

        onFileValidated(fileInfo.id, {
          ...fileInfo,
          status: 'valid'
        });
      });
    },
    [onFilesSelected, onFileValidated, validationConfig]
  );

  // 处理点击上传
  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  // 处理拖拽事件
  const handleDrag = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (disabled) {
        showError('上传功能已禁用');
        return;
      }

      if (e.type === 'dragenter' || e.type === 'dragover') {
        setIsDragging(true);
      } else if (e.type === 'dragleave' || e.type === 'drop') {
        setIsDragging(false);
      }
    },
    [disabled]
  );

  // 处理文件放置
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (disabled) {
        showError('上传功能已禁用');
        return;
      }

      const { files } = e.dataTransfer;
      handleFileSelect(files);
    },
    [disabled, handleFileSelect]
  );

  return (
    <div
      className={clsx(
        'relative flex flex-col items-center justify-center w-full h-64 p-6',
        'border-2 border-dashed rounded-lg cursor-pointer',
        'transition-colors duration-200 ease-in-out',
        {
          'border-blue-400 bg-blue-50': isDragging,
          'border-blue-200 hover:border-blue-400 hover:bg-blue-50': !isDragging && !disabled,
          'border-gray-200 bg-gray-50 cursor-not-allowed': disabled
        },
        className
      )}
      onClick={handleClick}
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files)}
        disabled={disabled}
        accept={validationConfig.allowedTypes.map(type => `.${type}`).join(',')}
      />

      <div className="flex flex-col items-center justify-center pt-5 pb-6">
        <svg
          className={clsx('w-12 h-12 mb-4', {
            'text-blue-500': isDragging,
            'text-blue-400': !isDragging && !disabled,
            'text-gray-300': disabled
          })}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        <p className={clsx('mb-3 text-base', {
          'text-blue-600': isDragging,
          'text-blue-500': !isDragging && !disabled,
          'text-gray-400': disabled
        })}>
          <span className="font-semibold">点击上传</span> 或拖拽文件到此处
        </p>
        <div className="space-y-1.5">
          <p className={clsx('text-sm', {
            'text-blue-500': isDragging,
            'text-blue-400': !isDragging && !disabled,
            'text-gray-400': disabled
          })}>
            支持的文件类型: {validationConfig.allowedTypes.join(', ')}
          </p>
          <p className={clsx('text-sm', {
            'text-blue-500': isDragging,
            'text-blue-400': !isDragging && !disabled,
            'text-gray-400': disabled
          })}>
            最大文件大小: {validationConfig.maxFileSize / 1024 / 1024}MB
          </p>
          <p className={clsx('text-sm', {
            'text-blue-500': isDragging,
            'text-blue-400': !isDragging && !disabled,
            'text-gray-400': disabled
          })}>
            单次最多上传50个文件
          </p>
        </div>
      </div>
    </div>
  );
}; 