# 酷洛米记账系统前端

基于 `ContiNew Admin UI 4.2.0-SNAPSHOT` 二次开发的前端项目，当前已经从通用后台模板演进为一套可同时支撑 Web 端和移动端 H5 的酷洛米记账系统前端。

当前版本重点是：

1. Web 端记账主流程已可稳定使用。
2. `/m` 移动端独立页面体系已落地。
3. 专属入口登录与静默续登链路已接通。
4. 验证码、隐私模式、用户管理、在线用户展示等配套能力已打通。
5. 报表模块需求和技术方案已完成，代码尚未正式开发。

当前移动端展示版本号：

`v1.1.15`

---

## 项目定位

本项目不是简单套壳的管理后台，而是当前酷洛米记账系统的前端主仓库，负责：

1. Web 端管理后台页面
2. `/m` 移动端独立页面
3. 登录、权限、专属入口、隐私模式等前端交互
4. 与后端共用的记账 API 对接

设计原则如下：

1. Web 端和移动端页面分开开发，不强行共用页面结构。
2. 公共 API、Store、Hook、工具方法尽量复用。
3. 移动端优先使用 `TDesign Mobile Vue`。
4. Web 端继续使用 `Arco Design Vue`。

---

## 当前已完成功能

### Web 端

当前 Web 端已完成以下能力：

1. 科目管理
2. 明细管理
3. 关注关系管理
4. 隐藏对象配置
5. 隐私密码与隐私时长配置
6. 用户管理中的专属入口维护
7. 在线用户中的登录方式与快捷登录标识展示
8. 网站配置中的前台域名维护

其中记账相关已经具备：

1. 分类、科目、支付方式、所属用户等维度查询
2. 明细统计区总支出、总收入、结余展示
3. 科目图标选择器与图标字段录入
4. 明细新增、编辑、删除完整链路

### 移动端

当前移动端已完成以下能力：

1. 独立 `/m` 路由入口与终端映射
2. 独立移动端布局与底部导航
3. `/m/bookkeeping/detail` 明细主页
4. `/m/me` 我的页面
5. `/m/subject` 科目页
6. `/m/report` 报表入口占位页

当前移动端明细主链路已完成：

1. 月份切换
2. 用户筛选
3. 收支汇总展示
4. 独立新增 / 编辑记账交互
5. 科目与支付方式弹层即时选择并关闭
6. 自定义金额键盘
7. 隐私模式入口与状态联动
8. 骨架屏、回到顶部、移动端 Toast

### 登录与安全链路

当前前端已完成以下登录安全能力：

1. 账号密码登录支持按后端配置动态启用图形验证码
2. 登录页支持专属入口登录
3. 前端本地保存 `entryKey`
4. Token 失效后自动静默续登
5. 被强制下线或手动退出时自动清理本地专属入口信息
6. 在线用户列表可区分普通登录和专属入口登录

---

## 技术栈

核心技术栈如下：

1. Vue 3
2. TypeScript
3. Vite 5
4. Pinia
5. Vue Router
6. Arco Design Vue
7. TDesign Mobile Vue
8. ECharts
9. Sass

说明：

1. Web 端图表和后续报表模块统一采用 `ECharts + vue-echarts`
2. 移动端不额外引入第二套图表框架

---

## 目录结构

```text
continew-admin-ui
├─ public
├─ scripts
│  └─ bump-mobile-version.mjs
├─ src
│  ├─ apis
│  │  ├─ auth
│  │  ├─ bookkeeping
│  │  ├─ monitor
│  │  └─ system
│  ├─ components
│  │  ├─ BookkeepingSubjectIconSelector
│  │  ├─ Chart
│  │  └─ Verify
│  ├─ config
│  │  └─ app-version.ts
│  ├─ hooks
│  ├─ layout
│  │  └─ mobile
│  ├─ router
│  │  └─ terminal.ts
│  ├─ stores
│  │  └─ modules
│  ├─ styles
│  ├─ utils
│  └─ views
│     ├─ bookkeeping
│     ├─ login
│     ├─ mobile
│     ├─ monitor
│     └─ system
├─ package.json
└─ README.md
```

关键目录说明：

1. `src/views/bookkeeping`
   - Web 端记账页面
2. `src/views/mobile`
   - 移动端页面
3. `src/apis/bookkeeping`
   - 记账模块前端接口封装
4. `src/layout/mobile`
   - 移动端布局、底部导航、全局挂载组件
5. `src/utils/auth.ts`
   - token 与专属入口本地存储能力
6. `src/utils/http.ts`
   - 401、静默续登、请求重放等拦截逻辑

