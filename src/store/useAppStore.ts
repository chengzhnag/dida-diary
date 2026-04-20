import { create } from 'zustand';
import { DiaryEntry, ApiResponse } from '@shared/types';
import { toast } from 'sonner';

interface AppState {
  isAuthenticated: boolean;
  isLoading: boolean;
  isListUnlocked: boolean;
  diaries: DiaryEntry[];
  totalCount: number;
  searchQuery: string;
  token: string | null;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
  unlockList: (password: string) => Promise<boolean>;
  fetchDiaries: (params?: { q?: string; startDate?: string; endDate?: string }) => Promise<void>;
  addDiary: (diary: Omit<DiaryEntry, 'id' | 'createdAt'>) => Promise<void>;
  updateDiary: (id: string, updates: Partial<DiaryEntry>) => Promise<void>;
  deleteDiary: (id: string) => Promise<void>;
  importDiaries: (items: any[]) => Promise<void>;
  setSearchQuery: (query: string) => void;
}

const API_BASE = 'https://d.952737.xyz/api';

export const useAppStore = create<AppState>((set, get) => ({
  isAuthenticated: !!localStorage.getItem('whisper_token'),
  isLoading: false,
  isListUnlocked: false,
  diaries: [],
  totalCount: 0,
  searchQuery: '',
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
      console.error('Login error', e);
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
      isListUnlocked: false,
      searchQuery: '',
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
    set({ isLoading: true });
    try {
      const url = new URL(`${API_BASE}/diaries`);
      const isFiltered = !!(params?.q?.trim() || params?.startDate || params?.endDate);
      if (params?.q) url.searchParams.append('q', params.q);
      if (params?.startDate) url.searchParams.append('startDate', params.startDate);
      if (params?.endDate) url.searchParams.append('endDate', params.endDate);
      const res = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.status === 401) {
        get().logout();
        return;
      }
      const json = await res.json() as ApiResponse<{ items: DiaryEntry[] }>;
      if (json.success && json.data) {
        set({
          diaries: json.data.items,
          // Only update global total count when no filters are applied
          totalCount: isFiltered ? get().totalCount : json.data.items.length
        });
      } else {
        toast.error(json.error || '获取时光记录失败');
      }
    } catch (e) {
      console.error('Fetch diaries error', e);
      toast.error('网络同步失败');
    } finally {
      set({ isLoading: false });
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
      toast.error('心情存入失败');
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
      toast.error('更新记忆失败');
    }
  },
  deleteDiary: async (id) => {
    const token = get().token;
    if (!token) return;
    try {
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
      toast.error('抹除记忆失败');
    }
  },
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
        toast.success('时光记录已全量同步');
      }
    } catch (e) {
      toast.error('数据找回失败');
    }
  },
  setSearchQuery: (query) => set({ searchQuery: query }),
}));