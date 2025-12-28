## Release Package File Description

```
.
├── web/                    # Frontend resource files
├── .env                    # Web configuration
├── index.js                # Server entry file
├── worker.js               # Server module
├── uws_win32_x64_127.node  # Server module
├── node.exe / node         # Server runtime environment node.js, you don't need this if you install node.js runtime environment yourself
├── qb-config.json          # Mongodb database configuration file (automatically created when starting the project)
├── qblogs                  # System log files (automatically created when starting the project)
└── run.bat / run.sh        # Startup script file, uses node.js in the current path by default, modify if using your own installed node.js environment
```

## Installation and Deployment Steps

1. Extract the release package to the specified location

2. Run the startup script run.bat or run.sh

3. The terminal window will prompt:

MongoDB is not accessible, restart the service after configuration is correct

Webserver started on port 8000

4. Access the database configuration interface through browser

 - Address: http://localhost:8000/init
 - account: qbone
 - Initial Password: qianbone.com

5. After opening the configuration interface, configure the Mongodb IP, port, database name, account and password; corresponding to the configuration items in qb-config.json

 - "MONGO_IP": "127.0.0.1",
 - "MONGO_PORT": "27017",
 - "MONGO_USERNAME": "xxxxxx",
 - "MONGO_PASSWORD": "xxxxxx",
 - "MONGO_MAINDB": "xxx",

6. Restart the server, if MongoDB no longer reports errors, the startup is normal;

7. Access the system login page through browser: http://localhost:8000

8. For first-time use, registration is required. After registration, you can log in with the registered account.

## Deploy after modifying source code following these steps:

I. Execute in the root path of nocozenbase (backend project):

npm install

npm run build

Note: Use npm instead of pnpm

II. Execute in the root path of nocozen (frontend project)

pnpm install

pnpm run build

III. At this point, the following directories will be generated under dist in the nocozenbase root path:

```
.
├── web/                    # Frontend resource files
├── .env                    # Web configuration
├── index.js                # Server entry file
├── worker.js               # Server module
├── uws_win32_x64_127.node  # Server module
└── run.bat / run.sh        # Startup script file, uses node.js in the current path by default, modify if using your own installed node.js environment
```

The node.js environment needs to be installed separately when deploying, or copy the node executable file to the dist root path.
