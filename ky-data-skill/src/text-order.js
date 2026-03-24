/**
 * 文字订单关联合并统计
 * 
 * 规则：
 * - 初始订单 (jswzcs) 的 pid = ""
 * - 加时订单 (jswzjs) 的 pid = 初始订单的 orderId
 * - 有加时订单的初始订单，合并为1单统计
 * - 金额累加，订单计数为1
 */

/**
 * 获取文字订单统计（含关联合并）
 * @param {Object} db - MongoDB 数据库连接
 * @param {Object} filter - 基础查询条件
 * @returns {Array} 合并后的统计结果
 */
async function getTextOrderStats(db, filter = {}) {
  const collection = db.collection('Order');
  
  // 1. 查询所有文字订单（初始 + 加时）
  const allOrders = await collection.find({
    ...filter,
    appItemKey: { $in: ['jswzcs', 'jswzjs'] }
  }).toArray();
  
  // 2. 按初始订单分组
  const initialOrders = new Map(); // orderId -> 初始订单
  const addTimeOrders = new Map(); // pid -> [加时订单数组]
  
  allOrders.forEach(order => {
    if (order.appItemKey === 'jswzcs') {
      // 初始订单
      initialOrders.set(order.orderId, order);
    } else if (order.appItemKey === 'jswzjs') {
      // 加时订单
      const pid = order.pid || '';
      if (!addTimeOrders.has(pid)) {
        addTimeOrders.set(pid, []);
      }
      addTimeOrders.get(pid).push(order);
    }
  });
  
  // 3. 合并统计
  const merged = [];
  const processedInitialIds = new Set();
  
  // 处理有加时订单的初始订单
  initialOrders.forEach((initialOrder, orderId) => {
    const addTimes = addTimeOrders.get(orderId) || [];
    
    if (addTimes.length > 0) {
      // 有关联的加时订单，合并统计
      let totalPaidMoney = initialOrder.paidMoney || 0;
      let totalOrderMoney = initialOrder.orderMoney || 0;
      let totalRefundMoney = initialOrder.refundMoney || 0;
      
      addTimes.forEach(addTime => {
        totalPaidMoney += addTime.paidMoney || 0;
        totalOrderMoney += addTime.orderMoney || 0;
        totalRefundMoney += addTime.refundMoney || 0;
      });
      
      merged.push({
        orderId: initialOrder.orderId,
        appItemKey: 'jswzcs', // 以初始订单为准
        paidMoney: totalPaidMoney,
        orderMoney: totalOrderMoney,
        refundMoney: totalRefundMoney,
        orderCount: 1, // 合并后计为1单
        addTimeCount: addTimes.length,
        createdAt: initialOrder.createdAt,
        aliasId: initialOrder.aliasId,
        paymentMethod: initialOrder.paymentMethod,
        status: initialOrder.status
      });
      
      processedInitialIds.add(orderId);
    }
  });
  
  // 处理没有加时订单的初始订单
  initialOrders.forEach((initialOrder, orderId) => {
    if (!processedInitialIds.has(orderId)) {
      merged.push({
        orderId: initialOrder.orderId,
        appItemKey: 'jswzcs',
        paidMoney: initialOrder.paidMoney || 0,
        orderMoney: initialOrder.orderMoney || 0,
        refundMoney: initialOrder.refundMoney || 0,
        orderCount: 1,
        addTimeCount: 0,
        createdAt: initialOrder.createdAt,
        aliasId: initialOrder.aliasId,
        paymentMethod: initialOrder.paymentMethod,
        status: initialOrder.status
      });
    }
  });
  
  return merged;
}

/**
 * 获取文字订单聚合统计（按商品分类）
 * @param {Object} db - MongoDB 数据库连接
 * @param {Object} filter - 基础查询条件
 * @returns {Array} 聚合统计结果
 */
async function getTextOrderStatsSimple(db, filter = {}) {
  const merged = await getTextOrderStats(db, filter);
  
  // 按 appItemKey 分组统计
  const stats = {};
  
  merged.forEach(order => {
    const key = order.appItemKey;
    if (!stats[key]) {
      stats[key] = {
        appItemKey: key,
        paidMoney: 0,
        orderMoney: 0,
        refundMoney: 0,
        orderCount: 0
      };
    }
    
    stats[key].paidMoney += order.paidMoney;
    stats[key].orderMoney += order.orderMoney;
    stats[key].refundMoney += order.refundMoney;
    stats[key].orderCount += order.orderCount;
  });
  
  return Object.values(stats);
}

/**
 * 获取文字订单聚合统计（MongoDB 聚合管道）
 * @param {Object} db - MongoDB 数据库连接
 * @param {Object} filter - 基础查询条件
 * @returns {Array} 聚合统计结果
 */
async function getTextOrderAggregated(db, filter = {}) {
  const merged = await getTextOrderStats(db, filter);
  
  // 使用内存聚合（因为关联逻辑复杂，不适合在 MongoDB 管道中实现）
  const result = merged.reduce((acc, order) => {
    const existing = acc.find(r => r._id === order.appItemKey);
    
    if (existing) {
      existing.paidMoney += order.paidMoney;
      existing.orderMoney += order.orderMoney;
      existing.refundMoney += order.refundMoney;
      existing.orderCount += order.orderCount;
    } else {
      acc.push({
        _id: order.appItemKey,
        paidMoney: order.paidMoney,
        orderMoney: order.orderMoney,
        refundMoney: order.refundMoney,
        orderCount: order.orderCount
      });
    }
    
    return acc;
  }, []);
  
  return result;
}

module.exports = {
  getTextOrderStats,
  getTextOrderStatsSimple,
  getTextOrderAggregated
};
