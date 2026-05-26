# 陪诊服务平台

一款完整的陪诊类微信小程序系统，包含用户端小程序、陪诊师端小程序和管理后台。

## 项目结构

```
peizhen/
├── server/                  # 后端服务 (Node.js + Express + MySQL)
├── miniprogram-user/        # 用户端微信小程序
├── miniprogram-companion/   # 陪诊师端微信小程序
├── admin/                   # 管理后台 (Vue 3 + Element Plus)
└── database/                # 数据库脚本
    └── peizhen.sql          # 数据库初始化脚本
```

## 功能模块

### 用户端小程序
- 微信一键登录
- 首页：Banner、推荐陪诊师、附近陪诊师、常见问题、客服入口
- 就诊人管理：添加、编辑、删除就诊人，设置默认就诊人
- 预约服务：选择城市、医院、科室、服务类型、时间、陪诊师
- 服务类型：全程陪诊、代挂号、代取药、代取报告、代问诊、住院陪诊、术后陪诊、产检陪诊
- 订单管理：查看订单状态、取消订单、申请退款、投诉
- 个人中心：个人资料、就诊记录、服务评价

### 陪诊师端小程序
- 陪诊师登录（手机号+验证码 / 微信登录）
- 首页：今日订单、收入统计
- 订单管理：接单、开始服务、完成服务
- 服务记录：历史服务记录
- 个人中心：个人资料、擅长技能、收入统计

### 管理后台
- 数据统计：用户数、订单数、收入统计、图表分析
- 用户管理：用户列表、禁用/启用用户
- 陪诊师管理：陪诊师列表、审核通过/拒绝
- 订单管理：订单列表、订单详情、取消订单
- 服务管理：服务类型CRUD
- 城市管理：城市CRUD
- Banner管理：首页轮播图管理
- 投诉处理：查看投诉、处理投诉
- 系统设置：平台配置、费用设置、提现设置

## 技术栈

### 后端
- Node.js
- Express
- MySQL
- JWT 认证
- Multer 文件上传

### 小程序
- 微信小程序原生开发
- WXML/WXSS/JavaScript

### 管理后台
- Vue 3
- Vite
- Element Plus
- Pinia
- Vue Router
- ECharts
- Axios

## 数据库配置

1. 创建数据库：
```sql
CREATE DATABASE peizhen DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. 导入数据：
```bash
mysql -u root -p peizhen < database/peizhen.sql
```

3. 修改配置文件 `server/config/index.js` 中的数据库连接信息。

## 后端部署

```bash
cd server
npm install
npm run dev    # 开发模式
npm start      # 生产模式
```

后端服务默认运行在 `http://localhost:3000`

## 管理后台部署

```bash
cd admin
npm install
npm run dev    # 开发模式
npm run build  # 生产构建
```

管理后台默认运行在 `http://localhost:8080`

## 小程序部署

1. 打开微信开发者工具
2. 导入 `miniprogram-user` 或 `miniprogram-companion` 目录
3. 修改 `app.js` 中的 `baseUrl` 为实际后端地址
4. 编译运行

## API 接口

基础路径：`http://localhost:3000/api`

### 认证接口
- POST `/auth/user/login` - 用户登录
- POST `/auth/companion/login` - 陪诊师登录
- POST `/auth/admin/login` - 管理员登录

### 用户接口
- GET `/user/info` - 获取用户信息
- POST `/user/info` - 更新用户信息
- GET `/user/patients` - 获取就诊人列表
- POST `/user/patients` - 添加就诊人
- PUT `/user/patients/:id` - 更新就诊人
- DELETE `/user/patients/:id` - 删除就诊人

### 订单接口
- GET `/orders` - 获取订单列表
- GET `/orders/:id` - 获取订单详情
- POST `/orders` - 创建订单
- POST `/orders/:id/cancel` - 取消订单
- POST `/orders/:id/reschedule` - 改期
- POST `/order/evaluation` - 提交评价
- POST `/order/after-sales` - 申请售后

### 陪诊师接口
- GET `/companion/profile` - 获取陪诊师信息
- GET `/companion/orders` - 获取订单列表
- POST `/companion/orders/:id/accept` - 接单
- POST `/companion/orders/:id/start` - 开始服务
- POST `/companion/orders/:id/complete` - 完成服务

### 公共接口
- GET `/common/banners` - 获取Banner列表
- GET `/common/cities` - 获取城市列表
- GET `/common/hospitals` - 获取医院列表
- GET `/common/services` - 获取服务类型列表
- GET `/common/faqs` - 获取常见问题

## 默认账号

### 管理员
- 用户名：admin
- 密码：admin123

### 测试用户
- 手机号：13800138000
- 验证码：123456

## 注意事项

1. 请确保已安装 Node.js (v16+) 和 MySQL (v5.7+)
2. 首次运行需要初始化数据库
3. 微信小程序需要在微信公众平台配置服务器域名
4. 生产环境请修改默认密码和密钥
