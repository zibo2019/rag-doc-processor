import React, { useEffect, useState } from 'react';
import { Dialog, DialogHeader, DialogTitle } from '../ui/dialog';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';
import { useFileStore } from '@/stores/fileStore';
import { FileInfo } from '@/types/file';

export interface ProcessingStatus {
  total: number;
  processed: number;
  success: number;
  failed: number;
  completed: boolean;
}

interface ProcessingModalProps {
  isOpen: boolean;
  processingStatus: ProcessingStatus;
  agentName: string;
  onComplete: () => void;
}

// 加载动画组件
const Spinner = () => (
  <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-middle text-blue-600 motion-reduce:animate-[spin_1.5s_linear_infinite]">
    <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
      加载中...
    </span>
  </div>
);

// 文件状态图标组件
const FileStatusIcon: React.FC<{ status: string }> = ({ status }) => {
  switch (status) {
    case 'uploading':
      return <div className="h-3 w-3 bg-blue-500 rounded-full animate-pulse"></div>;
    case 'completed':
      return <div className="h-3 w-3 bg-green-500 rounded-full"></div>;
    case 'failed':
      return <div className="h-3 w-3 bg-red-500 rounded-full"></div>;
    case 'pending':
      return <div className="h-3 w-3 bg-gray-300 rounded-full"></div>;
    default:
      return <div className="h-3 w-3 bg-gray-400 rounded-full"></div>;
  }
};

// 波浪效果动画的关键帧
const waveAnimation = `
  @keyframes waveAnimation {
    0% {
      transform: translateX(-100%);
    }
    50% {
      transform: translateX(0);
    }
    100% {
      transform: translateX(100%);
    }
  }
`;

// 创建一个无关闭按钮的DialogContent组件
const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay
      className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
    />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg md:max-w-xl',
        className
      )}
      {...props}
    >
      {children}
      {/* 移除关闭按钮 */}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

