---
title: "文章归档"
description: "按时间浏览 Huravar 的所有文章。"
permalink: /archive/
---

<!-- markdownlint-disable MD033 -->

<section class="page-heading">
  <h1>文章归档</h1>
  <p>按时间倒序放在这里，方便回看最近写过什么，也能看见一段时间里关注点怎么变化。</p>
</section>

<section class="archive-list">
  {% for post in site.posts %}
    {% assign current_year = post.date | date: "%Y" %}
    {% if current_year != previous_year %}
      {% unless forloop.first %}
        </div>
      {% endunless %}
      <div class="archive-year">
        <h2>{{ current_year }}</h2>
      {% assign previous_year = current_year %}
    {% endif %}

    <article class="archive-item">
      <time datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date: "%m-%d" }}</time>
      <div>
        <h3><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h3>
        <p>{{ post.description | default: post.excerpt | strip_html | strip_newlines | truncate: 120 }}</p>
      </div>
    </article>

    {% if forloop.last %}
      </div>
    {% endif %}
  {% endfor %}
</section>
