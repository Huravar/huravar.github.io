---
title: "把 AI 学习环境先搭稳"
description: "从 Python、Jupyter、PyTorch 到本地模型调用，记录一次不求花哨但能反复使用的 AI 学习环境搭建。"
date: 2026-05-12 20:00:00 +0800
tags: [AI, 学习笔记, PyTorch, 实操]
---

我之前学 AI 时有个坏习惯：看到一个新概念就急着找代码跑，结果环境一乱，注意力全被版本、路径、依赖占走了。后来我决定先花半天把学习环境整理好，不求一步到位，但至少让后面的 RNN、Transformer、RAG 实验都能在同一套基础上继续。

这篇记录的是我给自己搭的一套最小环境。

## 我想要的环境

目标很简单：

- 能写普通 Python 脚本。
- 能用 Jupyter 做小实验。
- 能跑 PyTorch。
- 能调用一个本地大模型接口。
- 每个实验有独立目录，不把笔记和临时文件混在一起。

我没有一开始就上 CUDA。原因也很现实：入门阶段的很多代码 CPU 就能跑，先把概念跑通更重要。

## 建目录

我先建了一个统一目录：

```powershell
mkdir ai-learning
cd ai-learning
mkdir notebooks scripts data outputs
```

目录大概这样：

```text
ai-learning/
  notebooks/
  scripts/
  data/
  outputs/
```

`notebooks` 放探索过程，`scripts` 放可以重复执行的代码，`data` 放小数据集，`outputs` 放模型输出或图表。这个划分很普通，但能减少后来找文件的时间。

## 创建虚拟环境

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
```

安装基础包：

```powershell
pip install torch numpy pandas matplotlib jupyter ipykernel requests
python -m ipykernel install --user --name ai-learning --display-name "AI Learning"
```

确认 PyTorch：

```powershell
python - <<'PY'
import torch
print(torch.__version__)
print(torch.cuda.is_available())
PY
```

如果 `cuda` 是 `False`，也不用急着处理。我的前几篇实验都按 CPU 可跑来设计。

## 做一个最小张量实验

我写了 `scripts/check_torch.py`：

```python
import torch

x = torch.tensor([[1.0, 2.0], [3.0, 4.0]])
w = torch.randn(2, 1)
y = x @ w

print("x shape:", x.shape)
print("w shape:", w.shape)
print("y:", y)
```

运行：

```powershell
python .\scripts\check_torch.py
```

这一步没什么技术含量，但它能确认几件事：解释器对、虚拟环境对、PyTorch 能导入、矩阵乘法正常。

## 接一个本地模型接口

我用 Ollama 做本地模型调用测试。先确认接口：

```powershell
ollama pull qwen2.5:7b
ollama run qwen2.5:7b
```

另开一个终端测试：

```powershell
curl http://127.0.0.1:11434/api/tags
```

然后写一个很小的调用脚本：

```python
import requests

payload = {
    "model": "qwen2.5:7b",
    "prompt": "用三句话解释什么是向量。",
    "stream": False,
}

resp = requests.post(
    "http://127.0.0.1:11434/api/generate",
    json=payload,
    timeout=60,
)
resp.raise_for_status()
print(resp.json()["response"])
```

我把它存成 `scripts/ask_local_model.py`。之后做 RAG 和 Agent 时，这个脚本可以慢慢改，不用每次从头查接口。

## 记录版本

环境能跑后，我生成一份依赖记录：

```powershell
pip freeze > requirements.txt
```

我也会写一个很短的 `README.md` 放在实验目录里：

```text
激活环境：
.\.venv\Scripts\Activate.ps1

启动 notebook：
jupyter notebook

本地模型：
Ollama qwen2.5:7b
API: http://127.0.0.1:11434
```

这些信息当时看起来多余，过两周再回来就会救命。

## 这次踩的小坑

第一个坑是终端没激活虚拟环境，导致 `pip install` 装到了系统 Python。后来我每次运行前先看提示符里有没有 `(.venv)`。

第二个坑是 Jupyter kernel 没选对。Notebook 里能 import 的包和命令行不一致时，通常就是 kernel 不对。

第三个坑是本地模型首次启动慢。我后来把模型调用脚本的 timeout 调大，不然总误以为接口坏了。

## 小结

这次环境搭建没有追求复杂，只留下了后面学习真正需要的东西：PyTorch、Jupyter、本地模型接口和清楚的目录结构。

我现在更愿意先把环境搭稳，再进入模型细节。环境不是学习 AI 最有趣的部分，但它会决定后面的实验能不能顺手做下去。
