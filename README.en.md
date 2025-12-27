<h4 align="right"><a href="./README.md">简体中文</a> | <strong>English</strong></h4>

## 🌟 Project Introduction

NocoZen (Qianbo No-Code Software Building Platform) is a nocode/low-code web application building platform built with Vue3 and Node.js, designed to provide users with an out-of-the-box solution for quickly building various business systems.

If you want to have the out-of-the-box user experience of mature products like Mingdao Cloud and Jiandao Cloud, but want to build your own completely custom no-code development platform, and find starting from scratch too costly, and as an enterprise user, you also want to achieve auditability, source code controllability, and data sovereignty, then building your own no-code software platform based on this open-source project is your only suitable option, providing you with a perfect starting point. It enables both out-of-the-box visual construction, and allows for rapid business system launch without starting from scratch. Whether you want to build internal management systems, or want to build your own SaaS platform, NocoZen is your ideal choice.

Here are some screenshots of the interface:

<a href="./docs/images/workbench.jpg">【Workbench Example】</a>    <a href="./docs/images/board.jpg">【Dashboard Example】</a>     <a href="./docs/images/form-editor.jpg">【Form Design Interface Example】</a>     <a href="./docs/images/flow-editor.jpg">【Workflow Design Interface Example】</a>     <a href="./docs/images/board-editor-gantt.jpg">【Dashboard Gantt Chart Example】</a>    <a href="./docs/images/board-pivottable.jpg">【Dashboard Pivot Table Example】</a>       <a href="./docs/images/board-calender.jpg">【Dashboard Calendar Chart Example】</a>

👉 If this project is helpful to you, please give it a ⭐️ to support us! Every Star is motivation for us to iterate continuously ~

## 🚀 Core Advantages

### 1. "No-Code" Building
- The platform provides self-developed form designer, workflow designer, report designer, and application customization functions, all configurable through drag-and-drop operations. The customization features are flexible and easy to use.

### 2. Ultimate Performance
- The platform optimizes performance at all levels from frontend to backend by selecting the highest-performing technologies in each category, ensuring smooth system operation and fast response to data interactions.

### 3. Security and Reliability
- Platform data transmission and storage adopt high-security redundant designs. Data at all levels is protected by highly reliable encryption and decryption algorithms to ensure data security.

### 4. Minimalist Technical Architecture
- Unified development language and environment for both frontend and backend, high technical reuse, concise code, and rapid iteration to respond to customer needs.

## 🛠️ Tech Stack

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

## 📦 Quick Start

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 10.0.0

### Development Environment

1. Start the NocoZenBase server side

Refer to the NocoZenBase documentation for operation, ensuring the service starts properly.

2. Install dependencies

```bash
pnpm install
```

3. Start the development server:

```bash
pnpm dev
```

Note that the port in [.env.test] should be consistent with the server port.

4. Initial Configuration

Initial Login:

Account: qbone   Initial Password: qianbone.com

After logging in, Modify the MongoDB database configuration. After modification, restart the service. For the first login to the system, you need to register enterprise information and creator account. After successful registration, log in with the creator account to use the system. Administrators can change the administrator password. The next time you log in to the initialization settings page, you need to use the new password. If you forget the password, you can delete the qb-config.json configuration file, re-run the system, and reconfigure the initialization parameters.

## 📁 Project Structure

```
.
├── packages/               # Monorepo packages
│   ├── alova/              # Alova library wrapper
│   ├── color/              # Color utilities
│   ├── hooks/              # Custom hooks
│   ├── materials/          # Material components
│   ├── ofetch/             # Ofetch wrapper
│   ├── scripts/            # Scripts and commands
│   ├── uno-preset/         # UnoCSS presets
│   └── utils/              # Utility functions
├── src/                    # Main source code
│   ├── components/         # Reusable components
│   ├── constants/          # Constant definitions
│   ├── enum/               # Enumerations
│   ├── hooks/              # Business and common hooks
│   ├── layouts/            # Page layouts
│   ├── localdb/            # Local database helpers
│   ├── locales/            # Internationalization files
│   ├── plugins/            # Plugin configurations
│   ├── router/             # Routing configurations
│   ├── service/            # API services
│   ├── store/              # Pinia stores
│   ├── styles/             # Style files
│   ├── theme/              # Theme configurations
│   ├── typings/            # TypeScript declarations
│   ├── utils/              # Utility functions
│   ├── views/              # Page views
│   ├── App.vue             # Root component
│   └── main.ts             # Entry point
├── index.html              # HTML template
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript configuration
├── uno.config.ts           # UnoCSS configuration
└── package.json            # Project manifest
```

## ✨ Main Features

### Implemented Features

- ✅ Form customization
- ✅ Chart and report customization (common chart types and calendar charts, Gantt charts, pivot tables, detail tables)
- ✅ Workflow customization (supporting parallel approval, sequential approval, and OR approval)
- ✅ System and permission management related functions
- ✅ Data synchronization
- ✅ Log recording
...

### Planned Development Features

- 📍 PostgreSQL database support
- 📍 Minio, OSS, S3 object storage support
- 📍 AI digital employee
- 📍 AI knowledge base management
- 📍 AI intelligent data analysis
- 📍 Supports multiple languages
...

### Launch Reflection 2025.12.24

The development of this project has continued for more than 2 years, experiencing a major framework refactoring. Although not full-time investment, it has consumed the main energy and time of the developers, and the project is still not perfect, requiring more effort. We hope that more enterprises and developers will participate together, building a community to achieve a more perfect goal, perhaps the real perfection is to bring real commercial value to individuals and enterprises using this project; in the current challenging employment situation, especially for graduates and senior programmer groups who are particularly difficult, it is hoped that this project can serve as a complete case for learning full-stack development, or as an acceleration engine for part-time jobs, side businesses or entrepreneurship to provide quick delivery projects; it is also hoped that enterprises can build their own integrated software building platforms based on this project, achieving software autonomy and control over data sovereignty; the project team will subsequently provide a series of training courses based on this project, providing the necessary knowledge and skills for full-stack rapid development suitable for independent developers, to meet the needs of subsequent continuous custom development.

## 🌐 Repository Mirrors

The canonical source of this project is hosted on **GitHub**. A read-only mirror is maintained on **Gitee** to provide faster access for users in mainland China.

- **Main (GitHub)**: https://github.com/nocozen/nocozen
- **Mirror (Gitee)**: https://gitee.com/nocozen/nocozen

> 🔔 Please submit all issues, pull requests, and discussions on **GitHub**. The Gitee repository is a mirror.

## 📄 License

[![Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
