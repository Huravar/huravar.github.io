---
title: "用 LSTM 和 GRU 重新做一次序列分类"
description: "在同一个小任务上对比普通 RNN、LSTM 和 GRU，记录门控结构带来的实际差异。"
date: 2026-05-19 20:00:00 +0800
tags: [AI, RNN, LSTM, GRU, 实操]
---

上一篇手写普通 RNN 后，我对 hidden state 有了直观感觉，但也看到了它在长序列上不太稳。这次我没有急着读复杂论文，而是用同一个序列分类任务，把 RNN 换成 LSTM 和 GRU，看训练过程有什么变化。

我更关心的是实际手感：同样的数据、同样的训练循环，模型是不是更容易学到长一点的依赖。

## 数据任务稍微改难一点

这次任务是：输入长度为 30 的数字序列，如果前 5 个数字之和大于后 5 个数字之和，标签为 1，否则为 0。

```python
import torch

def make_batch(batch_size=64, seq_len=30):
    x = torch.randint(0, 10, (batch_size, seq_len)).float()
    y = (x[:, :5].sum(dim=1) > x[:, -5:].sum(dim=1)).long()
    x = x.unsqueeze(-1) / 10.0
    return x, y
```

这个任务故意让模型同时记住序列开头和结尾的信息。普通 RNN 也能试，但会比较不稳定。

## 先写一个可替换模型

我把模型类写成可以切换 `rnn`、`lstm`、`gru`：

```python
import torch.nn as nn

class SeqClassifier(nn.Module):
    def __init__(self, kind="lstm", hidden_size=32):
        super().__init__()
        if kind == "rnn":
            self.encoder = nn.RNN(1, hidden_size, batch_first=True)
        elif kind == "gru":
            self.encoder = nn.GRU(1, hidden_size, batch_first=True)
        elif kind == "lstm":
            self.encoder = nn.LSTM(1, hidden_size, batch_first=True)
        else:
            raise ValueError(kind)

        self.fc = nn.Linear(hidden_size, 2)

    def forward(self, x):
        output, state = self.encoder(x)
        last = output[:, -1, :]
        return self.fc(last)
```

这里我第一次卡在 LSTM 的 `state`。RNN 和 GRU 返回的是最后 hidden，LSTM 返回的是 `(h, c)`。不过这段代码直接用 `output[:, -1, :]`，三者都能统一处理。

## 训练函数

```python
import torch.nn.functional as F

def train(kind):
    model = SeqClassifier(kind=kind)
    optimizer = torch.optim.Adam(model.parameters(), lr=0.005)

    for step in range(500):
        x, y = make_batch()
        logits = model(x)
        loss = F.cross_entropy(logits, y)

        optimizer.zero_grad()
        loss.backward()
        optimizer.step()

        if step % 100 == 0:
            pred = logits.argmax(dim=1)
            acc = (pred == y).float().mean().item()
            print(kind, step, round(loss.item(), 4), round(acc, 3))

    return model
```

分别运行：

```python
for kind in ["rnn", "gru", "lstm"]:
    train(kind)
```

我的一次观察是：GRU 和 LSTM 往往比普通 RNN 更快稳定下来。这个结论不能当严谨 benchmark，因为数据是随机生成的，参数也没认真调，但学习阶段已经足够说明差异。

## 门控到底帮了什么

我现在对 LSTM/GRU 的理解还比较朴素：

- 普通 RNN 每一步都把旧 hidden 和新输入混在一起。
- LSTM 多了 cell state，用门控制保留、写入和输出。
- GRU 结构更简洁，用更新门和重置门控制信息流。

如果把序列当成一条很长的路，普通 RNN 每一步都可能把早期信息冲淡；门控结构至少给模型一个机会：哪些东西继续带着，哪些东西可以忘掉。

这个解释不够数学，但对我理解训练现象有帮助。

## 做一次简单验证

我加了一个验证函数，避免只看训练 batch：

```python
def evaluate(model, rounds=50):
    total_acc = 0
    with torch.no_grad():
        for _ in range(rounds):
            x, y = make_batch()
            pred = model(x).argmax(dim=1)
            total_acc += (pred == y).float().mean().item()
    return total_acc / rounds
```

训练后打印：

```python
model = train("gru")
print("eval acc:", evaluate(model))
```

这一步很小，但能提醒我不要只盯着训练过程里的某一次高准确率。

## 这次没有做的事

我暂时没有手写 LSTM 的每个门。原因是我现在更想先建立模型之间的使用差异，再回头补公式。完全手写当然有价值，但如果一开始陷进矩阵细节，可能会忘了它解决的是什么问题。

后面学 Transformer 时，我会采用类似方式：先写一个最小 attention，让数据流动看得见，再去补更完整的结构。

## 小结

这次练习让我把 RNN、LSTM、GRU 放到了同一个任务里比较。普通 RNN 最容易理解，但长一点的依赖就开始吃力；LSTM 和 GRU 多了门控，训练起来更稳一些。

我的下一步不是继续调这个小任务，而是转向 Transformer。因为现在很多模型的核心已经不是“按顺序一步步记”，而是用 attention 直接看序列里不同位置之间的关系。
