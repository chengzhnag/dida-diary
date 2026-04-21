import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 检测输入内容是否为Markdown格式文档
 * @param {string} content - 需要检测的文本内容
 * @param {number} [threshold=0.3] - 判定阈值(0-1)，值越高要求越严格
 * @returns {boolean} - 是否为Markdown文档
 */
export function checkIsMarkdown(content, threshold = 0.3) {
  if (!content || typeof content !== 'string') {
    return false;
  }

  const text = content.trim();
  if (text.length < 10) { // 太短的文本无法准确判断
    return false;
  }

  // 特征检测权重配置
  const featureWeights = {
    headings: 0.15,      // 标题特征
    lists: 0.15,         // 列表特征
    links: 0.15,         // 链接特征
    emphasis: 0.15,      // 强调特征
    codeBlocks: 0.15,    // 代码块特征
    blockquotes: 0.15,   // 引用特征
    tables: 0.1          // 表格特征
  };

  // 检测标题特征：以#开头的行
  const headingPattern = /^#{1,6}\s+/gm;
  const headingCount = (text.match(headingPattern) || []).length;

  // 检测列表特征：以-或数字开头的行
  const listPattern = /^(-|\d+\.)\s+/gm;
  const listCount = (text.match(listPattern) || []).length;

  // 检测链接特征：[text](url)格式
  const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  const linkCount = (text.match(linkPattern) || []).length;

  // 检测图片特征：![alt](image_url)格式
  const imagePattern = /!\[([^\]]+)\]\(([^)]+)\)/g;
  const imageCount = (text.match(imagePattern) || []).length;

  // 检测强调特征：**bold**或*italic*
  const emphasisPattern = /(\*\*|__|[*_])([^\s*]+)\1/g;
  const emphasisCount = (text.match(emphasisPattern) || []).length;

  // 检测代码块特征：以```开头和结尾
  const codeBlockPattern = /```[\s\S]*?```/g;
  const codeBlockCount = (text.match(codeBlockPattern) || []).length;

  // 检测引用特征：以>开头的行
  const blockquotePattern = /^>\s+/gm;
  const blockquoteCount = (text.match(blockquotePattern) || []).length;

  // 检测表格特征：包含|分隔符的行
  const tablePattern = /^.*\|.*\|.* $ /gm;
  const tableCount = (text.match(tablePattern) || []).length;

  // 计算总分
  const totalScore = (
    (headingCount > 0 ? 1 : 0) * featureWeights.headings +
    (listCount > 0 ? 1 : 0) * featureWeights.lists +
    ((linkCount + imageCount) > 0 ? 1 : 0) * featureWeights.links +
    (emphasisCount > 0 ? 1 : 0) * featureWeights.emphasis +
    (codeBlockCount > 0 ? 1 : 0) * featureWeights.codeBlocks +
    (blockquoteCount > 0 ? 1 : 0) * featureWeights.blockquotes +
    (tableCount > 0 ? 1 : 0) * featureWeights.tables
  );

  // 根据阈值判断
  return totalScore >= threshold;
}