export const ProcessingModal: React.FC<ProcessingModalProps> = ({
  isOpen,
  processingStatus,
  agentName,
  onComplete
}) => {
  const { total, processed, success, failed, completed } = processingStatus;
  const progress = total > 0 ? Math.round((processed / total) * 100) : 0;
  const { files, currentProcessingCount, maxConcurrentProcessing, processQueue } = useFileStore();
  
  // 获取正在处理中的文件和队列中等待处理的文件
  const [processingFiles, setProcessingFiles] = useState<FileInfo[]>([]);
  const [queuedFiles, setQueuedFiles] = useState<FileInfo[]>([]);
  
  // 根据文件状态更新显示列表
  useEffect(() => {
    if (isOpen) {
      // 获取正在处理中的文件
      const currentlyProcessing = files.filter(file => file.status === 'uploading');
      setProcessingFiles(currentlyProcessing);
      
      // 获取队列中等待处理的文件（根据状态和processQueue中的pendingFiles）
      if (processQueue?.pendingFiles?.length > 0) {
        const pendingFileIds = processQueue.pendingFiles;
        const pendingFiles = files.filter(file => 
          pendingFileIds.includes(file.id) || file.status === 'pending'
        );
        setQueuedFiles(pendingFiles);
      } else {
        setQueuedFiles(files.filter(file => file.status === 'pending'));
      }
    }
  }, [isOpen, files, processQueue]);
  
  // 每秒更新文件状态
  useEffect(() => {
    if (isOpen && !completed) {
      const interval = setInterval(() => {
        // 获取正在处理中的文件
        const currentlyProcessing = files.filter(file => file.status === 'uploading');
        setProcessingFiles(currentlyProcessing);
        
        // 获取队列中等待处理的文件
        if (processQueue?.pendingFiles?.length > 0) {
          const pendingFileIds = processQueue.pendingFiles;
          const pendingFiles = files.filter(file => 
            pendingFileIds.includes(file.id) || file.status === 'pending'
          );
          setQueuedFiles(pendingFiles);
        } else {
          setQueuedFiles(files.filter(file => file.status === 'pending'));
        }
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [isOpen, files, completed, processQueue]);
  
  return (
    <Dialog open={isOpen}>
      <style>{waveAnimation}</style>
      <DialogContent className="sm:max-w-md" 
        // 禁止用户关闭模态框
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-center">文件处理进度</DialogTitle>
        </DialogHeader>
        
        <div className="py-6 space-y-4">
          <div className="text-center text-sm mb-4 flex flex-col items-center justify-center">
            {completed 
              ? `已完成处理${total}个文件` 
              : (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <Spinner />
                    <span>正在使用"{agentName}"处理{total}个文件...</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    当前并行处理：{currentProcessingCount}/{maxConcurrentProcessing}
                  </div>
                </>
              )
            }
          </div>
          
          {/* 进度条 - 添加数字显示和处理中的动画效果 */}
          <div className="relative w-full h-7 bg-gray-200 rounded-md overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ease-in-out ${completed ? 'bg-green-600' : 'bg-blue-600'}`}
              style={{ width: `${progress}%` }}
            >
              {!completed && progress > 0 && progress < 100 && (
                <div 
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-50"
                  style={{ animation: 'waveAnimation 2s ease-in-out infinite' }}
                />
              )}
            </div>
            <div className="absolute inset-0 flex items-center justify-center text-sm font-medium">
              <span className={progress > 50 ? 'text-white' : 'text-gray-700'}>
                {processed}/{total}
              </span>
            </div>
          </div>
          
          {/* 进度数据 - 改为成功、失败、总数 */}
          <div className="grid grid-cols-3 gap-3 text-center text-sm">
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-green-600 font-semibold">{success}</div>
              <div className="text-gray-500">成功</div>
            </div>
            <div className="bg-red-50 p-3 rounded-lg">
              <div className="text-red-600 font-semibold">{failed}</div>
              <div className="text-gray-500">失败</div>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-blue-600 font-semibold">{total}</div>
              <div className="text-gray-500">总数</div>
            </div>
          </div>
          
          {/* 正在处理文件列表 */}
          {!completed && (
            <div className="mt-4">
              <div className="text-sm font-medium text-gray-700 mb-2 flex justify-between">
                <span>处理中的文件 ({processingFiles.length})：</span>
                {processingFiles.length >= maxConcurrentProcessing && (
                  <span className="text-xs text-amber-500">已达最大并行数</span>
                )}
              </div>
              <div className="max-h-24 overflow-y-auto bg-gray-50 rounded-md p-2">
                {processingFiles.length > 0 ? (
                  <div className="space-y-1">
                    {processingFiles.map(file => (
                      <div key={file.id} className="flex items-center justify-between text-xs py-1 px-2 rounded-md bg-white">
                        <div className="flex items-center space-x-2 truncate flex-grow">
                          <FileStatusIcon status={file.status} />
                          <span className="truncate">{file.name}</span>
                        </div>
                        <div className="flex items-center pl-2">
                          <div className="h-1.5 w-12 bg-gray-200 rounded-full mr-1.5 overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full w-1/2 animate-pulse"></div>
                          </div>
                          <span className="text-blue-500 text-xs whitespace-nowrap">处理中</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-500 text-center py-2">
                    暂无文件正在处理
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* 等待队列文件列表 */}
          {!completed && queuedFiles.length > 0 && (
            <div className="mt-1">
              <div className="text-sm font-medium text-gray-700 mb-2">
                等待队列 ({queuedFiles.length})：
              </div>
              <div className="max-h-24 overflow-y-auto bg-gray-50 rounded-md p-2">
                <div className="space-y-1">
                  {queuedFiles.map((file, index) => (
                    <div key={file.id} className="flex items-center justify-between text-xs py-1 px-2 rounded-md bg-white">
                      <div className="flex items-center space-x-2 truncate flex-grow">
                        <div className="flex items-center justify-center min-w-5 h-5 bg-gray-100 rounded-full text-gray-500 text-xs font-medium mr-0.5">
                          {index + 1}
                        </div>
                        <FileStatusIcon status={file.status} />
                        <span className="truncate">{file.name}</span>
                      </div>
                      <span className="text-gray-400 text-xs whitespace-nowrap">等待中</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          <div className="text-center text-sm mt-2">
            {completed ? (
              <button
                onClick={onComplete}
                className="mt-4 px-6 py-2 bg-green-600 text-white rounded-full font-medium hover:bg-green-700 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                完成
              </button>
            ) : (
              <p className="text-gray-500">处理完成前请勿关闭此窗口</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 