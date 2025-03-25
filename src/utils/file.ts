import { FileInfo, FileValidationConfig } from '../types/file';

/**
 * 生成唯一文件ID
 */
export const generateFileId = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

/**
 * 将原生File对象转换为FileInfo对象
 */
export const convertToFileInfo = async (file: File): Promise<FileInfo> => {
  // 读取文件原始内容
  const rawContent = await readFileContent(file);
  
  return {
    id: generateFileId(),
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified,
    rawContent,
    status: 'pending'
  };
};

/**
 * 验证文件类型
 */
export const validateFileType = (file: File, allowedTypes: string[]): boolean => {
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  return allowedTypes.includes(fileExtension || '');
};

/**
 * 验证文件大小
 */
export const validateFileSize = (file: File, maxSize: number): boolean => {
  return file.size <= maxSize;
};

/**
 * 验证单个文件
 */
export const validateFile = (
  file: File,
  config: FileValidationConfig
): { isValid: boolean; error?: string } => {
  // 如果allowedTypes不为空，则验证文件类型
  if (config.allowedTypes.length > 0 && !validateFileType(file, config.allowedTypes)) {
    return {
      isValid: false,
      error: `不支持的文件类型。支持的类型：${config.allowedTypes.join(', ')}`
    };
  }

  if (!validateFileSize(file, config.maxFileSize)) {
    return {
      isValid: false,
      error: `文件大小超过限制。最大允许：${config.maxFileSize / 1024 / 1024}MB`
    };
  }

  return { isValid: true };
};

/**
 * 读取文件内容
 */
export const readFileContent = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsText(file);
  });
}; 