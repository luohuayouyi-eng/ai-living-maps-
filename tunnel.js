// 自动重连的localtunnel脚本 - 使用固定子域名，断线自动恢复
const lt = require('localtunnel');

const SUBDOMAIN = 'ai-living-maps'; // 固定子域名，链接永远不变
const PORT = 3000;
let retryCount = 0;
let maxRetries = 100;

async function startTunnel() {
  try {
    const tunnel = await lt({ port: PORT, subdomain: SUBDOMAIN });
    retryCount = 0; // 重置重试计数
    const url = `https://${SUBDOMAIN}.loca.lt`;
    console.log(`========================================`);
    console.log(`  固定公网链接: ${url}`);
    console.log(`  状态: 运行中 (自动重连已启用)`);
    console.log(`========================================`);

    tunnel.on('close', () => {
      console.log(`[${new Date().toLocaleString()}] 隧道断开，5秒后自动重连...`);
      setTimeout(startTunnel, 5000);
    });

    tunnel.on('error', (err) => {
      console.error(`[${new Date().toLocaleString()}] 隧道错误: ${err.message}`);
      try { tunnel.close(); } catch(e) {}
      setTimeout(startTunnel, 5000);
    });

  } catch (err) {
    retryCount++;
    console.error(`[${new Date().toLocaleString()}] 启动失败(${retryCount}/${maxRetries}): ${err.message}`);
    if (retryCount < maxRetries) {
      console.log('5秒后自动重试...');
      setTimeout(startTunnel, 5000);
    } else {
      console.error('重试次数已达上限，请手动重启');
    }
  }
}

// 进程未捕获异常处理，防止崩溃
process.on('uncaughtException', (err) => {
  console.error(`[${new Date().toLocaleString()}] 未捕获异常: ${err.message}`);
  setTimeout(startTunnel, 5000);
});

process.on('unhandledRejection', (err) => {
  console.error(`[${new Date().toLocaleString()}] 未处理Promise: ${err}`);
  setTimeout(startTunnel, 5000);
});

console.log(`[${new Date().toLocaleString()}] 正在启动隧道服务...`);
startTunnel();

// 保持进程运行
setInterval(() => {}, 1000);
