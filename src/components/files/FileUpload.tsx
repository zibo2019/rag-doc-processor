import React, { useCallback, useRef, useState } from 'react';
import { FileUploadProps, FileInfo } from '../../types/file';
import { convertToFileInfo, validateFile, readFileContent, splitFile } from '../../utils/file';
import { showError, showSuccess } from '../../utils/notification';
import clsx from 'clsx';
import { useFileStore } from '../../stores/fileStore';

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
  const { validationConfig: storeConfig, updateValidationConfig } = useFileStore();

  // 自动分割选项变化处理
  const handleAutoSplitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateValidationConfig({
      ...validationConfig,
      autoSplitFiles: e.target.checked
    });
  };

  // 处理文件选择
  const handleFileSelect = useCallback(
    async (files: FileList | null) => {
      if (!files?.length) return;

      const fileArray = Array.from(files);
      
      // 检查文件数量
      if (fileArray.length > 50) {
        showError('最多50个文件');
        return;
      }

      // 创建文件信息数组
      const fileInfoPromises = fileArray.map(async (file) => {
        // 读取文件内容
        const rawContent = await readFileContent(file);
        // 转换为FileInfo
        const fileInfo = await convertToFileInfo(file);
        return {
          ...fileInfo,
          rawContent
        };
      });

      const fileInfos = await Promise.all(fileInfoPromises);
      const processedFiles: FileInfo[] = [];
      
      // 处理每个文件（可能需要分割）
      for (const fileInfo of fileInfos) {
        const validation = validateFile(
          new File([fileInfo.rawContent || ''], fileInfo.name, { type: fileInfo.type }),
          validationConfig
        );

        if (!validation.isValid) {
          // 验证失败，更新文件状态
          onFileValidated(fileInfo.id, {
            ...fileInfo,
            status: 'invalid',
            error: validation.error
          });
          showError(`${validation.error}`);
          continue;
        }

        // 分割文件（如果需要）
        if (validationConfig.autoSplitFiles && fileInfo.rawContent) {
          try {
            const splitFiles = await splitFile(fileInfo, validationConfig);
            
            if (splitFiles.length > 1) {
              // 添加分割后的文件
              processedFiles.push(...splitFiles);
            } else {
              // 不需要分割
              processedFiles.push(fileInfo);
            }
          } catch (error) {
            // 分割失败，使用原始文件
            processedFiles.push(fileInfo);
            // 只在出错时显示错误提示
            showError(`分割失败`);
          }
        } else {
          // 不需要分割
          processedFiles.push(fileInfo);
        }
        
        // 更新文件状态为有效
        onFileValidated(fileInfo.id, {
          ...fileInfo,
          status: 'valid'
        });
      }

      // 添加所有文件
      onFilesSelected(processedFiles);
      
      // 只在没有分割文件时显示添加成功提示
      const hasSplitFiles = processedFiles.some(file => file.isPartOfSplit);
      if (!hasSplitFiles) {
        showSuccess(`已添加${processedFiles.length}份`);
      }
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
        showError('已禁用');
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
        showError('已禁用');
        return;
      }

      const { files } = e.dataTransfer;
      handleFileSelect(files);
    },
    [disabled, handleFileSelect]
  );

  return (
    <div className={clsx('w-full', className)}>
      <div
        className={clsx(
          'flex flex-col items-center justify-center p-8 border-2 rounded-lg transition-all duration-200',
          {
            'border-blue-400 bg-blue-50/70 shadow-lg shadow-blue-100': isDragging,
            'border-gray-200 hover:border-blue-300 hover:bg-gray-50/70 hover:shadow-md': !isDragging && !disabled,
            'border-gray-200 bg-gray-50 cursor-not-allowed': disabled
          }
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
        />

        <div className={clsx(
          'w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 transform',
          {
            'bg-blue-100 scale-110': isDragging,
            'bg-gray-100 hover:scale-105': !isDragging && !disabled,
            'bg-gray-50': disabled
          }
        )}>
          <svg
            className={clsx('w-8 h-8 transition-colors duration-300', {
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
        </div>

        <p className={clsx('text-lg mt-4 mb-6', {
          'text-blue-600': isDragging,
          'text-gray-700': !isDragging && !disabled,
          'text-gray-400': disabled
        })}>
          <span className="font-medium">点击上传</span> 或拖拽文件到此处
        </p>
        
        <div className="flex flex-wrap justify-center gap-4">
          <div className={clsx('flex items-center space-x-2 px-3 py-1.5 rounded-full transition-colors duration-200', {
            'bg-blue-100/80 text-blue-700': isDragging,
            'bg-gray-100/80 text-gray-600 hover:bg-gray-200/80': !isDragging && !disabled,
            'bg-gray-50 text-gray-400': disabled
          })}>
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-sm whitespace-nowrap">文件类型不限</span>
          </div>
          
          <div className={clsx('flex items-center space-x-2 px-3 py-1.5 rounded-full transition-colors duration-200', {
            'bg-blue-100/80 text-blue-700': isDragging,
            'bg-gray-100/80 text-gray-600 hover:bg-gray-200/80': !isDragging && !disabled,
            'bg-gray-50 text-gray-400': disabled
          })}>
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
            </svg>
            <span className="text-sm whitespace-nowrap">最大 {validationConfig.maxFileSize / 1024}KB</span>
          </div>
          
          <div className={clsx('flex items-center space-x-2 px-3 py-1.5 rounded-full transition-colors duration-200', {
            'bg-blue-100/80 text-blue-700': isDragging,
            'bg-gray-100/80 text-gray-600 hover:bg-gray-200/80': !isDragging && !disabled,
            'bg-gray-50 text-gray-400': disabled
          })}>
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <span className="text-sm whitespace-nowrap">最多50个文件</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 px-5 py-4 rounded-lg">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="autoSplitFiles"
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-offset-0"
              checked={validationConfig.autoSplitFiles}
              onChange={handleAutoSplitChange}
              disabled={disabled}
            />
            <label htmlFor="autoSplitFiles" className="ml-2 text-sm font-medium text-gray-700">
              自动分割大文件
            </label>
          </div>
          <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full">
            重叠率：{validationConfig.splitOverlapPercent || 20}%
          </span>
        </div>
        
        <div className="flex items-center text-sm text-gray-600">
          <svg className="w-4 h-4 mr-1.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span>
            分块大小：{validationConfig.maxChunkSize ? 
              `约${validationConfig.maxChunkSize}个token（约${validationConfig.maxChunkSize * 4}字符）` : 
              '约2000个token'}
          </span>
        </div>
      </div>
    </div>
  );
}; 