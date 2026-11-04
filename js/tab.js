/*
 * tab.js —— 可复用选项卡组件
 * 作者：陈茹    建立时间：2026-11-04    使用模型：GLM-5.3-Flash
 * 主要功能：页面中任意 <div class="cr_tabs"> 容器都会被自动初始化为选项卡，
 *           一个页面可放多组选项卡共用本段代码，互不影响。
 * 结构约定：
 *   <div class="cr_tabs">
 *       <button class="cr_tab-btn">标签一</button> ...
 *       <section class="cr_tab-panel">内容一</section> ...
 *   </div>
 */

// 函数功能：初始化一组选项卡，为容器内每个标签按钮绑定点击监听事件
function cr_initTabs(cr_box) {
    var cr_btns = cr_box.querySelectorAll('.cr_tab-btn');
    var cr_panels = cr_box.querySelectorAll('.cr_tab-panel');

    cr_btns.forEach(function (cr_btn, cr_i) {
        // 监听事件：点击标签按钮时切换选中状态
        cr_btn.addEventListener('click', function () {
            // 第一步：先清除所有选项卡和面板的选中状态
            cr_btns.forEach(function (cr_b) {
                cr_b.classList.remove('cr_active');
            });
            cr_panels.forEach(function (cr_p) {
                cr_p.classList.remove('cr_active');
            });

            // 第二步：再设置当前元素的选中状态
            cr_btn.classList.add('cr_active');
            cr_panels[cr_i].classList.add('cr_active');
        });
    });
}

// 函数功能：页面加载完成后，自动初始化页面上所有 .cr_tabs 容器（体现可复用性）
document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.cr_tabs').forEach(cr_initTabs);
});
