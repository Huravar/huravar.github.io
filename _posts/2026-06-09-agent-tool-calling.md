---
title: "搭一个会调用工具的简单 Agent"
description: "从工具 schema、函数执行和错误处理开始，写一个很小但边界清楚的 Agent 实验。"
date: 2026-06-09 20:00:00 +0800
tags: [AI, Agent, 工具调用, 实操]
---

学 Agent 时，我最容易被各种框架名带偏。后来我先把框架放到一边，只问一个问题：如果模型要完成任务，它怎么知道有哪些工具，怎么决定调用哪个工具，工具结果又怎么回到下一轮回答里？

这篇写一个很小的 Agent，只支持两个工具：计算器和读取学习笔记标题。功能很少，但能看清工具调用的基本流程。

## 先定义工具

我用 Python 字典描述工具：

```python
TOOLS = [
    {
        "name": "calculator",
        "description": "计算一个简单数学表达式，例如 2 + 3 * 4",
        "arguments": {
            "expression": "要计算的表达式"
        }
    },
    {
        "name": "list_notes",
        "description": "列出本地学习笔记文件名",
        "arguments": {}
    }
]
```

真实系统里 schema 会更严格，比如 JSON Schema。学习阶段我先写成这样，方便看。

## 工具实现

```python
from pathlib import Path

def calculator(expression):
    allowed = set("0123456789+-*/(). ")
    if not set(expression) <= allowed:
        raise ValueError("表达式包含不允许的字符")
    return str(eval(expression, {"__builtins__": {}}))

def list_notes():
    return "\n".join(p.name for p in Path("docs").glob("*.md"))

def run_tool(name, arguments):
    if name == "calculator":
        return calculator(arguments["expression"])
    if name == "list_notes":
        return list_notes()
    raise ValueError(f"未知工具: {name}")
```

这里的 `eval` 只用于本地学习，而且做了字符限制和空 builtins。即便如此，我也不想在真实服务里这样写计算器。工具执行是 Agent 风险最大的地方之一，不能因为是模型调用就放松。

## 约定模型输出格式

不用专门的 function calling API 时，可以先让模型输出 JSON：

```text
你是一个学习助手。
你可以使用以下工具：
{tools}

如果需要调用工具，只输出 JSON：
{"tool": "工具名", "arguments": {...}}

如果不需要工具，直接回答。
```

这个方法不稳定，但适合理解流程。生产里最好使用模型平台提供的工具调用协议，至少结构化输出更可靠。

## 写一次循环

```python
import json
import requests

def call_model(prompt):
    resp = requests.post(
        "http://127.0.0.1:11434/api/generate",
        json={"model": "qwen2.5:7b", "prompt": prompt, "stream": False},
        timeout=120,
    )
    resp.raise_for_status()
    return resp.json()["response"].strip()

def agent(question):
    prompt = f"""你是一个学习助手。
工具列表：
{json.dumps(TOOLS, ensure_ascii=False, indent=2)}

用户问题：{question}
如果需要工具，只输出 JSON。"""

    first = call_model(prompt)
    print("model:", first)

    try:
        action = json.loads(first)
    except json.JSONDecodeError:
        return first

    tool_name = action["tool"]
    arguments = action.get("arguments", {})
    result = run_tool(tool_name, arguments)

    final_prompt = f"""用户问题：{question}
工具 {tool_name} 返回：
{result}

请根据工具结果回答用户。"""
    return call_model(final_prompt)
```

测试：

```python
print(agent("帮我算一下 23 * 17"))
print(agent("我有哪些学习笔记？"))
```

第一次跑时，模型有时会在 JSON 外面加解释文字，导致解析失败。后来我在提示词里加了“只输出 JSON，不要 Markdown 代码块”，情况好一些，但仍然不能完全依赖。

## 错误处理

我加了几类错误：

```python
def safe_run_tool(name, arguments):
    try:
        return {"ok": True, "result": run_tool(name, arguments)}
    except Exception as exc:
        return {"ok": False, "error": str(exc)}
```

然后把错误也交给模型：

```python
tool_result = safe_run_tool(tool_name, arguments)
```

如果工具失败，最终回答应该说明失败原因，而不是假装成功。

## 工具边界

这次实验让我对 Agent 多了一点警惕。模型本身只是生成文本，但工具会真的做事。工具一旦能读文件、写文件、发请求、执行命令，边界就必须清楚。

我给自己列了几条规则：

- 工具只做一件小事。
- 参数要校验。
- 默认只读，写操作单独确认。
- 工具结果要记录日志。
- 不把敏感文件直接暴露给模型。
- 模型不能自己发明工具名。

## 小结

这个 Agent 很简陋，但已经包含了核心流程：模型选择工具，程序执行工具，再把结果交给模型生成最终回答。

我现在对 Agent 的理解更像“模型驱动的控制循环”，而不是一个神奇助手。真正难的地方不只是让它会调用工具，而是让工具权限、错误处理和执行记录都可控。

下一篇我会把前面的 RAG 检索接进来，做一个能查学习笔记、能调用小工具的学习助手。
