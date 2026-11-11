/*
 * 文件：prompt-task.js
 * 作者：陈茹
 * 建立时间：2026-11-11
 * 使用模型：GLM-5.3-Flash
 * 功能：任务一·提示词工程师作业页的活体演示——把第 1、2 轮 AI 答案原样粘进
 *       本页的两个真实轮播中，通过"模拟手动拖拽 / 模拟点击圆点"按钮演示行为
 *       差异，实时状态面板自动标红/标绿，直观说明第 1 轮答案错在哪里。
 */

// 函数：cr_initDemo —— 用某轮 AI 答案的原样配置初始化一个演示轮播
// 说明：AI 配置中的分页器 el 写的是作业页的 #wyPag4，本页演示时替换为各自演示区容器
function cr_initDemo(cr_swSel, cr_pagSel, cr_aiCfg) {
  // 深拷贝 AI 配置，避免两轮演示互相影响
  var cr_cfg = JSON.parse(JSON.stringify(cr_aiCfg));
  // 把分页器容器替换为本页演示区的容器（必要的本地适配，其余配置原样保留）
  cr_cfg.pagination = cr_cfg.pagination || {};
  cr_cfg.pagination.el = cr_pagSel;
  // 返回实例：配置其余部分与 AI 答案完全一致
  return new Swiper(cr_swSel, cr_cfg);
}

// 函数：cr_fakeDrag —— 向轮播容器派发 pointerdown/move/up 事件序列，模拟用户真实手动拖拽
// 说明：Swiper 监听容器上的 pointer 事件，合成事件同样触发其内部 touchStart 处理，
//       因此第 1 轮（无 disableOnInteraction: false）会被停止自动播放
function cr_fakeDrag(cr_swiper) {
  // 取轮播容器位置，确定拖拽起止坐标
  var cr_rect = cr_swiper.el.getBoundingClientRect();
  var cr_y = cr_rect.top + cr_rect.height / 2;
  var cr_opts = { bubbles: true, cancelable: true, pointerId: 1, isPrimary: true, pointerType: 'mouse' };
  // 按下：位于轮播右侧 70% 处
  cr_swiper.el.dispatchEvent(new PointerEvent('pointerdown', Object.assign(cr_opts, { clientX: cr_rect.left + cr_rect.width * 0.7, clientY: cr_y })));
  // 移动：拖到左侧 30% 处
  cr_swiper.el.dispatchEvent(new PointerEvent('pointermove', Object.assign(cr_opts, { clientX: cr_rect.left + cr_rect.width * 0.3, clientY: cr_y })));
  // 抬起：结束拖拽
  cr_swiper.el.dispatchEvent(new PointerEvent('pointerup', Object.assign(cr_opts, { clientX: cr_rect.left + cr_rect.width * 0.3, clientY: cr_y })));
}

// 函数：cr_fakeClickDot —— 向指定序号的分页圆点派发 click 事件，模拟用户点击圆点
// 说明：只有配置了 clickable: true 的轮播（第 2 轮）会在圆点上绑定点击跳页监听；
//       第 1 轮的圆点是普通 span 且无监听，点击后毫无反应——这正是要演示的错误
function cr_fakeClickDot(cr_swiper, cr_index) {
  // 取当前演示轮播的分页圆点列表
  var cr_dots = cr_swiper.pagination.bullets || [];
  if (cr_dots[cr_index]) {
    // 对目标圆点派发 click，触发 Swiper 的跳页监听（若已绑定）
    cr_dots[cr_index].dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  }
}

