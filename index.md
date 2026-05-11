---
title: "首页"
description: "Huravar 的个人博客，记录技术实践、学习笔记和日常思考。"
body_class: "home-page"
---

<!-- markdownlint-disable MD033 -->

{% assign latest_post = site.posts.first %}

<section class="magazine-layout">
  <div class="magazine-main">
    {% if latest_post %}
      <article class="featured-post">
        <a href="{{ latest_post.url | relative_url }}">
          <div class="featured-label">最新发布</div>
          <h1>{{ latest_post.title }}</h1>
          <p>{{ latest_post.description | default: latest_post.excerpt | strip_html | strip_newlines | truncate: 160 }}</p>
          <div class="post-info">
            <time datetime="{{ latest_post.date | date_to_xmlschema }}">{{ latest_post.date | date: "%Y-%m-%d" }}</time>
            {% if latest_post.tags and latest_post.tags.size > 0 %}
              <span>{{ latest_post.tags | join: " / " }}</span>
            {% endif %}
          </div>
        </a>
      </article>
    {% endif %}

    <section class="magazine-section">
      <div class="magazine-heading">
        <h2>最新文章</h2>
        <a href="{{ '/archive/' | relative_url }}">查看归档</a>
      </div>

      <div class="magazine-grid">
        {% for post in site.posts offset: 1 limit: 6 %}
          <article class="magazine-card">
            <a href="{{ post.url | relative_url }}">
              {% if post.tags and post.tags.size > 0 %}
                <span class="card-category">{{ post.tags | first }}</span>
              {% endif %}
              <h3>{{ post.title }}</h3>
              <p>{{ post.description | default: post.excerpt | strip_html | strip_newlines | truncate: 110 }}</p>
              <time datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date: "%Y-%m-%d" }}</time>
            </a>
          </article>
        {% endfor %}
      </div>
    </section>

    <section class="magazine-section">
      <div class="magazine-heading">
        <h2>专题阅读</h2>
        <a href="{{ '/tags/' | relative_url }}">全部标签</a>
      </div>

      <div class="topic-strip">
        {% assign sorted_tags = site.tags | sort %}
        {% for tag in sorted_tags limit: 8 %}
          <a href="{{ '/tags/#' | append: tag[0] | relative_url }}">{{ tag[0] }}</a>
        {% endfor %}
      </div>
    </section>
  </div>

  <aside class="magazine-sidebar" aria-label="侧边栏">
    <section class="sidebar-widget">
      <h2>最近更新</h2>
      <ul class="sidebar-posts">
        {% for post in site.posts limit: 5 %}
          <li>
            <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
            <time datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date: "%m-%d" }}</time>
          </li>
        {% endfor %}
      </ul>
    </section>

    <section class="sidebar-widget">
      <h2>分类入口</h2>
      <div class="sidebar-links">
        <a href="{{ '/archive/' | relative_url }}">文章归档</a>
        <a href="{{ '/tags/' | relative_url }}">主题标签</a>
        <a href="{{ '/about/' | relative_url }}">关于本站</a>
        <a href="{{ '/feed.xml' | relative_url }}">RSS 订阅</a>
      </div>
    </section>
  </aside>
</section>
