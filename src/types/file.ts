/**
 * 文件状态枚举
 */
export type FileStatus = 'pending' | 'validating' | 'valid' | 'invalid' | 'uploading' | 'completed' | 'failed';

/**
 * 文件信息接口
 */
export interface FileInfo {
  id: string;                  // 文件唯一ID
  name: string;                // 文件名称
  size: number;                // 文件大小（字节）
  type: string;                // 文件类型
  status: FileStatus;          // 文件状态
  error?: string;              // 错误信息
  rawContent?: string;         // 原始文件内容
  content?: string;            // 处理后的内容
  createdAt?: string;          // 创建时间
  updatedAt?: string;          // 更新时间
  isPartOfSplit?: boolean;     // 是否为分割文件的一部分
  originalFileId?: string;     // 原始文件ID（如果是分割文件）
  partIndex?: number;          // 分块索引
  totalParts?: number;         // 总分块数
}

/**
 * 文件验证配置接口
 */
export interface FileValidationConfig {
  maxFileSize: number;           // 最大文件大小（字节）
  allowedTypes: string[];        // 允许的文件类型
  maxConcurrentUploads: number;  // 最大并发上传数
  autoSplitFiles?: boolean;      // 是否自动分割大文件
  splitOverlapPercent?: number;  // 分割重叠百分比
  maxChunkSize?: number;         // 分块最大大小
}

/**
 * 文件上传组件属性接口
 */
export interface FileUploadProps {
  onFilesSelected: (files: FileInfo[]) => void;     // 文件选择回调
  onFileValidated: (id: string, updates: Partial<FileInfo>) => void;  // 文件验证回调
  validationConfig: FileValidationConfig;           // 验证配置
  disabled?: boolean;                               // 是否禁用
  className?: string;                               // 自定义样式类
} 