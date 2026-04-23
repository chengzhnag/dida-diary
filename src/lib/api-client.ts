import { ApiResponse } from "../../shared/types"

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const fullPath = path.startsWith('https://') ? path : `${path}`
  const res = await fetch(fullPath, { headers: { 'Content-Type': 'application/json' }, ...init })
  // 401 未授权，清除用户信息并跳转登录
  if (res.status === 401) {
    localStorage.removeItem('whisper_token');
    window.location.href = '/login';
    return Promise.reject(new Error('未授权'));
  }
  const json = (await res.json()) as ApiResponse<T>
  if (!res.ok || !json.success || json.data === undefined) throw new Error(json.error || 'Request failed')
  return json.data
}