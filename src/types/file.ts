/**
 * 文件状态枚举
 */
export type FileStatus = 'pending' | 'validating' | 'valid' | 'invalid' | 'uploading' | 'completed' | 'failed';

/**
 * 文件信息接口
 */
export interface FileInfo {
  id: string;           // 文件唯一标识
  name: string;         // 文件名
  size: number;         // 文件大小（字节）
  type: string;         // 文件类型
  lastModified: number; // 最后修改时间
  content?: string;     // 文件内容
  status: FileStatus;   // 文件状态
  error?: string;       // 错误信息
}

/**
 * 文件验证配置接口
 */
export interface FileValidationConfig {
  maxFileSize: number;           // 最大文件大小（字节）
  allowedTypes: string[];        // 允许的文件类型
  maxConcurrentUploads: number;  // 最大并发上传数
}

/**
 * 文件上传组件属性接口
 */
export interface FileUploadProps {
  onFilesSelected: (files: FileList) => void;        // 文件选择回调
  onFileValidated: (id: string, updates: Partial<FileInfo>) => void;  // 文件验证回调
  validationConfig: FileValidationConfig;          // 验证配置
  disabled?: boolean;                              // 是否禁用
  className?: string;                              // 自定义样式类
} 