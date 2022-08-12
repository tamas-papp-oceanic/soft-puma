// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain } = require('electron');
const os = require('os');
const fs = require('fs');
const util = require('util');
const path = require('path');
const serve = require('electron-serve');
const { SerialPort } = require('serialport')
const loadURL = serve({ directory: 'public' });
let Can = null;
const Serial = require('./src/services/serial.js');
const com = require('./src/services/common.js');
const NMEAEngine = require('./src/services/nmea.js');
const bwipjs = require('bwip-js');
const PDFDocument = require('pdfkit');
const prt = 'HP-LaserJet-Pro-M404-M405';

if (os.platform() == 'linux') {
  Can = require('./src/services/can.js');
} else if (os.platform() == 'win32') {
  Can = require('./src/services/pcan.js');
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let devices = {};
let timer = null;

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
// Discovering interfaces
async function discover() {
  Serial.discover().then((sls) => {
    let plf = os.platform();
    let dev = (plf == 'linux' ? '/dev/ttyACM' : 'COM');
    for (let i in sls) {
      if (sls[i].path.startsWith(dev)) {
        if (typeof devices[sls[i].path] === "undefined") {
          console.log('New serial interface (' + sls[i].path + ')')
          let dev = new Serial(sls[i].path, 115200);
          let eng = new NMEAEngine(dev);
          eng.init();
          devices[sls[i].path] = { device: dev, engine: eng, process: proc };
        }
      }
    }
    let can = new Can();
    can.discover().then((cls) => {
      if (cls.length > 0) {
        console.log('New CAN interface (' + cls[0] + ')')
        let eng = new NMEAEngine(dev);
        eng.init();
        devices[cls[0].path] = { device: can, engine: eng, process: proc };
      }
    }).catch((err) => {
      console.log(err);
    });
  }).catch((err) => {
    console.log(err);
  });
}
// NMEA processing
function proc(dev, frm) {
  if ((typeof mainWindow !== 'undefined') && (typeof mainWindow.webContents !== 'undefined')) {
    let msg = devices[dev].engine.process(frm);
    if (msg != null) {
      switch (msg.header.pgn) {
      case 60928:
        mainWindow.webContents.send('n2k-name', [ dev, msg ]);
        break;
      case 126996:
        mainWindow.webContents.send('n2k-prod', [ dev, msg ]);
        break;
      case 65477:
        mainWindow.webContents.send('test-data', [ dev, msg ]);
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
console.log('Discovering interfaces...')
discover();
timer = setInterval(() => {
  discover();
}, 10000);
// Load configurations
ipcMain.on('n2k-ready', (e, ...args) => {
  if ((typeof mainWindow !== 'undefined') && (typeof mainWindow.webContents !== 'undefined')) {
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
    console.log(err)
  });
});
// Start device processing
ipcMain.on('dev-start', (e, ...args) => {
  for (const [key, val] of Object.entries(devices)) {
    val.device.start(val.process);  
  }
});
// Stop device processing
ipcMain.on('dev-stop', (e, ...args) => {
  for (const [key, val] of Object.entries(devices)) {
    val.device.stop();  
  }
});
// Close the application
ipcMain.on('app-quit', (e, ...args) => {
  if (timer != null) {
    clearInterval(timer);
    timer = null;
  }
  for (const [key, val] of Object.entries(devices)) {
    if (key.startsWith('can')) {
      console.log('Stopping CAN (' + key + ')...');
    } else if (key.startsWith('/dev/ttyACM')) {
      console.log('Closing Serial (' + key + ')...');
    }
    val.device.stop();
  }
  console.log('Stopping NMEA engines...');
  for (const [key, val] of Object.entries(devices)) {
    val.engine.destroy();
  }
  console.log('Quit...')
  app.quit();
});
