import type { ApiResponse } from "@shared/types";
import type { Context } from "hono";

export interface Env {
  DB: D1Database;
  ADMIN_PASS?: string;
  DIARY_PASS?: string;
  JWT_SECRET?: string;
}

export const ok = <T>(c: Context, data: T) => c.json({ success: true, data } as ApiResponse<T>);
export const bad = (c: Context, error: string) => c.json({ success: false, error } as ApiResponse, 400);
export const notFound = (c: Context, error = 'not found') => c.json({ success: false, error } as ApiResponse, 404);
export const isStr = (s: unknown): s is string => typeof s === 'string' && s.length > 0;