# DormMate AI

DormMate AI 是一个面向学生宿舍的手机端网页应用原型，用来管理宿舍公告、值扫、缴费、洗晒、成员状态和轻量 AI 助手。项目基于 Next.js App Router 构建，当前阶段重点是验证宿舍协作流程，不接入真实微信支付，也不作为生产系统使用。

## 当前定位

- 面向手机尺寸使用，主界面模拟一个移动端应用壳。
- 底部五个一级导航：首页、值扫、缴费、洗晒、我的。
- 二级页面和弹窗用于承载公告、换班、缴费详情、月报等操作。
- AI 助手当前以 mock 规则为主，可演示常见宿舍事务指令。
- 数据当前存储在本地 SQLite 的宿舍状态 JSON 中，后续可拆分为真实业务表。

## 技术栈

- Next.js 16 App Router
- React 19
- Tailwind CSS 4
- Recharts
- Node SQLite `node:sqlite`

## 本地启动

安装依赖：

```bash
npm install
```

启动开发服务：

```bash
npm run dev
```

访问：

```text
http://localhost:3000
```

常用命令：

```bash
npm run lint
npm run build
npm run start
```

如果 PowerShell 阻止执行 `npm.ps1`，可以使用：

```bash
npm.cmd run lint
npm.cmd run dev
```

## 环境变量

项目可以不配置环境变量直接运行。可选项：

```env
DORM_DATABASE_PATH=./data/dormmate.sqlite
DORM_SESSION_SECRET=your-session-secret
DORM_LAT=31.2304
DORM_LON=121.4737
DEEPSEEK_API_KEY=
```

说明：

- `DORM_DATABASE_PATH`：SQLite 文件路径，默认是 `data/dormmate.sqlite`。
- `DORM_SESSION_SECRET`：登录会话签名密钥。
- `DORM_LAT` / `DORM_LON`：天气接口默认经纬度。
- `DEEPSEEK_API_KEY`：预留给真实 AI 调用；当前阶段可不配置。

## 登录与宿舍

首页支持登录和注册流程。用户进入宿舍后，会话保存在 Cookie 和浏览器本地缓存中。

默认示例宿舍邀请码：

```text
DORM-402
```

宿舍数据按邀请码隔离。第一次访问某个邀请码时，会生成一份默认宿舍数据。

## 路由结构

当前使用 Next.js App Router，不使用 React Router。

一级页面：

- `/dashboard`：首页
- `/duty`：值扫
- `/payment`：缴费
- `/laundry`：洗晒
- `/profile`：我的

二级页面：

- `/announcement`：公告栏
- `/status`：更改我的状态
- `/duty/swap`：换班申请
- `/payment/report`：费用月报

弹窗类操作：

- 缴费详情：在 `/payment` 内弹窗展示
- 新增支出：在 `/payment` 内弹窗展示
- 晾晒 / 收衣确认：在 `/laundry` 内弹窗展示
- 修改昵称 / 舍长转让：在 `/profile` 内弹窗展示

主滚动发生在 `(main)/layout.tsx` 的 `main#main-scroll-container`，路由变化时会重置滚动位置，避免进入二级页面后停留在旧滚动位置。

## 功能说明

### 首页

首页展示必要宿舍信息：

- 宿舍公告入口
- 舍友状态
- 今日任务

今日任务覆盖三类：

- 值扫
- 收衣
- 缴费

任务会根据当前用户状态生成，可以在首页完成值扫、收衣，或跳转到缴费页处理缴费。

### 值扫

值扫页面展示最近三天安排：

- 昨天
- 今天
- 明天

当前支持：

- 查看当前值扫负责人
- 标记“我已完成”
- 进入换班页面
- 自动排班

换班页面当前支持选择换班方式、选择舍友、填写说明并提交。后续还需要补齐“当前任务、结果预览、换班中状态、换班申请记录”等完整流程。

### 公告

公告栏当前支持：

- 查看置顶公告
- 查看公告列表
- 标记置顶公告已读
- 新增公告

后续需要补齐：

- 公告详情页
- 修改公告
- 删除公告
- 删除前二次确认

