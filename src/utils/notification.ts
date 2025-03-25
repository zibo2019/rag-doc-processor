import { toast } from 'react-hot-toast';

// 统一的通知配置
const defaultConfig = {
  duration: 3000,
  position: 'top-center' as const,
  className: 'bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700',
  style: {
    padding: '16px',
    borderRadius: '8px',
  },
  iconTheme: {
    primary: '#4f46e5',
    secondary: '#ffffff',
  }
};

// 显示错误提示
export const showError = (message: string) => {
  return toast.error(message, {
    ...defaultConfig,
    className: `${defaultConfig.className} border-red-200 dark:border-red-700`,
    iconTheme: {
      primary: '#ef4444',
      secondary: '#ffffff',
    },
  });
};

// 显示成功提示
export const showSuccess = (message: string) => {
  return toast.success(message, {
    ...defaultConfig,
    className: `${defaultConfig.className} border-green-200 dark:border-green-700`,
    iconTheme: {
      primary: '#22c55e',
      secondary: '#ffffff',
    },
  });
};

// 显示常规信息提示
export const showInfo = (message: string) => {
  return toast(message, {
    ...defaultConfig,
    icon: '📝',
  });
};

// 显示警告提示
export const showWarning = (message: string) => {
  return toast(message, {
    ...defaultConfig,
    icon: '⚠️',
    className: `${defaultConfig.className} border-yellow-200 dark:border-yellow-700`,
  });
};

// 显示加载提示
export const showLoading = (message: string) => {
  return toast.loading(message, {
    ...defaultConfig,
    duration: Infinity,
  });
};

// 显示自定义提示
export const showCustom = (message: string, icon: string) => {
  return toast(message, {
    ...defaultConfig,
    icon,
  });
};

// 更新已存在的 toast
export const updateToast = (toastId: string, message: string, type: 'success' | 'error' | 'info' | 'warning' | 'loading') => {
  toast.dismiss(toastId);
  
  switch (type) {
    case 'success':
      return showSuccess(message);
    case 'error':
      return showError(message);
    case 'info':
      return showInfo(message);
    case 'warning':
      return showWarning(message);
    case 'loading':
      return showLoading(message);
    default:
      return showInfo(message);
  }
};

// 关闭所有通知
export const dismissAllToasts = () => {
  toast.dismiss();
};

// 主要通知函数 - 简化调用
export const notify = {
  success: showSuccess,
  error: showError,
  info: showInfo,
  warning: showWarning,
  loading: showLoading,
  custom: showCustom,
  update: updateToast,
  dismiss: toast.dismiss,
  dismissAll: dismissAllToasts,
}; 