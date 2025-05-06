import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AgentConfig } from '../../types/agent';
import { ExtendedAgentConfig, extendedAgentConfigSchema } from '../../types/agentExtend';
import { useAgentStore } from '../../stores/agentStore';

interface AgentFormProps {
  initialData?: ExtendedAgentConfig;
  onSubmit?: (data: ExtendedAgentConfig) => void;
  onCancel?: () => void;
}

export const AgentForm: React.FC<AgentFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
}) => {
  const { addAgent, updateAgent } = useAgentStore();

  // 确保initialData中的日期字段是Date对象
  const processedInitialData = React.useMemo(() => {
    if (!initialData) return undefined;

    const processed = { ...initialData };
    // 转换日期字符串为Date对象
    if (processed.createdAt && !(processed.createdAt instanceof Date)) {
      processed.createdAt = new Date(processed.createdAt);
    }
    if (processed.updatedAt && !(processed.updatedAt instanceof Date)) {
      processed.updatedAt = new Date(processed.updatedAt);
    }
    return processed;
  }, [initialData]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ExtendedAgentConfig>({
    resolver: zodResolver(extendedAgentConfigSchema),
    defaultValues: processedInitialData || {
      name: '',
      prompt: '',
      model: 'gpt-4o',
      rules: {
        maxTokens: 8192,
        temperature: 0.7,
      },
      isActive: true,
    },
  });

  const onSubmitForm = async (data: ExtendedAgentConfig) => {
    try {
      // 确保日期字段为Date对象
      const formData = { ...data };

      // 提交到store
      if (initialData?.id) {
        updateAgent(initialData.id, formData as AgentConfig);
      } else {
        addAgent(formData as AgentConfig);
      }
      onSubmit?.(formData);
      reset();
    } catch (error) {
      console.error('提交表单时出错:', error);
    }
  };

  // 添加表单验证错误的调试信息
  console.log('Form Errors:', errors);

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="flex flex-col h-full">
      {/* 表单内容区域 */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 左侧：基本信息和规则配置 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium border-b pb-2">基本信息</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                名称 *
              </label>
              <input
                type="text"
                {...register('name')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                模型 *
              </label>
              <input
                type="text"
                {...register('model')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="例如: gpt-4o, gpt-4"
              />
              {errors.model && (
                <p className="mt-1 text-sm text-red-600">{errors.model.message}</p>
              )}
            </div>

            {/* 处理规则 */}
            <div className="space-y-4 pt-2">
              <h3 className="text-lg font-medium border-b pb-2">规则配置</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  最大Token数 *
                </label>
                <input
                  type="number"
                  {...register('rules.maxTokens', { valueAsNumber: true })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                {errors.rules?.maxTokens && (
                  <p className="mt-1 text-sm text-red-600">{errors.rules.maxTokens.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  温度参数 *
                </label>
                <input
                  type="number"
                  step="0.1"
                  {...register('rules.temperature', { valueAsNumber: true })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                {errors.rules?.temperature && (
                  <p className="mt-1 text-sm text-red-600">{errors.rules.temperature.message}</p>
                )}
              </div>
            </div>

            {/* 状态开关 */}
            <div className="flex items-center pt-4">
              <input
                type="checkbox"
                {...register('isActive')}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label className="ml-2 block text-sm text-gray-900">
                启用该智能体
              </label>
            </div>
          </div>

          {/* 右侧：提示词配置 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium border-b pb-2">提示词设置</h3>
            <div className="h-full">
              <label className="block text-sm font-medium text-gray-700">
                提示词 *
              </label>
              <textarea
                {...register('prompt')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 h-[calc(100vh-32rem)]"
                placeholder="请输入提示词"
              />
              {errors.prompt && (
                <p className="mt-1 text-sm text-red-600">{errors.prompt.message}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 固定在底部的按钮组 */}
      <div className="flex justify-end space-x-4 px-4 py-3 bg-gray-50 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          取消
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          {isSubmitting ? '提交中...' : initialData ? '更新' : '创建'}
        </button>
      </div>
    </form>
  );
};