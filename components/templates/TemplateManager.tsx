'use client';

import React, { useState, useEffect } from 'react';
import { PromptTemplate } from '@/lib/types';
import { getTemplates, deleteTemplate, saveTemplates } from '@/lib/templates/manager';
import { getCategoryIcon, getCategoryName, getAllCategories } from '@/lib/templates/categories';
import { TemplateEditor } from './TemplateEditor';

interface TemplateManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TemplateManager({ isOpen, onClose }: TemplateManagerProps) {
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTemplate, setEditingTemplate] = useState<PromptTemplate | undefined>();
  const [showEditor, setShowEditor] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTemplates(getTemplates());
    }
  }, [isOpen]);

  // 过滤模板
  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // 按更新时间排序
  const sortedTemplates = filteredTemplates.sort((a, b) => 
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  const handleDeleteTemplate = (templateId: string) => {
    if (confirm('确定要删除这个模板吗？此操作不可撤销。')) {
      deleteTemplate(templateId);
      setTemplates(getTemplates());
    }
  };

  const handleEditTemplate = (template: PromptTemplate) => {
    setEditingTemplate(template);
    setShowEditor(true);
  };

  const handleCreateTemplate = () => {
    setEditingTemplate(undefined);
    setShowEditor(true);
  };

  const handleSaveTemplate = () => {
    setTemplates(getTemplates());
    setShowEditor(false);
    setEditingTemplate(undefined);
  };

  const handleExportTemplates = () => {
    const exportData = {
      exportTime: new Date().toISOString(),
      templates: templates,
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `langchain-chat-templates-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportTemplates = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.templates && Array.isArray(data.templates)) {
          const currentTemplates = getTemplates();
          const newTemplates = [...currentTemplates, ...data.templates];
          saveTemplates(newTemplates);
          setTemplates(newTemplates);
          alert(`成功导入 ${data.templates.length} 个模板`);
        } else {
          alert('无效的模板文件格式');
        }
      } catch (error) {
        alert('导入失败：文件格式错误');
      }
    };
    reader.readAsText(file);
    
    // 重置文件输入
    event.target.value = '';
  };

  const categories = getAllCategories();

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
          {/* 头部 */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              模板管理
            </h2>
            <div className="flex items-center gap-3">
              {/* 导入导出 */}
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportTemplates}
                  className="hidden"
                  id="import-templates"
                />
                <label
                  htmlFor="import-templates"
                  className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 cursor-pointer"
                >
                  导入
                </label>
                <button
                  onClick={handleExportTemplates}
                  className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  导出
                </button>
              </div>
              
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* 工具栏 */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* 搜索 */}
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="搜索模板..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <svg
                    className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* 分类筛选 */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    selectedCategory === 'all'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  全部 ({templates.length})
                </button>
                {categories.map(category => {
                  const count = templates.filter(t => t.category === category.id).length;
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`px-3 py-1 text-xs rounded-full transition-colors ${
                        selectedCategory === category.id
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {category.icon} {category.name} ({count})
                    </button>
                  );
                })}
              </div>

              {/* 创建按钮 */}
              <button
                onClick={handleCreateTemplate}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
              >
                创建模板
              </button>
            </div>
          </div>

          {/* 模板列表 */}
          <div className="p-4 overflow-y-auto max-h-[calc(90vh-200px)]">
            {sortedTemplates.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-12">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-lg font-medium mb-2">
                  {searchQuery || selectedCategory !== 'all' ? '未找到匹配的模板' : '暂无模板'}
                </h3>
                <p className="text-sm mb-4">
                  {searchQuery || selectedCategory !== 'all' 
                    ? '尝试调整搜索条件或分类筛选' 
                    : '创建您的第一个提示模板'
                  }
                </p>
                {!searchQuery && selectedCategory === 'all' && (
                  <button
                    onClick={handleCreateTemplate}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    创建模板
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedTemplates.map(template => (
                  <div
                    key={template.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{getCategoryIcon(template.category)}</span>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-gray-100">
                            {template.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                              {template.type}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {getCategoryName(template.category)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEditTemplate(template)}
                          className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                          title="编辑"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                          title="删除"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                      {template.description}
                    </p>

                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        {template.usageCount > 0 && (
                          <span>使用 {template.usageCount} 次</span>
                        )}
                        <span>
                          {new Date(template.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      {template.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {template.tags.slice(0, 2).map(tag => (
                            <span
                              key={tag}
                              className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                          {template.tags.length > 2 && (
                            <span className="text-xs">+{template.tags.length - 2}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 模板编辑器 */}
      <TemplateEditor
        template={editingTemplate}
        isOpen={showEditor}
        onClose={() => setShowEditor(false)}
        onSave={handleSaveTemplate}
      />
    </>
  );
}