// 函数：cr_refreshStat —— 读取两轮实例的实时状态并刷新各自状态面板
// 说明：每个状态项按"达标绿 / 出错红"上色：running、disableOnInteraction: false、
//       clickable: true 为绿色；相反为红色。面板每 600ms 刷新一次
function cr_refreshStat() {
  // 两轮演示的状态面板与实例对照表
  var cr_map = [
    { cr_sw: window.cr_demo1, cr_box: '#crStat1' },
    { cr_sw: window.cr_demo2, cr_box: '#crStat2' }
  ];
  cr_map.forEach(function (cr_item) {
    var cr_s = cr_item.cr_sw;
    var cr_box = document.querySelector(cr_item.cr_box);
    if (!cr_s || !cr_box) { return; }
    // 逐项计算状态：running / disableOnInteraction / clickable / 当前页
    var cr_running = cr_s.autoplay && cr_s.autoplay.running;
    var cr_doi = cr_s.params.autoplay && cr_s.params.autoplay.disableOnInteraction;
    var cr_click = cr_s.params.pagination && cr_s.params.pagination.clickable;
    // 生成状态行 HTML：红色代表第 1 轮答案暴露的错误，绿色代表正确行为
    cr_box.innerHTML =
      '自动播放状态：<b class="' + (cr_running ? 'cr-good' : 'cr-bad') + '">' + (cr_running ? 'running… 正在自动翻页' : 'stopped！已停止（再也不会自己翻页）') + '</b><br>' +
      'disableOnInteraction：<b class="' + (cr_doi === false ? 'cr-good' : 'cr-bad') + '">' + cr_doi + '</b>' + (cr_doi === false ? '（手动操作后继续播放）' : '（默认 true：手动一拖就停）') + '<br>' +
      '圆点 clickable：<b class="' + (cr_click ? 'cr-good' : 'cr-bad') + '">' + cr_click + '</b>' + (cr_click ? '（可点击跳页）' : '（圆点是普通 span，点不动）') + '<br>' +
      '当前页：<b>' + (cr_s.realIndex + 1) + ' / 5</b>';
  });
}

// 页面加载后：初始化两轮演示轮播、绑定演示按钮、启动状态刷新定时器
document.addEventListener('DOMContentLoaded', function () {
  // 第 1 轮 AI 答案原样配置（autoplay 数字简写、pagination 无 clickable）
  window.cr_demo1 = cr_initDemo('#crDemo1', '#crDemoPag1', {
    loop: true,
    autoplay: 3200,
    pagination: { el: '#wyPag4' },
    effect: 'cube'
  });

  // 第 2 轮 AI 答案原样配置（完整四项）
  window.cr_demo2 = cr_initDemo('#crDemo2', '#crDemoPag2', {
    loop: true,
    autoplay: { delay: 3200, disableOnInteraction: false },
    pagination: { el: '#wyPag4', clickable: true },
    effect: 'cube'
  });

  // 绑定第 1 轮"模拟手动拖拽"按钮：演示拖拽后自动播放被停止（错误 1）
  var cr_btn1 = document.querySelector('#crBtn1');
  if (cr_btn1) {
    cr_btn1.addEventListener('click', function () { cr_fakeDrag(window.cr_demo1); });
  }

  // 绑定第 2 轮"模拟手动拖拽"按钮：演示拖拽后自动播放依旧继续（正确）
  var cr_btn2 = document.querySelector('#crBtn2');
  if (cr_btn2) {
    cr_btn2.addEventListener('click', function () { cr_fakeDrag(window.cr_demo2); });
  }

  // 绑定第 1 轮"模拟点击第 3 个圆点"按钮：演示点击无反应（错误 2）
  var cr_btn3 = document.querySelector('#crBtn3');
  if (cr_btn3) {
    cr_btn3.addEventListener('click', function () { cr_fakeClickDot(window.cr_demo1, 2); });
  }

  // 绑定第 2 轮"模拟点击第 3 个圆点"按钮：演示点击直接跳页（正确）
  var cr_btn4 = document.querySelector('#crBtn4');
  if (cr_btn4) {
    cr_btn4.addEventListener('click', function () { cr_fakeClickDot(window.cr_demo2, 2); });
  }

  // 启动实时状态刷新：每 600ms 更新两轮状态面板
  setInterval(cr_refreshStat, 600);
  // 立即刷新一次，避免初始空白
  cr_refreshStat();
});
