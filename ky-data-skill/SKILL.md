---
name: ky-data-skill
description: |
  订单数据分析 skill。基于 MongoDB ky-order 库的 Order 表，提供销售统计、业务分析、环比对比等功能。
  当用户询问订单、销售、收入、营收、业绩等相关问题时触发。
  支持：整体销售、各业务销售、月度趋势、环比对比、新用户统计、退款分析等。
metadata: 
  openclaw: 
    emoji: "📊"
    requires:
      bins: ["node"]
---

# 订单数据分析 Skill

基于 MongoDB ky-order 库的 Order 表，提供销售统计和业务分析。

## 触发条件

✅ **使用此 skill 当用户询问：**
- 销售额、收入、营收、业绩
- 订单数、订单量
- 各业务销售情况
- 月度/周度趋势
- 环比/同比对比
- 退款情况
- 新用户/首单用户

❌ **不使用此 skill 当：**
- 询问具体的订单详情（查询单笔订单）
- 财务对账（需要更精确的财务表）
- 库存/物流数据

## 编程语言环境
- node.js

## 数据源

- **数据库**：MongoDB ky-order 库
- **表**：Order（订单表）
- **连接**：MongoDB连接方式请读取 ~/.env.agent 里的 MONGODB_URI

## 取数口径（固定规则）

```
channel: ''              // 非渠道订单
orderSource: ['client', '']  // C端或默认来源
status: [1, 3, 4]       // 已支付、部分退款、全部退款

销售额 = paidMoney（实付金额，分→元÷100）
订单额 = orderMoney（订单金额）
订单状态：0=待支付, 1=已支付, 2=已取消, 3=部分退款, 4=全部退款

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

## 使用方式

### 直接运行脚本

```bash
# 切换到 skill 目录
cd ~/.qclaw/workspace/ky-order-agent-skill

# 运行分析
node src/query.js "总销售额"
node src/query.js "各业务销售"
node src/query.js "1月 vs 2月"
node src/query.js "月度趋势"
```

### 支持的分析类型

| 问题示例 | 说明 |
|---------|------|
| 总销售额、总收入 | 2026年以来总销售额 |
| 各业务销售、各业务营收 | 按业务维度统计 |
| 月度趋势、每月销售 | 按月统计 |
| 1月销售、2月对比 | 特定月份数据 |
| 环比变化 | 前后月对比 |
| 新用户、首单用户 | 新用户统计 |
| 退款情况 | 退款统计 |
| 最好卖、top商品 | TOP商品排行 |

## 目录结构

```
ky-order-agent-skill/
├── SKILL.md              # 本文件
├── src/
│   ├── config.js         # 业务映射配置
│   ├── db.js             # MongoDB 连接
│   ├── query.js          # 查询逻辑
│   └── index.js          # 入口脚本
└── README.md             # 使用文档
```

## 配置

### MongoDB 连接

连接信息已配置在 `~/.env.agent` 文件中，可以复制该文件到当前目录中：
- Host: 111.231.23.87:27027
- Database: ky-order
- Auth: readonly 账号（需密码）


## 注意事项
- 如果不指定时间范围，默认本月
- 金额单位：MongoDB 存的是分，展示时自动转为元
- 时间字段：createdAt（订单创建时间），该时间是UTC标准时间，请保证以北京时间（东八区）来取数
- 一次任务可以复用一个 MongoDB 连接
- 聊愈即时文字订单如果没刻意指定初始或加时，应该把两者加起来统计
- 如果没刻意指定统计安卓还是iOS，应该把两端加起来统计，比如: 月食=月食iOS+月食安卓
- 营销信息marketingPolicy虽然是数组，但实际每单只享受一个优惠，即只有一个元素
- 优惠券取数： marketingPolicy[0].type=='coupon'，抵扣金额: marketingPolicy[0].item.coupon.deductionAmount
- 活动折扣取数：marketingPolicy[0].type=='discount'，抵扣金额: marketingPolicy[0].item.activity.deductionAmount
- 支付渠道paymentInfo虽然是数组，但实际每单只有一个支付方式，即只有一个元素

## 扩展

如需新增分析维度，可修改 `src/query.js` 中的 QUERY_PATTERNS。
