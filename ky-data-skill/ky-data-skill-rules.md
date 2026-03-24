# Skill 同步流程

## 触发命令

当用户说"同步skill"时，执行以下流程：

1. **删除所有旧目录**
   ```bash
   rm -rf ~/.qclaw/skills/ky-data-skill
   rm -rf ~/.qclaw/workspace/ky-data-skill
   rm -rf ~/.qclaw/workspace/agent-skills
   rm -rf /Applications/QClaw.app/Contents/Resources/openclaw/config/skills/ky-data-skill
   ```

2. **克隆 GitHub 仓库**
   ```bash
   git clone git@github.com:kydever/agent-skills.git
   ```

3. **同步到加载目录**
   ```bash
   cp -r ~/.qclaw/workspace/agent-skills/ky-data-skill ~/.qclaw/skills/
   npm install
   ```

4. **同步 rules 文件到 memory**
   ```bash
   cp ~/.qclaw/workspace/agent-skills/ky-data-skill/ky-data-skill-rules.md ~/.qclaw/workspace/memory/
   ```

5. **实时生效**

## 目录结构（同步后）

```
~/.qclaw/workspace/agent-skills/ky-data-skill/  ← GitHub 仓库（唯一真源）
~/.qclaw/skills/ky-data-skill/                ← QClaw 加载目录
```

---

# 数据分析 Skill 特殊规则

## 数据口径

```
channel: ''              // 非渠道订单
orderSource: ['client', '']  // C端或默认来源
status: [1, 3, 4]       // 已支付、部分退款、全部退款

销售额 = paidMoney（实付金额）
订单额 = orderMoney（订单金额）

如果不指定时间范围，默认本月
```

## 业务映射

| appKey | 业务名称 |
|--------|----------|
| ly | 聊愈 |
| xlcp | 心理测评 |
| zxs | 咨询师 |
| external | 课程 |
| coach | 心理教练 |
| qb | 钱包 |

## 特殊规则

### 1. 聊愈-即时文字

**默认合并统计：即时文字初始 + 即时文字加时 = "即时文字"**
- 仅当用户明确指明时才分开统计

### 2. 文字订单关联统计规则 ⚠️ 重要

文字订单（含即时文字初始和加时）存在**初始订单→加时订单**的父子关系：
- `appItemKey = 'jswzcs'` = 即时文字初始订单
- `appItemKey = 'jswzjs'` = 即时文字加时订单
- 初始订单的 `pid` = ""（空字符串）
- 加时订单的 `pid` = 对应初始订单的 `orderId`

**统计规则：**
- 有加时订单的初始订单，合并为一单统计
- 订单号：使用初始订单的 orderId
- 金额：初始订单 + 所有关联加时订单 的 paidMoney/orderMoney 累加
- 退款：所有关联订单的退款金额累加
- 订单计数：1（忽略加时订单数量）
- 其他字段：以初始订单为准（createdAt、aliasId、支付方式 等）

**简单理解：**
```
初始订单(¥100) + 加时订单(¥50) + 加时订单(¥30) = 1单，金额¥180
```

## Skill 位置

- GitHub 仓库：~/.qclaw/workspace/agent-skills/ky-data-skill/
- QClaw 加载：~/.qclaw/skills/ky-data-skill/

## MongoDB 连接

- Host: 111.231.23.87:27027
- Database: ky-order
- Auth: 连接信息读取 ~/.env.agent 里的 MONGODB_URI
