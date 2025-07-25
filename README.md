# Jobbit 招聘管理后台系统

一个基于 Next.js 15 的现代化招聘管理后台系统，提供完整的职位发布、申请者管理、沟通交流和用户权限控制功能。

## ✨ 功能特性

### 🔐 完整的账号体系

- **多维度用户信息**：昵称、Handle 标识符、性别、生日等完整信息
- **角色权限管理**：超级管理员、管理员、HR 经理、HR 专员、只读用户等分级权限
- **细粒度权限控制**：模块级权限控制，支持读取、编辑、删除、管理等操作权限
- **安全认证机制**：完整的登录认证和会话管理

### 💼 招聘管理功能

- **职位管理**：职位发布、编辑、状态管理
- **申请者沟通**：与求职者实时聊天交流
- **数据统计**：招聘数据可视化展示
- **用户管理**：系统用户账号和权限管理

### 🎨 现代化 UI 设计

- **响应式设计**：完美适配桌面端和移动端
- **深色模式支持**：优雅的界面主题切换
- **无障碍访问**：符合 WCAG 2.1 AA 标准
- **高对比度**：确保文字清晰易读

## 🏗️ 技术栈

- **前端框架**：Next.js 15 (App Router)
- **UI 框架**：React 18
- **样式方案**：Tailwind CSS 4
- **类型检查**：TypeScript
- **状态管理**：React Hooks + LocalStorage
- **图标系统**：SVG + Emoji

## 📋 账号体系详解

### 用户信息结构

```typescript
interface User {
	id: number;
	username: string; // 用户名（登录用）
	nickname: string; // 昵称（显示用）
	handle: number; // 用户唯一标识符
	gender: Gender; // 性别 (0-未知, 1-男, 2-女, 3-其他)
	birthday: string; // 生日（YYYY-MM-DD格式）
	email?: string; // 邮箱（可选）
	phone?: string; // 手机号（可选）
	avatar?: string; // 头像（可选）
	role: UserRole; // 用户角色
	permissions: Permission[]; // 用户权限列表
	status: UserStatus; // 用户状态
	createdAt: string; // 创建时间
	updatedAt: string; // 更新时间
	lastLoginAt?: string; // 最后登录时间
}
```

### 用户角色层级

| 角色            | 中文名称   | 权限范围               | 说明                               |
| --------------- | ---------- | ---------------------- | ---------------------------------- |
| `SUPER_ADMIN`   | 超级管理员 | 全部权限               | 系统最高权限，可管理所有功能       |
| `ADMIN`         | 管理员     | 除用户删除外的所有权限 | 可管理大部分功能，不能删除用户     |
| `HR_MANAGER`    | HR 经理    | 招聘相关管理权限       | 可管理职位和申请，查看数据统计     |
| `HR_SPECIALIST` | HR 专员    | 基础招聘操作权限       | 可操作职位和申请，与申请者沟通     |
| `VIEWER`        | 只读用户   | 仅查看权限             | 只能查看数据，不能进行任何修改操作 |

### 权限模块划分

| 模块           | 功能说明   | 权限操作           |
| -------------- | ---------- | ------------------ |
| `DASHBOARD`    | 数据统计   | 查看统计数据       |
| `JOBS`         | 职位管理   | 职位增删改查       |
| `APPLICATIONS` | 申请管理   | 申请处理和状态更新 |
| `CHAT`         | 申请者沟通 | 与申请者聊天交流   |
| `USERS`        | 用户管理   | 系统用户管理       |
| `SETTINGS`     | 系统设置   | 系统配置管理       |

### 权限操作类型

- `READ`：查看权限
- `WRITE`：编辑权限
- `DELETE`：删除权限
- `MANAGE`：管理权限（包含以上所有权限）

## 🚀 快速开始

### 环境要求

- Node.js 18.17+
- npm 或 yarn 或 pnpm

### 安装依赖

```bash
npm install
# 或
yarn install
# 或
pnpm install
```

### 启动开发服务器

