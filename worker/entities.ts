import type { DiaryEntry } from "@shared/types";
/**
 * Data structures for D1 Database.
 * Note: Tables are managed via schema.sql in project root.
 */
export interface DiaryRow {
  id: string;
  title: string;
  content: string;
  isMarkdown: number; // 0 or 1
  tags: string; // JSON string
  categories: string; // JSON string
  date: string;
  createdAt: number;
  isLocked: number; // 0 or 1
}
/**
 * Maps a raw D1 database row to the clean shared DiaryEntry type.
 */
export function mapRowToEntry(row: DiaryRow): DiaryEntry {
  return {
    ...row,
    isMarkdown: row.isMarkdown === 1,
    isLocked: row.isLocked === 1,
    tags: safeParseJson(row.tags, []),
    categories: safeParseJson(row.categories, [])
  };
}
function safeParseJson<T>(str: string, fallback: T): T {
  if (!str) return fallback;
  try {
    return JSON.parse(str) || fallback;
  } catch (e) {
    console.error('JSON Parse Error:', e, 'Source:', str);
    return fallback;
  }
}