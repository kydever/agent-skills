const { APP_KEYS, APP_IDS, ORDER_STATUS, ORDER_SOURCE } = require('./config');

/**
 * 生成 Schema 说明，供 LLM 理解数据结构
 */
function getSchemaDescription() {
  return `
## MongoDB Collection: Order

### 字段说明
- orderId: 订单号（唯一）
- aliasId: 用户分身ID（用户唯一标记）
- orderDescription: 订单信息对象 { title, money, nickName, mobile }
- orderMoney: 订单金额（分）
- paidMoney: 实际支付金额（分）
- status: 订单状态（0:待支付, 1:已支付, 2:已取消, 3:部分退款, 4:全部退款）
- paymentInfo: 支付信息数组 [{ paymentChannel: 'WECHAT'|'ALIPAY'|'LYCARD'|'YUELIANGBI'|’QMF_WECHAT‘, paymentMode, paidMoney }]（'WECHAT':微信, 'QMF_WECHAT': 微信 'ALIPAY':支付宝, 'LYCARD':储值卡, 'YUELIANGBI':月亮币）
- paidTime: 支付时间
- marketingPolicy: 营销优惠信息数组
- orderSource: 订单来源 ('':默认, 'client':C端下单, 'yyf':语音房, 'give':后台赠送, 'ly_card_exchange':聊愈卡兑换, 'exam_card_consume':测评卡抵扣)
- channel: 第三方渠道标识
- pid: 上级订单ID
- refundMoney: 总退款金额（分）
- appKey: 业务标识（${Object.keys(APP_KEYS).join(', ')}）
- appItemKey: 商品标识（各业务下不同）
- appId: 客户端应用类型（1:内部管理, 2:iOS, 4:安卓, 8:H5, 16:PC, 32:共练营, 64:小程序, 128:iOS2, 256:安卓2...）
- utmCampaign: 广告系列活动
- utmSource: 广告系列来源
- utmMedium: 广告系列媒介
- createdAt: 创建时间
- updatedAt: 更新时间

### 业务(appKey)说明
${Object.entries(APP_KEYS).map(([key, val]) => `- ${key}: ${val.name}`).join('\n')}

### 订单状态(status)说明
${Object.entries(ORDER_STATUS).map(([k, v]) => `- ${k}: ${v}`).join('\n')}

### 时间范围
- 默认查询 2026年1月1日以来的数据
- 时间字段: createdAt, paidTime
`;
}

/**
 * 预定义的查询模式 - 常见分析需求
 */
