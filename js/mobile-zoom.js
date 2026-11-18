/*
 * 文件：mobile-zoom.js
 * 作者：陈茹　学号：24002120621
 * 建立时间：2026-11-18
 * 使用模型：GLM-5.3-Flash
 * 功能：任务三·图片查看器——双指捏合缩放（1x～4x，以两指中点为锚点不跳）、
 *       双指旋转（Math.atan2 角度差）、双击切换 1x/2x（0.25s 过渡）、
 *       放大后单指拖动（超界阻尼，松手回弹），缩回 1x 自动居中，
 *       旋转屏幕（orientationchange/resize）不丢失状态。
 */

// 变量：cr_scale / cr_rot / cr_tx / cr_ty —— 变换四要素：缩放倍数、旋转角、横向/纵向位移
var cr_scale = 1, cr_rot = 0, cr_tx = 0, cr_ty = 0;
// 变量：cr_MIN / cr_MAX —— 缩放边界（验收②：硬限制 1～4 倍）
var cr_MIN = 1, cr_MAX = 4;
// 变量：cr_lastX / cr_lastY —— 单指拖动上一帧的坐标
var cr_lastX = 0, cr_lastY = 0;
// 变量：cr_pinchDist / cr_pinchAngle / cr_pinchScale / cr_pinchRot —— 双指按下那一刻的初值
var cr_pinchDist = 1, cr_pinchAngle = 0, cr_pinchScale = 1, cr_pinchRot = 0;
// 变量：cr_rect —— 容器的屏幕位置（touchstart 时刷新，用于把 client 坐标转成容器坐标）
var cr_rect = null;
// 变量：cr_lastTap / cr_lastTapX / cr_lastTapY —— 双击检测：上一次抬起的时间与位置
var cr_lastTap = 0, cr_lastTapX = 0, cr_lastTapY = 0;
// 变量：cr_pinched —— 本次触摸过程中是否出现过双指（防止捏合结束被误判成双击）
var cr_pinched = false;
// 变量：cr_transTimer —— 过渡动画的关闭定时器
var cr_transTimer = null;
// 变量：cr_el / cr_box —— 图片元素与查看器容器；cr_baseW / cr_baseH —— 图片未缩放的布局尺寸
var cr_el, cr_box, cr_baseW = 0, cr_baseH = 0;

// 函数：cr_rotVec —— 把向量 (x,y) 绕原点旋转 th 弧度，用于锚点的反解/正解换算
function cr_rotVec(cr_v, cr_th) {
  var cr_c = Math.cos(cr_th), cr_s = Math.sin(cr_th);
  return { x: cr_v.x * cr_c - cr_v.y * cr_s, y: cr_v.x * cr_s + cr_v.y * cr_c };
}

// 函数：cr_apply —— 把当前状态（位移/旋转/缩放）写进图片 transform，并更新指示器
function cr_apply() {
  cr_el.style.transform = 'translate(' + cr_tx + 'px,' + cr_ty + 'px) rotate(' + cr_rot + 'deg) scale(' + cr_scale + ')';
  // 加分项：左上角实时指示器，显示缩放倍数与旋转角
  document.querySelector('#crZoomVal').textContent = cr_scale.toFixed(2) + 'x · ' + Math.round(cr_rot) + '°';
}

// 函数：cr_bounds —— 计算当前 scale/rot 下位移允许的最大值
// 原理：图片旋转后的外接框半宽/半高必须仍能盖住容器（不留黑边），即图片中心
// 偏离容器中心的距离不能超过"外接框半宽 − 容器半宽"
function cr_bounds() {
  var cr_th = Math.abs(cr_rot) * Math.PI / 180;
  // 旋转后外接框的半宽/半高（|cosθ|、|sinθ| 加权底片宽高）
  var cr_hw = (cr_baseW * Math.abs(Math.cos(cr_th)) + cr_baseH * Math.abs(Math.sin(cr_th))) * cr_scale / 2;
  var cr_hh = (cr_baseW * Math.abs(Math.sin(cr_th)) + cr_baseH * Math.abs(Math.cos(cr_th))) * cr_scale / 2;
  return {
    x: Math.max(0, cr_hw - cr_box.clientWidth / 2),
    y: Math.max(0, cr_hh - cr_box.clientHeight / 2)
  };
}

// 函数：cr_localAt —— 关键换算①（反解）：把容器坐标 cr_m 换算成"图片局部坐标"
// 即：当前状态（cr_s 缩放 / cr_r 旋转 / cr_tx,cr_ty 位移）下，中点手指压着图片内部哪个像素
function cr_localAt(cr_m, cr_s, cr_r) {
  var cr_cx = cr_box.clientWidth / 2, cr_cy = cr_box.clientHeight / 2;
  // 屏幕偏移 = 中点 − 容器中心 − 当前位移
  var cr_d = { x: cr_m.x - cr_cx - cr_tx, y: cr_m.y - cr_cy - cr_ty };
  // 反旋转、反缩放，得到图片"相对中心"的局部坐标
  var cr_u = cr_rotVec(cr_d, -cr_r * Math.PI / 180);
  return { x: cr_u.x / cr_s, y: cr_u.y / cr_s };
}

