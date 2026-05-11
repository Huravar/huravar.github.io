---
title: "搭一个最小 RAG 流程"
description: "把切分、向量化、检索、拼 prompt 和本地模型回答串起来，完成一个能跑的 RAG 小实验。"
date: 2026-06-02 20:00:00 +0800
tags: [AI, RAG, Embedding, 实操]
---

前面做完 embedding 检索后，我终于可以把 RAG 串起来了。RAG 这个词听起来很大，但拆开看就是几步：把资料切开，转成向量，按问题检索，把结果塞进 prompt，再让模型回答。

这篇做一个最小版本，不用框架，尽量让每一步都看得见。

## 目录结构

```text
rag-demo/
  docs/
    rnn.md
    transformer.md
    agent.md
  build_index.py
  ask.py
  outputs/
```

我在 `docs` 里放了几篇自己写的学习笔记。内容不用多，但最好是自己熟悉的，这样方便判断回答是否靠谱。

## 文档切分

先写一个很朴素的切分函数：

```python
from pathlib import Path

def load_chunks():
    chunks = []
    for path in Path("docs").glob("*.md"):
        text = path.read_text(encoding="utf-8")
        parts = [p.strip() for p in text.split("\n\n") if p.strip()]
        for i, part in enumerate(parts):
            chunks.append({
                "id": f"{path.name}:{i}",
                "source": path.name,
                "text": part,
            })
    return chunks
```

这里按空行切，很粗糙，但适合起步。后面再调 chunk size。

## 构建索引

`build_index.py`：

```python
import json
import numpy as np
from pathlib import Path
from sentence_transformers import SentenceTransformer
from common import load_chunks

model = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")
chunks = load_chunks()
texts = [item["text"] for item in chunks]

embeddings = model.encode(texts, normalize_embeddings=True)

Path("outputs").mkdir(exist_ok=True)
np.save("outputs/embeddings.npy", embeddings)
Path("outputs/chunks.json").write_text(
    json.dumps(chunks, ensure_ascii=False, indent=2),
    encoding="utf-8",
)

print("chunks:", len(chunks))
```

运行：

```powershell
python .\build_index.py
```

我第一次忘了建 `outputs` 目录，脚本直接报错。后来加了 `mkdir(exist_ok=True)`，小问题就不用每次手动处理。

## 检索相关片段

`ask.py` 里先写检索：

```python
import json
import numpy as np
from pathlib import Path
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")
chunks = json.loads(Path("outputs/chunks.json").read_text(encoding="utf-8"))
embeddings = np.load("outputs/embeddings.npy")

def retrieve(question, top_k=3):
    q = model.encode([question], normalize_embeddings=True)[0]
    scores = embeddings @ q
    order = np.argsort(scores)[::-1][:top_k]
    return [
        {**chunks[i], "score": float(scores[i])}
        for i in order
    ]
```

先不接模型，直接打印检索结果：

```python
for item in retrieve("Transformer 里的 attention 是什么？"):
    print(round(item["score"], 3), item["source"], item["text"][:80])
```

我觉得这一步很重要。RAG 回答不好时，先看检索结果，不要急着改 prompt。

## 拼 prompt

```python
def build_prompt(question, hits):
    context = "\n\n".join(
        f"[来源: {item['source']} 分数: {item['score']:.3f}]\n{item['text']}"
        for item in hits
    )
    return f"""你是一个学习笔记助手。
请只根据下面资料回答问题。
如果资料里没有答案，就说资料不足，不要编造。

资料：
{context}

问题：{question}
回答："""
```

这里我加了来源和分数，方便调试。正式展示给用户时可以隐藏分数，但学习阶段我想看见它。

## 调本地模型回答

```python
import requests

def ask_local_model(prompt):
    resp = requests.post(
        "http://127.0.0.1:11434/api/generate",
        json={
            "model": "qwen2.5:7b",
            "prompt": prompt,
            "stream": False,
        },
        timeout=120,
    )
    resp.raise_for_status()
    return resp.json()["response"]
```

串起来：

```python
question = "Transformer 里的 attention 是什么？"
hits = retrieve(question)
prompt = build_prompt(question, hits)
answer = ask_local_model(prompt)

print(answer)
print("\n引用：")
for item in hits:
    print("-", item["source"], round(item["score"], 3))
```

这就是一个最小 RAG。

## 一次观察

我问：“RNN 和 Transformer 处理序列的方式有什么不同？”

检索结果里同时出现了 RNN 和 Transformer 的笔记，回答也能对比：

```text
RNN 按时间步逐个读取输入，hidden state 负责把前面的信息传到后面。
Transformer 通过 self-attention 让不同位置之间直接计算关系，不必严格按顺序传递信息。
```

这个回答不惊艳，但符合资料。对一个最小系统来说，我觉得已经够了。

## 这次先不做的优化

我暂时没做：

- 向量数据库。
- 重排序模型。
- 流式输出。
- 多轮对话记忆。
- 复杂的引用格式。

不是它们不重要，而是现在最该看清楚的是主链路。如果主链路不清楚，框架越多越容易糊。

## 小结

这次我终于把 RAG 拆成了可运行的几步：切分、向量化、检索、拼 prompt、生成回答。

我现在对 RAG 的判断也更谨慎了。它不是“给大模型加知识库”这么简单。真正影响效果的地方很多：文档怎么切、检索是否命中、prompt 是否约束清楚、回答有没有引用。下一篇我会专门调 chunk size 和 top-k，看这些参数怎样影响结果。
