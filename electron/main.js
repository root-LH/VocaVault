const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const { spawn, fork } = require('child_process');
const fs = require('fs');

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
let mainWindow = null;
let serverProcess = null;

// --- Logging Setup ---
const logPath = path.join(app.getPath('userData'), 'app.log');

function log(message) {
  try {
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} [${process.type}] ${message}\n`;
    fs.appendFileSync(logPath, logMessage);
    if (isDev) console.log(message);
  } catch (error) {
    console.error('Failed to write log:', error);
  }
}

// Clear log on startup
if (fs.existsSync(logPath)) {
  fs.writeFileSync(logPath, '');
}

log(`App starting... isDev: ${isDev}`);

// --- Database Setup ---
const dbName = 'vocavault.db';
const projectPrismaPath = isDev ? path.join(app.getAppPath(), 'prisma') : path.join(process.resourcesPath, 'prisma');
const devDbPath = path.join(projectPrismaPath, dbName);
const prodDbPath = path.join(app.getPath('userData'), dbName);
const dbPath = isDev ? devDbPath : prodDbPath;
const formattedDbPath = dbPath.replace(/\\/g, '/');
process.env.DATABASE_URL = `file:${formattedDbPath}`;

// --- Prisma Engine Setup ---
const prismaEnginesPath = isDev 
  ? path.join(app.getAppPath(), 'node_modules', '@prisma', 'engines')
  : path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', '@prisma', 'engines');

process.env.PRISMA_QUERY_ENGINE_LIBRARY = path.join(prismaEnginesPath, 'query_engine-windows.dll.node');
process.env.PRISMA_SCHEMA_ENGINE_BINARY = path.join(prismaEnginesPath, 'schema-engine-windows.exe');

async function ensureDatabase() {
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

  // Only run migrations if we are in dev OR if the DB was just created OR if schema changed (optional)
  // For simplicity, we can always run migrations but try to do it faster.
  // Actually, 'db push' is quite heavy. Let's see if we can skip it if the DB exists in production.
  // But schema changes might happen during updates.
  await runMigrations();
}

async function runMigrations() {
  let prismaPath;
  try {
    prismaPath = require.resolve('prisma/build/index.js');
  } catch (e) {
    prismaPath = isDev 
      ? path.join(app.getAppPath(), 'node_modules', 'prisma', 'build', 'index.js')
      : path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', 'prisma', 'build', 'index.js');
  }

  const schemaPath = isDev 
    ? path.join(app.getAppPath(), 'prisma', 'schema.prisma')
    : path.join(process.resourcesPath, 'prisma', 'schema.prisma');

  if (!fs.existsSync(prismaPath)) {
    log(`Prisma path not found: ${prismaPath}`);
    return; // Skip if prisma tool is missing
  }
  
  return new Promise((resolve) => {
    const migrateProcess = fork(prismaPath, ['db', 'push', '--schema', schemaPath, '--accept-data-loss', '--skip-generate'], {
      env: { ...process.env },
      silent: true,
    });

    migrateProcess.on('close', (code) => {
      log(`Prisma migrations finished with code ${code}`);
      resolve();
    });
    
    // Safety timeout
    setTimeout(resolve, 10000);
  });
}

function launchDevServer() {
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  serverProcess = spawn(npmCmd, ['run', 'dev'], { stdio: 'pipe' });

  serverProcess.stdout.on('data', (data) => {
    if (data.toString().includes('ready in')) {
      checkServerReady();
    }
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
        log(`Server file not found at ${serverPath}`);
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

    checkServerReady();
}

function checkServerReady() {
  const { net } = require('electron');
  const check = () => {
    const request = net.request('http://localhost:3000');
    request.on('response', (response) => {
      if (response.statusCode === 200) {
        if (mainWindow) {
            mainWindow.loadURL('http://localhost:3000');
        }
      } else {
        setTimeout(check, 200);
      }
    });
    request.on('error', () => {
      setTimeout(check, 200);
    });
    request.end();
  };
  check();
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false, // Don't show immediately to prevent flicker
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'splash.html'));
  
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  if (!isDev) mainWindow.setMenuBarVisibility(false);
  mainWindow.on('closed', () => (mainWindow = null));
}

function killServer() {
  if (serverProcess) {
    try {
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
  createWindow();
  
  try {
    // Start server and DB setup in background
    if (isDev) {
      launchDevServer();
    } else {
      launchProdServer();
    }
    
    // DB setup might take time, but the server can start in parallel
    // (though Next.js might error if API is called before DB is ready)
    await ensureDatabase();
    
  } catch (e) {
    log(`Init error: ${e.message}`);
  }
});

app.on('window-all-closed', () => {
  killServer();
  app.quit();
});

app.on('will-quit', () => {
  killServer();
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
