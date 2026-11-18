/*
 * 文件：poems.js
 * 作者：陈茹
 * 建立时间：2026-11-13
 * 使用模型：GLM-5.3-Flash
 * 功能：诗词卡片墙的页面逻辑——请求本地服务器(localhost:3004)的 /api/poems
 *       接口，拿到 db.json 中 poems 数组（pic/title/content），渲染成
 *       "上图下文"的卡片。
 */

// 函数：cr_renderCards —— 把 poems 数据渲染为上图下文的卡片列表
// 参数：cr_list —— 服务器返回的诗词数组，每项含 pic（图片）、title（标题）、content（内容）
function cr_renderCards(cr_list) {
  // 取卡片容器与占位提示元素
  var cr_grid = document.querySelector('#crGrid');
  var cr_tip = document.querySelector('#crTip');
  // 拼接所有卡片的 HTML：img 在上（图），标题+内容在下（文）
  var cr_html = '';
  cr_list.forEach(function (cr_item) {
    cr_html +=
      '<div class="cr_card">' +
      '<img src="' + cr_item.pic + '" alt="' + cr_item.title + '">' +
      '<div class="cr_body">' +
      '<h2>' + cr_item.title + '</h2>' +
      '<p>' + cr_item.content + '</p>' +
      '</div>' +
      '</div>';
  });
  // 用生成的卡片整体替换容器内容（同时移除"正在读取"提示）
  cr_grid.innerHTML = cr_html;
}

// 函数：cr_showError —— 服务器连不上或接口出错时，在容器中显示错误提示
// 参数：cr_err —— 错误对象，用于在控制台打印详情方便排查
function cr_showError(cr_err) {
  // 控制台输出错误详情
  console.error('获取诗词数据失败：', cr_err);
  // 页面上给出友好提示（常见原因：忘了启动 node server.js）
  document.querySelector('#crGrid').innerHTML =
    '<p class="cr_tip">⚠️ 读取数据失败！请先在 db 文件夹里运行 <b>node server.js</b>，再刷新本页。</p>';
}

// 页面加载完成后：请求服务器接口并把数据渲染成卡片
document.addEventListener('DOMContentLoaded', function () {
  // 请求本地 3004 端口的诗词数据接口
  fetch('http://localhost:3004/api/poems')
    // 把响应体解析为 JS 数组
    .then(function (cr_res) { return cr_res.json(); })
    // 渲染成功：生成上图下文卡片
    .then(function (cr_list) { cr_renderCards(cr_list); })
    // 渲染失败：显示错误提示
    .catch(cr_showError);
});
