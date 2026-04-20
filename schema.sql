-- Memos & Whispers - D1 Database Schema
-- Manual execution required: wrangler d1 execute DB --local --file=schema.sql
-- 1. Diaries Table: Stores all notes and diary entries
CREATE TABLE IF NOT EXISTS diaries (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  isMarkdown INTEGER DEFAULT 0, -- 0 for plain text, 1 for markdown
  tags TEXT, -- JSON string array: ["tag1", "tag2"]
  categories TEXT, -- JSON string array: ["cat1"]
  date TEXT NOT NULL, -- Format: yyyy-MM-dd
  createdAt INTEGER NOT NULL, -- Unix timestamp in ms
  isLocked INTEGER DEFAULT 1 -- 1 for locked, 0 for public
);
-- 2. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_diaries_date ON diaries(date DESC);
CREATE INDEX IF NOT EXISTS idx_diaries_createdAt ON diaries(createdAt DESC);
-- 3. Search Optimization Index
CREATE INDEX IF NOT EXISTS idx_diaries_search ON diaries(date, isLocked);