// 函数：cr_fixAnchor —— 关键换算②（正解）：从旧状态 (cr_s0, cr_r0) 换到新状态 (cr_s1, cr_r1) 时，
// 求出新的位移使锚点 cr_m 下的图像像素"钉"在锚点上——这就是"缩放不跳"的核心（答辩点）
function cr_fixAnchor(cr_m, cr_s0, cr_r0, cr_s1, cr_r1) {
  // 反解：锚点下压着图片内部哪个像素（局部坐标 u）
  var cr_u = cr_localAt(cr_m, cr_s0, cr_r0);
  var cr_cx = cr_box.clientWidth / 2, cr_cy = cr_box.clientHeight / 2;
  // 正解：同一个像素在新缩放/新旋转下落在屏幕哪里，位移取差值补偿
  var cr_v = cr_rotVec({ x: cr_u.x * cr_s1, y: cr_u.y * cr_s1 }, cr_r1 * Math.PI / 180);
  cr_tx = cr_m.x - cr_cx - cr_v.x;
  cr_ty = cr_m.y - cr_cy - cr_v.y;
}

// 函数：cr_setTransition —— 给图片临时开启 transform 过渡动画（双击切换/回弹用），到期自动关闭
function cr_setTransition(cr_ms) {
  // 开启过渡
  cr_el.style.transition = 'transform ' + cr_ms + 'ms ease';
  // 先清除旧定时器再设新的，避免连续动画互相干扰
  if (cr_transTimer) { clearTimeout(cr_transTimer); }
  cr_transTimer = setTimeout(function () { cr_el.style.transition = ''; }, cr_ms + 30);
}

// 函数：cr_clamp —— 把位移夹紧回边界内；cr_animate 为 true 时带 0.25s 回弹动画
// 关键步骤：scale 回到 1x 时位移清零（自动居中，验收③）
function cr_clamp(cr_animate) {
  // 取当前边界并夹紧
  var cr_b = cr_bounds();
  cr_tx = Math.max(-cr_b.x, Math.min(cr_b.x, cr_tx));
  cr_ty = Math.max(-cr_b.y, Math.min(cr_b.y, cr_ty));
  // 缩回 1x：位移清零，图片自动回到正中
  if (cr_scale <= cr_MIN + 0.001) { cr_tx = 0; cr_ty = 0; }
  // 需要动画时临时开启 0.25s 过渡（回弹）
  if (cr_animate) { cr_setTransition(250); }
  cr_apply();
}