const QUERY_PATTERNS = {
  // 销售统计
  totalSales: {
    description: '总销售额',
    generatePipeline: () => [
      { $match: { status: 1, createdAt: { $gte: new Date('2026-01-01') } } },
      { $group: { 
        _id: null, 
        totalAmount: { $sum: '$paidMoney' },
        orderCount: { $sum: 1 }
      }}
    ]
  },
  
  // 按业务统计
  salesByApp: {
    description: '按业务/商品统计销售额',
    generatePipeline: () => [
      { $match: { status: 1, createdAt: { $gte: new Date('2026-01-01') } } },
      { $group: { 
        _id: { appKey: '$appKey', appItemKey: '$appItemKey' },
        totalAmount: { $sum: '$paidMoney' },
        orderCount: { $sum: 1 }
      }},
      { $sort: { totalAmount: -1 } }
    ]
  },
  
  // 按客户端统计
  salesByAppId: {
    description: '按客户端统计',
    generatePipeline: () => [
      { $match: { status: 1, createdAt: { $gte: new Date('2026-01-01') } } },
      { $group: { 
        _id: '$appId', 
        totalAmount: { $sum: '$paidMoney' },
        orderCount: { $sum: 1 }
      }},
      { $sort: { totalAmount: -1 } }
    ]
  },
  
  // 按月统计
  salesByMonth: {
    description: '按月统计销售额',
    generatePipeline: () => [
      { $match: { status: 1, createdAt: { $gte: new Date('2026-01-01') } } },
      { $group: { 
        _id: { $month: '$createdAt' }, 
        totalAmount: { $sum: '$paidMoney' },
        orderCount: { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ]
  },
  
  // 退款统计
  refundStats: {
    description: '退款统计',
    generatePipeline: () => [
      { $match: { status: { $in: [3, 4] }, createdAt: { $gte: new Date('2026-01-01') } } },
      { $group: { 
        _id: null, 
        totalRefund: { $sum: '$refundMoney' },
        refundCount: { $sum: 1 }
      }}
    ]
  },
  
  // 热门商品 TOP10
  topProducts: {
    description: '销售额 TOP10 商品',
    generatePipeline: () => [
      { $match: { status: 1, createdAt: { $gte: new Date('2026-01-01') } } },
      { $group: { 
        _id: { appKey: '$appKey', appItemKey: '$appItemKey' },
        totalAmount: { $sum: '$paidMoney' },
        orderCount: { $sum: 1 }
      }},
      { $sort: { totalAmount: -1 } },
      { $limit: 10 }
    ]
  }
};

/**
 * 智能查询生成器
 * 根据用户问题生成 MongoDB 查询
 */
function generateQuery(userQuestion) {
  const question = userQuestion.toLowerCase();
  
  if (question.includes('总销售额') || question.includes('总收入') || question.includes('总共卖了')) {
    return QUERY_PATTERNS.totalSales;
  }
  
  if (question.includes('按业务') || question.includes('各业务') || question.includes('哪个业务')) {
    return QUERY_PATTERNS.salesByApp;
  }
  
  if (question.includes('按客户端') || question.includes('哪个端') || question.includes('ios') || question.includes('安卓')) {
    return QUERY_PATTERNS.salesByAppId;
  }
  
  if (question.includes('按月') || question.includes('每月') || question.includes('月度')) {
    return QUERY_PATTERNS.salesByMonth;
  }
  
  if (question.includes('退款')) {
    return QUERY_PATTERNS.refundStats;
  }
  
  if (question.includes('top') || question.includes('排行') || question.includes('最好卖')) {
    return QUERY_PATTERNS.topProducts;
  }
  
  return QUERY_PATTERNS.totalSales;
}

/**
 * 格式化金额（分→元）
 */
function formatMoney(cents) {
  return (cents / 100).toFixed(2);
}

function getAppName(appKey) {
  return APP_KEYS[appKey] ? APP_KEYS[appKey].name : appKey;
}

function getItemName(appKey, appItemKey) {
  if (APP_KEYS[appKey] && APP_KEYS[appKey].items) {
    return APP_KEYS[appKey].items[appItemKey] || appItemKey;
  }
  return appItemKey;
}

/**
 * 格式化结果
 */
function formatResult(queryType, data) {
  if (!data || data.length === 0) {
    return '暂无数据';
  }
  
  switch (queryType) {
    case 'totalSales':
      const total = data[0];
      return '📊 2026年以来销售统计\n💰 总销售额: ¥' + formatMoney(total.totalAmount) + 
             '\n📦 订单数: ' + total.orderCount + ' 单\n📈 客单价: ¥' + 
             formatMoney(total.totalAmount / total.orderCount);
    
    case 'salesByApp':
      return '📊 按业务/商品销售统计\n\n' + 
        data.map(function(item) {
          const appName = getAppName(item._id.appKey);
          const itemName = getItemName(item._id.appKey, item._id.appItemKey);
          return '• ' + appName + ' - ' + itemName + ': ¥' + formatMoney(item.totalAmount) + ' (' + item.orderCount + '单)';
        }).join('\n');
    
    case 'salesByAppId':
      return '📊 按客户端销售统计\n\n' + 
        data.map(function(item) {
          const appIdName = APP_IDS[item._id] || '未知(' + item._id + ')';
          return '• ' + appIdName + ': ¥' + formatMoney(item.totalAmount) + ' (' + item.orderCount + '单)';
        }).join('\n');
    
    case 'salesByMonth':
      return '📊 按月销售统计\n\n' + 
        data.map(function(item) {
          return '• ' + item._id + '月: ¥' + formatMoney(item.totalAmount) + ' (' + item.orderCount + '单)';
        }).join('\n');
    
    case 'refundStats':
      var refund = data[0];
      return '📊 退款统计\n💸 总退款金额: ¥' + formatMoney(refund.totalRefund) + 
             '\n📦 退款单数: ' + refund.refundCount + ' 单';
    
    case 'topProducts':
      return '📊 销售额 TOP10\n\n' + 
        data.map(function(item, index) {
          const appName = getAppName(item._id.appKey);
          const itemName = getItemName(item._id.appKey, item._id.appItemKey);
          return (index + 1) + '. ' + appName + ' - ' + itemName + ': ¥' + formatMoney(item.totalAmount);
        }).join('\n');
    
    default:
      return JSON.stringify(data, null, 2);
  }
}

module.exports = {
  getSchemaDescription,
  generateQuery,
  formatResult,
  QUERY_PATTERNS
};
