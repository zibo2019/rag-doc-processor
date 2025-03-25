import { v4 as uuid } from 'uuid';
import { FileInfo, FileValidationConfig } from '../types/file';

/**
 * 生成唯一ID
 */
export const generateId = (): string => uuid();

/**
 * 将File对象转换为FileInfo
 */
export const convertToFileInfo = async (file: File): Promise<FileInfo> => {
  return {
    id: generateId(),
    name: file.name,
    size: file.size,
    type: file.type,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

/**
 * 验证文件类型
 */
export const validateFileType = (file: File, allowedTypes: string[]): boolean => {
  // 如果没有限制类型，则允许所有类型
  if (allowedTypes.length === 0) {
    return true;
  }

  return allowedTypes.some(type => file.type.includes(type));
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
      error: `格式不支持`
    };
  }

  if (!validateFileSize(file, config.maxFileSize)) {
    return {
      isValid: false,
      error: `超出大小限制`
    };
  }

  return { isValid: true };
};

/**
 * 读取文件内容
 */
export const readFileContent = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        resolve(event.target.result as string);
      } else {
        reject(new Error('读取文件失败'));
      }
    };
    reader.onerror = () => {
      reject(new Error('读取文件失败'));
    };
    reader.readAsText(file);
  });
};

/**
 * 分割文本内容为多个块
 * @param content 要分割的内容
 * @param maxChunkSize 每个块的最大大小（字符数）
 * @param overlapPercent 块之间的重叠百分比
 * @returns 分割后的块数组
 */
export const splitContentIntoChunks = (
  content: string,
  maxChunkSize: number,
  overlapPercent: number = 8
): string[] => {
  // 直接按照字符数量进行分割
  const chunkSize = maxChunkSize * 4; // 每个token约等于4个字符
  
  if (content.length <= chunkSize) {
    return [content];
  }

  const chunks: string[] = [];
  const overlapSize = Math.floor(chunkSize * overlapPercent / 100);
  const chunkStep = chunkSize - overlapSize;
  
  let position = 0;
  while (position < content.length) {
    const endPos = Math.min(position + chunkSize, content.length);
    chunks.push(content.substring(position, endPos));
    position += chunkStep;
  }

  return chunks;
};

/**
 * 将文件分割成多个小文件
 * @param fileInfo 原始文件信息
 * @param config 验证配置
 * @returns 分割后的文件信息数组
 */
export const splitFile = async (
  fileInfo: FileInfo,
  config: FileValidationConfig
): Promise<FileInfo[]> => {
  if (!fileInfo.rawContent) {
    throw new Error('文件内容为空');
  }

  // 获取配置并设置默认值
  const tokenSize = config.maxChunkSize || 2000; // 默认目标2000个token
  const chunkSize = tokenSize * 4; // 估算字符数
  const overlapPercent = config.splitOverlapPercent || 8; // 默认8%重叠
  
  if (fileInfo.rawContent.length <= chunkSize || !config.autoSplitFiles) {
    return [fileInfo];
  }

  // 分割内容
  const chunks = splitContentIntoChunks(fileInfo.rawContent, tokenSize, overlapPercent);
  
  // 如果只有一个块，则不分割
  if (chunks.length <= 1) {
    return [fileInfo];
  }

  // 创建分割后的文件数组
  const splitFiles: FileInfo[] = [];
  const { name } = fileInfo;
  const nameParts = name.split('.');
  const extension = nameParts.length > 1 ? `.${nameParts.pop()}` : '';
  const baseName = nameParts.join('.');

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const newFile: FileInfo = {
      ...fileInfo,
      id: generateId(),
      name: `${baseName}_part_${i + 1}_${chunks.length}${extension}`,
      rawContent: chunk,
      size: new Blob([chunk]).size,
      status: 'pending',
      updatedAt: new Date().toISOString(),
      isPartOfSplit: true,
      originalFileId: fileInfo.id,
      partIndex: i + 1,
      totalParts: chunks.length
    };
    splitFiles.push(newFile);
  }

  return splitFiles;
}; 