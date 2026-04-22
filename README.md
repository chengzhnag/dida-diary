# 滴答日记 - 移动端私人日记应用

一款专为移动端设计的精美个人日记与笔记应用，采用治愈系纸张质感设计，支持 Markdown 写作、双重密码保护与数据安全备份。

## 📸 项目预览

### 界面预览
![项目预览图](https://img.952737.xyz/file/1776829856432_Stitch_20260422_115002.png)

### 在线体验
你可以直接访问演示站点进行体验：
👉 [点击访问在线演示](https://d.952737.xyz/)
- **登录密码**: `admin`
- **时光锁查看密码**: `1234`

---

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

### 方式一：本地代码部署

如果你希望在本地环境运行或调试代码，请按照以下步骤操作：

1.  **安装依赖**
    ```bash
    bun install
    ```

2.  **初始化数据库**
    - **命令行方式**：
      ```bash
      wrangler d1 execute DB --file=schema.sql
      ```
    - **手动方式**：在 Cloudflare Dashboard 中进入 D1 数据库管理界面，创建新表 `diaries`，并手动执行 `schema.sql` 中的建表语句和索引语句。

3.  **启动本地开发**
    ```bash
    bun dev
    ```

4.  **线上部署**
    ```bash
    bun run deploy
    ```

### 方式二：Fork 项目 Cloudflare 部署

如果你想快速部署到自己的 Cloudflare 账号，推荐使用 Fork 方式：

1.  **Star 和 Fork 项目**
    - 访问项目仓库：[滴答日记](https://github.com/chengzhnag/dida-diary)
    - 点击右上角的 `Star` ⭐️ ⭐️ 按钮，再点击 `Fork` 按钮将项目复制到你的 GitHub 账户。

2.  **登录 Cloudflare**
    - 访问 [Cloudflare Dashboard](https://dash.cloudflare.com/)，登录你的账户。

3.  **创建 D1 数据库并初始化表**
    - 在左侧导航栏选择 **存储和数据库** > **D1 SQL 数据库**。
    - 点击 **创建数据库**，按提示创建数据库实例。
    - 记录数据库的 **名称**（例如：`dida_db`）。
    - 初始化表：
      - **控制台**（在 D1 数据库管理界面手动执行 `schema.sql` 中的建表语句）。

4.  **创建 Workers 应用**
    - 在左侧导航栏选择 **计算** > **Workers 和 Pages**。
    - 点击 **创建应用程序**，选择 **with GitHub**。

5.  **选择仓库**
    - 选择 **GitHub**，登录并授权。
    - 从列表中找到并选择你的 Fork 仓库（例如：`<你的用户名>/dida-diary`）。
    - 确认 **Branch** 为 `master`（或你的主分支）。

6.  **设置环境变量**
    - 在部署页面的 **Environment Variables** 部分，添加以下变量：
      ```bash
      ADMIN_PASS: 自定义管理密码
      DIARY_PASS: 自定义时光锁密码
      JWT_SECRET: 自定义密钥（务必复杂）
      DB: <你的数据库绑定名称，需要去绑定D1数据库，绑定名称一定要是DB>  # 例如：dida_db
      ```

7.  **保存并部署**
    - 点击 **Save and Deploy**，等待部署完成。
    - 部署成功后，点击 **Visit site** 访问你的在线应用。


**全流程步骤图片**：  
| 步骤 | 图片预览 |
| :--- | :--- |
| 步骤 1 | [点击查看图片](https://cdn.jsdelivr.net/gh/Zgrowth/image@master/document/image.2h8wolad0n.webp) |
| 步骤 2 | [点击查看图片](https://cdn.jsdelivr.net/gh/Zgrowth/image@master/document/image.2dpaqvjj5m.webp) |
| 步骤 3 | [点击查看图片](https://cdn.jsdelivr.net/gh/Zgrowth/image@master/document/image.39ls6c4iw3.webp) |
| 步骤 4 | [点击查看图片](https://cdn.jsdelivr.net/gh/Zgrowth/image@master/document/image.64egc4j610.webp) |
| 步骤 5 | [点击查看图片](https://cdn.jsdelivr.net/gh/Zgrowth/image@master/document/image.9ddk8rxc9j.webp) |
| 步骤 6 | [点击查看图片](https://cdn.jsdelivr.net/gh/Zgrowth/image@master/document/image.7axrkpz03s.webp) |
| 步骤 7 | [点击查看图片](https://cdn.jsdelivr.net/gh/Zgrowth/image@master/document/image.26m2vfzr1o.webp) |
| 步骤 8 | [点击查看图片](https://cdn.jsdelivr.net/gh/Zgrowth/image@master/document/image.58hywo2eb3.webp) |
| 步骤 9 | [点击查看图片](https://cdn.jsdelivr.net/gh/Zgrowth/image@master/document/image.3d5e41shbx.webp) |
| 步骤 10 | [点击查看图片](https://cdn.jsdelivr.net/gh/Zgrowth/image@master/document/image.8l0or1m8bp.webp) |
| 步骤 11 | [点击查看图片](https://cdn.jsdelivr.net/gh/Zgrowth/image@master/document/image.szjreu5d5.webp) |

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