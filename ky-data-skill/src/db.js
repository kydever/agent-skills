const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

/**
 * 连接 MongoDB
 */
async function connect() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection.db;
  }
  
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000
    });
    console.log('✅ MongoDB 连接成功');
    return mongoose.connection.db;
  } catch (error) {
    console.error('❌ MongoDB 连接失败:', error.message);
    throw error;
  }
}

/**
 * 关闭连接
 */
async function close() {
  await mongoose.disconnect();
  console.log('🔌 MongoDB 连接已关闭');
}

/**
 * 查询订单
 * @param {Object} filter - 查询条件
 * @param {Object} options - 选项（limit, skip, sort）
 */
async function queryOrders(filter = {}, options = {}) {
  const db = await connect();
  const collection = db.collection('Order');
  
  const { limit = 100, skip = 0, sort = { createdAt: -1 } } = options;
  
  return await collection
    .find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .toArray();
}

/**
 * 聚合查询订单
 * @param {Array} pipeline - 聚合管道
 */
async function aggregateOrders(pipeline) {
  const db = await connect();
  const collection = db.collection('Order');
  
  return await collection.aggregate(pipeline).toArray();
}

/**
 * 统计订单数量
 * @param {Object} filter - 查询条件
 */
async function countOrders(filter = {}) {
  const db = await connect();
  const collection = db.collection('Order');
  
  return await collection.countDocuments(filter);
}

/**
 * 获取表结构信息
 */
async function getCollectionStats() {
  const db = await connect();
  const collection = db.collection('Order');
  
  return await collection.stats();
}

module.exports = {
  connect,
  close,
  queryOrders,
  aggregateOrders,
  countOrders,
  getCollectionStats
};