```bash
npm run dev
# 或
yarn dev
# 或
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

### 演示账号

系统提供以下演示账号供测试使用：

| 用户名         | 角色       | 密码          | 权限说明         |
| -------------- | ---------- | ------------- | ---------------- |
| `admin`        | 超级管理员 | 任意 6 位以上 | 拥有系统所有权限 |
| `hr_manager`   | HR 经理    | 任意 6 位以上 | 可管理职位和申请 |
| `hr_staff_001` | HR 专员    | 任意 6 位以上 | 可操作职位和申请 |
| `viewer_001`   | 只读用户   | 任意 6 位以上 | 仅可查看数据     |

## 📁 项目结构

```
jobbit-chat/
├── src/
│   ├── app/                    # Next.js App Router 页面
│   │   ├── dashboard/          # 管理后台页面
│   │   │   ├── chat/          # 申请者沟通页面
│   │   │   ├── jobs/          # 职位管理页面
│   │   │   ├── users/         # 用户管理页面
│   │   │   ├── layout.tsx     # 后台布局组件
│   │   │   └── page.tsx       # 数据统计主页
│   │   ├── login/             # 登录页面
│   │   ├── layout.tsx         # 根布局
│   │   ├── page.tsx           # 路由守卫页面
│   │   └── globals.css        # 全局样式
│   ├── types/                  # TypeScript 类型定义
│   │   └── user.ts            # 用户相关类型
│   ├── hooks/                  # 自定义 Hooks
│   │   └── useAuth.ts         # 认证权限 Hook
│   └── components/             # 可复用组件（待扩展）
├── public/                     # 静态资源
├── README.md                   # 项目说明
├── package.json               # 项目配置
├── tsconfig.json              # TypeScript 配置
├── tailwind.config.ts         # Tailwind CSS 配置
└── next.config.ts             # Next.js 配置
```

## 🔧 核心功能使用

### 权限检查

使用 `useAuth` Hook 进行权限检查：

```typescript
import { useAuth } from "@/hooks/useAuth";
import { PermissionModule, PermissionAction } from "@/types/user";

function MyComponent() {
	const { hasPermission } = useAuth();

	// 检查是否有职位管理的写入权限
	const canEditJobs = hasPermission(PermissionModule.JOBS, PermissionAction.WRITE);

	return <div>{canEditJobs && <button>编辑职位</button>}</div>;
}
```

### 用户信息管理

```typescript
import { useAuth } from "@/hooks/useAuth";

function UserProfile() {
	const { user, updateUser } = useAuth();

	const handleUpdateProfile = () => {
		if (user) {
			updateUser({
				...user,
				nickname: "新昵称",
			});
		}
	};

	return (
		<div>
			<h1>欢迎，{user?.nickname}</h1>
			<p>Handle: #{user?.handle}</p>
			<p>角色: {getRoleText(user?.role)}</p>
		</div>
	);
}
```

## 🎯 开发指南

### 添加新的权限模块

1. 在 `src/types/user.ts` 中添加新的 `PermissionModule`
2. 更新 `ROLE_PERMISSIONS` 配置
3. 在相关组件中使用权限检查

### 创建新的用户角色

1. 在 `UserRole` 枚举中添加新角色
2. 在 `ROLE_PERMISSIONS` 中定义角色权限
3. 更新 `getRoleText` 函数添加显示文本

### 扩展用户信息

1. 更新 `User` 接口添加新字段
2. 修改用户创建和编辑表单
3. 更新用户显示组件

## 📱 响应式设计

系统完全适配移动端，主要特性：

- **自适应导航**：移动端收起侧边栏，使用汉堡菜单
- **触摸友好**：按钮和交互元素适配触摸操作
- **流式布局**：内容区域自动适应屏幕大小
- **优化体验**：针对移动端优化的交互体验

## 🔒 安全机制

- **会话管理**：基于 localStorage 的会话持久化
- **权限验证**：每个操作都进行权限检查
- **路由守卫**：未授权访问自动重定向
- **数据校验**：输入数据严格校验和过滤

## 🚧 待实现功能

- [ ] 完整的用户编辑功能
- [ ] 高级权限管理界面
- [ ] 申请者管理模块
- [ ] 系统设置页面
- [ ] 数据导出功能
- [ ] 邮件通知系统
- [ ] 审计日志记录

## 📄 许可证

本项目基于 MIT 许可证开源。

## 👥 贡献指南

欢迎提交 Issue 和 Pull Request 来改进项目！

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📞 联系我们

如有问题或建议，请提交 Issue 或联系项目维护者。

---

⭐ 如果这个项目对你有帮助，请给个 Star 支持一下！
