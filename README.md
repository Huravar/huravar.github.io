# Huravar Notes

这是一个基于 Jekyll 和 GitHub Pages 的个人博客。它以 Markdown 写作为核心，提供简洁的深色 UI、文章归档、标签页、RSS 订阅、在线编辑后台和移动端适配。

## 本地预览

先安装 Ruby 和 Bundler，然后在仓库根目录运行：

```bash
bundle install
bundle exec jekyll serve
```

打开 `http://127.0.0.1:4000` 即可预览。

## 写一篇新文章

1. 复制 `_drafts/template.md`。
2. 重命名为 `_posts/YYYY-MM-DD-your-title.md`。
3. 修改开头的 front matter：

   ```yaml
   ---
   title: "文章标题"
   description: "一句话介绍这篇文章。"
   date: 2026-04-30 20:00:00 +0800
   tags: [技术, 项目]
   ---
   ```

4. 在 front matter 下面写正文。
5. 提交并推送到 GitHub，GitHub Pages 会自动构建发布。

## 在线编辑后台

站点包含 Decap CMS 后台，发布后访问：

```text
https://huravar.github.io/admin/
```

后台可以管理：

- `_posts/`：发布文章。
- `_drafts/`：草稿。
- `about.md`：关于页。
- `assets/images/uploads/`：后台上传的图片。

文章页底部会显示“在线编辑本文”，可以直接跳到该文章在后台的编辑界面。

### GitHub 登录配置

GitHub Pages 只能托管静态文件，不能保存 OAuth 密钥，所以后台登录需要一个外部 OAuth Proxy。推荐流程：

1. 部署一个 Decap CMS 兼容的 GitHub OAuth Proxy，例如 Cloudflare Worker、Vercel Function、Netlify Function 或自托管服务。
2. 在 GitHub 创建 OAuth App：
   - Homepage URL: `https://huravar.github.io`
   - Authorization callback URL: `https://你的-oauth-proxy-域名/callback`
3. 把 GitHub OAuth App 的 `client_id` 和 `client_secret` 配到 OAuth Proxy 的环境变量中，不要写进仓库。
4. 修改 `admin/config.yml` 中的 `base_url`：

   ```yaml
   backend:
     name: github
     repo: Huravar/huravar.github.io
     branch: main
     base_url: https://你的-oauth-proxy-域名
     auth_endpoint: auth
   ```

5. 给需要编辑文章的人添加 GitHub 仓库协作者权限，并确保他们拥有写入权限。

完成后，协作者可以访问 `/admin/`，使用 GitHub 登录，在线创建、编辑和发布文章。保存内容时，Decap CMS 会通过 GitHub API 向 `main` 分支提交 Markdown 文件，GitHub Pages 随后自动重新构建博客。

## 常用目录

- `_posts/`：已发布文章。
- `_drafts/`：草稿模板和未发布内容。
- `admin/`：在线编辑后台。
- `_layouts/`：页面模板。
- `_includes/`：导航、页脚等复用片段。
- `assets/css/style.scss`：站点主样式。
- `assets/js/main.js`：轻量交互脚本。

## 个性化

- 修改 `_config.yml` 中的 `title`、`description`、`author` 和 `url`。
- 修改 `about.md` 中的个人介绍和联系方式。
- 替换 `assets/images/favicon.svg` 和 `assets/images/og-default.svg`。
