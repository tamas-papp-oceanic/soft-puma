// Modules to control application life and create native browser window
const { app, BrowserWindow, dialog, ipcMain, MessageChannelMain } = require('electron');
const path = require('path');
const serve = require('electron-serve');
const loadURL = serve({ directory: 'public' });

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function isDev() {
  return !app.isPackaged;
}

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 720,
    frame: false,
    minWidth: 720,
    useContentSize: true,
    webPreferences: {
      nodeIntegration: true,
      // nodeIntegrationInWorker: true,
      enableRemoteModule: true,
      // contextIsolation: false
      preload: path.join(isDev() ? process.cwd() : __dirname, 'preload.js'),
    },
    // Use this in development mode.
    icon: path.join(isDev() ? process.cwd() : __dirname, 'public/favicon.png'),
    // Use this in production mode.
    // icon: path.join(__dirname, 'public/favicon.png'),
    show: false
  });
  mainWindow.setMenuBarVisibility(false)
  // This block of code is intended for development purpose only.
  // Delete this entire block of code when you are ready to package the application.
  if (isDev()) {
    mainWindow.loadURL('http://localhost:5000/');
  } else {
    loadURL(mainWindow);
  }

  // Uncomment the following line of code when app is ready to be packaged.
  // loadURL(mainWindow);

  // Open the DevTools and also disable Electron Security Warning.
  // process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = true;
  //mainWindow.webContents.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  });

  // Emitted when the window is ready to be shown
  // This helps in showing the window gracefully.
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  const cworker = new BrowserWindow({
    show: false,
    webPreferences: { nodeIntegration: true }
  });
  cworker.loadFile('./src/workers/can.js').catch((err) => {
    console.log("Unable to load can worker", err);
  });
  const sworker = new BrowserWindow({
    show: false,
    webPreferences: { nodeIntegration: true }
  })
  await sworker.loadFile('./src/workers/serial.js').catch((err) => {
    console.log("Unable to load serial worker", err);
  });
  sworker.onmessage = (evt) => {
console.log(evt)
  };
  createWindow();
  // Message channel handlers
  ipcMain.on('can-ready', (evt) => {

console.log("can-ready")

    if (evt.senderFrame === mainWindow.webContents.mainFrame) {
      const { port1, port2 } = new MessageChannelMain();
      cworker.webContents.postMessage('can-worker', null, [port1])
      evt.senderFrame.postMessage('can-service', null, [port2]);
    }
  });
  ipcMain.on('serial-ready', (evt) => {

console.log("serial-ready")

    if (evt.senderFrame === mainWindow.webContents.mainFrame) {
      const { port1, port2 } = new MessageChannelMain();
      sworker.webContents.postMessage('serial-worker', null, [port1])
      evt.senderFrame.postMessage('serial-service', null, [port2]);
    }
  });
});

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') app.quit()
});

app.on('activate', function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) createWindow()
});
// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
