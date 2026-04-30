---
title: "首页"
description: "Huravar 的个人博客，记录技术实践、学习笔记和日常思考。"
body_class: "home-page"
---

<!-- markdownlint-disable MD033 -->

<section class="hero-section">
  <div class="hero-copy">
    <p class="eyebrow">Personal Blog</p>
    <h1>记录技术实践，也记录一些真实的日常思考。</h1>
    <p class="hero-lead">
      这里是 Huravar 的个人博客。我会把学到的东西、做过的项目、踩过的坑和一些生活里的观察整理下来，方便自己回看，也希望对路过的人有一点帮助。
    </p>
    <div class="hero-actions">
      <a class="button button-primary" href="{{ '/archive/' | relative_url }}">开始阅读</a>
      <a class="button button-ghost" href="{{ '/about/' | relative_url }}">关于这个博客</a>
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
        <small>Focus</small>
        <strong>Notes</strong>
      </div>
    </div>
    <p class="console-line"><span>•</span> 最近会多写技术笔记、项目复盘和工具使用。</p>
    <p class="console-line muted"><span>•</span> 文章保持短一点、清楚一点，能复用就更好。</p>
  </div>
</section>

<section class="section-block">
  <div class="section-heading">
    <p class="eyebrow">Latest</p>
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
    <p class="eyebrow">Topics</p>
    <h2>主要写这些</h2>
    <div class="topic-list">
      <a href="{{ '/tags/#技术' | relative_url }}">技术笔记</a>
      <a href="{{ '/tags/#项目' | relative_url }}">项目复盘</a>
      <a href="{{ '/tags/#生活' | relative_url }}">生活观察</a>
      <a href="{{ '/tags/#灵感' | relative_url }}">灵感收藏</a>
    </div>
  </div>

  <div class="glass-panel">
    <p class="eyebrow">Subscribe</p>
    <h2>保持简单的订阅方式</h2>
    <p>
      你可以通过 RSS 订阅，也可以直接从归档页按时间浏览。这个站点会尽量保持轻量、快速、好读，不把注意力放在复杂功能上。
    </p>
    <a class="text-link" href="{{ '/feed.xml' | relative_url }}">订阅 RSS</a>
  </div>
</section>
