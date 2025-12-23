<h4 align="right"><a href="./README.zh.md">简体中文</a> | <strong>English</strong></h4>

## 🌟 Project Introduction

Nocozens is a modern web application built with Vue3 and Node.js, designed to provide users with an out-of-the-box solution for quickly building various business systems.

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

![Initial Login](/docs/images/init-login.png)

Account: qbone   Initial Password: qianbone.com

After logging in, the initialization parameter setting interface will open:

![Initial Config](/docs/images/init-config.png)

Modify the MongoDB database configuration. After modification, restart the service. For the first login to the system, you need to register enterprise information and creator account. After successful registration, log in with the creator account to use the system. Administrators can change the administrator password. The next time you log in to the initialization settings page, you need to use the new password. If you forget the password, you can delete the qb-config.json configuration file, re-run the system, and reconfigure the initialization parameters.

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
- 📍 English internationalization support
...

## 📄 License

[![AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
