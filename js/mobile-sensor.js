/*
 * 文件：mobile-sensor.js
 * 作者：陈茹　学号：24002120621
 * 建立时间：2026-11-18
 * 使用模型：GLM-5.3-Flash
 * 功能：任务四·摇一摇彩蛋——监听 devicemotion，取 accelerationIncludingGravity
 *       计算合成加速度，超过阈值 18 判定为摇动并随机抽出一道菜（1.5 秒冷却）；
 *       无传感器/无数据时显示"当前设备不支持"并提供按钮降级；iOS 13+ 用按钮申请权限。
 */

// 变量：cr_DISHES —— 菜谱池（摇一摇/手抽共用的候选菜，带本地食物照片）
var cr_DISHES = [
  { img: 'mobile-imgs/kaoya.jpg', name: '北京烤鸭', desc: '皮脆肉嫩、肥而不腻，配薄饼葱丝甜面酱，今日就吃它！' },
  { img: 'mobile-imgs/mapodoufu.jpg', name: '麻婆豆腐', desc: '麻辣鲜香烫，豆腐嫩滑红油亮，下饭一绝。' },
  { img: 'mobile-imgs/xiaolongbao.jpg', name: '小笼包', desc: '轻轻提、慢慢移、先开窗、后喝汤。' },
  { img: 'mobile-imgs/fotiaoqiang.jpg', name: '佛跳墙', desc: '坛启荤香飘四邻，今日给自己加个硬菜。' }
];

// 变量：cr_THRESHOLD —— 摇动判定阈值：合成加速度超过它才算摇动
var cr_THRESHOLD = 18;
// 变量：cr_COOL —— 触发后的冷却时间（毫秒）：一次摇动的连续采样只抽一次
var cr_COOL = 1500;
// 变量：cr_lastShake —— 上一次成功触发摇一摇的时间戳
var cr_lastShake = 0;
// 变量：cr_gotData —— 是否收到过有效的加速度数据（用于判断设备是否支持）
var cr_gotData = false;
// 变量：cr_drawCount —— 本次会话累计抽出次数（调试/答辩观察用）
var cr_drawCount = 0;

// 函数：cr_setStatus —— 更新顶部传感器状态徽章文字与颜色
// 参数：cr_text —— 状态文字；cr_bad —— 是否为"不支持"等异常状态（true 显示红色）
function cr_setStatus(cr_text, cr_bad) {
  var cr_s = document.querySelector('#crStatus');
  cr_s.textContent = cr_text;
  cr_s.classList.toggle('cr_bad', !!cr_bad);
}

// 函数：cr_drawDish —— 随机抽一道菜写进结果卡，并触发弹出动画
// 关键步骤：先移除动画类 → 强制重排 → 换内容再加回动画类，保证每次都能重新弹
function cr_drawDish() {
  cr_drawCount++;                                          // 累计次数（调试用）
  var cr_d = cr_DISHES[Math.floor(Math.random() * cr_DISHES.length)];
  var cr_box = document.querySelector('#crResult');
  // 先清除动画状态，为重新触发做准备
  cr_box.classList.remove('cr_pop');
  void cr_box.offsetWidth;                                 // 强制重排：让动画可以重复播放
  // 换成抽中的菜（照片 + 菜名 + 简介）
  cr_box.innerHTML =
    '<div class="cr_popbox">' +
    '<img class="cr_img" src="' + cr_d.img + '" alt="' + cr_d.name + '">' +
    '<h2>' + cr_d.name + '</h2>' +
    '<p>' + cr_d.desc + '</p>' +
    '</div>';
  // 加回动画类，触发弹出
  cr_box.classList.add('cr_pop');
}

// 函数：cr_showUnsupported —— 降级显示：无传感器/无数据时不报错不白屏，
// 显示"当前设备不支持"提示，并提供"点我抽一次"按钮作为替代方案
function cr_showUnsupported() {
  cr_setStatus('❌ 当前设备不支持，请用手机打开', true);
  document.querySelector('#crManual').classList.add('cr_show');   // 显示降级按钮
}

