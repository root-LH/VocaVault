const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
let mainWindow = null;

// --- Logging Setup ---
const logPath = path.join(app.getPath('userData'), 'app.log');

function log(message) {
  try {
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} [${process.type}] ${message}\n`;
    fs.appendFileSync(logPath, logMessage);
    // Also log to console for terminal visibility
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
log(`UserData path: ${app.getPath('userData')}`);
// --- End Logging Setup ---

// --- Database Setup ---
const dbName = 'vocavault.db';
const projectPrismaPath = isDev ? path.join(app.getAppPath(), 'prisma') : path.join(process.resourcesPath, 'prisma');
const devDbPath = path.join(projectPrismaPath, dbName);
const prodDbPath = path.join(app.getPath('userData'), dbName);
const dbPath = isDev ? devDbPath : prodDbPath;
process.env.DATABASE_URL = `file:${dbPath.replace(/\\/g, '\\\\')}`;

log(`Database path: ${dbPath}`);

// In production, copy the DB from the app resources if it doesn't exist in user data
if (!isDev && !fs.existsSync(dbPath)) {
  const templateDbPath = path.join(projectPrismaPath, 'dev.db');
  if (fs.existsSync(templateDbPath)) {
    try {
      fs.copyFileSync(templateDbPath, dbPath);
      log('Copied database template to user data.');
    } catch (e) {
      log(`Error copying DB template: ${e.message}`);
    }
  } else {
    log('Template DB not found at ' + templateDbPath);
  }
}
// --- End of Database Setup ---


function runMigrations() {
  const { fork } = require('child_process');
  // Using the prisma executable that's unpacked from asar
  const prismaPath = isDev 
    ? path.join(app.getAppPath(), 'node_modules', 'prisma', 'build', 'index.js')
    : path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', 'prisma', 'build', 'index.js');

  const schemaPath = isDev 
    ? path.join(app.getAppPath(), 'prisma', 'schema.prisma')
    : path.join(process.resourcesPath, 'prisma', 'schema.prisma');
  
  log(`Running migrations with DB at: ${dbPath}`);
  
  const migrateProcess = fork(prismaPath, ['db', 'push', '--schema', schemaPath], {
    env: { ...process.env },
    silent: true,
  });

  return new Promise((resolve, reject) => {
    let stderr = '';
    migrateProcess.stdout.on('data', (data) => log(`Migration log: ${data}`));
    migrateProcess.stderr.on('data', (data) => {
      stderr += data.toString();
      log(`Migration error: ${data}`);
    });

    migrateProcess.on('close', (code) => {
      if (code === 0) {
        log('Prisma migrations applied successfully.');
        resolve();
      } else {
        log(`Prisma migrations failed with code ${code}`);
        reject(new Error(`Prisma migrations failed. Details: \n${stderr}`));
      }
    });
  });
}

function launchDevServer() {
  const nextProcess = spawn('npm.cmd', ['run', 'dev'], { stdio: 'pipe' });

  nextProcess.stdout.on('data', (data) => {
    console.log(`Next.js: ${data}`);
    if (data.toString().includes('ready in')) {
      if (!mainWindow) createWindow();
    }
  });

  nextProcess.stderr.on('data', (data) => {
    console.error(`Next.js Error: ${data}`);
  });

  app.on('quit', () => nextProcess.kill());
}

function launchProdServer() {
    const { fork } = require('child_process');
    // Determine the path to the server.
    // When packaged, we use extraResources, so the server is in resources/standalone
    let serverPath;
    if (app.isPackaged) {
        serverPath = path.join(process.resourcesPath, 'standalone', 'server.js');
    } else {
        serverPath = path.join(app.getAppPath(), '.next/standalone/server.js');
    }
    
    log(`Launching Next.js server from: ${serverPath}`);

    if (!fs.existsSync(serverPath)) {
        log(`CRITICAL ERROR: Server file not found at ${serverPath}`);
        dialog.showErrorBox('Startup Error', `Server file not found at:\n${serverPath}\n\nPlease reinstall the application.`);
        return;
    }

    const prodServerProcess = fork(serverPath, [], {
        env: {
            ...process.env,
            PORT: '3000',
            HOSTNAME: 'localhost', // Explicitly set hostname
        },
        silent: true,
    });

    prodServerProcess.stdout.on('data', (data) => log(`Server: ${data}`));
    prodServerProcess.stderr.on('data', (data) => log(`Server Error: ${data}`));

    prodServerProcess.on('exit', (code, signal) => {
        log(`Next.js server process exited with code ${code} and signal ${signal}`);
        if (code !== 0) {
             dialog.showErrorBox('Server Error', `The application server stopped unexpectedly (Code: ${code}).\nCheck ${logPath} for details.`);
        }
    });
    
    prodServerProcess.on('error', (err) => {
        log(`Failed to spawn server process: ${err.message}`);
        dialog.showErrorBox('Server Start Error', `Failed to start server process:\n${err.message}`);
    });

    app.on('quit', () => {
        log('App quitting, killing server process...');
        prodServerProcess.kill();
    });

    // Start polling for the server
    checkServerReady();
}

let checkServerRetries = 0;
const MAX_RETRIES = 60; // 30 seconds (60 * 500ms)

function checkServerReady() {
  const { net } = require('electron');
  const request = net.request('http://localhost:3000');

  request.on('response', (response) => {
    log(`Server responded with status: ${response.statusCode}`);
    if (response.statusCode === 200) {
        log('Server is ready! Creating window...');
        if (!mainWindow) createWindow();
    } else {
        // Retry if not 200 (though usually it is 200 if connected)
        log(`Server not ready (Status ${response.statusCode}), retrying...`);
        retryServerCheck();
    }
  });

  request.on('error', (error) => {
    // Server not ready yet
    // log(`Server check failed: ${error.message}`); // Too noisy
    retryServerCheck();
  });

  request.end();
}

function retryServerCheck() {
    checkServerRetries++;
    if (checkServerRetries > MAX_RETRIES) {
        log('Server failed to start within timeout.');
        dialog.showErrorBox('Startup Timeout', 'The application server failed to start within the expected time.\nCheck logs for details.');
        return;
    }
    setTimeout(checkServerReady, 500);
}

function createWindow() {
  log('Creating main window...');
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
  
  // In production, remove menu bar for cleaner look, or keep it.
  if (!isDev) mainWindow.setMenuBarVisibility(false);
  
  if (isDev) mainWindow.webContents.openDevTools();
  
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
      log(`Failed to load window content: ${errorDescription} (${errorCode})`);
  });

  mainWindow.on('closed', () => (mainWindow = null));
}

app.whenReady().then(async () => {
  log('App ready event fired.');
  try {
    if (isDev) {
      await runMigrations();
      launchDevServer();
    } else {
      launchProdServer();
    }
  } catch (e) {
    dialog.showErrorBox('App Initialization Error', e.stack || e.toString());
    log(`Failed to initialize app: ${e.stack}`);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
