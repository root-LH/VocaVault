const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const { spawn, fork } = require('child_process');
const fs = require('fs');

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
let mainWindow = null;
let serverProcess = null; // Next.js 서버 프로세스를 전역으로 관리

// --- Logging Setup ---
const logPath = path.join(app.getPath('userData'), 'app.log');

function log(message) {
  try {
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} [${process.type}] ${message}\n`;
    fs.appendFileSync(logPath, logMessage);
    console.log(message);
  } catch (error) {
    console.error('Failed to write log:', error);
  }
}

// Clear log on startup
if (fs.existsSync(logPath)) {
  fs.writeFileSync(logPath, '');
}

log(`App starting... isDev: ${isDev}`);
// --- End Logging Setup ---

// --- Database Setup ---
const dbName = 'vocavault.db';
const projectPrismaPath = isDev ? path.join(app.getAppPath(), 'prisma') : path.join(process.resourcesPath, 'prisma');
const devDbPath = path.join(projectPrismaPath, dbName);
const prodDbPath = path.join(app.getPath('userData'), dbName);
const dbPath = isDev ? devDbPath : prodDbPath;
// Prisma URL for SQLite on Windows needs special formatting
const formattedDbPath = dbPath.replace(/\\/g, '/');
process.env.DATABASE_URL = `file:${formattedDbPath}`;

// --- Prisma Engine Setup (ASAR Unpacked) ---
const prismaEnginesPath = isDev 
  ? path.join(app.getAppPath(), 'node_modules', '@prisma', 'engines')
  : path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', '@prisma', 'engines');

const queryEnginePath = path.join(prismaEnginesPath, 'query_engine-windows.dll.node');
const schemaEnginePath = path.join(prismaEnginesPath, 'schema-engine-windows.exe');

process.env.PRISMA_QUERY_ENGINE_LIBRARY = queryEnginePath;
process.env.PRISMA_SCHEMA_ENGINE_BINARY = schemaEnginePath;

log(`Prisma Query Engine Path: ${queryEnginePath}`);
log(`Prisma Schema Engine Path: ${schemaEnginePath}`);
// --- End Prisma Engine Setup ---

if (!isDev && !fs.existsSync(dbPath)) {
  const templateDbPath = path.join(projectPrismaPath, 'dev.db');
  if (fs.existsSync(templateDbPath)) {
    try {
      fs.copyFileSync(templateDbPath, dbPath);
      log(`Copied template DB to ${dbPath}`);
    } catch (e) {
      log(`Error copying DB template: ${e.message}`);
    }
  }
}

async function runMigrations() {
  let prismaPath;
  try {
    prismaPath = require.resolve('prisma/build/index.js');
  } catch (e) {
    // fallback for packaged app
    prismaPath = isDev 
      ? path.join(app.getAppPath(), 'node_modules', 'prisma', 'build', 'index.js')
      : path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', 'prisma', 'build', 'index.js');
  }

  const schemaPath = isDev 
    ? path.join(app.getAppPath(), 'prisma', 'schema.prisma')
    : path.join(process.resourcesPath, 'prisma', 'schema.prisma');
  
  log(`Prisma Path: ${prismaPath}`);
  log(`Schema Path: ${schemaPath}`);

  if (!fs.existsSync(prismaPath)) {
    log(`Prisma path not found: ${prismaPath}`);
    throw new Error('Database migration tool missing.');
  }
  
  const migrateProcess = fork(prismaPath, ['db', 'push', '--schema', schemaPath, '--accept-data-loss'], {
    env: { ...process.env },
    silent: true,
  });

  return new Promise((resolve, reject) => {
    let output = '';
    migrateProcess.stdout.on('data', (data) => {
      output += data.toString();
    });
    migrateProcess.stderr.on('data', (data) => {
      output += data.toString();
    });

    migrateProcess.on('close', (code) => {
      if (code === 0) {
        log('Prisma migrations successful');
        resolve();
      } else {
        log(`Prisma migrations failed with code ${code}. Output: ${output}`);
        reject(new Error(`Prisma migrations failed with code ${code}`));
      }
    });
  });
}

function launchDevServer() {
  // Windows에서는 npm.cmd, macOS/Linux에서는 npm
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  serverProcess = spawn(npmCmd, ['run', 'dev'], { stdio: 'pipe' });

  serverProcess.stdout.on('data', (data) => {
    if (data.toString().includes('ready in')) {
      if (!mainWindow) createWindow();
    }
  });

  serverProcess.on('error', (err) => {
    log(`Dev server error: ${err.message}`);
  });
}

function launchProdServer() {
    let serverPath;
    if (app.isPackaged) {
        serverPath = path.join(process.resourcesPath, 'standalone', 'server.js');
    } else {
        serverPath = path.join(app.getAppPath(), '.next/standalone/server.js');
    }
    
    if (!fs.existsSync(serverPath)) {
        dialog.showErrorBox('Startup Error', `Server file not found at ${serverPath}`);
        return;
    }

    const serverDir = path.dirname(serverPath);
    serverProcess = fork(serverPath, [], {
        env: {
            ...process.env,
            PORT: '3000',
            HOSTNAME: 'localhost',
        },
        cwd: serverDir,
        silent: true,
    });

    serverProcess.on('exit', (code, signal) => {
        log(`Next.js server exited with code ${code}`);
    });

    checkServerReady();
}

function checkServerReady() {
  const { net } = require('electron');
  const request = net.request('http://localhost:3000');

  request.on('response', (response) => {
    if (response.statusCode === 200) {
        if (!mainWindow) createWindow();
    } else {
        setTimeout(checkServerReady, 500);
    }
  });

  request.on('error', () => {
    setTimeout(checkServerReady, 500);
  });

  request.end();
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadURL('http://localhost:3000');
  if (!isDev) mainWindow.setMenuBarVisibility(false);
  mainWindow.on('closed', () => (mainWindow = null));
}

// 종료 시 프로세스 확실하게 죽이기
function killServer() {
  if (serverProcess) {
    log('Killing server process...');
    try {
      // Windows의 경우 트리 구조로 죽여야 할 수도 있음
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', serverProcess.pid, '/f', '/t']);
      } else {
        serverProcess.kill('SIGTERM');
      }
    } catch (e) {
      log(`Error killing server: ${e.message}`);
    }
    serverProcess = null;
  }
}

app.whenReady().then(async () => {
  try {
    // 개발/배포 환경 상관없이 항상 DB 마이그레이션(구조 업데이트) 실행
    await runMigrations();
    
    if (isDev) {
      launchDevServer();
    } else {
      launchProdServer();
    }
  } catch (e) {
    log(`Init error: ${e.message}`);
    app.quit();
  }
});

// 모든 창이 닫히면 앱 종료 (macOS 포함)
app.on('window-all-closed', () => {
  log('All windows closed, killing server and quitting...');
  killServer();
  app.quit();
});

// 앱이 종료될 때 서버 프로세스 정리
app.on('will-quit', () => {
  killServer();
});

// 앱이 완전히 종료되기 직전에 마지막으로 프로세스 정리
app.on('before-quit', () => {
  killServer();
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// 예기치 못한 종료 시에도 정리 시도
process.on('exit', () => {
  killServer();
});
