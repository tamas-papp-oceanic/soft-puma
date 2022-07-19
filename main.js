// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain, MessageChannelMain } = require('electron');
const path = require('path');
const serve = require('electron-serve');
const { SerialPort } = require('serialport')
const loadURL = serve({ directory: 'public' });
const can = require('./src/services/can.js');
const Serial = require('./src/services/serial.js');
const com = require('./src/services/common.js');
const NMEAEngine = require('./src/services/nmea.js');

// const can = require('./src/services/can.js');
// const serial = require('./src/services/serial.js');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let devices = [];
let engines = {};

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
      enableRemoteModule: true,
      contextIsolation: true,
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

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  // Uncomment the following line of code when app is ready to be packaged.
  // loadURL(mainWindow);

  // Open the DevTools and also disable Electron Security Warning.
  // process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = true;
  //mainWindow.webContents.openDevTools();ipc
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
  createWindow();
});

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});
// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
// Data processing
// FOR INIT ONLY
// let tool = require('./src/tools/nmea.js');
// tool.create();
// NMEA processing
function proc(dev, frm) {
  if (typeof mainWindow.webContents !== 'undefined') {
    let msg = engines[dev].engine.process(frm);
    if (msg != null) {
      switch (msg.header.pgn) {
        case 60928:
          mainWindow.webContents.send('n2k-name', msg);
          break;
        case 126996:
          mainWindow.webContents.send('n2k-prod', msg);
          break;
        default:
          mainWindow.webContents.send('n2k-data', msg);
          break;
      }
    }
  }
}
// Initialize NMEA translator
com.init();
// Discover serial devices
SerialPort.list().then((pts) => {
  for (let i in pts) {
    if (pts[i].path.startsWith('/dev/ttyACM')) {
      devices.push({ device: pts[i].path, driver: new Serial(pts[i].path, 115200) });
    }
  }
  // Initialize NMEA engines
  console.log('Starting NMEA engines...')
  for (let i in devices) {
    if (devices[i].device.startsWith('/dev/ttyACM')) {
      engines[devices[i].device] = { engine: new NMEAEngine(devices[i].driver), process: proc };
    }
  }
  for (const [key, val] of Object.entries(engines)) {
    val.engine.init();
  }
});
// engines[can.device()] = { engine: new NMEAEngine(can), process: proc };
// Load configurations
ipcMain.on('n2k-ready', (e, ...args) => {
  if (typeof mainWindow.webContents !== 'undefined') {
    const configs = ['classes', 'functions', 'industries', 'manufacturers'];
    for (let i in configs) {
      let cnf = configs[i];
      let dat = com.load(cnf);
      if (dat != null) {
        mainWindow.webContents.send('n2k-' + cnf.substring(0, 4), dat);
      }
    }
  }
});
// Processing outgoing message
ipcMain.on('n2k-data', (e, ...args) => {
  let eng = engines[args[0]];
  if (typeof eng !== 'undefined') {
    eng.engine.sendMsg(args[1]);
  }
});
ipcMain.on('n2k-addr', (e, ...args) => {
  let eng = engines[args[0]];
  if (typeof eng !== 'undefined') {
    eng.engine.send059904(60928, 0xFF);
  }
});
// Start device processing
ipcMain.on('dev-start', (e, ...args) => {
  for (const [key, val] of Object.entries(engines)) {
    val.engine.device.start(val.process);  
  }
});
// Stop device processing
ipcMain.on('dev-stop', (e, ...args) => {
  for (const [key, val] of Object.entries(engines)) {
    val.engine.device.stop();  
  }
});
// Close the application
ipcMain.on('app-quit', (e, ...args) => {
  for (let i in devices) {
    if (devices[i].device.startsWith('can')) {
      console.log('Stopping CAN (' + devices[i].device + ')...');
    } else if (devices[i].device.startsWith('/dev/ttyACM')) {
      console.log('Closing Serial (' + devices[i].device + ')...');
    }
    devices[i].driver.stop();
  }
  console.log('Stopping NMEA engines...');
  for (const [key, val] of Object.entries(engines)) {
    val.engine.destroy();
  }
  console.log('Quit...')
  app.quit();
});
