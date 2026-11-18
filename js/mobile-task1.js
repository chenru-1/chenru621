/*
 * 文件：mobile-task1.js
 * 作者：陈茹
 * 建立时间：2026-11-18
 * 使用模型：GLM-5.3-Flash
 * 功能：任务一·事件侦探的活体探针——在 #crPad 区域监听四个触摸事件 + click，
 *       按真实触发顺序把事件名和坐标写入日志区，并统计每次拖动 touchmove 的次数，
 *       供现场复测"事件触发顺序"使用（与课堂讲解页第 3 节探针对应）。
 */

// 变量：cr_moveCount —— 统计"当前这次拖动"里 touchmove 触发的次数
// 时机：touchstart 时清零，touchend 时汇总输出
var cr_moveCount = 0;

// 函数：cr_log —— 向日志区追加一行记录（自动带上行号）
// 参数：cr_html —— 该行日志的 HTML 内容（事件名 + 坐标等）
function cr_log(cr_html) {
  // 取日志容器
  var cr_box = document.querySelector('#crLog');
  // 第一条日志时先清掉占位文字
  if (cr_box.dataset.crReady !== '1') {
    cr_box.innerHTML = '';
    cr_box.dataset.crReady = '1';
  }
  // 行号取现有行数 + 1，模拟课堂探针的编号效果
  var cr_no = cr_box.querySelectorAll('.cr_ln').length + 1;
  // 插入新日志行
  cr_box.insertAdjacentHTML('beforeend', '<div class="cr_ln">' + cr_no + '. ' + cr_html + '</div>');
  // 让日志区自动滚到底部，始终看到最新一条
  cr_box.scrollTop = cr_box.scrollHeight;
}

// 函数：cr_fmt —— 把触点坐标格式化成 (x, y) 字符串，方便记录
// 参数：cr_t —— 一个 Touch 触点对象
function cr_fmt(cr_t) {
  // 只取相对可视区域的 clientX / clientY
  return '(' + Math.round(cr_t.clientX) + ', ' + Math.round(cr_t.clientY) + ')';
}

// 页面加载后：给探针区域绑定四个触摸事件 + click，给清空按钮绑定点击
document.addEventListener('DOMContentLoaded', function () {
  // 取探针区域与日志区
  var cr_pad = document.querySelector('#crPad');

  // touchstart：手指按下 —— 清零 move 计数，记录起点坐标与当前手指数量
  cr_pad.addEventListener('touchstart', function (e) {
    cr_moveCount = 0;                                    // 新一轮手势，计数清零
    cr_log('<span class="cr_ev">touchstart</span> 起点坐标 ' + cr_fmt(e.touches[0]) +
      '，当前手指数 touches.length = ' + e.touches.length);
  }, { passive: true });

  // touchmove：手指移动 —— 连续触发，每次都计数并记录坐标
  cr_pad.addEventListener('touchmove', function (e) {
    cr_moveCount++;                                      // 累计本次拖动的 move 次数
    // 日志太多会淹没重点：前 6 次逐条记录，之后只计数不刷屏
    if (cr_moveCount <= 6) {
      cr_log('<span class="cr_ev">touchmove</span> ×' + cr_moveCount +
        ' 坐标 ' + cr_fmt(e.touches[0]) + '，手指数 ' + e.touches.length);
    } else if (cr_moveCount === 7) {
      cr_log('<span class="cr_ev">touchmove</span> …（后续 move 省略，结束时汇总次数）');
    }
  }, { passive: true });

  // touchend：手指抬起 —— 用 changedTouches 拿坐标（touches 里已没有它），汇总 move 次数
  cr_pad.addEventListener('touchend', function (e) {
    cr_log('<span class="cr_ev">touchend</span> 抬起点坐标 ' + cr_fmt(e.changedTouches[0]) +
      '（changedTouches）');
    // 汇总：本次拖动 touchmove 总次数，用于观察"次数与距离/时间的关系"
    cr_log('<span class="cr_sum">📊 本次拖动 touchmove 共 ' + cr_moveCount + ' 次</span>');
  }, { passive: true });

  // touchcancel：被系统打断 —— 正常操作不会触发它，只有来电/通知横幅/手势返回才来
  cr_pad.addEventListener('touchcancel', function () {
    cr_log('<span class="cr_cancel">touchcancel</span> 被系统打断了！（来电 / 通知横幅 / 手势返回）');
  });

  // click：浏览器在 touchend 之后补发 —— 用不同颜色标识，直观看到它"永远排在最后"
  cr_pad.addEventListener('click', function () {
    cr_log('<span class="cr_click">click</span> 浏览器补发（排在 touchend 之后）');
  });

  // 清空按钮：重置日志区，恢复占位文字
  document.querySelector('#crClear').addEventListener('click', function () {
    var cr_box = document.querySelector('#crLog');
    cr_box.innerHTML = '等待你的第一次触摸……';           // 恢复占位提示
    cr_box.dataset.crReady = '';                          // 下次触摸重新从 1 号开始编号
  });
});
