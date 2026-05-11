export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
export interface DiaryEntry {
  id: string;
  title: string;
  content: string;
  isMarkdown: boolean;
  tags: string[];
  categories: string[];
  date: string; // yyyy-mm-dd
  createdAt: number;
  isLocked?: boolean;
}
export interface PaginatedDiaries {
  items: DiaryEntry[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
export interface AuthResponse {
  success: boolean;
  token?: string;
  error?: string;
}

export interface PolishStylePreset {
  id: string;
  name: string;
  description: string;
  systemPrompt: string; // 系统提示词
}

export interface PolishRequest {
  content: string;
  styleId?: string; // 预设风格ID（可选）
  customSystemPrompt?: string; // 自定义系统提示词（可选）
}

export interface PolishResponse {
  original: string;
  polished: string;
  styleId?: string;
  styleName?: string;
  wordCountBefore: number;
  wordCountAfter: number;
}