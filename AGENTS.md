# AGENTS.md

## What this repo is

- 静态 HTML 课堂作业仓库（《高级网页设计》，Gitee 仓库 `chenru789`）。无 package.json、无构建/测试/lint 工具——验证方式就是在浏览器中直接打开 HTML 页面。
- `index.html` 是首页，集中列出所有作业页链接；每个新页面都是独立样张（one-page demo）。

## 强制约定（来自课程要求，见 cr_prompt.md）

- **命名规则**：所有 CSS 类名、id、JS 变量必须以 `cr_` 开头（如 `cr_initTabs`、`cr_tabs`、`cr_tab-btn`、`cr_active`）。
- **提示词记录**：执行任何用户提示之前，先以追加方式把该提示词写入 `cr_prompt.md`（不覆盖已有内容），格式见文件内既有条目：时间分节 + 模型名 + 提示词内容。`cr_prompt.md` 必须入库。
- **首页入口**：每个新建 HTML 文件必须包含返回 `index.html` 的超链接，并且要在 `index.html` 的作业列表中加入该页入口（参照现有卡片的写法）。
- **HTML 文件头注释**：每个新建 HTML 文件必须在 `<head>` 内加入注释，内容包括四项：作者（陈茹）、建立时间（yyyy-MM-dd）、使用的模型（如 GLM-5.3-Flash）、功能名称。示例：
  ```html
  <!--
      作者：陈茹
      建立时间：2026-11-04
      使用模型：GLM-5.3-Flash
      功能名称：页面功能名
  -->
  ```
- **JS 函数注释**：js 文件中的每个函数必须在其上方加入注释，说明该函数主要实现的功能；函数内关键步骤（如事件绑定、状态清除/设置）也应配简短行注释。
- JS 逻辑单独放 `js/` 文件夹并外部引用；可复用组件写成自动初始化模式，事件处理遵循"先清除全部选中状态再设置当前项"。

## Git 提交（skills/ 下的 SKILL.md 是权威流程）

- 远程：`origin` = Gitee（`master` 分支，remote URL 中已带令牌，已配置好，直接 `git push`）；`github` = GitHub 镜像 `chenru-1/chenru621`（SSH）。用户说"提交项目"时按 `skills/gitee-push/SKILL.md` 执行。
- `skills/` 已被 `.gitignore` 排除（内含 Gitee 私人令牌），**绝不能入库，也不要在对话或提交信息中复述令牌**。
- 提交信息一律用中文、简洁描述本次改动；逐个 `git add <文件>`，避免 `git add -A` 盲加临时文件。

## 本地资源（页面走离线本地路径，不要改成 CDN 链接）

- `cdn/`：本地化的 Font Awesome（`css/all.min.css` + `webfonts/`）和 Lucide（`js/lucide.min.js`，SVG 方式）。
- `font/`：iconfont.cn 导出的图标字体（css/woff/ttf + `iconfont.json`）。
- `.trae-html-share-packages/` 为 IDE 临时产物，已 gitignore。
