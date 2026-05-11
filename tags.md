---
title: "主题标签"
description: "按标签浏览博客文章。"
permalink: /tags/
---

<!-- markdownlint-disable MD033 -->

<section class="page-heading">
  <h1>主题标签</h1>
  <p>按主题聚合文章，方便从不同方向继续阅读。</p>
</section>

<section class="tag-cloud">
  {% assign sorted_tags = site.tags | sort %}
  {% for tag in sorted_tags %}
    <a href="#{{ tag[0] | slugify: 'raw' }}">{{ tag[0] }} <span>{{ tag[1] | size }}</span></a>
  {% endfor %}
</section>

<section class="tag-index">
  {% for tag in sorted_tags %}
    <div id="{{ tag[0] | slugify: 'raw' }}" class="tag-group">
      <h2>{{ tag[0] }}</h2>
      <div class="archive-list compact">
        {% for post in tag[1] %}
          <article class="archive-item">
            <time datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date: "%Y-%m-%d" }}</time>
            <div>
              <h3><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h3>
              <p>{{ post.description | default: post.excerpt | strip_html | strip_newlines | truncate: 100 }}</p>
            </div>
          </article>
        {% endfor %}
      </div>
    </div>
  {% endfor %}
</section>
