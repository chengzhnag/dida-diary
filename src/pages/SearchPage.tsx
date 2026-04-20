import React, { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useShallow } from 'zustand/react/shallow';
import { Search, X, Calendar, Tag, LayoutGrid } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
export function SearchPage() {
  const navigate = useNavigate();
  const diaries = useAppStore(useShallow(s => s.diaries));
  const [query, setQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const filtered = React.useMemo(() => {
    return diaries.filter(d => {
      const matchesQuery = !query ||
        (d.title || '').toLowerCase().includes(query.toLowerCase()) ||
        (d.content || '').toLowerCase().includes(query.toLowerCase()) ||
        (d.tags || []).some(t => t.toLowerCase().includes(query.toLowerCase())) ||
        (d.categories || []).some(c => c.toLowerCase().includes(query.toLowerCase()));
      const matchesStart = !startDate || (d.date || '') >= startDate;
      const matchesEnd = !endDate || (d.date || '') <= endDate;
      return matchesQuery && matchesStart && matchesEnd;
    });
  }, [diaries, query, startDate, endDate]);
  return (
    <div className="min-h-full bg-[#FFF7ED]">
      <header className="sticky top-0 z-40 bg-[#FFF7ED]/80 backdrop-blur-md p-4 border-b border-orange-100 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索关键词、标签、分类..."
            className="pl-10 pr-10 h-12 bg-white rounded-2xl border-none shadow-sm focus:ring-orange-500"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">
              <X size={18} />
            </button>
          )}
        </div>
        <div className="flex gap-2 items-center">
          <div className="flex-1 flex items-center gap-2 bg-white px-3 py-2 rounded-xl shadow-sm border border-orange-50">
            <Calendar size={12} className="text-zinc-400" />
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="text-[10px] w-full bg-transparent border-none p-0 focus:ring-0"
            />
          </div>
          <span className="text-zinc-300">至</span>
          <div className="flex-1 flex items-center gap-2 bg-white px-3 py-2 rounded-xl shadow-sm border border-orange-50">
            <Calendar size={12} className="text-zinc-400" />
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="text-[10px] w-full bg-transparent border-none p-0 focus:ring-0"
            />
          </div>
        </div>
      </header>
      <div className="p-4 space-y-3">
        {(query || startDate || endDate) ? (
          filtered.length > 0 ? (
            filtered.map((d) => (
              <motion.div
                key={d.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => navigate(`/editor/diary/${d.id}`)}
                className="bg-white p-4 rounded-2xl shadow-sm border border-orange-50"
              >
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-zinc-800 truncate">{d.title}</h3>
                  <span className="text-[10px] text-zinc-400 italic">{d.date}</span>
                </div>
                <p className="text-xs text-zinc-500 line-clamp-1 mb-2">{d.content}</p>
                <div className="flex flex-wrap gap-1">
                  {(d.categories || []).map(c => (
                    <Badge key={c} variant="outline" className="text-[8px] px-1 py-0 bg-blue-50 text-blue-500 border-none">
                      {c}
                    </Badge>
                  ))}
                  {(d.tags || []).map(t => (
                    <span key={t} className="text-[8px] text-orange-400">#{t}</span>
                  ))}
                </div>
              </motion.div>
            ))
          ) : (
            <div className="py-20 text-center text-zinc-400">时光机未找到相关碎片</div>
          )
        ) : (
          <div className="py-20 text-center text-zinc-400 space-y-2">
            <Search className="mx-auto text-zinc-200" size={48} />
            <p>输入关键词或筛选日期</p>
          </div>
        )}
      </div>
    </div>
  );
}