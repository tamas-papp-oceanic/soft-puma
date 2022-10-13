// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain } = require('electron');
const { autoUpdater, CancellationToken } = require('electron-updater');
const isDev = require('electron-is-dev');
const os = require('os');
const fs = require('fs');
const path = require('path');
const serve = require('electron-serve');
const loadURL = serve({ directory: 'public' });
const log = require('electron-log');
const Serial = require('./src/services/serial.js');
const com = require('./src/services/common.js');
const NMEAEngine = require('./src/services/nmea.js');
const bwipjs = require('bwip-js');
const PDFDocument = require('pdfkit');
const prt = 'HP-LaserJet-Pro-M404-M405';
const { writeBoot, writeProg } = require('./src/services/program.js')
const { readFile, writeFile } = require('./src/services/volume.js')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let devices = {};
let timer = null;
let Can = null;
let cancelToken;

if (os.platform() == 'linux') {
  Can = require('./src/services/can.js');
} else if (os.platform() == 'win32') {
  Can = require('./src/services/pcan.js');
}

log.transports.console.level = 'info';
log.transports.file.level = 'info';

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
      preload: path.join(isDev ? process.cwd() : __dirname, 'preload.js'),
    },
    // Use this in development mode.
    icon: path.join(isDev ? process.cwd() : __dirname, 'public/favicon.png'),
    // Use this in production mode.
    // icon: path.join(__dirname, 'public/favicon.png'),
    show: false
  });

  mainWindow.setMenuBarVisibility(false)

  if (isDev) {
    // This block of code is intended for development purpose only.
    // Delete this entire block of code when you are ready to package the application.
    mainWindow.loadURL('http://localhost:5000/');
  } else {
    // Uncomment the following line of code when app is ready to be packaged.
    loadURL(mainWindow);
  }

  // Open the DevTools and also disable Electron Security Warning.
  // process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = true;
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

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

