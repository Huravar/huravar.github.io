---
title: "手写一个最小 Self-Attention"
description: "从 Q、K、V 和 attention mask 开始，用 PyTorch 写一个小实验理解 Transformer 的核心计算。"
date: 2026-04-17 20:00:00 +0800
tags: [AI, Transformer, Attention, PyTorch, 实操]
---

学 Transformer 时，我最开始被结构图劝退过。Encoder、Decoder、Multi-Head、LayerNorm、FFN 全堆在一起，看起来像一大块机器。后来我发现可以先只盯住 self-attention：输入一组 token 向量，让每个位置去“看”其他位置。

这篇只写最小 self-attention，不急着搭完整 Transformer。

## 先准备一组假 token

我用随机张量模拟 4 个 token，每个 token 8 维：

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

torch.manual_seed(0)

x = torch.randn(1, 4, 8)
print(x.shape)
```

形状是：

```text
batch, seq_len, embed_dim
```

这里 `seq_len=4`，方便后面直接看 attention 矩阵。

## Q、K、V 是怎么来的

我以前总把 Q、K、V 当成三个神秘概念。实际代码里，它们就是对输入做三次线性变换：

```python
embed_dim = 8

to_q = nn.Linear(embed_dim, embed_dim, bias=False)
to_k = nn.Linear(embed_dim, embed_dim, bias=False)
to_v = nn.Linear(embed_dim, embed_dim, bias=False)

q = to_q(x)
k = to_k(x)
v = to_v(x)

print(q.shape, k.shape, v.shape)
```

输出形状仍然是：

```text
1, 4, 8
```

直觉上，我现在把它们理解成三种视角：

- Q：当前位置想找什么。
- K：每个位置提供什么索引。
- V：真正被加权汇总的信息。

这个说法不严谨，但写代码时够用。

## 计算 attention 分数

```python
scores = q @ k.transpose(-2, -1)
scores = scores / (embed_dim ** 0.5)
print(scores.shape)
```

形状变成：

```text
batch, seq_len, seq_len
```

也就是每个位置对每个位置都有一个分数。`scores[0]` 是一个 4x4 矩阵。

接着 softmax：

```python
weights = F.softmax(scores, dim=-1)
print(weights[0])
```

每一行加起来接近 1。某一行表示“这个位置看其他位置的比例”。

最后加权求和：

```python
out = weights @ v
print(out.shape)
```

输出形状又回到：

```text
1, 4, 8
```

这一步让我终于把 attention 的数据流看顺了：先算位置之间的关系，再按关系混合信息。

## 加一个因果 mask

如果是语言模型，当前位置不应该看到未来 token。比如第 2 个位置不能偷看第 3、4 个位置。这个时候需要 mask。

```python
seq_len = x.shape[1]
mask = torch.triu(torch.ones(seq_len, seq_len), diagonal=1).bool()
scores = scores.masked_fill(mask, float("-inf"))
weights = F.softmax(scores, dim=-1)
```

我打印 mask 看了一眼：

```python
print(mask)
```

大概是：

```text
False True  True  True
False False True  True
False False False True
False False False False
```

这说明每个位置只能看自己和之前的位置。

## 封装成一个模块

```python
class SelfAttention(nn.Module):
    def __init__(self, embed_dim):
        super().__init__()
        self.to_q = nn.Linear(embed_dim, embed_dim, bias=False)
        self.to_k = nn.Linear(embed_dim, embed_dim, bias=False)
        self.to_v = nn.Linear(embed_dim, embed_dim, bias=False)
        self.scale = embed_dim ** 0.5

    def forward(self, x, causal=False):
        q = self.to_q(x)
        k = self.to_k(x)
        v = self.to_v(x)

        scores = q @ k.transpose(-2, -1) / self.scale

        if causal:
            seq_len = x.shape[1]
            mask = torch.triu(
                torch.ones(seq_len, seq_len, device=x.device),
                diagonal=1,
            ).bool()
            scores = scores.masked_fill(mask, float("-inf"))

        weights = F.softmax(scores, dim=-1)
        return weights @ v, weights
```

测试：

```python
attn = SelfAttention(8)
out, weights = attn(x, causal=True)
print(out.shape)
print(weights[0])
```

我特意让它返回 `weights`，因为学习阶段看 attention 权重很有帮助。

## 这次先不碰多头

Multi-Head Attention 本质上是把 embedding 切成多个头，各自做 attention，再拼起来。它很重要，但我暂时不急着写。

如果一开始就把多头、残差、LayerNorm、FFN 全塞进来，我会看不到 attention 自己在做什么。先把一头 attention 写清楚，后面加结构会轻松一点。

## 小结

这次实验后，Transformer 对我来说不再是一张复杂结构图。至少 self-attention 这部分，我能用几步说清楚：

1. 输入 token 向量。
2. 线性变换得到 Q、K、V。
3. Q 和 K 算相似度。
4. softmax 得到权重。
5. 用权重汇总 V。
6. 语言模型场景加 causal mask。

下一篇我会在这个基础上搭一个小型 Transformer 语言模型。它肯定很简陋，但只要能从训练 loss 和生成文本里看到变化，就值得继续。
