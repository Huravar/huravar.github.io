---
title: "从零写一个 RNN 小实验"
description: "不用复杂框架封装，手写一个最小 RNN，理解 hidden state、序列输入和梯度不稳定。"
date: 2026-05-15 20:00:00 +0800
tags: [AI, RNN, PyTorch, 实操]
---

学 RNN 时，我以前总是直接看 `nn.RNN`、`nn.LSTM` 的参数说明，结果看完还是有点虚。后来我换了个办法：先手写一个非常小的 RNN 单元，只处理玩具序列，不追求效果，把 hidden state 到底怎么传下去看清楚。

这篇就是这次小实验的记录。

## 任务设定

我做了一个很小的分类任务：输入一串数字，如果最后三个数字的和大于 15，就输出 1，否则输出 0。

例如：

```text
[1, 2, 3, 9, 8, 1] -> 9 + 8 + 1 = 18 -> 1
[4, 3, 2, 1, 5, 1] -> 1 + 5 + 1 = 7 -> 0
```

这个任务很简单，但它有序列信息。模型需要一步步读输入，最后根据 hidden state 做判断。

## 生成数据

```python
import torch

def make_batch(batch_size=32, seq_len=6):
    x = torch.randint(0, 10, (batch_size, seq_len)).float()
    y = (x[:, -3:].sum(dim=1) > 15).long()
    x = x.unsqueeze(-1) / 10.0
    return x, y
```

这里 `x` 的形状是：

```text
batch_size, seq_len, input_size
```

我一开始忘了最后的 `unsqueeze(-1)`，后面矩阵乘法一直对不上。这个错误很基础，但也提醒我：序列模型里 shape 比想象中更重要。

## 手写 RNN 单元

```python
import torch.nn as nn
import torch.nn.functional as F

class TinyRNN(nn.Module):
    def __init__(self, input_size=1, hidden_size=16, num_classes=2):
        super().__init__()
        self.hidden_size = hidden_size
        self.w_xh = nn.Linear(input_size, hidden_size)
        self.w_hh = nn.Linear(hidden_size, hidden_size)
        self.fc = nn.Linear(hidden_size, num_classes)

    def forward(self, x):
        batch_size, seq_len, _ = x.shape
        h = torch.zeros(batch_size, self.hidden_size)

        for t in range(seq_len):
            h = torch.tanh(self.w_xh(x[:, t, :]) + self.w_hh(h))

        return self.fc(h)
```

这段代码把 RNN 的核心暴露得很直接：

```text
当前输入 x_t
上一步 hidden h
新的 hidden = tanh(Wx + Wh)
```

它不是高性能写法，但适合学习。

## 训练循环

```python
model = TinyRNN()
optimizer = torch.optim.Adam(model.parameters(), lr=0.01)

for step in range(300):
    x, y = make_batch()
    logits = model(x)
    loss = F.cross_entropy(logits, y)

    optimizer.zero_grad()
    loss.backward()
    optimizer.step()

    if step % 50 == 0:
        pred = logits.argmax(dim=1)
        acc = (pred == y).float().mean().item()
        print(step, "loss", round(loss.item(), 4), "acc", round(acc, 3))
```

我第一次跑时准确率上下波动比较明显。后来把 batch size 调大一点，曲线才稳定一些。这个任务太小，随机 batch 的影响会比较明显。

## 看 hidden state 的变化

为了不只看 loss，我加了几行打印 hidden norm 的代码：

```python
with torch.no_grad():
    x, _ = make_batch(batch_size=1)
    h = torch.zeros(1, model.hidden_size)
    for t in range(x.shape[1]):
        h = torch.tanh(model.w_xh(x[:, t, :]) + model.w_hh(h))
        print(t, x[0, t, 0].item(), h.norm().item())
```

输出不一定有很强解释性，但能看到 hidden state 不是一个抽象名词，它确实随着每个时间步更新。

## 梯度问题的直观感受

我把序列长度从 6 改到 40，任务变成看最前面几个数字。普通 RNN 训练明显更不稳定，准确率很难上去。

这时我才更能理解课本里说的梯度消失和长期依赖。不是所有序列任务都适合普通 RNN。它能处理短依赖，但序列一长，早期信息传到最后会很吃力。

我没有在这里硬调参数，因为下一篇会看 LSTM 和 GRU。普通 RNN 先学到这里就够了：它的结构简单，也有明显限制。

## 小结

这次手写 RNN 后，我对 `hidden state` 的理解清楚了不少。它不是模型里神秘的一块记忆，而是每个时间步不断更新的一组数。

这篇最有价值的不是准确率，而是三个细节：

- 输入 shape 要想清楚。
- hidden state 是按时间步传递的。
- 普通 RNN 在长序列上会变得吃力。

下一步我会用同一个小任务试 LSTM 和 GRU，看它们到底多了哪些门控。
