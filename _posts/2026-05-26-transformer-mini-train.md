---
title: "训练一个很小的 Transformer 语言模型"
description: "用字符级 tokenizer 和小语料训练迷你 Transformer，记录 loss、采样效果和几个不太顺的地方。"
date: 2026-05-26 20:00:00 +0800
tags: [AI, Transformer, 语言模型, 实操]
---

手写 self-attention 之后，我想继续往前走一步：训练一个能生成文本的小模型。它不需要聪明，也不需要像真正大模型那样泛化，只要能让我看到 tokenizer、训练 loss、上下文窗口和采样之间的关系。

这次我做的是字符级迷你 Transformer。数据很小，模型也很小，重点是完整跑通。

## 准备语料

我先建一个文本文件 `data/tiny.txt`，里面放一些自己的学习笔记片段。内容不需要很多，但至少几千字，不然模型很快记住训练集。

读入数据：

```python
from pathlib import Path

text = Path("data/tiny.txt").read_text(encoding="utf-8")
chars = sorted(list(set(text)))
stoi = {ch: i for i, ch in enumerate(chars)}
itos = {i: ch for ch, i in stoi.items()}

def encode(s):
    return [stoi[c] for c in s]

def decode(ids):
    return "".join(itos[i] for i in ids)

data = encode(text)
print("chars:", len(chars), "tokens:", len(data))
```

字符级 tokenizer 很粗糙，但适合入门。它不需要额外训练，也不会被分词细节卡住。

## 构造 batch

语言模型训练的目标是：给前面的 token，预测下一个 token。

```python
import torch

block_size = 64
batch_size = 32
tensor_data = torch.tensor(data, dtype=torch.long)

def get_batch():
    ix = torch.randint(len(tensor_data) - block_size - 1, (batch_size,))
    x = torch.stack([tensor_data[i:i+block_size] for i in ix])
    y = torch.stack([tensor_data[i+1:i+block_size+1] for i in ix])
    return x, y
```

这里的 `x` 和 `y` 只差一个位置。第一次写时我把 `y` 截错了，loss 下降得很奇怪。后来打印一组 decode 才发现错位。

```python
x, y = get_batch()
print(decode(x[0].tolist()))
print(decode(y[0].tolist()))
```

## 一个迷你 Transformer Block

为了篇幅，我把模块写得比较紧：

```python
import torch.nn as nn
import torch.nn.functional as F

class Head(nn.Module):
    def __init__(self, n_embd, head_size):
        super().__init__()
        self.key = nn.Linear(n_embd, head_size, bias=False)
        self.query = nn.Linear(n_embd, head_size, bias=False)
        self.value = nn.Linear(n_embd, head_size, bias=False)
        self.register_buffer("tril", torch.tril(torch.ones(block_size, block_size)))

    def forward(self, x):
        b, t, c = x.shape
        k = self.key(x)
        q = self.query(x)
        wei = q @ k.transpose(-2, -1) * (k.shape[-1] ** -0.5)
        wei = wei.masked_fill(self.tril[:t, :t] == 0, float("-inf"))
        wei = F.softmax(wei, dim=-1)
        v = self.value(x)
        return wei @ v
```

再做多头和前馈层：

```python
class MultiHeadAttention(nn.Module):
    def __init__(self, n_embd, num_heads):
        super().__init__()
        head_size = n_embd // num_heads
        self.heads = nn.ModuleList([Head(n_embd, head_size) for _ in range(num_heads)])
        self.proj = nn.Linear(n_embd, n_embd)

    def forward(self, x):
        return self.proj(torch.cat([h(x) for h in self.heads], dim=-1))

class Block(nn.Module):
    def __init__(self, n_embd, num_heads):
        super().__init__()
        self.sa = MultiHeadAttention(n_embd, num_heads)
        self.ff = nn.Sequential(
            nn.Linear(n_embd, 4 * n_embd),
            nn.ReLU(),
            nn.Linear(4 * n_embd, n_embd),
        )
        self.ln1 = nn.LayerNorm(n_embd)
        self.ln2 = nn.LayerNorm(n_embd)

    def forward(self, x):
        x = x + self.sa(self.ln1(x))
        x = x + self.ff(self.ln2(x))
        return x
```

## 完整模型

```python
class TinyTransformer(nn.Module):
    def __init__(self, vocab_size, n_embd=64, num_heads=4, num_layers=2):
        super().__init__()
        self.token_embedding = nn.Embedding(vocab_size, n_embd)
        self.position_embedding = nn.Embedding(block_size, n_embd)
        self.blocks = nn.Sequential(*[
            Block(n_embd, num_heads) for _ in range(num_layers)
        ])
        self.ln = nn.LayerNorm(n_embd)
        self.head = nn.Linear(n_embd, vocab_size)

    def forward(self, idx, targets=None):
        b, t = idx.shape
        token = self.token_embedding(idx)
        pos = self.position_embedding(torch.arange(t, device=idx.device))
        x = token + pos
        x = self.blocks(x)
        logits = self.head(self.ln(x))

        loss = None
        if targets is not None:
            loss = F.cross_entropy(logits.view(-1, logits.size(-1)), targets.view(-1))
        return logits, loss
```

训练：

```python
model = TinyTransformer(vocab_size=len(chars))
optimizer = torch.optim.AdamW(model.parameters(), lr=3e-4)

for step in range(1000):
    xb, yb = get_batch()
    logits, loss = model(xb, yb)
    optimizer.zero_grad()
    loss.backward()
    optimizer.step()

    if step % 100 == 0:
        print(step, round(loss.item(), 4))
```

## 生成文本

```python
@torch.no_grad()
def generate(model, idx, max_new_tokens=200):
    for _ in range(max_new_tokens):
        idx_cond = idx[:, -block_size:]
        logits, _ = model(idx_cond)
        logits = logits[:, -1, :]
        probs = F.softmax(logits, dim=-1)
        next_id = torch.multinomial(probs, num_samples=1)
        idx = torch.cat([idx, next_id], dim=1)
    return idx

start = torch.zeros((1, 1), dtype=torch.long)
out = generate(model, start)
print(decode(out[0].tolist()))
```

刚开始生成内容非常乱。训练久一点后，会出现一些像样的词和标点，但整体仍然很碎。这是正常的：语料少、模型小、字符级分词都限制了效果。

## 这次的收获

我这次最有感觉的不是生成文本，而是几个部件终于连起来了：

- tokenizer 把文本变成 id。
- embedding 把 id 变成向量。
- positional embedding 补上位置信息。
- causal attention 阻止模型偷看未来。
- loss 衡量下一个 token 预测得怎么样。
- generate 用模型一步步采样。

## 小结

这个迷你模型没有实用价值，但学习价值很高。它让我知道一个语言模型训练脚本大概有哪些骨架，也让我对大模型的复杂度有了更具体的想象。

下一步我会暂时离开训练模型，去看 embedding 和向量检索。因为 RAG 里很多工程问题，不在训练阶段，而在怎么把资料找到并塞给模型。
