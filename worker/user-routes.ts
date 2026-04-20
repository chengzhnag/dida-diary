import { Hono } from "hono";
import { type DiaryRow, mapRowToEntry } from "./entities";
import { ok, bad, notFound } from './core-utils';
import { SignJWT, jwtVerify } from 'jose';
import type { DiaryEntry } from "@shared/types";
import type { Env } from "./core-utils";

const getJwtSecret = (env: Env) => new TextEncoder().encode(env.JWT_SECRET);

export function userRoutes(app: Hono<{ Bindings: Env }>) {
  // Global Middleware to check D1 Database Binding
  app.use('/api/diaries/*', async (c, next) => {
    if (!c.env.DB) {
      return c.json({
        success: false,
        error: '数据库未绑定',
        detail: '请在 Cloudflare Dashboard 绑定 D1 数据库，并命名为 "DB"。'
      }, 500);
    }
    await next();
  });

  app.post('/api/auth/login', async (c) => {
    try {
      const { password } = await c.req.json();
      const adminPass = c.env.ADMIN_PASS;
      if (password === adminPass) {
        const token = await new SignJWT({ role: 'admin' })
          .setProtectedHeader({ alg: 'HS256' })
          .setIssuedAt()
          .setExpirationTime('7d')
          .sign(getJwtSecret(c.env));
        return ok(c, { token });
      }
      return bad(c, '管理密码错误');
    } catch (e) {
      return bad(c, '无效的登录请求');
    }
  });

  // Auth Middleware
  app.use('/api/*', async (c, next) => {
    const path = c.req.path;
    if (path === '/api/auth/login' || path === '/api/health' || path === '/api/client-errors') return await next();
    const auth = c.req.header('Authorization');
    if (!auth?.startsWith('Bearer ')) return bad(c, '未授权访问');
    try {
      const token = auth.split(' ')[1];
      await jwtVerify(token, getJwtSecret(c.env));
      await next();
    } catch (e) {
      return c.json({ success: false, error: '登录已过期' }, 401);
    }
  });

  app.get('/api/diaries', async (c) => {
    const q = c.req.query('q')?.toLowerCase();
    const startDate = c.req.query('startDate');
    const endDate = c.req.query('endDate');
    const limit = Math.min(parseInt(c.req.query('limit') || '1000'), 2000);
    let sql = `SELECT * FROM diaries WHERE 1=1`;
    const params: any[] = [];
    if (q) {
      sql += ` AND (LOWER(title) LIKE ? OR LOWER(content) LIKE ? OR tags LIKE ? OR categories LIKE ?)`;
      const pattern = `%${q}%`;
      params.push(pattern, pattern, pattern, pattern);
    }
    if (startDate) {
      sql += ` AND date >= ?`;
      params.push(startDate);
    }
    if (endDate) {
      sql += ` AND date <= ?`;
      params.push(endDate);
    }
    sql += ` ORDER BY date DESC, createdAt DESC LIMIT ?`;
    params.push(limit);
    try {
      const { results } = await c.env.DB.prepare(sql).bind(...params).all<DiaryRow>();
      return ok(c, { items: (results || []).map(mapRowToEntry) });
    } catch (e) {
      console.error('D1 Query Error:', e);
      return bad(c, `查询失败: ${e instanceof Error ? e.message : '未知错误'}`);
    }
  });

  app.post('/api/diaries/verify-list', async (c) => {
    try {
      const { password } = await c.req.json();
      const envPass = c.env.DIARY_PASS;
      if (password === envPass) {
        return ok(c, true);
      }
      return bad(c, '访问密码错误');
    } catch (e) {
      return bad(c, '验证请求失败');
    }
  });

  app.post('/api/diaries', async (c) => {
    try {
      const data = await c.req.json() as Omit<DiaryEntry, 'id' | 'createdAt'>;
      const id = crypto.randomUUID();
      const createdAt = Date.now();
      await c.env.DB.prepare(`
        INSERT INTO diaries (id, title, content, isMarkdown, tags, categories, date, createdAt, isLocked)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id,
        data.title || '无题',
        data.content || '',
        data.isMarkdown ? 1 : 0,
        JSON.stringify(data.tags || []),
        JSON.stringify(data.categories || []),
        data.date || new Date().toISOString().split('T')[0],
        createdAt,
        data.isLocked ? 1 : 0
      ).run();
      const created = await c.env.DB.prepare(`SELECT * FROM diaries WHERE id = ?`).bind(id).first<DiaryRow>();
      return ok(c, created ? mapRowToEntry(created) : null);
    } catch (e) {
      console.error('Create Error:', e);
      return bad(c, '记录创建失败');
    }
  });

  app.put('/api/diaries/:id', async (c) => {
    try {
      const id = c.req.param('id');
      const updates = await c.req.json() as Partial<DiaryEntry>;
      const fields: string[] = [];
      const values: any[] = [];
      if (updates.title !== undefined) { fields.push('title = ?'); values.push(updates.title); }
      if (updates.content !== undefined) { fields.push('content = ?'); values.push(updates.content); }
      if (updates.isMarkdown !== undefined) { fields.push('isMarkdown = ?'); values.push(updates.isMarkdown ? 1 : 0); }
      if (updates.tags !== undefined) { fields.push('tags = ?'); values.push(JSON.stringify(updates.tags)); }
      if (updates.categories !== undefined) { fields.push('categories = ?'); values.push(JSON.stringify(updates.categories)); }
      if (updates.date !== undefined) { fields.push('date = ?'); values.push(updates.date); }
      if (updates.isLocked !== undefined) { fields.push('isLocked = ?'); values.push(updates.isLocked ? 1 : 0); }
      if (fields.length > 0) {
        values.push(id);
        const { success } = await c.env.DB.prepare(`UPDATE diaries SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
        if (!success) return notFound(c, '记录不存在或更新失败');
      }
      const updated = await c.env.DB.prepare(`SELECT * FROM diaries WHERE id = ?`).bind(id).first<DiaryRow>();
      return ok(c, updated ? mapRowToEntry(updated) : null);
    } catch (e) {
      console.error('Update Error:', e);
      return bad(c, '更新失败');
    }
  });

  app.delete('/api/diaries/:id', async (c) => {
    try {
      const id = c.req.param('id');
      const { success } = await c.env.DB.prepare(`DELETE FROM diaries WHERE id = ?`).bind(id).run();
      return ok(c, { id, deleted: success });
    } catch (e) {
      return bad(c, '删除失败');
    }
  });

  app.post('/api/diaries/import', async (c) => {
    try {
      const items = await c.req.json() as any[];
      if (!Array.isArray(items)) return bad(c, '无效的数据格式');
      const statements = items.map(it => {
        return c.env.DB.prepare(`
          INSERT INTO diaries (id, title, content, isMarkdown, tags, categories, date, createdAt, isLocked)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          crypto.randomUUID(),
          it.title || '无题',
          it.content || '',
          it.isMarkdown ? 1 : 0,
          JSON.stringify(it.tags || []),
          JSON.stringify(it.categories || []),
          it.date || new Date().toISOString().split('T')[0],
          it.createdAt || Date.now(),
          it.isLocked ? 1 : 0
        );
      });
      if (statements.length > 0) {
        await c.env.DB.batch(statements);
      }
      return ok(c, { count: items.length });
    } catch (e) {
      console.error('Import Error:', e);
      return bad(c, '导入失败: ' + (e instanceof Error ? e.message : '数据格式错误'));
    }
  });
}