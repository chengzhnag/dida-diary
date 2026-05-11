import { Hono } from "hono";
import { type DiaryRow, mapRowToEntry } from "./entities";
import { ok, bad, notFound } from './core-utils';
import { SignJWT, jwtVerify } from 'jose';
import type { DiaryEntry, PolishRequest, PolishResponse, PolishStylePreset } from "@shared/types";
import type { Env } from "./core-utils";

const getJwtSecret = (env: Env) => new TextEncoder().encode(env.JWT_SECRET);

// 预设的润色风格配置
const POLISH_STYLE_PRESETS: PolishStylePreset[] = [
  {
    id: 'concise',
    name: '简洁有力',
    description: '删除冗余表述，保留核心信息，语言精炼',
    systemPrompt: '你是一位精妙的文字编辑。请用简洁有力的语言重写输入的内容，删除冗余表述，保留核心意思。仅输出重写后的内容，不要包含任何解释或前缀。'
  },
  {
    id: 'poetic',
    name: '诗意优美',
    description: '富有意象和比喻，提升文字的美感和意境',
    systemPrompt: '你是一位天才的诗人。请用优美、富有诗意的语言重写输入的内容，加入恰当的比喻和联想，提升文字的意象美和意境。仅输出重写后的内容，不要包含任何解释或前缀。'
  },
  {
    id: 'professional',
    name: '专业正式',
    description: '适合正式文档，避免口语或感叹，措辞严谨',
    systemPrompt: '你是一位专业的商务文案撰写员。请用专业正式的语言重写输入的内容，避免口语和感叹，措辞严谨得体。仅输出重写后的内容，不要包含任何解释或前缀。'
  },
  {
    id: 'casual',
    name: '轻松自然',
    description: '口语化表达，就像和朋友聊天，增强亲近感',
    systemPrompt: '你是一位亲切友善的聊天伙伴。请用轻松自然的口语改写输入的内容，就像和朋友聊天一样，增强亲近感和真挚感。仅输出重写后的内容，不要包含任何解释或前缀。'
  },
  {
    id: 'sentimental',
    name: '温暖感性',
    description: '强调情感和回忆，突出内心感受，温情脉脉',
    systemPrompt: '你是一位感悟生活的文艺青年。请强调情感和回忆，用温暖感人的语言重写输入的内容，突出内心感受和情感温度。仅输出重写后的内容，不要包含任何解释或前缀。'
  },
  {
    id: 'humorous',
    name: '幽默趣味',
    description: '添加幽默和趣味元素，让表述有趣生动',
    systemPrompt: '你是一位风趣幽默的故事讲述者。请添加适当的幽默和趣味元素，让输入的内容更有趣生动，但要保持原意。仅输出重写后的内容，不要包含任何解释或前缀。'
  }
];

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
    // Strict param parsing
    const rawPage = parseInt(c.req.query('page') || '1');
    const rawLimit = parseInt(c.req.query('limit') || '20');
    const page = Math.max(isNaN(rawPage) ? 1 : rawPage, 1);
    const limit = Math.min(Math.max(isNaN(rawLimit) ? 20 : rawLimit, 1), 200);
    const offset = (page - 1) * limit;
    let whereClause = ` WHERE 1=1`;
    const params: any[] = [];
    if (q) {
      whereClause += ` AND (LOWER(title) LIKE ? OR LOWER(content) LIKE ? OR tags LIKE ? OR categories LIKE ?)`;
      const pattern = `%${q}%`;
      params.push(pattern, pattern, pattern, pattern);
    }
    if (startDate) {
      whereClause += ` AND date >= ?`;
      params.push(startDate);
    }
    if (endDate) {
      whereClause += ` AND date <= ?`;
      params.push(endDate);
    }
    try {
      const countResult = await c.env.DB.prepare(`SELECT COUNT(*) as total FROM diaries ${whereClause}`).bind(...params).first<{ total: number }>();
      const total = countResult?.total || 0;
      const sql = `SELECT * FROM diaries ${whereClause} ORDER BY date DESC, createdAt DESC LIMIT ? OFFSET ?`;
      const { results } = await c.env.DB.prepare(sql).bind(...[...params, limit, offset]).all<DiaryRow>();
      const items = (results || []).map(mapRowToEntry);
      const hasMore = offset + items.length < total;
      return ok(c, { items, total, page, limit, hasMore });
    } catch (e) {
      console.error('D1 Query Error:', e);
      return bad(c, `查询失败: ${e instanceof Error ? e.message : '未知错误'}`);
    }
  });

  // Get Single Diary
  app.get('/api/diaries/:id', async (c) => {
    const id = c.req.param('id');
    try {
      const row = await c.env.DB.prepare(`SELECT * FROM diaries WHERE id = ?`).bind(id).first<DiaryRow>();
      return ok(c, row ? mapRowToEntry(row) : null);
    } catch (e) {
      return bad(c, '记录查询失败');
    }
  });

  // Get All Diaries for Export
  app.get('/api/diaries-export', async (c) => {
    try {
      const { results } = await c.env.DB.prepare(`SELECT * FROM diaries ORDER BY date DESC, createdAt DESC`).all<DiaryRow>();
      const items = (results || []).map(mapRowToEntry);
      return ok(c, items);
    } catch (e) {
      return bad(c, '备份导出失败');
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

  // AI Polish API
  const getPolishStyleById = (styleId: string): PolishStylePreset | undefined => {
    return POLISH_STYLE_PRESETS.find(s => s.id === styleId);
  };

  // Get available polish styles
  app.get('/api/polish-styles', async (c) => {
    const styles = POLISH_STYLE_PRESETS.map(({ id, name, description }) => ({
      id,
      name,
      description
    }));
    return ok(c, styles);
  });

  // Post request for polish
  app.post('/api/polish', async (c) => {
    try {
      if (!c.env.AI) {
        return bad(c, 'AI服务未配置');
      }

      const req = await c.req.json<PolishRequest>();
      const { content, styleId, customSystemPrompt } = req;

      if (!content) {
        return bad(c, '缺少必要参数：content');
      }

      if (content.length > 5000) {
        return bad(c, '内容过长，请限制在5000字以内');
      }

      let systemPrompt = '';
      let styleName = '';

      // 优先使用自定义系统提示词，其次使用预设风格，都没有则报错
      if (customSystemPrompt) {
        systemPrompt = customSystemPrompt;
        styleName = '自定义风格';
      } else if (styleId) {
        const preset = getPolishStyleById(styleId);
        if (!preset) {
          return bad(c, `无效的风格ID: ${styleId}`);
        }
        systemPrompt = preset.systemPrompt;
        styleName = preset.name;
      } else {
        return bad(c, '必须提供 styleId 或 customSystemPrompt');
      }

      // 构建用户消息
      const userContent = `请润色以下内容：\n\n${content}`;

      const response = await c.env.AI.run('@cf/moonshotai/kimi-k2.6', {
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userContent
          }
        ]
      } as any);

      const polished = (response as any)?.result?.content?.trim() || '';

      if (!polished) {
        return bad(c, 'AI润色失败，请重试');
      }

      const result: PolishResponse = {
        original: content,
        polished,
        styleId: styleId,
        styleName,
        wordCountBefore: content.length,
        wordCountAfter: polished.length,
      };

      return ok(c, result);
    } catch (e) {
      console.error('Polish Error:', e);
      return bad(c, `润色失败: ${e instanceof Error ? e.message : '未知错误'}`);
    }
  });
}