// 函数：cr_onMotion —— devicemotion 事件处理：读加速度、刷新读数、判定摇动
function cr_onMotion(e) {
  // 只用 accelerationIncludingGravity（含重力，静止基线约 9.8，所有设备都有）
  var cr_a = e.accelerationIncludingGravity;
  // 没有数据（部分浏览器触发事件但字段为 null）→ 视为不支持，不报错
  if (!cr_a || cr_a.x === null || cr_a.x === undefined) { return; }
  cr_gotData = true;                                       // 收到有效数据
  cr_setStatus('✅ 传感器工作正常，用力摇一摇！', false);
  // 合成加速度 = √(x² + y² + z²)，静止时约 9.8，用力摇会瞬间冲过 18
  var cr_x = cr_a.x || 0, cr_y = cr_a.y || 0, cr_z = cr_a.z || 0;
  var cr_mag = Math.sqrt(cr_x * cr_x + cr_y * cr_y + cr_z * cr_z);
  // 实时读数（答辩观察：摇动时数值的变化）
  document.querySelector('#crLive').innerHTML =
    '合成加速度 <b>' + cr_mag.toFixed(2) + '</b>' +
    '（x ' + cr_x.toFixed(1) + ' / y ' + cr_y.toFixed(1) + ' / z ' + cr_z.toFixed(1) + '）· 阈值 ' + cr_THRESHOLD;
  // 摇动判定：超过阈值 且 不在冷却期内（验收①：1.5 秒冷却，一次摇动只触发一次）
  var cr_now = Date.now();
  if (cr_mag > cr_THRESHOLD && cr_now - cr_lastShake > cr_COOL) {
    cr_lastShake = cr_now;                                 // 记录触发时间，开启冷却
    cr_drawDish();                                         // 随机抽菜 + 弹出动画
  }
}

// 页面加载后：绑定传感器监听、iOS 权限按钮与降级按钮，并启动支持性检测
document.addEventListener('DOMContentLoaded', function () {
  // 监听 devicemotion（用 try 包住，极老的浏览器不支持该事件也不报错）
  try {
    window.addEventListener('devicemotion', cr_onMotion);
  } catch (cr_e) {
    cr_showUnsupported();
  }

  // iOS 13+：必须由用户手势触发权限申请（验收③），检测到该 API 才显示按钮
  if (window.DeviceMotionEvent && typeof window.DeviceMotionEvent.requestPermission === 'function') {
    document.querySelector('#crAuth').classList.add('cr_show');
    document.querySelector('#crAuth').addEventListener('click', function () {
      window.DeviceMotionEvent.requestPermission()
        .then(function (cr_state) {
          if (cr_state === 'granted') {
            // 授权成功：隐藏按钮，等待 devicemotion 数据到来
            document.querySelector('#crAuth').classList.remove('cr_show');
            cr_setStatus('✅ 权限已授予，用力摇一摇！', false);
          } else {
            cr_setStatus('⚠️ 权限被拒绝，可用下方按钮手抽', true);
            document.querySelector('#crManual').classList.add('cr_show');
          }
        })
        .catch(function () { cr_showUnsupported(); });
    });
  }

  // 降级按钮：点击直接抽一次（无传感器设备的替代方案）
  document.querySelector('#crManual').addEventListener('click', cr_drawDish);

  // 支持性检测：1.5 秒内没收到任何有效加速度数据 → 判定不支持，走降级（验收②）
  setTimeout(function () {
    if (!cr_gotData) { cr_showUnsupported(); }
  }, 1500);

  // 调试/答辩辅助：暴露内部状态供自动化验证与课堂演示读取
  window.cr_getDebug = function () {
    return { draws: cr_drawCount, got: cr_gotData };
  };
});
