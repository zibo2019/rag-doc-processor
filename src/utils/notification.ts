import { toast } from 'react-hot-toast';

// 显示错误提示
export const showError = (message: string) => {
  toast.error(message, {
    duration: 3000,
    position: 'top-right',
  });
};

// 显示成功提示
export const showSuccess = (message: string) => {
  toast.success(message, {
    duration: 3000,
    position: 'top-right',
  });
};

// 显示加载提示
export const showLoading = (message: string) => {
  return toast.loading(message, {
    position: 'top-right',
  });
};

// 更新已存在的 toast
export const updateToast = (toastId: string, message: string, type: 'success' | 'error') => {
  toast.dismiss(toastId);
  if (type === 'success') {
    showSuccess(message);
  } else {
    showError(message);
  }
}; 