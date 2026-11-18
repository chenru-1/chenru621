/*
 * 文件：mobile-gesture.js
 * 作者：陈茹　学号：24002120621
 * 建立时间：2026-11-18
 * 使用模型：GLM-5.3-Flash
 * 功能：任务二·手势卡片——监听 touchstart / touchend，用 changedTouches[0]
 *       计算横向位移，阈值 40px 判定左右滑动，切换中华美食卡片；
 *       边界给出提示，0.3s 过渡动画，300ms 冷却防止快速连滑一次跳两张。
 */

// 变量：cr_idx —— 当前显示的卡片序号（从 0 开始：0～3）
var cr_idx = 0;
// 变量：cr_total —— 卡片总数
var cr_total = 4;
// 变量：cr_startX —— 手指按下时的横向起点坐标（touchstart 时记录）
var cr_startX = 0;
// 变量：cr_lastSwitch —— 上一次成功切换的时间戳（毫秒），用于 300ms 冷却判断
var cr_lastSwitch = 0;
// 变量：cr_hintTimer —— 边界提示自动消失的定时器句柄
var cr_hintTimer = null;
// 变量：cr_threshold —— 滑动判定阈值（像素）：小于它的位移视为误触，不切换
var cr_threshold = 40;
// 变量：cr_coolDown —— 冷却时间（毫秒）：两次切换的最小间隔，防止连滑跳两张
var cr_coolDown = 300;

// 函数：cr_update —— 把轨道位移到当前卡片，并同步更新底部页码指示
// 关键步骤：transform 位移量 = -cr_idx * 100%，配合 CSS 的 0.3s 过渡产生滑动动画
function cr_update() {
  // 移动轨道：显示当前卡片
  document.querySelector('#crTrack').style.transform = 'translateX(' + (-cr_idx * 100) + '%)';
  // 更新底部页码："第 X/4 张"
  document.querySelector('#crCounter').innerHTML = '第 <b>' + (cr_idx + 1) + '</b>/' + cr_total + ' 张';
}

// 函数：cr_showHint —— 显示边界提示文字（如"已经是第一张"），1.2 秒后自动消失
// 关键步骤：先清掉上一个定时器再设新的，避免连续提示时提前消失
function cr_showHint(cr_msg) {
  // 取提示浮层并写入文字
  var cr_hint = document.querySelector('#crHint');
  cr_hint.textContent = cr_msg;
  // 加 cr_show 类让浮层淡入
  cr_hint.classList.add('cr_show');
  // 先清除全部旧定时器，再设置当前定时器（防止连续提示互相干扰）
  if (cr_hintTimer) { clearTimeout(cr_hintTimer); }
  cr_hintTimer = setTimeout(function () {
    // 1.2 秒后移除 cr_show 类，浮层淡出
    cr_hint.classList.remove('cr_show');
  }, 1200);
}

// 页面加载后：绑定触摸事件，完成手势识别
document.addEventListener('DOMContentLoaded', function () {
  // 取卡片视口（touch-action: pan-y 已在 CSS 中设置：横向手势归我们，纵向交给浏览器）
  var cr_vp = document.querySelector('#crViewport');

  // touchstart：手指按下 —— 记录横向起点坐标（passive: true，不阻塞浏览器合成）
  cr_vp.addEventListener('touchstart', function (e) {
    cr_startX = e.touches[0].clientX;
  }, { passive: true });

  // touchend：手指抬起 —— 用 changedTouches[0] 取最终坐标（touches 里已经没有这根手指）
  cr_vp.addEventListener('touchend', function (e) {
    // 计算横向位移：负值 = 左滑（下一张），正值 = 右滑（上一张）
    var cr_dx = e.changedTouches[0].clientX - cr_startX;
    // 验收①：位移小于阈值 40px 视为误触（或纵向滚动），直接忽略
    if (Math.abs(cr_dx) < cr_threshold) { return; }

    // 验收②：冷却期内（距上次切换不足 300ms）忽略本次滑动，防止一次连滑跳两张
    var cr_now = Date.now();
    if (cr_now - cr_lastSwitch < cr_coolDown) { return; }

    if (cr_dx < 0) {
      // 左滑 → 下一张：未到最后一张才切换，否则提示边界
      if (cr_idx < cr_total - 1) {
        cr_idx++;                                // 序号 +1
        cr_lastSwitch = cr_now;                  // 记录本次切换时间，开启冷却
        cr_update();                             // 位移轨道 + 更新页码（0.3s 过渡）
      } else {
        cr_showHint('已经是最后一张');            // 边界提示
      }
    } else {
      // 右滑 → 上一张：未到第一张才切换，否则提示边界
      if (cr_idx > 0) {
        cr_idx--;                                // 序号 -1
        cr_lastSwitch = cr_now;                  // 记录本次切换时间，开启冷却
        cr_update();                             // 位移轨道 + 更新页码（0.3s 过渡）
      } else {
        cr_showHint('已经是第一张');              // 边界提示
      }
    }
  }, { passive: true });
});