### 缴费

缴费模块采用宿舍轻量转账确认方案，不接入微信支付 API。

当前流程：

```text
待支付 → 去缴费 → 展示收款信息/微信收款码 → 我已完成转账 → 待收款人确认 → 已完成
```

当前支持：

- 按日期查看支出
- 新增支出记录
- 全员平摊
- 仅我支付
- 按比例收费
- 展示微信收款码
- 复制收款信息
- 提交“我已完成转账”
- 收款人确认收到或标记未收到
- 费用月报分析

微信收款码当前使用本地静态图片：

```text
public/images/wechat-pay-qr.jpg
```

注意：项目不会拉起微信，也不会调用微信支付 API。

### 洗晒

洗晒页面支持：

- 查看天气和洗晒建议
- 查看阳台占用情况
- 登记我要晾晒
- 设置预计收衣时间
- 确认收衣并释放阳台位置

天气数据会优先调用 `/api/weather`，失败时使用默认数据。

### 我的

我的页面当前支持：

- 查看宿舍邀请码
- 查看昵称和身份
- 复制邀请码
- 修改昵称
- 切换宿舍
- 清空本地缓存
- 舍长身份转让

后续需要补齐：

- 复制完整邀请文案
- 展示邀请二维码
- 收款设置入口
- 上传或展示微信收款码
- 月报汇总入口

### AI 助手

右下角 AI 气泡在主页面中常驻，可打开、发送指令、关闭。

当前阶段以 mock 规则执行，不要求接真实 AI。可演示指令包括：

```text
我今晚晚归
今天值扫完成了
我已经收衣了
水电费我已确认
帮我和小王换班
```

AI 操作会尝试同步更新宿舍状态、值扫、洗晒、缴费和公告数据。

已知限制：AI 的缴费确认逻辑后续应调整为“提交转账确认”，避免绕过收款人确认流程。

## 当前数据存储

当前项目使用 SQLite，但主要宿舍业务数据仍保存在 `dorm_states.state_json` 中。

已有表：

- `users`
- `dorm_states`

主要状态类型定义在：

```text
src/data/types.ts
```

默认数据在：

```text
src/data/mock.ts
```

宿舍状态读写在：

```text
src/lib/serverStore.ts
src/lib/database.ts
```

## 后续数据库实体

后续接真实后端时，建议从 `DormState` JSON 拆分为以下实体：

- `users`
- `dorms`
- `dorm_members`
- `announcements`
- `member_statuses`
- `duty_tasks`
- `duty_swap_requests`
- `bills`
- `bill_splits`
- `laundry_records`
- `ai_action_logs`

建议替换点：

- `src/lib/serverStore.ts`：从 JSON blob 读写改为表级读写。
- `src/data/mock.ts`：仅保留种子数据或开发 fixture。
- `src/lib/aiEngine.ts`：从直接修改 `DormState` 改为调用业务服务或写入 action log。
- `src/app/api/dorm/[code]/**`：按业务实体拆分查询与更新逻辑。

## 已知待完善事项

高优先级：

- 公告详情、编辑、删除和删除确认。
- AI 缴费确认不要直接变成已完成。
- 换班申请需要形成独立记录和“换班中”状态。
- 值扫任务需要筛选、添加任务入口和更完整的任务列表。
- 我的页面需要收款设置和更完整的邀请方案。

中优先级：

- 首页公告展示格式可调整为 `[公告]：xxxx`。
- 今日任务建议保留已完成项，并按未完成在前排序。
- 缴费编辑按钮需要补齐功能或暂时隐藏。
- 弹窗在小屏幕下需要继续统一检查高度和关闭方式。

低优先级：

- 返回一级页面时保留筛选状态。
- 洗晒状态文案进一步统一。
- AI 气泡与底部按钮的避让策略。

## 项目边界

当前版本是可运行的宿舍协作原型，但不是生产系统：

- 不接入微信支付。
- 不强行拉起微信。
- 不保证多端并发一致性。
- 不包含完整权限审计。
- 不包含真实文件上传能力。

适合用于产品流程演示、移动端交互验证和后续后端拆分前的原型开发。
