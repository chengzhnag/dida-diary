import React, { useState } from 'react';
import { Smile, Type, Bold, Italic, List, CheckSquare, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import zh from 'emoji-picker-react/dist/data/emojis-zh';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface EditorToolbarProps {
  onInsertEmoji: (emoji: string) => void;
  onInsertText: (text: string) => void;
  tags: string[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  isMarkdown: boolean;
  setIsMarkdown: (val: boolean) => void;
}

export function EditorToolbar({
  onInsertEmoji,
  onInsertText,
  tags,
  onAddTag,
  onRemoveTag,
  isMarkdown,
  setIsMarkdown
}: EditorToolbarProps) {
  const [newTag, setNewTag] = useState('');
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTag.trim()) {
      onAddTag(newTag.trim());
      setNewTag('');
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    onInsertEmoji(emoji);
    setIsEmojiOpen(false);
  };

  const tools = [
    {
      icon: <Bold size={18} />, action: () => {
        setIsEmojiOpen(false);
        onInsertText('****');
      }, label: '加粗'
    },
    {
      icon: <Italic size={18} />, action: () => {
        setIsEmojiOpen(false);
        onInsertText('**');
      }, label: '斜体'
    },
    {
      icon: <List size={18} />, action: () => {
        setIsEmojiOpen(false);
        onInsertText('\n- ');
      }, label: '列表'
    },
    {
      icon: <CheckSquare size={18} />, action: () => {
        setIsEmojiOpen(false);
        onInsertText('\n- [ ] ');
      }, label: '任务'
    },
  ];

  return (
    <div className="border-t border-orange-100 bg-white/80 backdrop-blur-md pb-safe">
      <div className="flex flex-wrap gap-2 p-4 px-4 border-b border-orange-50">
        {tags.map(tag => (
          <Badge key={tag} variant="secondary" className="bg-orange-50 text-orange-600 gap-1 pr-1 group">
            #{tag}
            <button onClick={() => onRemoveTag(tag)} className="hover:text-orange-800">
              <X size={12} />
            </button>
          </Badge>
        ))}
        <form onSubmit={handleAddTag} className="flex-1 min-w-[80px]">
          <Input
            type="text"
            placeholder="+ 标签"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            className="w-full border-none shadow-none focus:ring-orange-500 placeholder:text-orange-300"
          />
        </form>
      </div>
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-1">
          {/* 表情按钮 */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsEmojiOpen(!isEmojiOpen)}
            className="text-zinc-500 hover:text-orange-500 active:scale-90 transition-transform"
          >
            <Smile size={22} />
          </Button>

          <div className="w-px h-6 bg-zinc-100 mx-1" />

          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setIsEmojiOpen(false);
              setIsMarkdown(!isMarkdown);
            }}
            className={cn(
              "text-zinc-500 hover:text-orange-500 active:scale-90 transition-transform",
              isMarkdown && "text-orange-500 bg-orange-50"
            )}
            title={isMarkdown ? "关闭 Markdown" : "开启 Markdown"}
          >
            <Type size={20} />
          </Button>

          {isMarkdown && (
            <>
              <div className="w-px h-6 bg-zinc-100 mx-1" />
              {tools.map((tool, i) => (
                <Button
                  key={i}
                  variant="ghost"
                  size="icon"
                  onClick={tool.action}
                  className="text-zinc-500 hover:text-orange-500 active:scale-90 transition-transform"
                >
                  {tool.icon}
                </Button>
              ))}
            </>
          )}
        </div>
      </div>

      {/* 直接渲染的 EmojiPicker */}
      {isEmojiOpen && (
        <div className="border-t border-orange-100 bg-white/80 backdrop-blur-md">
          <div className="p-0 overflow-hidden">
            <EmojiPicker
              onEmojiClick={(data) => handleEmojiSelect(data.emoji)}
              width="100%"
              height="100%"
              skinTonesDisabled
              autoFocusSearch={false}
              lazyLoadEmojis
              searchDisabled
              previewConfig={{ showPreview: false }}
              searchPlaceHolder="搜索表情..."
              theme={Theme.LIGHT}
              style={{ background: '#FFF7ED', maxHeight: '300px' }}
              emojiData={zh}
            />
          </div>
        </div>
      )}
    </div>
  );
}