---
title: "首页"
description: "Huravar 的个人博客，记录技术、生活与灵感。"
body_class: "home-page"
---

<!-- markdownlint-disable MD033 -->

<section class="hero-section">
  <div class="hero-copy">
    <p class="eyebrow">Personal cosmic notebook</p>
    <h1>把技术、灵感和生活轨迹，写成一张持续生长的星图。</h1>
    <p class="hero-lead">
      这里是 Huravar 的个人博客。我会把学习笔记、项目实践、生活观察和偶然闪现的想法整理成文章，让写作更轻松，也让阅读更舒服。
    </p>
    <div class="hero-actions">
      <a class="button button-primary" href="{{ '/archive/' | relative_url }}">开始阅读</a>
      <a class="button button-ghost" href="{{ '/about/' | relative_url }}">了解我</a>
    </div>
  </div>

  <div class="hero-console glass-panel" aria-label="博客状态面板">
    <div class="console-bar">
      <span></span>
      <span></span>
      <span></span>
    </div>
    <div class="console-grid">
      <div>
        <small>Posts</small>
        <strong>{{ site.posts | size }}</strong>
      </div>
      <div>
        <small>Tags</small>
        <strong>{{ site.tags | size }}</strong>
      </div>
      <div>
        <small>Mode</small>
        <strong>Write</strong>
      </div>
    </div>
    <p class="console-line"><span>></span> new_post --format markdown --publish github-pages</p>
    <p class="console-line muted"><span>></span> status: ready for ideas</p>
  </div>
</section>

<section class="section-block">
  <div class="section-heading">
    <p class="eyebrow">Latest signals</p>
    <h2>最新文章</h2>
    <a href="{{ '/archive/' | relative_url }}">查看全部</a>
  </div>

  <div class="post-grid">
    {% for post in site.posts limit: 3 %}
      <article class="post-card glass-card">
        <a class="card-link" href="{{ post.url | relative_url }}">
          <time datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date: "%Y-%m-%d" }}</time>
          <h3>{{ post.title }}</h3>
          <p>{{ post.description | default: post.excerpt | strip_html | strip_newlines | truncate: 96 }}</p>
          {% if post.tags and post.tags.size > 0 %}
            <div class="tag-row">
              {% for tag in post.tags limit: 3 %}
                <span>{{ tag }}</span>
              {% endfor %}
            </div>
          {% endif %}
        </a>
      </article>
    {% endfor %}
  </div>
</section>

<section class="section-block split-section">
  <div class="glass-panel">
    <p class="eyebrow">Writing map</p>
    <h2>我会在这里写什么</h2>
    <div class="topic-list">
      <a href="{{ '/tags/#技术' | relative_url }}">技术笔记</a>
      <a href="{{ '/tags/#项目' | relative_url }}">项目复盘</a>
      <a href="{{ '/tags/#生活' | relative_url }}">生活观察</a>
      <a href="{{ '/tags/#灵感' | relative_url }}">灵感收藏</a>
    </div>
  </div>

  <div class="glass-panel">
    <p class="eyebrow">How to follow</p>
    <h2>轻量订阅</h2>
    <p>
      喜欢 RSS 的读者可以直接订阅，也可以从归档页按时间浏览。这个站点尽量保持静态、快速、可读，不把注意力浪费在复杂操作上。
    </p>
    <a class="text-link" href="{{ '/feed.xml' | relative_url }}">订阅 RSS</a>
  </div>
</section>
