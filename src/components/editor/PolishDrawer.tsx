import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, Check, X, Copy, ChevronRight } from 'lucide-react';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { PolishStylePreset, PolishResponse } from '@shared/types';

interface PolishDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: string;
  onApplyPolish: (polished: string) => void;
}

type PolishMode = 'preset' | 'custom';

const CUSTOM_PROMPT_EXAMPLES = [
  {
    title: '古文言风格',
    prompt: '你是一位古代文人。请用古文言的方式重写输入的内容，使用典雅的文言词汇和句式。根据语义适当添加换行符。仅输出重写后的内容，不要包含任何解释。'
  },
  {
    title: '科技术语风格',
    prompt: '你是一位技术博客作者。请用专业的科技术语和现代表达重写输入的内容。根据语义适当添加换行符。仅输出重写后的内容，不要包含任何解释。'
  },
  {
    title: '儿童故事风格',
    prompt: '你是一位儿童文学作家。请用简单有趣的语言重写输入的内容，让小朋友容易理解。根据语义适当添加换行符。仅输出重写后的内容，不要包含任何解释。'
  },
];

export function PolishDrawer({ open, onOpenChange, content, onApplyPolish }: PolishDrawerProps) {
  const [styles, setStyles] = useState<Array<{ id: string; name: string; description: string }>>([]);
  const [selectedStyleId, setSelectedStyleId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [polishResult, setPolishResult] = useState<PolishResponse | null>(null);
  const [stylesLoading, setStylesLoading] = useState(true);
  const [mode, setMode] = useState<PolishMode>('preset');
  const [customPrompt, setCustomPrompt] = useState('');
  const [showExamples, setShowExamples] = useState(false);

  // 获取风格列表
  useEffect(() => {
    const fetchStyles = async () => {
      try {
        const token = localStorage.getItem('whisper_token');
        const res = await fetch('/api/polish-styles', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });
        const data = await res.json();
        if (data.success && data.data) {
          setStyles(data.data);
          setSelectedStyleId(data.data[0]?.id || '');
        }
      } catch (e) {
        console.error('Failed to fetch styles:', e);
        toast.error('加载风格列表失败');
      } finally {
        setStylesLoading(false);
      }
    };

    if (open) {
      fetchStyles();
      setMode('preset');
      setCustomPrompt('');
      setShowExamples(false);
      setPolishResult(null);
    }
  }, [open]);

  const handlePolish = async () => {
    if (!content.trim()) {
      toast.error('请输入要润色的内容');
      return;
    }

    if (mode === 'preset' && !selectedStyleId) {
      toast.error('请选择一个风格');
      return;
    }

    if (mode === 'custom' && !customPrompt.trim()) {
      toast.error('请输入自定义提示词');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('whisper_token');
      const requestBody = {
        content,
        ...(mode === 'preset' ? { styleId: selectedStyleId } : { customSystemPrompt: customPrompt })
      };

      const res = await fetch('/api/polish', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      const data = await res.json();
      if (data.success && data.data) {
        setPolishResult(data.data);
        toast.success('润色完成');
      } else {
        toast.error(data.error || '润色失败');
      }
    } catch (e) {
      console.error('Polish failed:', e);
      toast.error('润色失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (polishResult) {
      onApplyPolish(polishResult.polished);
      onOpenChange(false);
      toast.success('已应用润色内容');
    }
  };

  const handleCopy = () => {
    if (polishResult) {
      navigator.clipboard.writeText(polishResult.polished);
      toast.success('已复制到剪贴板');
    }
  };

  const insertExample = (prompt: string) => {
    setCustomPrompt(prompt);
    setShowExamples(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="rounded-t-3xl bg-white border-t border-orange-100 max-h-[85vh]">
        <DrawerHeader className="border-b border-orange-50 sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between w-full">
            <DrawerTitle className="flex items-center gap-2 text-lg font-bold text-zinc-900">
              <Sparkles size={20} className="text-orange-500" />
              AI润色
            </DrawerTitle>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <X size={18} />
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <div className="overflow-y-auto flex-1 p-4 space-y-4">
          {/* 模式切换 */}
          {!polishResult && (
            <div className="flex gap-2">
              <button
                onClick={() => setMode('preset')}
                className={cn(
                  'flex-1 py-2.5 px-3 rounded-2xl font-bold text-sm transition-all',
                  mode === 'preset'
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'bg-gray-100 text-zinc-600 hover:bg-gray-200'
                )}
              >
                预设风格
              </button>
              <button
                onClick={() => setMode('custom')}
                className={cn(
                  'flex-1 py-2.5 px-3 rounded-2xl font-bold text-sm transition-all',
                  mode === 'custom'
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'bg-gray-100 text-zinc-600 hover:bg-gray-200'
                )}
              >
                自定义
              </button>
            </div>
          )}

          {/* 预设风格选择 */}
          {!polishResult && mode === 'preset' && (
            <>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 mb-3">选择风格</h3>
                {stylesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="animate-spin text-orange-500" size={24} />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {styles.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => setSelectedStyleId(style.id)}
                        className={cn(
                          'text-left p-3 rounded-2xl border transition-all',
                          selectedStyleId === style.id
                            ? 'bg-orange-50 border-orange-300 shadow-sm'
                            : 'bg-gray-50 border-gray-200 hover:border-orange-200'
                        )}
                      >
                        <div className="font-bold text-sm text-zinc-900">{style.name}</div>
                        <div className="text-xs text-zinc-500 mt-1">{style.description}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <Button
                onClick={handlePolish}
                disabled={loading || !selectedStyleId || !content.trim()}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-2xl h-11 font-bold gap-2 active:scale-95 transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    润色中...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    开始润色
                  </>
                )}
              </Button>
            </>
          )}

          {/* 自定义风格 */}
          {!polishResult && mode === 'custom' && (
            <>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-bold text-zinc-900">自定义提示词</label>
                    <button
                      onClick={() => setShowExamples(!showExamples)}
                      className="text-xs text-orange-500 hover:text-orange-600 font-bold flex items-center gap-1"
                    >
                      查看示例 <ChevronRight size={14} />
                    </button>
                  </div>
                  <textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="输入你的自定义提示词，例如：你是一位...，请用...的风格重写内容..."
                    className="w-full h-24 p-3 rounded-2xl border border-orange-100 focus:border-orange-300 focus:ring-1 focus:ring-orange-200 resize-none text-sm text-zinc-700 focus:outline-none"
                  />
                  <p className="text-xs text-zinc-400 mt-2">
                    提示：好的提示词应该明确角色、风格和要求。例如："你是一位诗人，请用诗意的语言重写内容，保留原意。"
                  </p>
                </div>

                {/* 示例卡片 */}
                {showExamples && (
                  <div className="bg-blue-50 rounded-2xl p-3 space-y-2 border border-blue-100">
                    <h4 className="text-sm font-bold text-blue-900">示例提示词</h4>
                    {CUSTOM_PROMPT_EXAMPLES.map((example, idx) => (
                      <div
                        key={idx}
                        className="bg-white rounded-xl p-2.5 border border-blue-100 hover:border-blue-300 cursor-pointer transition-all group"
                        onClick={() => insertExample(example.prompt)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="text-xs font-bold text-blue-900">{example.title}</div>
                            <div className="text-xs text-zinc-600 mt-1 line-clamp-2 group-hover:line-clamp-none">
                              {example.prompt}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 ml-2 shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              insertExample(example.prompt);
                            }}
                          >
                            <Check size={14} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button
                onClick={handlePolish}
                disabled={loading || !customPrompt.trim() || !content.trim()}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-2xl h-11 font-bold gap-2 active:scale-95 transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    润色中...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    开始润色
                  </>
                )}
              </Button>
            </>
          )}

          {/* 润色结果 */}
          {polishResult && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 mb-2">原文</h3>
                <div className="bg-gray-50 rounded-2xl p-3 text-sm text-zinc-700 leading-relaxed max-h-32 overflow-y-auto whitespace-pre-wrap">
                  {polishResult.original}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-zinc-900 mb-2">
                  润色结果 ({polishResult.styleName})
                </h3>
                <div className="bg-orange-50 rounded-2xl p-3 text-sm text-zinc-700 leading-relaxed max-h-32 overflow-y-auto border border-orange-200 whitespace-pre-wrap">
                  {polishResult.polished}
                </div>
              </div>

              <div className="text-xs text-zinc-500 flex items-center justify-between px-2">
                <span>
                  字数: {polishResult.wordCountBefore} → {polishResult.wordCountAfter}
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleCopy}
                  variant="outline"
                  className="flex-1 rounded-2xl border-orange-200 hover:bg-orange-50 text-zinc-700 h-11 font-bold gap-2"
                >
                  <Copy size={16} />
                  复制
                </Button>
                <Button
                  onClick={handleApply}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl h-11 font-bold gap-2 active:scale-95 transition-all"
                >
                  <Check size={16} />
                  应用
                </Button>
              </div>

              <Button
                onClick={() => setPolishResult(null)}
                variant="ghost"
                className="w-full text-zinc-500 hover:text-zinc-700 h-10 font-bold"
              >
                返回选择风格
              </Button>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
