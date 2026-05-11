---
title: "从 Embedding 到本地语义搜索"
description: "用句向量和余弦相似度搭一个本地语义搜索 demo，理解 RAG 前半段到底在做什么。"
date: 2026-05-29 20:00:00 +0800
tags: [AI, Embedding, 向量检索, 实操]
---

学 RAG 之前，我想先把 embedding 和向量检索单独拆出来。因为很多教程一上来就是框架、数据库、Agent，看起来很热闹，但我真正想知道的是：一句话怎么变成向量，检索又是怎么发生的。

这次我搭了一个不用向量数据库的本地语义搜索 demo，只用 Python、embedding 模型和余弦相似度。

## 准备几段文档

我先写了一个很小的文档列表：

```python
docs = [
    "RNN 适合处理序列数据，但长距离依赖会比较吃力。",
    "LSTM 和 GRU 通过门控机制缓解普通 RNN 的梯度问题。",
    "Transformer 使用 self-attention 建模序列中不同位置的关系。",
    "RAG 会先检索相关资料，再把资料和问题一起交给语言模型。",
    "Agent 通常会根据任务选择工具，并根据工具返回结果继续推理。",
]
```

如果直接用关键词搜索，问“怎么让模型查资料再回答”可能不一定命中 `RAG` 那句。embedding 的意义就在这里：它尝试把语义接近的文本放到相近位置。

## 安装依赖

我用 `sentence-transformers`：

```powershell
pip install sentence-transformers numpy
```

测试模型：

```python
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")
emb = model.encode(["你好", "今天天气不错"])
print(emb.shape)
```

这个模型不是最强的，但支持中文，体积也不算太夸张，适合学习。

## 生成向量

```python
import numpy as np
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")

doc_embeddings = model.encode(docs, normalize_embeddings=True)
print(doc_embeddings.shape)
```

我这里打开了 `normalize_embeddings=True`。这样后面做点积时，就相当于余弦相似度。

## 写检索函数

```python
def search(query, top_k=3):
    query_embedding = model.encode([query], normalize_embeddings=True)[0]
    scores = doc_embeddings @ query_embedding
    ranked = np.argsort(scores)[::-1][:top_k]

    results = []
    for idx in ranked:
        results.append({
            "score": float(scores[idx]),
            "text": docs[idx],
        })
    return results
```

测试：

```python
for item in search("怎么让模型先查资料再回答？"):
    print(round(item["score"], 3), item["text"])
```

我得到的前几条里，RAG 那句排在最前。这时我才对“语义搜索”有了一个很具体的感觉。

## 观察失败情况

我又试了几个问题：

```python
queries = [
    "循环神经网络为什么记不住很远的信息？",
    "注意力机制解决了什么问题？",
    "工具调用属于哪类 AI 应用？",
]

for q in queries:
    print("query:", q)
    for item in search(q):
        print(" ", round(item["score"], 3), item["text"])
```

有些结果不错，有些结果只算勉强相关。这里我提醒自己：embedding 检索不是理解全文，它只是把文本压成一个向量。文档太短、表达太绕、模型不适合领域，都可能影响结果。

## 保存向量

为了不用每次重新算，我把向量保存下来：

```python
np.save("outputs/doc_embeddings.npy", doc_embeddings)
```

文档也保存成 JSON：

```python
import json
from pathlib import Path

Path("outputs/docs.json").write_text(
    json.dumps(docs, ensure_ascii=False, indent=2),
    encoding="utf-8",
)
```

加载：

```python
doc_embeddings = np.load("outputs/doc_embeddings.npy")
docs = json.loads(Path("outputs/docs.json").read_text(encoding="utf-8"))
```

这个小动作会在文档数量变多时节省时间。

## 我现在怎么理解 embedding

我的理解还很粗，但比之前清楚：

- embedding 是把文本变成固定长度向量。
- 相似文本的向量距离通常更近。
- 向量检索先召回候选资料，不负责最终回答。
- 检索质量取决于模型、切分方式、文档质量和相似度计算。

如果后面的 RAG 回答不准，不一定是大模型的问题，可能检索阶段就没有把正确资料找出来。

## 小结

这次 demo 没有用数据库，也没有接大模型，但它把 RAG 的前半段讲清楚了：资料先变成向量，问题也变成向量，再按相似度找最相关的内容。

下一篇我会把这部分接到本地模型上，做一个真正能“检索资料再回答”的最小 RAG 流程。
