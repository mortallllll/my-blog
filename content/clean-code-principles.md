---
title: "代码整洁之道：写出让人看得懂的代码"
date: "2026-06-01"
description: "编程不只是让机器运行，更是与队友的对话。分享几个实用的代码整洁原则，让你的代码可读性翻倍。"
tags: ["编程", "最佳实践", "软件工程"]
draft: false
---

## 代码是写给人看的

Martin Fowler 曾说："任何一个傻瓜都能写出计算机可以理解的代码，只有写出人类容易理解的代码才是优秀的程序员。"

### 1. 命名即文档

好的命名胜过十行注释。来看一个例子：

```python
# 糟糕 ❌
def calc(d, t):
    return d * 0.1 if t == 'v' else d * 0.2

# 清晰 ✅
def calculate_discount(order_amount, customer_type):
    vip_rate = 0.1
    regular_rate = 0.2
    return order_amount * vip_rate if customer_type == 'vip' else order_amount * regular_rate
```

### 2. 函数只做一件事

每个函数应承担单一职责。如果一个函数的名字里出现了"和"字（比如 `fetch_and_parse_data`），就该拆成两个。

```javascript
// 拆之前
async function fetchAndRenderPosts() {
  const res = await fetch('/api/posts')
  const posts = await res.json()
  renderPostList(posts)
  updatePagination()
  trackAnalytics()
}

// 拆之后
async function fetchPosts() { /* ... */ }
function renderPosts(posts) { /* ... */ }
function setupPagination() { /* ... */ }
function logPageView() { /* ... */ }
```

### 3. 避免深层嵌套

三层以上的 `if` 嵌套就是危险的信号。使用**提前返回（Early Return）**来扁平化逻辑：

```typescript
function processOrder(order: Order | null): string {
  if (!order) return '订单不存在'
  if (order.status === 'cancelled') return '订单已取消'
  if (order.items.length === 0) return '订单为空'
  
  // 主逻辑在这里，不需要嵌套
  return `正在处理 ${order.items.length} 件商品...`
}
```

### 4. 注释解释"为什么"，不是"做了什么"

代码本身已经说明了"做了什么"，注释应该聚焦于"为什么这样做"：

```python
# ❌ 没用的注释
x = x + 1  # x 加 1

# ✅ 有价值的注释
x = x + 1  # 补偿前端传来的偏移量误差，详见 issue #3472
```

### 总结

整洁代码的核心是**尊重读者**——那可能是三个月后的你自己，也可能是新加入团队的同事。养成好习惯，从现在开始。
