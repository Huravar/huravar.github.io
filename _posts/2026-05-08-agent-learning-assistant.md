---
title: "把 RAG 和 Agent 组合成一个学习助手"
description: "用本地笔记检索、工具调用和简单执行循环做一个学习助手，并复盘它好用和不好用的地方。"
date: 2026-05-08 20:00:00 +0800
tags: [AI, RAG, Agent, 学习笔记, 实操]
---

前面几篇分别做了 embedding、RAG 和工具调用。最后我想把它们组合起来，做一个很小的学习助手：它能查我的本地 AI 学习笔记，也能调用少量工具，比如列出笔记、做简单计算、返回引用来源。

我不想把它包装成完整产品，只把它当成一次学习复盘。

## 目标先写清楚

这个助手只做三件事：

1. 回答 AI 学习笔记里的问题。
2. 回答时给出引用来源。
3. 必要时调用简单工具。

它明确不做：

- 不联网搜索。
- 不修改文件。
- 不读取笔记目录之外的内容。
- 不长期记忆用户对话。

限制先写出来，后面实现时才不容易越做越大。

## 目录结构

```text
study-agent/
  docs/
    rnn.md
    transformer.md
    rag.md
    agent.md
  outputs/
    chunks.json
    embeddings.npy
  build_index.py
  tools.py
  assistant.py
```

`build_index.py` 沿用前面 RAG 的索引构建逻辑。重点放在 `tools.py` 和 `assistant.py`。

## 工具设计

我只放三个工具：

```python
TOOLS = [
    {
        "name": "search_notes",
        "description": "检索本地 AI 学习笔记，返回相关片段和来源",
        "arguments": {"query": "检索问题"}
    },
    {
        "name": "list_notes",
        "description": "列出当前笔记文件",
        "arguments": {}
    },
    {
        "name": "calculator",
        "description": "计算简单数学表达式",
        "arguments": {"expression": "数学表达式"}
    }
]
```

我没有给它“读取任意文件”或“执行命令”的工具。学习助手不需要这些能力，给了反而麻烦。

## search_notes 工具

```python
import json
import numpy as np
from pathlib import Path
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")
chunks = json.loads(Path("outputs/chunks.json").read_text(encoding="utf-8"))
embeddings = np.load("outputs/embeddings.npy")

def search_notes(query, top_k=3):
    q = model.encode([query], normalize_embeddings=True)[0]
    scores = embeddings @ q
    order = np.argsort(scores)[::-1][:top_k]

    results = []
    for i in order:
        results.append({
            "source": chunks[i]["source"],
            "text": chunks[i]["text"],
            "score": round(float(scores[i]), 3),
        })
    return results
```

这个工具返回结构化数据，不直接生成回答。回答交给模型做。

## Agent 主循环

我把循环限制为最多两次工具调用：

```python
MAX_STEPS = 2

def assistant(question):
    messages = [
        {
            "role": "system",
            "content": "你是 AI 学习助手。优先检索本地笔记。回答要给出来源。"
        },
        {
            "role": "user",
            "content": question
        }
    ]

    for _ in range(MAX_STEPS):
        action_or_answer = call_model_with_tools(messages, TOOLS)

        if action_or_answer["type"] == "answer":
            return action_or_answer["content"]

        result = run_tool(
            action_or_answer["tool"],
            action_or_answer.get("arguments", {})
        )
        messages.append({
            "role": "tool",
            "content": json.dumps(result, ensure_ascii=False)
        })

    return "我没有在限定步骤内得到可靠答案，请缩小问题范围。"
```

这里的 `call_model_with_tools` 可以用真实工具调用 API，也可以先用 JSON 文本协议模拟。学习阶段我更关注控制流。

## 回答 prompt

最终回答时，我要求它保持克制：

```text
请根据工具返回的资料回答。
要求：
1. 不要超出资料编造。
2. 回答后列出“依据：文件名”。
3. 如果资料不足，直接说明资料不足。
4. 如果问题太大，给出下一步学习建议。
```

这段提示词不神奇，但能减少一些过度发挥。

## 测试几个问题

我试了三个问题。

第一个：

```text
RNN 和 Transformer 处理序列的方式有什么不同？
```

回答能引用 `rnn.md` 和 `transformer.md`，并说出 RNN 按时间步传递 hidden state，Transformer 用 attention 建模位置关系。这个结果是我想要的。

第二个：

```text
帮我列出当前有哪些笔记。
```

模型选择了 `list_notes`，返回文件名。这个工具很稳定。

第三个：

```text
如果一个 batch 有 32 条样本，每条序列 64 个 token，一共有多少 token？
```

它调用 calculator，得到 2048。这个问题不用 RAG，工具调用更直接。

## 不好用的地方

也有明显问题。

第一，模型有时会在已经检索到资料后继续想调用工具。后来我加了最多两步限制，避免它绕圈。

第二，引用来源有时写得不准。工具返回的是 `source`，但模型会改写文件名。我最后把来源作为固定字段放在回答模板里，而不是让模型自由发挥。

第三，问题太宽时，检索结果会很杂。比如“讲讲 AI”这种问题，助手应该要求缩小范围，而不是硬答。

## 我保留的边界

这次组合后，我更确信 Agent 的边界要早定：

- 只读笔记目录。
- 工具白名单。
- 最多工具调用次数。
- 工具参数校验。
- 回答必须带来源。
- 资料不足时允许拒答。

这些限制会让助手看起来没那么“万能”，但它更像一个可长期使用的学习工具。

## 小结

从环境搭建、RNN、LSTM/GRU、Transformer、embedding、RAG 到 Agent，这十篇算是一条小路线。它没有覆盖所有 AI 知识，但把我最想理解的几件事串起来了：序列怎么建模，文本怎么变向量，资料怎么检索，模型怎么调用工具。

我现在对“搭 Agent”这件事也冷静了很多。真正有价值的不是让模型说自己会做很多事，而是把资料、工具、权限和失败处理安排清楚。这样做出来的东西也许朴素，但更适合学习。
