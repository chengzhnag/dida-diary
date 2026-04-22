import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Check, Eye, EyeOff, LayoutGrid, Trash2, History, Plus, Loader2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useShallow } from 'zustand/react/shallow';
import { Button } from '@/components/ui/button';
import { MarkdownPreview } from '@/components/editor/MarkdownPreview';
import { EditorToolbar } from '@/components/editor/EditorToolbar';
import { cn, checkIsMarkdown } from '@/lib/utils';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function EditorPage({ isFirst }: { isFirst?: boolean }) {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const diaries = useAppStore(useShallow(s => s.diaries));
  const addDiary = useAppStore(s => s.addDiary);
  const updateDiary = useAppStore(s => s.updateDiary);
  const deleteDiary = useAppStore(s => s.deleteDiary);
  const isListUnlocked = useAppStore(s => s.isListUnlocked);
  const isLoading = useAppStore(s => s.isLoading);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [date, setDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [isMarkdown, setIsMarkdown] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [isCategoryError, setIsCategoryError] = useState(false);
  const [checkMdDialogVisible, setCheckMdDialogVisible] = useState(false);
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const isCheckMdDialogOnce = useRef<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const initializedIdRef = useRef<string | null>(null);

  const clear = () => {
    setTitle('');
    setContent('');
    setTags([]);
    setCategories([]);
    setDate(format(new Date(), 'yyyy-MM-dd'));
    setIsMarkdown(false);
    setIsPreview(false);
    isCheckMdDialogOnce.current = false;
  }

  useEffect(() => {
    if (id) {
      // Prevent re-initialization if we already loaded this ID
      if (initializedIdRef.current === id) return;
      const entry = diaries.find(e => e.id === id);
      if (entry) {
        setTitle(entry.title || '');
        setContent(entry.content || '');
        setTags(entry.tags || []);
        setCategories(entry.categories || []);
        setDate(entry.date || format(new Date(), 'yyyy-MM-dd'));
        setIsMarkdown(!!entry.isMarkdown);
        initializedIdRef.current = id;
      } else if (!isLoading) {
        // Only navigate away if we are not loading and still can't find it
        navigate('/diaries', { replace: true });
      }
    } else {
      // Reset for new entry
      if (initializedIdRef.current === 'new') return;
      clear();
      initializedIdRef.current = 'new';
    }
  }, [id, diaries, navigate, isLoading]);

  useEffect(() => {
    if (content && !isMarkdown) {
      const flag = checkIsMarkdown(content);
      if (flag && !isCheckMdDialogOnce.current) {
        setCheckMdDialogVisible(true);
        isCheckMdDialogOnce.current = true
      }
    }
  }, [content, isMarkdown]);

  const handleSave = async () => {
    setIsEmojiOpen(false);
    setLoading(true);
    // Auto-include pending category
    let finalCategories = [...categories];
    const trimmedNewCat = newCategory.trim();
    if (trimmedNewCat && !finalCategories.includes(trimmedNewCat)) {
      finalCategories.push(trimmedNewCat);
    }
    const data = {
      title: title.trim() || `${date}日记`,
      content,
      tags: tags.map(t => t.trim()).filter(Boolean),
      categories: finalCategories.map(c => c.trim()).filter(Boolean),
      date,
      isMarkdown,
      isLocked: true
    };
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    try {
      if (id) {
        await updateDiary(id, data);
        toast.success('时光印记已更新');
        setTimeout(() => navigate('/diaries', { replace: true }), 300);
      } else {
        await addDiary(data);
        toast.success('已安全存入滴答日记');
        if (location.pathname === '/editor') {
          setTimeout(() => navigate('/diaries', { replace: true }), 300);
        } else {
          clear();
        }
      }
    } catch (e) {
      toast.error('时光同步失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteDiary(id);
      toast.success('这段记忆已被温柔抹除');
      navigate('/diaries', { replace: true });
    } catch (e) {
      toast.error('删除失败');
    }
  };

  const handleGoToList = () => {
    setIsEmojiOpen(false);
    if (isListUnlocked) {
      navigate('/diaries');
    } else {
      navigate('/verify');
    }
  };

  const insertTextAtCursor = (text: string) => {
    if (!textareaRef.current) return;
    const { selectionStart, selectionEnd, value } = textareaRef.current;
    const nextVal = value.substring(0, selectionStart) + text + value.substring(selectionEnd);
    setContent(nextVal);
    setTimeout(() => {
      textareaRef.current?.focus();
      const newPos = selectionStart + text.length;
      textareaRef.current?.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const onKeepTextareaFocus = () => {
    if (!textareaRef.current) return;
    textareaRef.current.focus();
  }

  const addCategory = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newCategory.trim()) {
      e.preventDefault();
      const val = newCategory.trim();
      if (categories.includes(val)) {
        setIsCategoryError(true);
        setTimeout(() => setIsCategoryError(false), 500);
        return;
      }
      setCategories([...categories, val]);
      setNewCategory('');
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-[#FFF7ED]">
      <header className="flex items-center justify-between px-4 py-3 bg-[#FFF7ED]/80 backdrop-blur-md border-b border-orange-100 z-10 shrink-0">
        <div className="flex items-center">
          {isFirst ? null : (
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full text-zinc-600 shrink-0 h-9 w-9">
              <ChevronLeft size={24} />
            </Button>
          )}
          <div className="flex flex-col">
            <span className="text-[16px] font-bold text-orange-500 bg-orange-50 py-0.5 rounded-full uppercase tracking-widest w-fit">
              {id ? '修正记忆' : '记录此刻'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {id && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setIsEmojiOpen(false);
                initializedIdRef.current = null;
                navigate('/editor');
              }}
              className="rounded-full hover:text-orange-500 h-9 w-9"
              title="新建记录"
            >
              <Plus size={18} />
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={handleGoToList}
            className="rounded-full hover:text-orange-500 transition-colors gap-1.5 h-9 px-3"
          >
            <History size={18} />
            <span className="text-xs font-bold hidden xs:inline">时光</span>
          </Button>
          {id && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full hover:text-red-400 h-9 w-9">
                  <Trash2 size={18} />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-3xl max-w-[320px] bg-white border-orange-100 shadow-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-zinc-900 font-bold">要抹除这段时光吗？</AlertDialogTitle>
                  <AlertDialogDescription className="text-zinc-500 text-xs leading-relaxed">
                    此操作无法撤回。抹除后，这段珍贵的回忆将从您的时光长廊中彻底消失。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex flex-row gap-2 pt-4">
                  <AlertDialogCancel className="flex-1 mt-0 rounded-2xl border-orange-100 text-zinc-500 bg-zinc-50 h-11 text-xs">留着它</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="flex-1 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-bold h-11 text-xs">确定抹除</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {isMarkdown && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => { setIsPreview(!isPreview); setIsEmojiOpen(false); }}
              className={cn("rounded-full h-9 w-9 transition-all", isPreview ? "text-orange-500 bg-orange-50" : "text-zinc-500")}
            >
              {isPreview ? <EyeOff size={18} /> : <Eye size={18} />}
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={Boolean(!content.trim())}
            size="sm"
            className="rounded-full bg-orange-500 hover:bg-orange-600 text-white h-9 gap-1.5 shadow-lg shadow-orange-500/20 px-4 ml-1 active:scale-95 transition-all"
          >
            {
              loading ? (
                <>
                  <Loader2 className="animate-spin" />
                  <span className="text-xs font-bold">存入</span>
                </>
              ) : (
                <>
                  <Check size={18} />
                  <span className="text-xs font-bold">存入</span>
                </>
              )
            }
          </Button>
        </div>
      </header>
      <main className="flex-1 overflow-hidden flex flex-col p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-2 shrink-0 animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-2xl shadow-sm border border-orange-50">
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              onFocus={() => setIsEmojiOpen(false)}
              className="text-[14px] font-bold text-zinc-700 bg-transparent border-none p-0 focus:ring-0 cursor-pointer w-[110px] appearance-none outline-none"
            />
          </div>
          <motion.div
            animate={isCategoryError ? { x: [-4, 4, -4, 4, 0] } : {}}
            className={cn(
              "flex-1 flex items-center gap-2 bg-white px-3 py-1.5 rounded-2xl shadow-sm border transition-colors min-w-[120px]",
              isCategoryError ? "border-red-300 bg-red-50" : "border-orange-50"
            )}
          >
            <LayoutGrid size={14} className={cn("shrink-0", isCategoryError ? "text-red-400" : "text-blue-400")} />
            <div className="flex flex-wrap gap-1 flex-1">
              {categories.map(cat => (
                <Badge key={cat} className="bg-blue-50 text-blue-600 hover:bg-blue-100 border-none text-[9px] px-1.5 py-0 flex items-center gap-1 shrink-0">
                  {cat}
                  <span onClick={() => { setCategories(categories.filter(c => c !== cat)); setIsEmojiOpen(false); }} className="cursor-pointer hover:text-red-500 leading-none">×</span>
                </Badge>
              ))}
              <input
                placeholder="+ 分类 (回车添加)"
                enterKeyHint='enter'
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                onKeyDown={addCategory}
                onFocus={() => setIsEmojiOpen(false)}
                className="flex-1 text-[14px] bg-transparent border-none p-0 focus:ring-0 placeholder:text-zinc-300 min-w-[60px] outline-none"
              />
            </div>
          </motion.div>
        </div>
        <div className="shrink-0 px-1">
          <input
            autoFocus={false}
            type="text"
            placeholder="给这段记忆起个名字..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onFocus={() => setIsEmojiOpen(false)}
            className="w-full text-2xl font-bold bg-transparent border-none focus:ring-0 placeholder:text-zinc-200 text-zinc-900 leading-tight outline-none"
          />
        </div>
        <div className={cn(
          "flex-1 bg-white rounded-[2rem] shadow-soft border border-orange-50 overflow-hidden relative group transition-all duration-300",
          isPreview && "border-orange-200"
        )}>
          {isPreview ? (
            <div className="h-full overflow-y-auto p-6 hide-scrollbar animate-in fade-in duration-300">
              <MarkdownPreview content={content || "_心之所向，笔之所往..._"} />
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              placeholder="这一刻，有什么想留下的吗..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onFocus={() => setIsEmojiOpen(false)}
              className="w-full h-full p-6 text-zinc-700 bg-transparent border-none focus:ring-0 resize-none leading-relaxed text-lg placeholder:text-zinc-200 outline-none"
            />
          )}
        </div>
      </main>
      {!isPreview && (
        <EditorToolbar
          isEmojiOpen={isEmojiOpen}
          setIsEmojiOpen={setIsEmojiOpen}
          onInsertEmoji={insertTextAtCursor}
          onInsertText={insertTextAtCursor}
          tags={tags}
          onAddTag={(tag) => !tags.includes(tag) && setTags([...tags, tag])}
          onRemoveTag={(tag) => setTags(tags.filter(t => t !== tag))}
          isMarkdown={isMarkdown}
          setIsMarkdown={setIsMarkdown}
          onKeepTextareaFocus={onKeepTextareaFocus}
        />
      )}

      <AlertDialog open={checkMdDialogVisible}>
        <AlertDialogContent className="rounded-3xl max-w-[320px] bg-white border-orange-100 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-900 font-bold">要开启Markdown模式吗？</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-500 text-xs leading-relaxed">
              检测到你的日记中包含Markdown语法，是否要开启Markdown模式？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-row gap-2 pt-4">
            <AlertDialogCancel
              onClick={() => setCheckMdDialogVisible(false)}
              className="flex-1 mt-0 rounded-2xl border-orange-100 text-zinc-500 bg-zinc-50 h-11 text-xs"
            >
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setIsMarkdown(true);
                setCheckMdDialogVisible(false);
              }}
              className="flex-1 rounded-2xl text-white font-bold h-11 text-xs"
            >
              确定
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}