## 发布包文件说明

```
.
├── web/                    # 前端资源文件
├── .env                    # web配置
├── index.js                # 服务器入口文件
├── worker.js               # 服务器模块
├── uws_win32_x64_127.node  # 服务器模块
├── node.exe / node         # 服务器运行环境 node.js, 自己安装node.js运行环境就不需要这个了
├── qb-config.json          # Mongodb数据库配置文件（启动项目时自动创建）
├── qblogs                  # 系统日志文件（启动项目时自动创建）
└── run.bat / run.sh        # 启动脚本文件，默认使用当前路径下的node.js，使用自己安装的node.js环境要修改下
```

## 安装部署步骤

1、将发布包解压到指定位置

2、运行启动脚本 run.bat 或 run.sh

3、终端窗口会提示：

MongoDB is not accessible, restart the service after configuration is correct

Webserver started on port 8000

4、浏览器登录数据库配置界面

 - 地址：http://localhost:8000/init
 - 初始账户：qbone
 - 密码：qianbone.com

5、打开配置界面后配置Mongodb ip、端口、库名、账户和密码；对应qb-config.json中的配置项

 - "MONGO_IP": "127.0.0.1",
 - "MONGO_PORT": "27017",
 - "MONGO_USERNAME": "xxxxxx",
 - "MONGO_PASSWORD": "xxxxxx",
 - "MONGO_MAINDB": "xxx",

6、重新启动服务器，MongoDB不再报错说明启动正常了；

7、浏览器访问系统登录页：http://localhost:8000

8、首次使用需要先注册，注册完成后使用注册的账户登录即可。


## 修改源码后基于如下步骤部署：

一、nocozenbase（后端项目）根路径下执行：

npm install

npm run build

注意：不要使用 pnmp 而是使用 npm

二、 nocozen（前端项目）根路径下执行

pnpm install

pnpm run build

三、此时nocozenbase根路径dist下会生成以下目录：

```
.
├── web/                    # 前端资源文件
├── .env                    # web配置
├── index.js                # 服务器入口文件
├── worker.js               # 服务器模块
├── uws_win32_x64_127.node  # 服务器模块
└── run.bat / run.sh        # 启动脚本文件，默认使用当前路径下的node.js，使用自己安装的node.js环境要修改下
```

node.js环境部署时需要自己安装，或者将node执行文件复制到dist根路径下。

