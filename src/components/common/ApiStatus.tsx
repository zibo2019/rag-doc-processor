import React from 'react';
import { useConfigStore } from '@/stores/configStore';
import { Badge } from '@/components/ui/badge';

export const ApiStatus: React.FC = () => {
  const { isConfigured, baseUrl } = useConfigStore();
  
  return (
    <div className="flex items-center space-x-2">
      <Badge variant={isConfigured ? 'default' : 'destructive'}>
        {isConfigured ? 'API 已配置' : 'API 未配置'}
      </Badge>
      {isConfigured && (
        <span className="text-xs text-muted-foreground truncate max-w-[150px]">
          {baseUrl}
        </span>
      )}
    </div>
  );
}; 