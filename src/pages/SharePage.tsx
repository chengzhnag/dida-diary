import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Lock, BookOpen, Calendar, Tag, ChevronLeft, Loader2 } from 'lucide-react';
import { MarkdownPreview } from '@/components/editor/MarkdownPreview';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DiaryEntry, ApiResponse } from '@shared/types';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
export default function SharePage() {
  const { id } = useParams<{ id: string }>();
  const [password, setPassword] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [diary, setDiary] = useState<DiaryEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const handleUnlock = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!password.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/public/diaries/${id}?pass=${encodeURIComponent(password)}`);
      const json = await res.json() as ApiResponse<DiaryEntry>;
      if (res.ok && json.success && json.data) {
        setDiary(json.data);
        setIsUnlocked(true);
        toast.success('时光碎片已成功开启');
      } else {
        toast.error(json.error || '访问密码似乎不正确');
        setPassword('');
        inputRef.current?.focus();
      }
    } catch (err) {
      toast.error('无法连接到时光长廊，请检查网络');
    } finally {
      setLoading(false);
    }
  };
  if (!isUnlocked) {
    return (
      <div className="min-h-[100dvh] bg-[#FFF7ED] flex flex-col items-center justify-center p-6 select-none">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm space-y-10 text-center"
        >
          <div className="space-y-4">
            <div className="mx-auto w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center text-orange-500 shadow-xl shadow-orange-500/5 border border-orange-50">
              <Lock size={36} strokeWidth={1.5} />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">受保护的时光</h1>
              <p className="text-zinc-500 text-sm max-w-[200px] mx-auto leading-relaxed">
                输入这段时光的访问密码，共同回顾那份珍贵的回忆
              </p>
            </div>
          </div>
          <form onSubmit={handleUnlock} className="space-y-4">
            <Input
              ref={inputRef}
              type="password"
              placeholder="请输入访问密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-14 text-center text-lg bg-white rounded-2xl border-orange-100 focus:ring-2 focus:ring-orange-500 shadow-sm"
              autoFocus
              disabled={loading}
            />
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-orange-500 hover:bg-orange-600 rounded-2xl text-lg font-bold shadow-lg shadow-orange-500/30 text-white active:scale-95 transition-all"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              ) : (
                '开启时光'
              )}
            </Button>
          </form>
          <Link to="/" className="inline-flex items-center text-zinc-400 text-xs hover:text-orange-500 transition-colors font-medium">
            <ChevronLeft size={14} className="mr-1" /> 开启我的日记长廊
          </Link>
        </motion.div>
      </div>
    );
  }
  return (
    <div className="min-h-[100dvh] bg-[#FFF7ED] flex flex-col">
      <header className="sticky top-0 z-40 bg-[#FFF7ED]/90 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-orange-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
            <BookOpen size={16} />
          </div>
          <span className="text-sm font-bold text-zinc-800 tracking-tight">时光共赏</span>
        </div>
        <Link to="/" className="text-[10px] text-orange-500 font-bold bg-orange-50 px-3 py-1.5 rounded-full uppercase tracking-widest transition-colors hover:bg-orange-100">
          记录我的生活
        </Link>
      </header>
      <main className="flex-1 p-6 space-y-8 max-w-2xl mx-auto w-full">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <h1 className="text-3xl font-bold text-zinc-900 leading-tight tracking-tight">
            {diary?.title}
          </h1>
          <div className="flex items-center gap-3 text-xs text-zinc-400 font-medium">
            <span className="flex items-center gap-1.5">
              <Calendar size={13} className="text-orange-400" /> {diary?.date}
            </span>
            {diary?.categories?.map(cat => (
              <Badge key={cat} variant="outline" className="bg-blue-50 text-blue-500 border-none text-[9px] px-2">
                {cat}
              </Badge>
            ))}
          </div>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-[2.5rem] p-8 shadow-soft border border-orange-50 min-h-[400px] relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none">
            <BookOpen size={120} />
          </div>
          {diary?.isMarkdown ? (
            <MarkdownPreview content={diary.content} />
          ) : (
            <p className="text-zinc-700 leading-relaxed whitespace-pre-wrap text-lg font-light">
              {diary?.content}
            </p>
          )}
        </motion.div>
        {diary?.tags && diary.tags.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap gap-2 pt-2"
          >
            {diary.tags.map(tag => (
              <span key={tag} className="text-xs text-orange-400 font-medium flex items-center gap-1.5 bg-orange-50 px-2 py-1 rounded-lg">
                <Tag size={11} /> #{tag}
              </span>
            ))}
          </motion.div>
        )}
      </main>
      <footer className="p-12 text-center text-zinc-300 text-[10px] space-y-1.5 font-medium">
        <p>© Memos & Whispers · 让每一刻都值得被珍藏</p>
        <p className="text-zinc-200">由 纯粹日记 提供技术支持</p>
      </footer>
    </div>
  );
}