# 滴答日记 - 移动端私人日记应用

一款专为移动端设计的精美个人日记与笔记应用，采用治愈系纸张质感设计，支持 Markdown 写作、双重密码保护与数据安全备份。

## 🌟 核心特性

- **极致移动体验**：响应式布局，适配刘海屏，大号触控热区，流畅动画。
- **全能编辑**：支持纯文本与 Markdown 无缝切换，内置 Emoji 选择器及 Markdown 工具栏。
- **时光管理**：通过日历、分类和标签多维度组织您的日记与笔记。
- **双重锁屏**：
  - **管理锁**：登录应用所需，保护全局数据。
  - **时光锁**：访问日记列表专属密码，二次加密私密回忆。
- **数据自主**：一键导出 JSON 备份文件，支持从备份文件无缝恢复数据。

---

## 🛠️ 环境配置

在 Cloudflare Dashboard 或 `wrangler.toml` 中配置以下环境变量：

| 变量名       | 描述                     | 默认值 (示例)     |
| :----------- | :----------------------- | :---------------- |
| `ADMIN_PASS` | 全局登录管理密码         | `admin`           |
| `DIARY_PASS` | 时光锁查看密码           | `1234`            |
| `JWT_SECRET` | JWT 签发密钥             | `dida-secret-key` |
| `DB`         | **D1 数据库绑定变量名称** | `DB`              |

> **注意**：`DB` 变量必须在 Cloudflare Workers 环境中正确绑定 D1 数据库实例，否则数据库操作将失败。

---

## 🚀 部署指南

### 1. 安装依赖

```bash
bun install
```

### 2. 初始化数据库

**方式一：使用命令行**

```bash
wrangler d1 execute DB --file=schema.sql
```

**方式二：手动初始化**

- 在 Cloudflare Dashboard 中进入 D1 数据库管理界面。
- 创建新表 `diaries`，并手动执行 `schema.sql` 中的建表语句和索引语句。

### 3. 本地开发

```bash
bun dev
```

### 4. 线上部署

```bash
bun run deploy
```

---

## 📝 数据库结构

### 1. `diaries` 表

存储所有日记和笔记条目。

| 字段名       | 类型      | 描述                                                                 |
| :----------- | :-------- | :------------------------------------------------------------------- |
| `id`         | TEXT      | 唯一标识符，主键                                                     |
| `title`      | TEXT      | 标题，非空                                                           |
| `content`    | TEXT      | 内容，非空                                                           |
| `isMarkdown` | INTEGER   | 是否为 Markdown 格式（0：纯文本，1：Markdown）                    |
| `tags`       | TEXT      | 标签数组 JSON 字符串（如：`["tag1", "tag2"]`）                    |
| `categories` | TEXT      | 分类数组 JSON 字符串（如：`["cat1"]`）                             |
| `date`       | TEXT      | 日期（格式：`yyyy-MM-dd`）                                          |
| `createdAt`  | INTEGER   | 创建时间（Unix 时间戳，毫秒）                                       |
| `isLocked`   | INTEGER   | 是否加密（1：加密，0：公开）                                        |

### 2. 索引优化

- **`idx_diaries_date`**：按日期降序索引，提升日历视图查询效率。
- **`idx_diaries_createdAt`**：按创建时间降序索引，优化最新日记排序。
- **`idx_diaries_search`**：组合索引（日期、加密状态），提高搜索过滤性能。

---

## 支持我

如果你喜欢我的项目或工作，并希望通过捐赠来支持我，非常感谢您的慷慨！

### 我的收款码
<img src="https://cdn.jsdelivr.net/gh/Zgrowth/image@master/document/1000056304.2rvhsy1c5e.png" style="width: 160px;" />

### 注意事项：

- 请在确认金额无误后进行支付。
- 捐赠时可以选择填写留言，告诉我你是谁或者对项目的建议和期待，这对我非常重要！
- 如果遇到任何问题，请联系我。

感谢您的支持与鼓励！

---

*滴答日记 · 滴答记录你的心跳*
