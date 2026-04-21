import { create } from 'zustand';
import { DiaryEntry, ApiResponse, PaginatedDiaries } from '@shared/types';
import { toast } from 'sonner';
interface AppState {
  isAuthenticated: boolean;
  isLoading: boolean;
  isListUnlocked: boolean;
  diaries: DiaryEntry[];
  totalCount: number;
  currentPage: number;
  hasMore: boolean;
  searchQuery: object;
  token: string | null;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
  unlockList: (password: string) => Promise<boolean>;
  fetchDiaries: (params?: { q?: string; startDate?: string; endDate?: string; append?: boolean }) => Promise<void>;
  fetchDiary: (id: string) => Promise<DiaryEntry | null>;
  addDiary: (diary: Omit<DiaryEntry, 'id' | 'createdAt'>) => Promise<void>;
  updateDiary: (id: string, updates: Partial<DiaryEntry>) => Promise<void>;
  deleteDiary: (id: string) => Promise<void>;
  getAllExportDiaries: () => Promise<DiaryEntry[]>;
  importDiaries: (items: any[]) => Promise<void>;
  setSearchQuery: (query: object) => void;
}
const API_BASE = 'https://d.952737.xyz/api';
const PAGE_SIZE = 10;
export const useAppStore = create<AppState>((set, get) => ({
  isAuthenticated: !!localStorage.getItem('whisper_token'),
  isLoading: false,
  isListUnlocked: false,
  diaries: [],
  totalCount: 0,
  currentPage: 1,
  hasMore: false,
  searchQuery: {},
  token: localStorage.getItem('whisper_token'),
  login: async (password: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const json = await res.json() as ApiResponse<{ token: string }>;
      if (json.success && json.data?.token) {
        localStorage.setItem('whisper_token', json.data.token);
        set({ isAuthenticated: true, token: json.data.token, isListUnlocked: false });
        return true;
      }
      return false;
    } catch (e) {
      console.error('[AUTH] Login error', e);
      return false;
    }
  },
  logout: () => {
    localStorage.removeItem('whisper_token');
    set({
      isAuthenticated: false,
      token: null,
      diaries: [],
      totalCount: 0,
      currentPage: 1,
      hasMore: false,
      isListUnlocked: false,
      searchQuery: {},
    });
    toast.info('已安全退出滴答日记');
  },
  unlockList: async (password: string) => {
    const token = get().token;
    if (!token) return false;
    try {
      const res = await fetch(`${API_BASE}/diaries/verify-list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password }),
      });
      if (res.status === 401) { get().logout(); return false; }
      const json = await res.json() as ApiResponse<boolean>;
      if (json.success) {
        set({ isListUnlocked: true });
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  },
  fetchDiaries: async (params) => {
    const token = get().token;
    if (!token) return;
    const isAppend = params?.append ?? false;
    const nextPage = isAppend ? get().currentPage + 1 : 1;
    set({ isLoading: true });
    try {
      const url = new URL(`${API_BASE}/diaries`);
      if (params?.q) url.searchParams.append('q', params.q);
      if (params?.startDate) url.searchParams.append('startDate', params.startDate);
      if (params?.endDate) url.searchParams.append('endDate', params.endDate);
      url.searchParams.append('page', nextPage.toString());
      url.searchParams.append('limit', PAGE_SIZE.toString());
      const res = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.status === 401) { get().logout(); return; }
      const json = await res.json() as ApiResponse<PaginatedDiaries>;
      if (json.success && json.data) {
        set(state => ({
          diaries: isAppend ? [...state.diaries, ...json.data!.items] : json.data!.items,
          totalCount: json.data!.total,
          currentPage: json.data!.page,
          hasMore: json.data!.hasMore
        }));
      } else {
        toast.error(json.error || '获取时光记录失败');
      }
    } catch (e) {
      console.error('Fetch diaries error', e);
      toast.error(e?.message || '数据获取失败，请稍后重试');
    } finally {
      set({ isLoading: false });
    }
  },
  fetchDiary: async (id: string) => {
    const token = get().token;
    if (!token) return null;
    try {
      const res = await fetch(`${API_BASE}/diaries/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.status === 401) {
        get().logout();
        throw new Error('会话过期');
      }
      const json = await res.json() as ApiResponse<DiaryEntry>;
      if (json.success && json.data) {
        return json.data;
      }
      throw new Error(json.error || '记录详情获取失败');
    } catch (e) {
      console.error('[STORE_ERR] Fetch single diary error:', e);
      toast.error((e as Error).message || '无法追溯这段时光');
      return null;
    }
  },
  addDiary: async (diaryData) => {
    const token = get().token;
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/diaries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(diaryData),
      });
      if (res.status === 401) { get().logout(); return; }
      const json = await res.json() as ApiResponse<DiaryEntry>;
      if (json.success && json.data) {
        set(state => ({
          diaries: [json.data!, ...state.diaries].sort((a, b) => {
            if (b.date !== a.date) return b.date.localeCompare(a.date);
            return b.createdAt - a.createdAt;
          }),
          totalCount: state.totalCount + 1
        }));
      }
    } catch (e) {
      toast.error('时光同步失败');
    }
  },
  updateDiary: async (id, updates) => {
    const token = get().token;
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/diaries/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates),
      });
      if (res.status === 401) { get().logout(); return; }
      const json = await res.json() as ApiResponse<DiaryEntry>;
      if (json.success && json.data) {
        set(state => ({
          diaries: state.diaries.map(d => d.id === id ? json.data! : d).sort((a, b) => {
            if (b.date !== a.date) return b.date.localeCompare(a.date);
            return b.createdAt - a.createdAt;
          })
        }));
      }
    } catch (e) {
      toast.error('修正时光失败');
    }
  },
  deleteDiary: async (id) => {
    const token = get().token;
    if (!token) return;
    try {
      set({ isLoading: true });
      const res = await fetch(`${API_BASE}/diaries/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.status === 401) { get().logout(); return; }
      const json = await res.json() as ApiResponse;
      if (json.success) {
        set(state => ({
          diaries: state.diaries.filter(d => d.id !== id),
          totalCount: Math.max(0, state.totalCount - 1)
        }));
      }
    } catch (e) {
      toast.error('抹除失败');
    } finally {
      set({ isLoading: false });
    }
  },
  // 获取所有需要导出的时光
  getAllExportDiaries: async () => {
    const token = get().token;
    if (!token) return [];
    try {
      const res = await fetch(`${API_BASE}/diaries/export`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.status === 401) { get().logout(); return []; }
      const json = await res.json() as ApiResponse<DiaryEntry[]>;
      if (json.success && json.data) {
        return json.data;
      }
      return [];
    } catch (e) {
      console.error('[STORE_ERR] Fetch all export diaries error:', e);
      toast.error('时光记录导出失败');
      return [];
    }
  },
  // 批量导入时光
  importDiaries: async (items) => {
    const token = get().token;
    if (!token || !Array.isArray(items)) return;
    try {
      const res = await fetch(`${API_BASE}/diaries/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(items),
      });
      if (res.status === 401) { get().logout(); return; }
      const json = await res.json() as ApiResponse;
      if (json.success) {
        await get().fetchDiaries();
        toast.success('时光记录已全量导入');
      }
    } catch (e) {
      toast.error('数据导入失败');
    }
  },
  setSearchQuery: (query = {}) => {
    set({ searchQuery: query, currentPage: 1, hasMore: false });
  },
}));