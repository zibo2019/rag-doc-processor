import React from 'react';
import { useConfigStore } from '@/stores/configStore';
import { Badge } from '@/components/ui/badge';

export const ApiStatus: React.FC = () => {
  const { isConfigured } = useConfigStore();
  
  // 如果 API 已配置，不显示任何内容
  if (isConfigured) {
    return null;
  }

  // 只在 API 未配置时显示红色提示
  return (
    <Badge variant="destructive">
      API 未配置
    </Badge>
  );
}; 