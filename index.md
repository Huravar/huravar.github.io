---
title: "首页"
description: "Huravar 的个人博客，记录技术实践、学习笔记和日常思考。"
body_class: "home-page"
---

<!-- markdownlint-disable MD033 -->

<section class="home-intro">
  <p class="site-kicker">Huravar Notes</p>
  <h1>这里主要放学习笔记、项目记录和一些能回头查的东西。</h1>
  <p>
    我希望这个博客更像一张长期维护的工作台，而不是一次性做完的展示页。文章会尽量写清楚背景、过程、踩坑和结论，方便以后重新翻出来用。
  </p>
</section>

<section class="home-layout">
  <div class="home-primary">
    <div class="section-heading plain-heading">
      <h2>最近文章</h2>
      <a href="{{ '/archive/' | relative_url }}">全部归档</a>
    </div>

    <div class="post-list">
      {% for post in site.posts limit: 10 %}
        <article class="post-list-item">
          <time datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date: "%Y-%m-%d" }}</time>
          <div>
            <h3><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h3>
            <p>{{ post.description | default: post.excerpt | strip_html | strip_newlines | truncate: 120 }}</p>
            {% if post.tags and post.tags.size > 0 %}
              <div class="tag-row">
                {% for tag in post.tags limit: 4 %}
                  <a href="{{ '/tags/#' | append: tag | relative_url }}">{{ tag }}</a>
                {% endfor %}
              </div>
            {% endif %}
          </div>
        </article>
      {% endfor %}
    </div>
  </div>

  <aside class="home-sidebar" aria-label="博客信息">
    <section class="side-block">
      <h2>正在写</h2>
      <p>AI 学习、模型实践、RAG、Agent，以及一些项目里的真实问题。</p>
    </section>

    <section class="side-block">
      <h2>常用入口</h2>
      <div class="link-stack">
        <a href="{{ '/archive/' | relative_url }}">文章归档</a>
        <a href="{{ '/tags/' | relative_url }}">主题标签</a>
        <a href="{{ '/about/' | relative_url }}">关于</a>
        <a href="{{ '/feed.xml' | relative_url }}">RSS</a>
      </div>
    </section>

    <section class="side-block">
      <h2>主题</h2>
      <div class="topic-list">
        <a href="{{ '/tags/#AI' | relative_url }}">AI</a>
        <a href="{{ '/tags/#RAG' | relative_url }}">RAG</a>
        <a href="{{ '/tags/#Transformer' | relative_url }}">Transformer</a>
        <a href="{{ '/tags/#Agent' | relative_url }}">Agent</a>
      </div>
    </section>
  </aside>
</section>
