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
              // 只在分割文件时显示提示
              showSuccess(`已分割${splitFiles.length}份`);
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
    <div className="space-y-4">
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
          accept={validationConfig.allowedTypes.length > 0 ? validationConfig.allowedTypes.map(type => `.${type}`).join(',') : '*'}
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
            {validationConfig.allowedTypes.length > 0 ? (
              <p className={clsx('text-sm', {
                'text-blue-500': isDragging,
                'text-blue-400': !isDragging && !disabled,
                'text-gray-400': disabled
              })}>
                支持的文件类型: {validationConfig.allowedTypes.join(', ')}
              </p>
            ) : (
              <p className={clsx('text-sm', {
                'text-blue-500': isDragging,
                'text-blue-400': !isDragging && !disabled,
                'text-gray-400': disabled
              })}>
                支持所有文件类型
              </p>
            )}
            <p className={clsx('text-sm', {
              'text-blue-500': isDragging,
              'text-blue-400': !isDragging && !disabled,
              'text-gray-400': disabled
            })}>
              最大文件大小: {validationConfig.maxFileSize / 1024}KB
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
      
      {/* 文件分割选项 */}
      <div className="flex items-center px-2">
        <input
          type="checkbox"
          id="autoSplitFiles"
          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
          checked={validationConfig.autoSplitFiles}
          onChange={handleAutoSplitChange}
          disabled={disabled}
        />
        <label htmlFor="autoSplitFiles" className="ml-2 text-sm font-medium text-gray-700">
          自动分割大文件（重叠率：{validationConfig.splitOverlapPercent || 20}%）
        </label>
        <div className="ml-auto text-xs text-gray-500">
          分块大小：{validationConfig.maxChunkSize ? `约${validationConfig.maxChunkSize}个token（约${validationConfig.maxChunkSize * 4}字符）` : '约2000个token'}
        </div>
      </div>
    </div>
  );
}; 