autoUpdater.logger = log;
autoUpdater.disableWebInstaller = true;
// AutoUpdater callbacks
// autoUpdater.on('checking-for-update', () => {
// })
autoUpdater.on('update-available', (info) => {
  setTimeout(() => {
    if ((mainWindow != null) && (typeof mainWindow.webContents !== 'undefined')) {
      mainWindow.webContents.send('upd-available', info.version);
    }
  }, 3000);
})
// autoUpdater.on('update-not-available', (info) => {
// })
// autoUpdater.on('error', (err) => {
// })
autoUpdater.on('download-progress', (progObj) => {
  if ((mainWindow != null) && (typeof mainWindow.webContents !== 'undefined')) {
    mainWindow.webContents.send('upd-progress', progObj);
  }
})
autoUpdater.on('update-downloaded', (info) => {
  mainWindow.webContents.send('upd-download', false);
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  createWindow();
  autoUpdater.autoDownload = false;
  autoUpdater.checkForUpdates();
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

// Discovering interfaces
async function discover() {
  Serial.discover().then((sls) => {
    for (let i in sls) {
      if ((sls[i].vendorId == '0483') && (sls[i].productId == '5740')) {
        // STMicroelectronics Virtual COM port
        if (typeof devices[sls[i].path] === "undefined") {
          log.info('New serial interface (' + sls[i].path + ')')
          let dev = new Serial(sls[i].path, 115200);
          let eng = new NMEAEngine(dev);
          devices[sls[i].path] = { type: 'serial', device: dev, engine: eng, process: proc };
        }
      }
    }
    if (os.platform() == 'linux') {
      let cls = Can.discover();
      for (let i in cls) {
        if (cls[i].startsWith('can')) {
          if (typeof devices[cls[i]] === "undefined") {
            log.info('New CAN interface (' + cls[i] + ')')
            let dev = new Can(cls[i]);
            let eng = new NMEAEngine(dev);
            devices[cls[i]] = { type: 'can', device: dev, engine: eng, process: proc };
          }
        }
      }
    } else {
      let can = new Can();
      can.discover().then((cls) => {
        if (cls.length > 0) {
          if (typeof devices[cls[0].path] === "undefined") {
            log.info('New CAN interface (' + cls[0].path + ')')
            let eng = new NMEAEngine(can);
            devices[cls[0].path] = { type: 'can', device: can, engine: eng, process: proc };
          }
        }
      }).catch((err) => {
        log.error(err);
      });
    }
  }).catch((err) => {
    log.error(err);
  });
}
// NMEA processing
function proc(dev, frm) {
  if ((mainWindow != null) && (typeof mainWindow.webContents !== 'undefined')) {
    let msg = devices[dev].engine.process(frm);
    if (msg != null) {
      switch (msg.header.pgn) {
      case 60928:
        mainWindow.webContents.send('n2k-name', [ dev, msg ]);
        break;
      case 65289:
      case 130825:
        mainWindow.webContents.send('n2k-volume', [ dev, msg ]);
        break;
      case 65446:
        if ((msg.fields[0].value == 161) && (msg.fields[2].value == 4)) {
          switch (msg.fields[3]) {
            case 8:
              mainWindow.webContents.send('n2k-3420', [ dev, msg ]);
              break;
          }
        }
        break;
      case 65477:
        mainWindow.webContents.send('test-data', [ dev, msg ]);
        break;
      case 126996:
        mainWindow.webContents.send('n2k-prod', [ dev, msg ]);
        break;
      default:
        mainWindow.webContents.send('n2k-data', [ dev, msg ]);
        break;
      }
    }
  }
}
// Initialize NMEA translator
com.init();
// Start discovery loop
log.info('Discovering interfaces...')
discover();
timer = setInterval(() => {
  discover();
}, 10000);
// Load configurations
ipcMain.on('n2k-ready', (e, ...args) => {
  if ((mainWindow != null) && (typeof mainWindow.webContents !== 'undefined')) {
    mainWindow.webContents.send('n2k-devs', Object.keys(devices));
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
  let dev = devices[args[0]];
  if ((typeof dev !== 'undefined') && (typeof dev.engine !== 'undefined')) {
    dev.engine.sendMsg(args[1]);
  }
});
ipcMain.on('bus-scan', (e) => {
  if ((mainWindow != null) && (typeof mainWindow.webContents !== 'undefined')) {
    mainWindow.webContents.send('n2k-clear');
  }
  for (const [key, val] of Object.entries(devices)) {
    // Send ISO Request for Address Claim
    val.engine.send059904(60928, 0xFF);
  }
});
ipcMain.on('ser-num', (e, args) => {
  const [serial] = args;
  for (const [key, val] of Object.entries(devices)) {
    // Send Proprietary Set serial PGN
    val.engine.send065280(serial);
  }
});
ipcMain.on('test-data', (e, args) => {
  const [code, param] = args;
  for (const [key, val] of Object.entries(devices)) {
    // Send Device Test Control proprietary PGN
    val.engine.send065477(code, param);
  }
});
ipcMain.on('bar-code', (e, args) => {
  const [code] = args;
  let fil = path.join(__dirname, 'barcode.pdf');
  const doc = new PDFDocument({
    size: [180, 110],
    margin: 10,
  });
  doc.pipe(fs.createWriteStream(fil));
  // doc.font('Courier');
  doc.fontSize(11);
  doc.text('Marine Multifunction Display 7"', {
    width: 160,
    align: 'left',
  });
  doc.text('MTOC: MFDS', {
    width: 160,
    align: 'left',
  });
  doc.fontSize(10);
  doc.moveDown();
  doc.text('Serial No: ' + code, {
    width: 160,
    align: 'left',
  });
  bwipjs.toBuffer({
    bcid:        'code39',  // Barcode type
    text:        code,      // Text to encode
    scale:       3,         // 3x scaling factor
    height:      20,        // Bar height, in millimeters
    includetext: false,     // Show human-readable text
    textxalign:  'center',  // Always good to set this
  }).then((png) => {
    doc.image(png, 10, 60, {
      width: 160,
    });
    doc.end();
    // require('child_process').execSync('lp -d ' + prt + ' -o media=a4 ' + fil);
    fs.rmSync(fil);
  }).catch((err) => {
    log.error(err)
  });
});

// Start device processing
ipcMain.on('dev-start', (e, ...args) => {
  for (const [key, val] of Object.entries(devices)) {
    val.device.start(val.process);  
    val.engine.init();
  }
});

// Stop device processing
ipcMain.on('dev-stop', (e, ...args) => {
  for (const [key, val] of Object.entries(devices)) {
    val.device.stop();  
  }
});

// Start update process
ipcMain.on('upd-start', (e, ...args) => {
  cancelToken = new CancellationToken();
  autoUpdater.downloadUpdate(cancelToken).then(() => {
    autoUpdater.quitAndInstall();
  });
});

// Cancel update process
ipcMain.on('upd-cancel', (e, ...args) => {
  if ((typeof cancelToken.cancel !== 'undefined') && (!cancelToken.cancelled)) {
    cancelToken.cancel();
    cancelToken.dispose();
  }
});

// Start bootloader programing
ipcMain.on('boot-start', (e, ...args) => {
  writeBoot(args[0], bootMessage).then((res) => {
    if ((mainWindow != null) && (typeof mainWindow.webContents !== 'undefined')) {
      mainWindow.webContents.send('boot-done', res);
    }
  }).catch((err) => {
    log.error(err);
  });
});

// Sends bootloader console message
function bootMessage(msg) {
  if ((mainWindow != null) && (typeof mainWindow.webContents !== 'undefined')) {
    mainWindow.webContents.send('boot-data', msg);
  }
}

// Start device programing
ipcMain.on('prog-start', (e, ...args) => {
  writeProg(args[0], progMessage).then((res) => {
    if ((mainWindow != null) && (typeof mainWindow.webContents !== 'undefined')) {
      mainWindow.webContents.send('prog-done', res);
    }
  }).catch((err) => {
    log.error(err);
  });
});

// Sends programmer console message
function progMessage(msg) {
  if ((mainWindow != null) && (typeof mainWindow.webContents !== 'undefined')) {
    mainWindow.webContents.send('prog-data', msg);
  }
}
// Sends SF Config Command
ipcMain.on('prog-boot', (e, args) => {
  const [code, param] = args;
  for (const [key, val] of Object.entries(devices)) {
    // Send Device Test Control proprietary PGN
    val.engine.send065477(code, param);
  }
});

// Starts volume file reading
ipcMain.on('volfile-read', (e, ...args) => {
  readFile(args[0]).then((res) => {
    if ((mainWindow != null) && (typeof mainWindow.webContents !== 'undefined')) {
      mainWindow.webContents.send('volfile-data', res);
      mainWindow.webContents.send('volfile-done');
    }
  }).catch((err) => {
    if ((mainWindow != null) && (typeof mainWindow.webContents !== 'undefined')) {
      mainWindow.webContents.send('volfile-data', err);
      mainWindow.webContents.send('volfile-done');
    }
  });
});

// Starts volume file writing
ipcMain.on('volfile-write', (e, ...args) => {
  writeFile(args[0]).then((res) => {
    if ((mainWindow != null) && (typeof mainWindow.webContents !== 'undefined')) {
      mainWindow.webContents.send('volfile-done', res);
    }
  }).catch((err) => {
    if ((mainWindow != null) && (typeof mainWindow.webContents !== 'undefined')) {
      mainWindow.webContents.send('volfile-done', err);
    }
  });
});

// Starts volume mode reading
ipcMain.on('volmode-read', (e, args) => {
  const [fluid, instance] = args;
  let res = true;
  for (const [key, val] of Object.entries(devices)) {
    // Send Fluid Sender Control proprietary PGN
    // Request for Mode Data
    let ret = val.engine.send130825(fluid, instance, 0x05);
    res ||= ret;
  }
  if ((mainWindow != null) && (typeof mainWindow.webContents !== 'undefined')) {
    mainWindow.webContents.send('volmode-done', res);
  }
});

// Starts volume mode writing
ipcMain.on('volmode-write', (e, args) => {
  const [fluid, instance, mode] = args;
  let res = true;
  for (const [key, val] of Object.entries(devices)) {
    // Send Fluid Sender Control proprietary PGN
    // Send Mode Data
    let ret = val.engine.send130825(fluid, instance, 0x04, mode);
    res ||= ret;
  }
  if ((mainWindow != null) && (typeof mainWindow.webContents !== 'undefined')) {
    mainWindow.webContents.send('volmode-done', res);
  }
});

// Starts volume table reading
ipcMain.on('voltable-read', (e, args) => {
  const [fluid, instance] = args;
  let res = true;
  for (const [key, val] of Object.entries(devices)) {
    // Send Fluid Sender Control proprietary PGN
    // Request for Volumetric Data
    let ret = val.engine.send130825(fluid, instance, 0x02);
    res ||= ret;
  }
  if ((mainWindow != null) && (typeof mainWindow.webContents !== 'undefined')) {
    mainWindow.webContents.send('voltable-done', res);
  }
});

// Starts volume table writing
ipcMain.on('voltable-write', (e, args) => {
  const [fluid, instance, table, capacity] = args;
  let res = true;
  for (const [key, val] of Object.entries(devices)) {
    // Send Fluid Sender Control proprietary PGN
    // Send Table and Capacity Data
    let ret = val.engine.send130825(fluid, instance, 0x01, table, capacity);
    res ||= ret;
  }
  if ((mainWindow != null) && (typeof mainWindow.webContents !== 'undefined')) {
    mainWindow.webContents.send('voltable-done', res);
  }
});

// Starts circuit type reading
ipcMain.on('circuit-read', (e, args) => {
  const [instance] = args;
  let res = true;
  for (const [key, val] of Object.entries(devices)) {
    // Send Fluid Sender Control proprietary PGN
    // Request for Mode Data
    let ret = val.engine.send065445(0x08, instance, 0x00, 0xFFFFFF);
    res ||= ret;
  }
  if ((mainWindow != null) && (typeof mainWindow.webContents !== 'undefined')) {
    mainWindow.webContents.send('circuit-done', res);
  }
});

// Closes the application
ipcMain.on('app-quit', (e, ...args) => {
  if (timer != null) {
    clearInterval(timer);
    timer = null;
  }
  for (const [key, val] of Object.entries(devices)) {
    log.info('Stopping NMEA engines...');
    for (const [key, val] of Object.entries(devices)) {
      val.engine.destroy();
    }
    if (val.type == 'serial') {
      log.info('Closing Serial (' + key + ')...');
    } else if (val.type == 'can') {
      log.info('Stopping CAN (' + key + ')...');
    }
    val.device.stop();
  }
  log.info('Quit...')
  app.quit();
});
