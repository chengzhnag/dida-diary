import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
interface MarkdownPreviewProps {
  content: string;
  className?: string;
}
export function MarkdownPreview({ content, className }: MarkdownPreviewProps) {
  return (
    <div className={cn("prose prose-zinc max-w-none break-words dark:prose-invert prose-sm sm:prose-base", className)}>
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 className="text-xl font-bold mt-4 mb-2 text-zinc-900">{children}</h1>,
          h2: ({ children }) => <h2 className="text-lg font-bold mt-3 mb-1 text-zinc-800">{children}</h2>,
          p: ({ children }) => <p className="mb-3 text-zinc-600 leading-relaxed">{children}</p>,
          ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="text-zinc-600">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-orange-200 pl-4 italic text-zinc-500 my-4">
              {children}
            </blockquote>
          ),
          code: ({ children }) => (
            <code className="bg-orange-50 text-orange-600 px-1 rounded text-sm font-mono">
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className="bg-zinc-900 text-zinc-100 p-4 rounded-xl overflow-x-auto my-4 font-mono text-xs">
              {children}
            </pre>
          ),
          input: ({ checked }) => (
            <input type="checkbox" checked={checked} readOnly className="mr-2 accent-orange-500" />
          ),
        }}
      >
        {content || "_暂无内容_"}
      </ReactMarkdown>
    </div>
  );
}