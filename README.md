# Huravar 星轨日志

这是一个基于 Jekyll 和 GitHub Pages 的个人博客。它以 Markdown 写作为核心，提供创意科技感 UI、文章归档、标签页、RSS 订阅和移动端适配。

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

## 常用目录

- `_posts/`：已发布文章。
- `_drafts/`：草稿模板和未发布内容。
- `_layouts/`：页面模板。
- `_includes/`：导航、页脚等复用片段。
- `assets/css/style.scss`：站点主样式。
- `assets/js/main.js`：轻量交互脚本。

## 个性化

- 修改 `_config.yml` 中的 `title`、`description`、`author` 和 `url`。
- 修改 `about.md` 中的个人介绍和联系方式。
- 替换 `assets/images/favicon.svg` 和 `assets/images/og-default.svg`。
