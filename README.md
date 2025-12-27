<h4 align="right" ><a href="./README.en.md">English</a> | <strong>简体中文</strong></h4>

## 🌟 项目介绍

NocoZen(仟伯零代码软件搭建平台)是一个基于 Vue3 和 Node.js 构建的零代码/低代码 Web 应用搭建平台，旨在为用户提供即开即用快速搭建各类业务系统的解决方案。

如果您既想要拥有明道云、简道云这样成熟产品的即开即用的用户体验，又想要打造完全属于自己的零代码开发平台，从零开始成本又太高，如果是企业用户想要实现可审计、源代码可掌控、数据主权可掌控，那么基于该开源项目打造自己的零代码软件平台是您唯一适合的选项，可以为您提供了一个完美的起点，既能够实现即开即用的可视化搭建，又无需从零开发就能快速上线业务系统，无论是想要搭建内部管理系统，还是想要打造自己的SaaS平台，NocoZen都是你理想的选择。

部分界面截图展示：

<a href="./docs/images/workbench.jpg">【工作台示例】</a>    <a href="./docs/images/board.jpg">【仪表盘示例】</a>     <a href="./docs/images/form-editor.jpg">【表单设计界面示例】</a>     <a href="./docs/images/flow-editor.jpg">【流程设计界面示例】</a>     <a href="./docs/images/board-editor-gantt.jpg">【仪表盘甘特图示例】</a>    <a href="./docs/images/board-pivottable.jpg">【仪表盘透视表示例】</a>       <a href="./docs/images/board-calender.jpg">【仪表盘日历图示例】</a>


👉 如果这个项目对您有帮助，请点个 ⭐️ 支持我们！每一个Star都是我们持续迭代的动力～

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

初始化登录:

账户：qbone   初始密码：qianbone.com

登录后打开初始化参数设置界面修改MongoDB数据库配置，修改完成后重启服务即可。首次登录系统需要先注册企业信息和创建者账户，注册成功后用创建者账户登录即可使用。管理员可以修改管理员密码，下次登录初始化设置界面需要使用新密码。如果遗忘密码可以删除qb-config.json配置文件重新运行系统重新配置初始化参数即可。

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
- 📍 支持多语言
- 📍 模板市场
- 📍 插件市场
...

### 首发感言 2025.12.24

本项目最初的创建目的是希望能提供一个需要类似明道云、简道云这样的商业产品私有化部署的一个低成本构建替代方案，开发也持续了2年多的时间，经历了一次大的框架重构，虽然不是全职投入，但是也耗费了开发者主要的精力和时间投入，项目还不完美，还需要更多的努力投入，希望有更多的企业、开发者共同参与，共建社区共同参与实现更完美的目标，或许给使用该项目的个人和企业带来实实在在的商业价值才是真完美；在就业形势比较严峻的当下，尤其是毕业生和大龄程序员群体尤为困难，希望该项目可以作为学习全栈开发的一个完整案例，或者兼职副业或创业提供快速交付项目的加速引擎；也希望企业能基于该项目构建自己的软件一体化搭建平台，实现软件的自主可控，掌握数据主权；项目团队后续会基于该项目提供一系列培训课程，以此提供适合独立开发者的全栈快速开发所需的必要知识和技能，满足后续持续定制开发所需。

## 🌐 仓库镜像说明

本项目**主仓库托管于 GitHub**，并自动同步至 **Gitee 镜像仓库**，以便中国大陆用户快速访问。

- **主站（GitHub）**: https://github.com/nocozen/nocozen
- **镜像（Gitee）**: https://gitee.com/nocozen/nocozen

> ⚠️ 所有 Issue、Pull Request 及讨论请提交至 **GitHub 主仓库**。Gitee 仅为只读镜像。


## 📢 交流与问题反馈微信

<img src="docs/images/laoqin.jpg" width="100" />

## 📮 交流与问题反馈邮箱：qb@qianbone.com

## 📄 开源许可证

[![Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)


