/**
 * 订单数据分析 - 命令行入口
 * 使用: node src/index.js "问题"
 */

const { connect, close, aggregateOrders } = require('./db');
const { generateQuery, formatResult } = require('./query');

async function main() {
  const question = process.argv[2] || '总销售额是多少';
  
  console.log('\n🔍 问题:', question, '\n');
  
  try {
    await connect();
    
    const queryPattern = generateQuery(question);
    console.log('📌 查询类型:', queryPattern.description);
    
    const startTime = Date.now();
    const result = await aggregateOrders(queryPattern.generatePipeline());
    const elapsed = Date.now() - startTime;
    
    console.log('⏱️ 查询耗时:', elapsed, 'ms');
    console.log('📋 返回数据:', result.length, '条\n');
    
    const output = formatResult(
      Object.keys(require('./query').QUERY_PATTERNS).find(
        key => require('./query').QUERY_PATTERNS[key] === queryPattern
      ), 
      result
    );
    
    console.log(output);
    
  } catch (error) {
    console.error('❌ 查询失败:', error.message);
  } finally {
    await close();
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
