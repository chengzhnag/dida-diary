import React from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { DiaryEntry } from '@shared/types';
import { format, parseISO, isValid } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Tag, Calendar, Edit3, Trash2, X, Clock } from 'lucide-react';
import { MarkdownPreview } from '@/components/editor/MarkdownPreview';
import { useNavigate } from 'react-router-dom';
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
interface DiaryPreviewDrawerProps {
  diary: DiaryEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (id: string) => Promise<void>;
}
export function DiaryPreviewDrawer({ diary, open, onOpenChange, onDelete }: DiaryPreviewDrawerProps) {
  const navigate = useNavigate();
  if (!diary) return null;
  const safeFormatDate = (dateStr: string) => {
    try {
      const d = parseISO(dateStr);
      return isValid(d) ? format(d, 'yyyy年MM月dd日 EEEE', { locale: zhCN }) : dateStr;
    } catch {
      return dateStr;
    }
  };
  const handleEdit = () => {
    onOpenChange(false);
    navigate(`/editor/${diary.id}`);
  };
  const handleDelete = async () => {
    await onDelete(diary.id);
    onOpenChange(false);
  };
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[92vh] bg-[#FFF7ED] border-none rounded-t-[2.5rem] flex flex-col">
        <DrawerHeader className="px-6 pb-2 pt-6 shrink-0">
          <div className="flex justify-between items-start gap-4">
            <div className="space-y-1 text-left flex-1">
              <div className="flex items-center gap-2 text-[10px] font-bold text-orange-400 uppercase tracking-widest">
                <Calendar size={12} />
                {safeFormatDate(diary.date)}
              </div>
              <DrawerTitle className="text-2xl pt-2 font-bold text-zinc-900 leading-tight">
                {diary.title || '无题'}
              </DrawerTitle>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => onOpenChange(false)}
              className="rounded-full bg-white/50 border border-orange-50 text-zinc-400 h-10 w-10 shrink-0"
            >
              <X size={20} />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {(diary.categories || []).map(cat => (
              <Badge key={cat} variant="secondary" className="bg-blue-50 text-blue-500 border-none px-2.5 py-0.5 rounded-lg text-[10px] font-bold">
                {cat}
              </Badge>
            ))}
            {(diary.tags || []).map(tag => (
              <Badge key={tag} variant="outline" className="bg-orange-50/50 text-orange-400 border-orange-100 px-2 py-0.5 rounded-lg text-[10px] flex items-center gap-1">
                <Tag size={10} /> {tag}
              </Badge>
            ))}
          </div>
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto px-6 py-4 hide-scrollbar">
          <div className="bg-white rounded-3xl p-4 shadow-sm border border-orange-50/50 min-h-[200px]">
            {diary.isMarkdown ? (
              <MarkdownPreview content={diary.content} />
            ) : (
              <p className="text-zinc-600 leading-relaxed whitespace-pre-wrap text-base">
                {diary.content || <span className="text-zinc-300 italic">暂无内容...</span>}
              </p>
            )}
            <div className="mt-8 pt-6 border-t border-zinc-50 flex items-center justify-between text-[10px] text-zinc-400 font-medium">
              <div className="flex items-center gap-1.5">
                <Clock size={12} />
                记录于 {format(diary.createdAt || Date.now(), 'HH:mm:ss')}
              </div>
              <div className="italic font-mono">ID: {diary.id.slice(0, 8)}</div>
            </div>
          </div>
        </div>
        <DrawerFooter className="p-6 pt-2 bg-white/50 backdrop-blur-sm border-t border-orange-100/50 shrink-0">
          <div className="flex gap-3">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" className="flex-1 h-14 rounded-2xl text-red-500 hover:text-red-600 hover:bg-red-50 font-bold gap-2">
                  <Trash2 size={18} /> 抹除记忆
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-3xl max-w-[320px] bg-white border-orange-100 shadow-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-bold">确定要抹除这段时光吗？</AlertDialogTitle>
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
            <Button onClick={handleEdit} className="flex-[2] h-14 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold gap-2 shadow-lg shadow-orange-500/20 active:scale-95 transition-all">
              <Edit3 size={18} /> 编辑时光
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}