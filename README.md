# 家庭记账管理系统前端

基于 `ContiNew Admin UI 4.2.0-SNAPSHOT` 二次开发的前端项目，当前同时承载：

- Web 端管理后台
- `/m` 独立移动端

## 项目定位

当前项目不是单纯的上游管理后台模板，而是已经落地为“家庭记账系统前端”。其中：

- Web 端继续使用 `Arco Design`
- 移动端 `/m` 使用 `TDesign Mobile Vue`
- PC 页面与移动端页面分开开发
- 公共 API、Store、Hook 和工具方法可复用

## 技术栈

- Vue 3
- TypeScript
- Vite 5
- Pinia
- Vue Router
- Arco Design Vue
- TDesign Mobile Vue
- Sass

## 当前已落地能力

### Web 端

- 科目管理
- 明细管理
- 隐藏对象配置
- 隐私密码与隐私时长配置
- 明细统计区结余展示

### 移动端

- `/m/bookkeeping/detail`：移动端明细主页
- `/m/me`：移动端“我的”页面
- `/m/subject`：移动端科目页
- `/m/report`：报表入口预留页

### 移动端已完成的重点能力

- 独立移动端布局与底部菜单
- `/m` 路由独立入口与终端映射
- rem 适配
- 黄色主题统一
- 骨架屏
- 移动端 Toast 提示
- 回到顶部
- 移动端月份选择器
- 独立的移动端新增 / 编辑记账表单
- 全屏分类选择页
- 移动端隐私模式入口
- 版本号脚本化递增

## 关键业务约定

### 1. 移动端页面与 PC 页面分离

移动端页面不复用 PC 页面的弹窗与页面结构。

约定如下：

- 页面单独开发
- 样式单独维护
- 公共 API、字典、Store、工具方法可以复用

### 2. 移动端统一组件体系

`/m` 下的页面统一优先使用 `TDesign Mobile Vue` 组件。

当前已经统一到以下能力：

- `Toast`
- `Loading`
- `Skeleton`
- `BackTop`
- `Footer`
- `Tabs`
- `DateTimePicker`

### 3. 移动端版本号统一管理

展示版本号不使用 `package.json` 的项目版本，而是统一使用：

`src/config/app-version.ts`

当前已提供两条版本脚本：

```bash
pnpm mobile:version:patch
pnpm mobile:version:minor
```

适用规则：

- 小改动：`patch`
- 阶段性功能升级：`minor`

## 目录结构

```text
continew-admin-ui
├─ src
│  ├─ apis
│  │  └─ bookkeeping              记账相关接口
│  ├─ config
│  │  └─ app-version.ts           移动端展示版本号
│  ├─ hooks
│  ├─ layout
│  │  └─ mobile                   移动端布局
│  ├─ router
│  │  └─ terminal.ts              Web / 移动端入口映射
│  ├─ stores
│  │  └─ modules
│  │     └─ privacy.ts            隐私模式状态
│  ├─ styles
│  │  └─ mobile.scss              移动端主题变量与统一样式
│  ├─ utils
│  │  ├─ mobile-rem.ts            rem 适配
│  │  └─ mobile-toast.ts          移动端提示封装
│  ├─ views
│  │  ├─ bookkeeping              Web 端记账页面
│  │  └─ mobile                   移动端页面
│  │     ├─ bookkeeping
│  │     ├─ me
│  │     ├─ report
│  │     └─ subject
│  └─ main.ts
├─ scripts
│  └─ bump-mobile-version.mjs     移动端版本号递增脚本
└─ package.json
```

## 路由入口

当前 `/m` 相关入口映射定义在：

`src/router/terminal.ts`

默认移动端首页：

```text
/m/bookkeeping/detail
```

当前主要移动端页面：

- `/m/bookkeeping/detail`
- `/m/report`
- `/m/subject`
- `/m/me`

## 开发环境

建议本地准备：

- Node.js 18+
- pnpm

后端默认联调地址：

- 前端：`http://localhost:5173`
- 后端：`http://localhost:8000`

## 常用命令

### 1. 安装依赖

```bash
pnpm i
```

或使用镜像安装：

```bash
pnpm bootstrap
```

### 2. 启动开发环境

```bash
pnpm dev
```

启动后默认访问：

- Web：`http://localhost:5173`
- 移动端：`http://localhost:5173/m/bookkeeping/detail`

### 3. 类型检查

```bash
pnpm typecheck
```

### 4. 打包

```bash
pnpm build
```

测试环境打包：

```bash
pnpm build:test
```

### 5. 代码检查

```bash
pnpm lint
pnpm lint:fix
```

### 6. 移动端版本号递增

```bash
pnpm mobile:version:patch
pnpm mobile:version:minor
```

## 当前移动端说明

### 1. 明细页

移动端明细页已经完成：

- 顶部月份查询
- 用户筛选
- 收支统计
- 骨架屏
- 回到顶部
- 删除与编辑交互
- 隐私模式退出按钮

### 2. 新增 / 编辑记账

当前移动端表单已经改为独立实现，不再复用 PC 弹窗页面。

已包含：

- 全屏分类选择页
- 金额键盘
- 表单校验
- 隐私模式下“隐藏此笔”开关

### 3. 隐私模式

当前移动端隐私链路已经接通：

- “我的”页面底部版本号三连击进入隐私入口
- 首次可设置隐私密码
- 已设置密码时可验证进入
- 有效时长由后端配置返回
- 状态由 `sessionStorage` 持有

### 4. 报表页

报表页当前是入口预留，后续继续补充图表与统计能力。

## 协作建议

- 需求文档、技术方案、修改日志统一维护在 `D:\ShaYuJiZhang\markdown`
- 移动端相关变更优先同步更新本 README
- 如果涉及展示版本号，请同步使用版本脚本，不要手改多个地方

## License

- 遵循 Apache-2.0 协议
- 基于 ContiNew Admin UI 二次开发