// 页面加载后：测量图片、绑定触摸事件与屏幕旋转监听
document.addEventListener('DOMContentLoaded', function () {
  // 取图片与容器，记录未缩放时的布局尺寸（offsetWidth/Height 不受 transform 影响）
  cr_el = document.querySelector('#crImg');
  cr_box = document.querySelector('#crStage');
  cr_baseW = cr_el.offsetWidth;
  cr_baseH = cr_el.offsetHeight;
  cr_apply();   // 初始化指示器

  // touchstart：手指按下 —— 刷新容器位置，按单指/双指分别记录初值
  cr_box.addEventListener('touchstart', function (e) {
    // 刷新容器屏幕位置：加上 clientLeft/Top 把边框宽度扣除，与 clientWidth 的内容坐标对齐
    var cr_r = cr_box.getBoundingClientRect();
    cr_rect = { left: cr_r.left + cr_box.clientLeft, top: cr_r.top + cr_box.clientTop };
    if (e.touches.length === 2) {
      // 双指：记录初始两指距离/角度/当前缩放与旋转（验收：touchstart 记录双指状态）
      cr_pinched = true;                               // 标记出现过双指，抬手时不做双击判定
      cr_pinchDist = Math.hypot(e.touches[1].clientX - e.touches[0].clientX, e.touches[1].clientY - e.touches[0].clientY);
      cr_pinchAngle = Math.atan2(e.touches[1].clientY - e.touches[0].clientY, e.touches[1].clientX - e.touches[0].clientX);
      cr_pinchScale = cr_scale;
      cr_pinchRot = cr_rot;
    } else if (e.touches.length === 1) {
      // 单指：记录拖动基准点（仅 scale>1 时才会真的拖动）
      cr_lastX = e.touches[0].clientX;
      cr_lastY = e.touches[0].clientY;
    }
  }, { passive: true });

  // touchmove：手指移动 —— 双指做缩放+旋转，单指（且已放大）做拖动；必须 passive:false 才能 preventDefault
  cr_box.addEventListener('touchmove', function (e) {
    e.preventDefault();                                // 接管手势，阻断浏览器默认的页面缩放/滚动
    if (e.touches.length >= 2) {
      // ── 双指：缩放 + 旋转 ──
      var cr_t0 = e.touches[0], cr_t1 = e.touches[1];
      // 当前两指距离与连线角度（Math.atan2 算角度差 = 加分项旋转的来源）
      var cr_d = Math.hypot(cr_t1.clientX - cr_t0.clientX, cr_t1.clientY - cr_t0.clientY);
      var cr_ang = Math.atan2(cr_t1.clientY - cr_t0.clientY, cr_t1.clientX - cr_t0.clientX);
      // 新缩放 = 起始缩放 × 距离比例，硬限制在 1～4 倍（验收②：限制）
      var cr_s1 = Math.max(cr_MIN, Math.min(cr_MAX, cr_pinchScale * cr_d / cr_pinchDist));
      // 新旋转 = 起始角度 + 两指连线的角度差
      var cr_r1 = cr_pinchRot + (cr_ang - cr_pinchAngle) * 180 / Math.PI;
      // 锚点 = 两指中点（换算成容器坐标）
      var cr_m = {
        x: (cr_t0.clientX + cr_t1.clientX) / 2 - cr_rect.left,
        y: (cr_t0.clientY + cr_t1.clientY) / 2 - cr_rect.top
      };
      // 以中点为锚点求补偿位移，保证中点下的像素不跑（缩放不跳）
      cr_fixAnchor(cr_m, cr_scale, cr_rot, cr_s1, cr_r1);
      cr_scale = cr_s1;
      cr_rot = cr_r1;
      cr_apply();
    } else if (e.touches.length === 1 && cr_scale > 1) {
      // ── 单指拖动（仅放大后允许，验收③：1x 不能拖）──
      var cr_t = e.touches[0];
      var cr_dx = cr_t.clientX - cr_lastX;
      var cr_dy = cr_t.clientY - cr_lastY;
      cr_lastX = cr_t.clientX;
      cr_lastY = cr_t.clientY;
      var cr_b = cr_bounds();
      var cr_nx = cr_tx + cr_dx, cr_ny = cr_ty + cr_dy;
      // 超出边界的部分只走 35%（阻尼/橡皮筋手感），松手后再回弹夹紧
      cr_tx = (cr_nx < -cr_b.x || cr_nx > cr_b.x) ? cr_tx + cr_dx * 0.35 : cr_nx;
      cr_ty = (cr_ny < -cr_b.y || cr_ny > cr_b.y) ? cr_ty + cr_dy * 0.35 : cr_ny;
      cr_apply();
    }
  }, { passive: false });

  // touchend：手指抬起 —— 剩一指则重置拖动基准；全部抬起则回弹夹紧 + 双击判定
  cr_box.addEventListener('touchend', function (e) {
    if (e.touches.length === 1) {
      // 双指抬起一根：剩下的那根手指重新作为拖动基准，避免图片"窜"一下
      cr_lastX = e.touches[0].clientX;
      cr_lastY = e.touches[0].clientY;
    } else if (e.touches.length === 0) {
      // 全部抬起：位移夹紧回边界（阻尼后回弹），1x 自动居中
      cr_clamp(true);
      // 双击判定：300ms 内在相近位置抬起两次，且本手势没有捏合过
      if (!cr_pinched) {
        var cr_t = e.changedTouches[0];
        var cr_now = Date.now();
        if (cr_now - cr_lastTap < 300 && Math.hypot(cr_t.clientX - cr_lastTapX, cr_t.clientY - cr_lastTapY) < 40) {
          cr_lastTap = 0;                              // 重置，避免三击被算成两次双击
          // 目标倍数：当前 >1 就缩回 1x，否则放大到 2x
          var cr_to = cr_scale > 1 ? cr_MIN : 2;
          // 以双击位置为锚点放大（0.25s 过渡）
          var cr_m = { x: cr_t.clientX - cr_rect.left, y: cr_t.clientY - cr_rect.top };
          cr_setTransition(250);
          cr_fixAnchor(cr_m, cr_scale, cr_rot, cr_to, cr_rot);
          cr_scale = cr_to;
          cr_clamp(false);                             // 复用过渡动画夹紧（1x 时居中）
        } else {
          // 记录本次抬起，供下次双击判定
          cr_lastTap = cr_now;
          cr_lastTapX = e.changedTouches[0].clientX;
          cr_lastTapY = e.changedTouches[0].clientY;
        }
      }
      cr_pinched = false;                              // 手势结束，复位双指标记
    }
  }, { passive: true });

  // touchcancel：被系统打断 —— 同样要夹紧复位，避免状态"卡死"
  cr_box.addEventListener('touchcancel', function () {
    cr_clamp(true);
    cr_pinched = false;
  });

  // 旋转屏幕 / 窗口尺寸变化：不清空状态，只按新尺寸重新夹紧边界（验收④）
  window.addEventListener('orientationchange', function () {
    // 等 80ms 让系统完成布局后再夹紧
    setTimeout(function () { cr_clamp(true); }, 80);
  });
  window.addEventListener('resize', function () {
    setTimeout(function () { cr_clamp(true); }, 80);
  });

  // 调试/答辩辅助：暴露当前状态与边界（供自动化验证与课堂演示读取）
  window.cr_getState = function () {
    return { s: cr_scale, x: cr_tx, y: cr_ty, r: cr_rot };
  };
  window.cr_getBounds = function () {
    return cr_bounds();
  };
});