---

## 关键页面与路由

### Web 端核心页面

1. `/bookkeeping/subject`
   - 科目管理
2. `/bookkeeping/detail`
   - 明细管理
3. `/bookkeeping/follow`
   - 关注关系管理
4. `/bookkeeping/hide-target`
   - 隐藏对象配置
5. `/system/user`
   - 用户管理，包含专属入口维护
6. `/system/config`
   - 系统配置，包含前台域名
7. `/monitor/online`
   - 在线用户，包含登录方式与快捷登录标识

### 移动端核心页面

1. `/m/bookkeeping/detail`
   - 移动端明细首页
2. `/m/report`
   - 移动端报表入口占位页
3. `/m/subject`
   - 移动端科目页
4. `/m/me`
   - 移动端我的页面

终端默认映射定义在：

- `src/router/terminal.ts`

当前默认移动端首页：

`/m/bookkeeping/detail`

---

## 本地开发

建议环境：

1. Node.js 18+
2. pnpm

### 安装依赖

```bash
pnpm i
```

或使用镜像源：

```bash
pnpm bootstrap
```

### 启动开发环境

```bash
pnpm dev
```

默认访问地址：

1. Web：`http://localhost:5173`
2. 移动端：`http://localhost:5173/m/bookkeeping/detail`

### 类型检查

```bash
pnpm typecheck
```

### 打包

```bash
pnpm build
```

测试环境打包：

```bash
pnpm build:test
```

### 代码检查

```bash
pnpm lint
pnpm lint:fix
```

### 移动端展示版本号递增

```bash
pnpm mobile:version:patch
pnpm mobile:version:minor
```

使用规则：

1. `patch`
   - 小范围修复或样式调整
2. `minor`
   - 阶段性功能升级

移动端展示版本号统一维护在：

- `src/config/app-version.ts`

---

## 与后端联调说明

默认联调端口：

1. 前端：`5173`
2. 后端：`8000`

当前前后端已打通的重点链路：

1. 账号密码登录与验证码链路
2. 专属入口登录链路
3. 专属入口静默续登链路
4. 用户管理中的专属入口启用、禁用、复制、重新生成
5. 在线用户中的登录方式展示
6. 记账明细、科目、关注、隐私、隐藏对象等业务链路

前端依赖的关键后端配置项：

1. `LOGIN_CAPTCHA_ENABLED`
   - 控制账号密码登录是否展示图形验证码
2. `SITE_FRONTEND_DOMAIN`
   - 用于生成用户专属快捷登录链接

---

## 当前业务约定

### 1. Web 与移动端页面分离

约定如下：

1. 移动端页面不直接复用 Web 页面的表格与弹窗结构
2. 业务数据模型和 API 可复用
3. 页面布局和视觉样式分开维护

### 2. 移动端优先使用 TDesign Mobile Vue

`/m` 目录下页面默认遵循：

1. 优先使用 `TDesign Mobile Vue`
2. 非必要不新增原生按钮和原生弹层实现
3. 保持黄色主题和移动端统一风格

### 3. 专属入口与静默续登

当前前端专属入口链路约定如下：

1. 首次通过专属链接进入登录页后，会自动发起专属入口登录
2. 登录成功后，本地保存 `entryKey`
3. Token 正常过期时，HTTP 拦截器会尝试静默续登
4. 手动退出或被强制下线时，会清理本地专属入口信息

### 4. 报表模块尚未开发

当前状态：

1. 需求文档已完成
2. 技术方案已完成
3. 移动端报表页当前仍是占位页
4. Web 端报表页尚未开发

---

## 相关文档

当前需求、方案、修改记录统一维护在工作区 `markdown` 目录中。

重点文档包括：

1. `1821.移动端报表模块需求文档.md`
2. `2026-03-28.记账报表模块技术方案.md`
3. `2026-03-28.用户永久专属入口与静默续登方案.md`
4. 其他需求文档、技术方案、修改日志

---

## 发布前建议

如果要以当前已完成功能作为一个稳定版本发布，建议至少完成以下检查：

1. `pnpm typecheck`
2. `pnpm build`
3. 核对专属入口登录、静默续登、手动退出链路
4. 核对账号密码登录在验证码开启和关闭两种场景下的表现
5. 核对移动端新增 / 编辑明细主链路
6. 核对用户管理、在线用户、系统配置三个管理页
7. 再从当前稳定代码切发布分支或打 tag

---

## License

1. 遵循 Apache-2.0 协议
2. 基于 ContiNew Admin UI 二次开发
