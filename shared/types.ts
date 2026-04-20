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
export interface AuthResponse {
  success: boolean;
  token?: string;
  error?: string;
}