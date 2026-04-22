import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Plus, History, Tag, Settings, Search, X, Calendar as CalendarIcon, Loader2, ClockPlus, Trash2, MoreVertical, Edit3, ArrowUp } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useShallow } from 'zustand/react/shallow';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO, isValid } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { SettingsDrawer } from '@/components/settings/SettingsDrawer';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DiaryPreviewDrawer } from '@/components/diaries/DiaryPreviewDrawer';
import { cn } from '@/lib/utils';
import { DiaryEntry } from '@shared/types';
import { useDebounce } from 'react-use';

export function DiariesPage() {
  const navigate = useNavigate();
  const diaries = useAppStore(useShallow(s => s.diaries));
  const totalCount = useAppStore(s => s.totalCount);
  const isLoading = useAppStore(s => s.isLoading);
  const hasMore = useAppStore(s => s.hasMore);
  const searchQuery = useAppStore(s => s.searchQuery);
  const fetchDiaries = useAppStore(s => s.fetchDiaries);
  const deleteDiary = useAppStore(s => s.deleteDiary);
  const setSearchQuery = useAppStore(useShallow(s => s.setSearchQuery));
  const isListUnlocked = useAppStore(s => s.isListUnlocked);
  const [showSearch, setShowSearch] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = React.useState<string | null>(null);
  const [selectedDiary, setSelectedDiary] = useState<DiaryEntry | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const scrollTopTimingRef = useRef(null);
  const isFiltered = keyword.trim() !== '' || startDate !== '' || endDate !== '';

  useEffect(() => {
    console.log('diaries', diaries)
    console.log('hasMore', hasMore)
  }, [hasMore, diaries])

  const groupedDiaries = useMemo(() => {
    const groups: Record<string, DiaryEntry[]> = {};
    diaries.forEach(diary => {
      const year = diary.date ? diary.date.slice(0, 4) : '未知年份';
      if (!groups[year]) groups[year] = [];
      groups[year].push(diary);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [diaries]);

  useEffect(() => {
    // If not loading and not unlocked, force verification
    if (!isLoading && !isListUnlocked) {
      navigate('/verify', { replace: true });
    }
  }, [isListUnlocked, isLoading, navigate]);

  const safeFormatDate = (dateStr: string, formatStr: string) => {
    try {
      const date = parseISO(dateStr);
      if (!isValid(date)) return '??';
      return format(date, formatStr, { locale: zhCN });
    } catch (e) {
      return '??';
    }
  };

  const scrollToYear = (year: string) => {
    const element = document.getElementById(`year-${year}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // 平滑滚动到顶部
  function scrollToTopAndWait() {
    return new Promise((resolve) => {
      // 开始平滑滚动
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // 检测滚动是否完成
      const checkScroll = () => {
        if (window.scrollY === 0) {
          // 滚动已完成
          resolve(true);
          if (scrollTopTimingRef.current) {
            clearTimeout(scrollTopTimingRef.current);
          }
          scrollTopTimingRef.current = null;
          window.removeEventListener('scroll', checkScroll);
        } else {
          // 继续检测
          scrollTopTimingRef.current = setTimeout(checkScroll, 50);
        }
      };

      // 添加滚动事件监听
      window.addEventListener('scroll', checkScroll);
      checkScroll(); // 立即检查一次
    });
  }

  const handleSearch = () => {
    if (scrollTopTimingRef.current) return;
    scrollToTopAndWait().then(() => {
      setSearchQuery({ q: keyword, startDate, endDate });
      fetchDiaries({ q: keyword, startDate, endDate, append: false });
    });
  };

  const handleReset = () => {
    if (scrollTopTimingRef.current) return;
    scrollToTopAndWait().then(() => {
      setKeyword('');
      setStartDate('');
      setEndDate('');
      setSearchQuery({});
      fetchDiaries({ append: false });
    });
  };

  // 无尽滚动观察器
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasMore && !isLoading && isListUnlocked) {
          fetchDiaries({ ...searchQuery, append: true });
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );
    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }
    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasMore, isLoading, isListUnlocked, fetchDiaries, searchQuery]);

  if (!isListUnlocked && !isLoading) return null;

  return (
    <div className="relative min-h-full bg-[#FFF7ED] flex flex-col">
      <header className="sticky top-0 z-50 bg-[#FFF7ED]/95 backdrop-blur-lg px-6 py-4 border-b border-orange-100 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <div className="flex items-baseline gap-2">
                <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">时光回顾</h1>
                <span className="text-[10px] text-orange-400 font-bold uppercase tracking-widest italic">滴答</span>
              </div>
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                key={isFiltered ? `filtered-${diaries.length}` : `total-${totalCount}`}
                className="flex items-center gap-1 mt-0.5"
              >
                <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", isFiltered ? "bg-blue-400" : "bg-orange-400")} />
                <span className="text-[10px] text-zinc-400 font-medium tracking-tight">
                  {isFiltered
                    ? `为您检索到 ${diaries.length} 条时光碎片`
                    : `时光长廊里共珍藏 ${totalCount} 段记忆`
                  }
                </span>
              </motion.div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSearch(!showSearch)}
              className={cn("h-10 w-10 transition-all rounded-xl", showSearch ? "text-orange-500 bg-orange-50 shadow-inner" : "text-zinc-400 hover:text-orange-500")}
            >
              <Search size={20} />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(true)} className="h-10 w-10 text-zinc-400 hover:text-zinc-600 rounded-xl">
              <Settings size={20} />
            </Button>
          </div>
        </div>
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mt-4 space-y-3"
              style={{ padding: '2px' }}
            >
              <div className="relative">
                <Input
                  placeholder="搜索标题、内容或标签..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="bg-white border-orange-100 pl-9 rounded-xl text-sm h-11 shadow-sm focus:border-orange-300"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-300" size={16} />
                {keyword && (
                  <button onClick={() => setKeyword('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-300 hover:text-zinc-400 p-1">
                    <X size={14} />
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Input
                    placeholder='选择开始日期筛选'
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="bg-white border-orange-100 pl-9 rounded-xl text-[11px] h-10 shadow-sm focus:border-orange-300 appearance-none"
                  />
                  <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-300 pointer-events-none" size={14} />
                </div>
                <div className="flex-1 relative">
                  <Input
                    placeholder='选择结束日期筛选'
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="bg-white border-orange-100 pl-9 rounded-xl text-[11px] h-10 shadow-sm focus:border-orange-300 appearance-none"
                  />
                  <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-300 pointer-events-none" size={14} />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <Button
                  onClick={handleSearch}
                  disabled={isLoading}
                  className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-xl h-11 text-xs font-bold gap-2"
                >
                  {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                  执行查询
                </Button>
                <Button
                  variant="outline"
                  onClick={handleReset}
                  disabled={isLoading}
                  className="flex-1 border-orange-100 text-muted-foreground hover:bg-orange-50 rounded-xl h-11 text-xs font-bold gap-2"
                >
                  <X size={16} />
                  重置条件
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
      <div className="flex-1 p-6 relative pb-14 w-full">
        <div className="absolute left-[39px] top-8 bottom-8 w-px bg-gradient-to-b from-orange-100 " />
        {groupedDiaries.length === 0 && !isLoading ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="h-[60vh] flex flex-col items-center justify-center text-zinc-300 space-y-6"
          >
            <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center">
              <History size={48} strokeWidth={1} className="text-orange-200" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-zinc-500 font-bold">{isFiltered ? '未发现匹配的时光' : '空旷的时光长廊'}</p>
              <p className="text-zinc-400 text-xs italic px-10 leading-relaxed">
                {isFiltered
                  ? '换个关键词或日期范围，或许会有惊喜？'
                  : '滴答之间，留下这一刻的温柔... 点击右下角，开始记录此刻。'}
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-10">
            {groupedDiaries.map(([year, yearDiaries]) => (
              <section key={year} id={`year-${year}`} className="relative scroll-mt-44">
                <div
                  onClick={() => scrollToYear(year)}
                  className={cn('year-sticky-header sticky top-20 z-40 mb-8 py-2 -mx-2 px-2 rounded-2xl flex items-center gap-3 cursor-pointer group active:scale-[0.98] transition-all', showSearch ? 'top-50' : '')}
                  style={{ top: showSearch ? '254px' : '80px' }}
                >
                  <div className="h-0.5 flex-1 bg-gradient-to-r from-transparent to-orange-100/30 to-orange-200 transition-colors" />
                  <div className="flex flex-col items-center">
                    <span className="text-lg font-black text-primary/90 tracking-tighter drop-shadow-sm px-4 py-1 rounded-full bg-white/90 border border-orange-100/50 shadow-sm backdrop-blur-sm bg-primary border-primary transition-all duration-300">
                      {year}
                    </span>
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      whileHover={{ opacity: 1, y: 0 }}
                      className="absolute -bottom-5 flex items-center gap-1 opacity-0 opacity-100 transition-all"
                    >
                      <ArrowUp size={10} className="text-primary" />
                      <span className="text-[8px] font-bold text-primary uppercase tracking-tighter">回到顶部</span>
                    </motion.div>
                  </div>
                  <div className="h-0.5 flex-1 bg-gradient-to-l from-transparent to-orange-100/30 to-orange-200 transition-colors" />
                </div>
                <div className="space-y-10">
                  {yearDiaries.map((diary, index) => (
                    <motion.div
                      key={diary.id}
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: Math.min(index * 0.02, 0.2) }}
                      className="relative flex gap-5 group"
                    >
                      <div className="flex flex-col items-center z-10 w-8 shrink-0 pt-1">
                        <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-[11px] font-bold shadow-lg shadow-orange-500/20">
                          {diary.date?.split('-')[2] || '??'}
                        </div>
                        <div className="text-[10px] text-orange-400 font-bold mt-1 uppercase tracking-tighter">
                          {safeFormatDate(diary.date, 'MMM')}
                        </div>
                      </div>
                      <motion.div
                        whileTap={{ scale: 0.98 }}
                        onClick={() => { setIsPreviewOpen(true); setSelectedDiary(diary) }}
                        className="flex-1 overflow-hidden bg-white rounded-2xl p-5 shadow-sm border border-orange-50 cursor-pointer hover:border-orange-200 transition-all hover:shadow-xl hover:shadow-orange-500/5"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-zinc-800 line-clamp-1 text-lg group-hover:text-orange-600 transition-colors">{diary.title}</h3>
                          <div className="flex items-center gap-1.5">
                            {diary.isMarkdown && <Badge variant="secondary" className="bg-zinc-50 text-zinc-400 text-[8px] h-6 font-mono">MD</Badge>}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-slate-600 rounded-full">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="rounded-xl w-32 shadow-md shadow-zinc-100/50 bg-white">
                                <DropdownMenuItem
                                  onClick={(e) => { e.stopPropagation(); navigate(`/editor/${diary.id}`) }}
                                  className="cursor-pointer"
                                >
                                  <Edit3 className="h-4 w-4 mr-2" /> 编辑记录
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-rose-500 cursor-pointer"
                                  onClick={(e) => { e.stopPropagation(); setRecordToDelete(diary.id) }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" /> 抹除记忆
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        <p className="text-sm text-zinc-500 line-clamp-3 leading-relaxed mb-2 font-light whitespace-pre-wrap">
                          {diary.content.replace(/[#*`]/g, ' ')}
                        </p>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {(diary.categories || []).map(cat => (
                            <Badge key={cat} variant="outline" className="text-[9px] px-2 py-0.5 bg-blue-50 text-blue-500 border-none rounded-lg">
                              {cat}
                            </Badge>
                          ))}
                          {(diary.tags || []).map(tag => (
                            <span key={tag} className="text-[9px] text-orange-400 flex items-center gap-0.5 bg-orange-50/50 px-1.5 py-0.5 rounded-lg">
                              <Tag size={8} /> {tag}
                            </span>
                          ))}
                        </div>
                        <div className="text-[10px] text-zinc-400 flex items-center justify-between border-t border-zinc-50 pt-3">
                          <div className="flex items-center gap-1.5">
                            {/* <div className="w-1 h-1 rounded-full bg-zinc-300"></div> */}
                            <ClockPlus size={12} />
                            <span>{format(diary.createdAt || Date.now(), ' yyyy-MM-dd HH:mm')}</span>
                          </div>
                          {/* <span className="text-zinc-300 italic font-mono">{diary.date}</span> */}
                        </div>
                      </motion.div>
                    </motion.div>
                  ))}
                </div>
              </section>
            ))}

            {/* 无尽滚动哨兵与状态反馈 */}
            <div ref={loadMoreRef} className="mt-1 flex flex-col items-center gap-4 min-h-[60px]">
              {(hasMore && isLoading) ? (
                <div className="flex flex-col items-center gap-3 opacity-60">
                  <Loader2 size={24} className="text-orange-400 animate-spin" />
                  <p className="text-[10px] text-orange-400 font-bold uppercase tracking-widest animate-pulse">追溯时光中...</p>
                </div>
              ) : diaries.length > 0 && (
                <div className="flex flex-col items-center gap-3 py-2 opacity-30">
                  <div className="w-12 h-px bg-orange-200" />
                  <p className="text-[10px] text-orange-300 font-bold uppercase tracking-widest italic text-center">
                    时光已载入全部 {totalCount} 段记忆<br />
                    此处即是思绪的尽头
                  </p>
                  <div className="w-12 h-px bg-orange-200" />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <Button
        onClick={() => navigate('/editor')}
        className="fixed bottom-10 right-6 w-16 h-16 rounded-full bg-orange-500 hover:bg-orange-600 shadow-2xl shadow-orange-500/40 flex items-center justify-center p-0 group z-50 active:scale-90 transition-all border-4 border-white"
      >
        <Plus className="text-white w-8 h-8 group-hover:rotate-90 transition-transform duration-300" />
      </Button>

      <SettingsDrawer open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />

      {/* 全屏幕 Loading */}
      {isLoading && !hasMore && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed top-0 left-0 w-full z-1001 h-full flex items-center justify-center"
        >
          <div className="bg-white rounded-3xl shadow-2xl p-8 flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-rose-500 border-t-transparent" />
            <p className="text-sm font-bold text-slate-700">加载中...</p>
          </div>
        </motion.div>
      )}

      <AlertDialog open={!!recordToDelete} onOpenChange={(open) => !open && setRecordToDelete(null)}>
        <AlertDialogContent className="rounded-3xl max-w-[320px] bg-white border-orange-100 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>确定要抹除吗？</AlertDialogTitle>
            <AlertDialogDescription>这段记忆将无法找回。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-row gap-2 pt-4">
            <AlertDialogCancel className="flex-1 mt-0 rounded-2xl border-orange-100 text-zinc-500 bg-zinc-50 h-11 text-xs">
              留着
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => recordToDelete && deleteDiary(recordToDelete)}
              className="flex-1 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-bold h-11 text-xs"
            >
              抹除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DiaryPreviewDrawer
        diary={selectedDiary}
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        onDelete={deleteDiary}
      />
    </div>
  );
}