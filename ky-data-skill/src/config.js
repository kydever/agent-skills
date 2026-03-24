/**
 * MongoDB 连接配置
 */
const MONGODB_URI = process.env.MONGODB_URI;
/**
 * 业务定义 - appKeys.ts
 */
const APP_KEYS = {
  'ly': { name: '聊愈', items: {
    'jswzcs': '即时文字初始',
    'jswzjs': '即时文字加时',
    'jsth': '即时通话',
    'lyCard': '聊愈储值卡'
  }},
  'xlcp': { name: '心理测评', items: {
    'xlcp': '心理测评',
    'examCard': '测评会员卡',
    'examPackage': '测评包',
    'examPickCard': '测评自选卡'
  }},
  'qb': { name: '钱包', items: {
    'qb': '钱包',
    'apple-qb': '苹果钱包',
    'h5Recharge-qb': 'H5钱包'
  }},
  'zxs': { name: '咨询师', items: {
    'zxs': '咨询师',
    'partner': '伴侣咨询'
  }},
  'external': { name: '对外销售', items: {
    'course': '课程'
  }},
  'coach': { name: '心理教练', items: {
    'coachSingle': '单次服务',
    'coachWeekly': '周服务'
  }}
};

/**
 * 客户端定义 - appId.ts
 */
const APP_IDS = {
  1: '内部管理平台',
  2: '月食APP-iOS',
  4: '月食APP-安卓',
  8: 'H5',
  16: '聊愈PC端',
  32: '共练营',
  64: '知我心理小程序',
  128: '知我心理APP-iOS',
  256: '知我心理APP-安卓',
  512: '测评小程序',
  1024: '百度小程序',
  2048: '复旦小程序'
};

/**
 * 订单状态映射
 */
const ORDER_STATUS = {
  0: '待支付',
  1: '已支付',
  2: '已取消',
  3: '部分退款',
  4: '全部退款'
};

/**
 * 订单来源映射
 */
const ORDER_SOURCE = {
  '': '默认',
  'client': 'C端下单',
  'yyf': '语音房连麦自动下单',
  'give': '后台赠送',
  'ly_card_exchange': '聊愈卡兑换',
  'exam_card_consume': '测评卡抵扣',
  'exam_exchange_code': '测评兑换码'
};

module.exports = {
  MONGODB_URI,
  APP_KEYS,
  APP_IDS,
  ORDER_STATUS,
  ORDER_SOURCE
};
