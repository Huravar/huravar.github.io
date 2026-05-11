---
title: "调 RAG 的切分和检索参数"
description: "记录一次 RAG 调参：chunk size、top-k、检索失败案例和一个简单评估表。"
date: 2026-06-05 20:00:00 +0800
tags: [AI, RAG, 评估, 实操]
---

最小 RAG 跑通以后，我很快遇到一个问题：同样的问题，有时回答很好，有时资料明明在文档里却没检索出来。这个时候继续改 prompt 没有太大意义，应该回头看切分和检索。

这篇记录一次很朴素的 RAG 调参。

## 先做一个评估问题集

我从自己的笔记里挑了 8 个问题，写成 `eval_questions.json`：

```json
[
  {
    "question": "普通 RNN 为什么不擅长长距离依赖？",
    "expected_source": "rnn.md"
  },
  {
    "question": "self-attention 里的 Q、K、V 分别有什么作用？",
    "expected_source": "transformer.md"
  },
  {
    "question": "RAG 的基本流程包括哪些步骤？",
    "expected_source": "rag.md"
  }
]
```

我没有一开始就做复杂自动评分，只先看正确资料有没有被检索到。

## 改成按长度切分

上一篇按空行切分，有的 chunk 太短，有的又太长。我写了一个按字符长度切分的版本：

```python
def split_text(text, chunk_size=300, overlap=50):
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start = end - overlap
        if start < 0:
            start = 0
    return chunks
```

这里有个小坑：如果 `overlap >= chunk_size`，循环会卡住。所以我加了一句检查：

```python
if overlap >= chunk_size:
    raise ValueError("overlap 必须小于 chunk_size")
```

## 跑几组参数

我先试三组：

```text
chunk_size=200, overlap=40
chunk_size=400, overlap=80
chunk_size=800, overlap=120
```

评估脚本：

```python
import json

questions = json.loads(open("eval_questions.json", encoding="utf-8").read())

def hit_rate(retrieve):
    hit = 0
    rows = []
    for item in questions:
        results = retrieve(item["question"], top_k=3)
        sources = [r["source"] for r in results]
        ok = item["expected_source"] in sources
        hit += int(ok)
        rows.append((item["question"], ok, sources))
    return hit / len(questions), rows
```

每次调整切分后重建索引，再跑评估。这个流程有点手工，但能让我看清变化。

## 我的观察

`chunk_size=200` 时，命中率不算差，但有些回答缺上下文。比如问题问“RAG 的基本流程”，检索到了“向量化”那一段，却没检索到“拼 prompt”和“生成回答”。

`chunk_size=800` 时，单个 chunk 信息更完整，但相似度被稀释，有时把不太相关的大段文字排上来。

`chunk_size=400, overlap=80` 在我的小笔记里最均衡。这个结论只适合这批文档，不应该当通用答案。

我把结果记成表：

```text
参数                    top3 命中率   备注
200 / 40                0.75         片段太碎，回答容易缺上下文
400 / 80                0.88         当前最好
800 / 120               0.63         片段太宽，相似度不集中
```

## top-k 也会影响回答

我又固定 `chunk_size=400`，尝试 `top_k=1, 3, 5`。

```text
top_k=1：回答更干净，但容易漏资料
top_k=3：多数问题够用
top_k=5：资料更全，但 prompt 变长，模型有时抓不住重点
```

我原来以为 top-k 越大越安全，后来发现不是。塞太多资料进去，模型反而可能被弱相关内容带偏。

## 看失败案例

有一个问题一直检索不好：

```text
问题：模型为什么不能偷看未来 token？
预期：transformer.md
```

原因是我的笔记里写的是 `causal mask`，没有写“偷看未来”。embedding 模型有时能连上，有时连不上。

我最后不是调参数，而是改文档：

```markdown
causal mask 的作用是防止当前位置看到未来 token，也就是训练语言模型时不能偷看答案。
```

这个改动比继续调 top-k 有用。RAG 的资料本身也需要面向检索来写。

## 给回答加引用检查

我还加了一条简单规则：回答必须列出引用来源。

```text
请在回答最后写“依据：”，列出使用到的资料文件名。
如果资料不足，不要猜。
```

然后我会检查模型列出的来源是否真的在检索结果里。这个检查不复杂，但能发现模型乱引用的情况。

## 小结

这次调参让我明白，RAG 的效果不是一个 prompt 能解决的。切分太碎，答案缺上下文；切分太大，检索不精准；top-k 太小会漏，太大又会乱。

我现在会把 RAG 调试分成三步：

1. 先看检索有没有命中正确资料。
2. 再看 prompt 里的资料是否足够回答。
3. 最后才看模型生成是否稳定。

下一篇开始看 Agent。和 RAG 相比，Agent 多了工具调用和执行边界，问题会更像工程系统。
