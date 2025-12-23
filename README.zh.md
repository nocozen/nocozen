<h4 align="right"><strong>English</strong> | <a href="./README.md">简体中文</a></h4>

## 🌟 项目介绍

仟伯零代码软件搭建平台是一个基于 Vue3 和 Node.js 构建的现代化 Web 应用程序，旨在为用户提即开即用快速搭建各类业务系统的解决方案

## 🚀 核心优势

### 1. “零代码”搭建
- 平台提供自研的表单设计器、流程设计器、报表设计器、应用定制功能均通过鼠标拖拽配置，定制功能灵活易用

### 2. 极致性能
- 平台从前端到后端各个层次都优选了同类型中最高性能的技术做优化，系统操作顺滑，数据交互快速响应

### 3. 安全可靠
- 平台数据传输和保存采用高安全冗余设计，各层次的数据都采用了高可靠的加解密算法保护数据安全

### 4. 极简技术架构
- 前后端统一使用一种开发语言和开发环境，技术复用度高，代码精简，能够快速迭代响应客户需求

## 🛠️ 技术栈

- Vue3 + TypeScript
- Vite
- Naive UI
- Pinia
- Vue Router
- UnoCSS
- soybean-admin
- d3.js
- VisActor/VTable
- ...


## 📦 快速开始

## 环境要求

- Node.js >= 20.0.0
- pnpm >= 10.0.0

### 开发环境

1、启动NocoZenBase服务端

参考NocoZenBase文档操作，确保服务启动正常。

2、安装依赖

```bash
pnpm install
```

3、启动开发服务器：

```bash
pnpm dev
```

注意【.env.test】中的端口和服务器端口一致。

4、初始化配置

初始化登录：

![初始化登录](/docs/images/init-login.png)

账户：qbone   初始密码：qianbone.com

登录后打开初始化参数设置界面：

![初始化登录](/docs/images/init-config.png)

修改MongoDB数据库配置，修改完成后重启服务即可。首次登录系统需要先注册企业信息和创建者账户，注册成功后用创建者账户登录即可使用。管理员可以修改管理员密码，下次登录初始化设置界面需要使用新密码。如果遗忘密码可以删除qb-config.json配置文件重新运行系统重新配置初始化参数即可。

## 📁 项目结构

```
.
├── packages/               # Monorepo 包
│   ├── alova/              # Alova 库封装
│   ├── color/              # 颜色工具
│   ├── hooks/              # 自定义钩子
│   ├── materials/          # 材料组件
│   ├── ofetch/             # Ofetch 封装
│   ├── scripts/            # 脚本和命令
│   ├── uno-preset/         # UnoCSS 预设
│   └── utils/              # 工具函数
├── src/                    # 主源代码
│   ├── components/         # 可复用组件
│   ├── constants/          # 常量定义
│   ├── enum/               # 枚举类型
│   ├── hooks/              # 业务和通用钩子
│   ├── layouts/            # 页面布局
│   ├── localdb/            # 本地数据库助手
│   ├── locales/            # 国际化文件
│   ├── plugins/            # 插件配置
│   ├── router/             # 路由配置
│   ├── service/            # API 服务
│   ├── store/              # Pinia 状态存储
│   ├── styles/             # 样式文件
│   ├── theme/              # 主题配置
│   ├── typings/            # TypeScript 声明
│   ├── utils/              # 工具函数
│   ├── views/              # 页面视图
│   ├── App.vue             # 根组件
│   └── main.ts             # 入口文件
├── index.html              # HTML 模板
├── vite.config.ts          # Vite 配置
├── tsconfig.json           # TypeScript 配置
├── uno.config.ts           # UnoCSS 配置
└── package.json            # 项目清单
```

## ✨ 主要功能

### 已实现功能

- ✅ 表单定制
- ✅ 图表报表定制(常用图表类型及日历图、甘特图、透视表、明细表)
- ✅ 工作流定制（支持并行会签、顺序会签、或签）
- ✅ 系统及权限管理相关功能
- ✅ 数据同步
- ✅ 日志记录
...

### 计划开发功能

- 📍 PostgreSQL数据库支持
- 📍 Minio、OSS、S3对象存储支持
- 📍 AI数字员工
- 📍 AI知识库管理
- 📍 AI数据智能分析
- 📍 英语国际化支持
...

## 📄 许可证

[![AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)


