import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useConfigStore } from '@/stores/configStore';

const Settings: React.FC = () => {
  const { baseUrl, apiKey, setConfig } = useConfigStore();
  
  const [formState, setFormState] = useState({
    baseUrl: baseUrl,
    apiKey: apiKey,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    setConfig(formState);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">系统设置</h1>
        
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold mb-4">API 配置</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="baseUrl">Base URL</Label>
                <Input
                  id="baseUrl"
                  name="baseUrl"
                  placeholder="https://api.openai.com/v1"
                  value={formState.baseUrl}
                  onChange={handleChange}
                />
                <p className="text-sm text-muted-foreground">
                  OpenAI 兼容模式的 API 基础 URL，默认为 OpenAI 官方地址
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  name="apiKey"
                  type="password"
                  placeholder="sk-..."
                  value={formState.apiKey}
                  onChange={handleChange}
                />
                <p className="text-sm text-muted-foreground">
                  您的 OpenAI API 密钥或兼容接口的密钥
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave}>
              保存设置
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings; 