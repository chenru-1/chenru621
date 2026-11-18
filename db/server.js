/*
 * 文件：server.js（放在 db 文件夹中）
 * 作者：陈茹
 * 建立时间：2026-11-13
 * 使用模型：GLM-5.3-Flash
 * 功能：本地数据服务器——读取同目录 db.json 中的 poems 数据，
 *       以 /api/poems 接口提供给前端页面使用，端口号 3004。
 * 启动方式：在 db 文件夹下执行 node server.js
 */

// 引入 express 框架（db/package.json 中已安装 express 5.3.0）
var express = require('express');
// 引入文件系统模块：用于读取 db.json
var fs = require('fs');
// 引入路径模块：用于拼接 db.json 的绝对路径
var path = require('path');

// 创建 express 应用实例
var app = express();

// 中间件：为所有响应添加 CORS 跨域头
// 作用：允许本地任意页面（file:// 或其它端口）通过 fetch 访问本服务器
app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

// 接口：GET /api/poems —— 返回 db.json 中 poems 数组
// 流程：读取 db.json -> 解析为对象 -> 取出 poems 字段 -> 以 JSON 返回
app.get('/api/poems', function (req, res) {
  // 同步读取与本文件同目录的 db.json（保证放哪个盘都能找到）
  var raw = fs.readFileSync(path.join(__dirname, 'db.json'), 'utf-8');
  // 把 JSON 字符串解析为 JS 对象
  var data = JSON.parse(raw);
  // 只返回 poems 数组给前端
  res.json(data.poems);
});

// 启动服务器：监听 3004 端口，启动成功后打印访问地址
app.listen(3004, function () {
  console.log('诗词数据服务器已启动：http://localhost:3004/api/poems');
});
