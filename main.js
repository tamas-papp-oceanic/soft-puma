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
const { writeBoot, downProg, downUpdates } = require('./src/services/program.js')
const { readFile, writeFile } = require('./src/services/volume.js');
const EventEmitter = require('node:events');
const crc32 = require('buffer-crc32');

// Leopard URL
const authURL = 'http://192.168.16.52:8080';

const pub = new EventEmitter();

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let devices = {};
let timer = null;
let Can = null;
let cancelToken;

log.transports.console.level = 'info';
log.transports.file.maxSize = 10 * 1024 * 1024;
log.transports.file.level = 'info';

if (os.platform() == 'linux') {
  Can = require('./src/services/can.js');
} else if (os.platform() == 'win32') {
  Can = require('./src/services/pcan.js');
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
    if ((mainWindow != null) && (typeof mainWindow.webContents !== 'undefined')) {
      mainWindow.webContents.send('auth-url', authURL);
    }
    mainWindow.show();
  });
}

autoUpdater.logger = log;
autoUpdater.disableWebInstaller = true;

// AutoUpdater callbacks

// autoUpdater.on('checking-for-update', () => {
//   log.info("Checking for program update...");
// });

autoUpdater.on('update-available', (info) => {
  // log.info("Program update available.", info.version);
  setTimeout(() => {
    if ((mainWindow != null) && (typeof mainWindow.webContents !== 'undefined')) {
      mainWindow.webContents.send('upd-available', info.version);
    }
  }, 3000);
});

// autoUpdater.on('update-not-available', (info) => {
//   log.info("No program update available.");
// });

// autoUpdater.on('error', (err) => {
//   log.error("Program update error!", err);
// });

autoUpdater.on('download-progress', (progObj) => {
  if ((mainWindow != null) && (typeof mainWindow.webContents !== 'undefined')) {
    mainWindow.webContents.send('upd-progress', progObj);
  }
});

autoUpdater.on('update-downloaded', (info) => {
  mainWindow.webContents.send('upd-download', false);
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  createWindow();
  autoUpdater.autoDownload = false;

console.log("START")

  autoUpdater.checkForUpdates();

console.log("FINISH")

  // Start discovery loop
  log.info('Discovering interfaces...')
  discover();
  timer = setInterval(() => {
    discover();
  }, 10000);


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
  let updates = new Array();
  Serial.discover().then((sls) => {
    for (let i in sls) {
      if ((sls[i].vendorId == '0483') && (sls[i].productId == '5740')) {
        // STMicroelectronics Virtual COM port
        if (typeof devices[sls[i].path] === "undefined") {
          log.info('New serial interface (' + sls[i].path + ')')
          let dev = new Serial(sls[i].path, 115200);
          let eng = new NMEAEngine(dev);
          devices[sls[i].path] = { type: 'serial', device: dev, engine: eng, process: proc };
          updates.push(devices[sls[i].path]);
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
            updates.push(devices[cls[i]]);
          }
        }
      }
    } else if (os.platform() == 'win32') {
      let can = new Can();
      can.discover().then((cls) => {
        if (cls.length > 0) {
          if (typeof devices[cls[0].path] === "undefined") {
            log.info('New CAN interface (' + cls[0].path + ')')
            let eng = new NMEAEngine(can);
            devices[cls[0].path] = { type: 'can', device: can, engine: eng, process: proc };
            updates.push(devices[cls[0].path]);
          }
        }
      }).catch((err) => {
        log.error(err);
      });
    }
    for (let upd of updates) {
      upd.device.start(upd.process);  
      upd.engine.init();
      // Send ISO Request for Address Claim
      upd.engine.send059904(60928, 0xFF);
    }
    if ((updates.length > 0) && (mainWindow != null) &&
      (typeof mainWindow.webContents !== 'undefined')) {
      mainWindow.webContents.send('n2k-devs', Object.keys(devices));
    }
  }).catch((err) => {
    log.error(err);
  });
}

// NMEA processing
function proc(dev, frm) {
  if ((mainWindow != null) && (typeof mainWindow.webContents !== 'undefined')) {
    let msg = devices[dev].engine.process(frm);
    let manu = devices[dev].engine.name[2];
    let indu = devices[dev].engine.name[9];
    if (msg != null) {
      switch (msg.header.pgn) {
      case 60928:
        mainWindow.webContents.send('n2k-name', [dev, msg]);
        break;
      case 65289:
      case 130825:
        mainWindow.webContents.send('n2k-volume', [dev, msg]);
        break;
      case 65446:
        if ((msg.fields[0].value == manu) && (msg.fields[2].value == indu)) {
          switch (msg.fields[5].value) {
            case 0xB0:
              pub.emit('reboot-ack', msg);
              break;
            default:
              switch (msg.fields[3].value) {
                case 8:
                  mainWindow.webContents.send('n2k-ac-data', [dev, msg]);
                  pub.emit('conf-ack', msg);
                  break;
              }
              break;
          }
        }
        break;
      case 65477:
        mainWindow.webContents.send('test-data', [dev, msg]);
        break;
      case 126996:
        mainWindow.webContents.send('n2k-prod', [dev, msg]);
        break;
      case 127501:
        mainWindow.webContents.send('n2k-data', [dev, msg]);
        mainWindow.webContents.send('n2k-digi-data', [dev, msg]);
        break;
      case 130982:
        if ((msg.fields[0].value == manu) && (msg.fields[2].value == indu)) {
          switch (msg.fields[5].value) {
            case 0xC2:
              pub.emit('crc-ack', msg);
              break;
            case 0xEB:
              pub.emit('erase-ack', msg);
              break;
            case 0xEC:
              pub.emit('flag-ack', msg);
              break;
            case 0xF0:
              pub.emit('prog-ack', msg);
              break;
            }
          break;
        }
        break;
      default:
        mainWindow.webContents.send('n2k-data', [dev, msg]);
        break;
      }
    }
  }
}

// Initialize NMEA translator
// com.init();

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

// Processing bus scan request
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
  const [dev, serial] = args;
  if ((typeof dev === 'string') && (typeof devices[dev] !== 'undefined')) {
    let eng = devices[dev].engine;
    // Send Proprietary Set serial PGN
    eng.send065280(serial);
  }
});

ipcMain.on('test-data', (e, args) => {
  const [dev, code, param] = args;
  if ((typeof dev === 'string') && (typeof devices[dev] !== 'undefined')) {
    let eng = devices[dev].engine;
    eng.send065477(code, param);
  } else {
    console.log("No device seleted!")
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

// Download program bin updates
ipcMain.on('updates', (e, ...args) => {
  downUpdates(authURL).then((res) => {
    let updates = JSON.parse(JSON.stringify(res));
    if ((mainWindow != null) && (typeof mainWindow.webContents !== 'undefined')) {
      mainWindow.webContents.send('updates', updates);
    }
  }).catch((err) => {
    console.log(err);
  });
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
  const [file] = args;
  writeBoot(authURL, file, bootMessage).then((res) => {
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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Start device programing
ipcMain.on('prog-start', (e, args) => {
  const [dev, file, typ, ins] = args;
  if ((typeof dev === 'string') && (typeof devices[dev] !== 'undefined')) {
    let eng = devices[dev].engine;
    let byt = 0;
    let dat;
    Promise.resolve()
    .then(() => downProg(authURL, file, progMessage))
    .then((res) => {
      byt = res.length;
      dat = Buffer.from(res);
    })
    .then(() => bootToLoader(eng, typ, ins, progMessage))
    .then(() => bootErase(eng, typ, ins, byt, progMessage))
    .then(() => bootProgram(eng, typ, ins, dat, progMessage))
    .then(() => bootCRC(eng, typ, ins, dat, progMessage))
    .then(() => bootFlag(eng, typ, ins, progMessage))
    .then(() => bootToProgram(eng, typ, ins, progMessage))
    .then(() => {
        if ((mainWindow != null) && (typeof mainWindow.webContents !== 'undefined')) {
        mainWindow.webContents.send('prog-done');
      }
    })
    .catch((err) => {
      log.error(err);
      progMessage(err);
    });
  } else {
    progMessage("No device selected!");
  }
});

// Sends programmer console message
function progMessage(msg) {
  if ((mainWindow != null) && (typeof mainWindow.webContents !== 'undefined')) {
    mainWindow.webContents.send('prog-data', msg);
  }
}

let btimer = null;

function bootToLoader(eng, typ, ins, func) {
  return new Promise((resolve, reject) => {
    // Re-booting to bootloader...
    let ret = eng.send065445(typ, ins, 0xAA, 0xFFFFFF);
    if (ret) {
      func('Waiting for re-boot...\n');
      btimer = setTimeout(() => {
        btimer = null;
        reject(new Error('Re-boot to bootloader failed!'));
      }, 5000);
      pub.once('reboot-ack', (res) => {
        clearTimeout(btimer);
        btimer = null;
        if ((typeof res.fields !== 'undefined') && Array.isArray(res.fields) &&
          (res.fields[3].value == 0xFF)) {
          let msg = 'Successfuly re-booted to Bootloader.';
          log.info(msg);
          func(msg + '\n');
          resolve(true);
        } else {
          reject(new Error('Re-boot to bootloader failed!'));
        }
      });
    } else {
      reject(new Error('Re-boot to bootloader failed!'));
    }
  });
}

function bootErase(eng, typ, ins, len, func) {
  return new Promise((resolve, reject) => {
    // Erasing program area...
    let dat = Buffer.alloc(4);
    dat.writeUInt32LE(len);
    let ret = eng.send130981(typ, ins, 0xEB, dat);
    if (ret) {
      func('Erasing program area...\n');
      btimer = setTimeout(() => {
        btimer = null;
        reject(new Error('Erasing program area failed!'));
      }, 5000);
      pub.once('erase-ack', (res) => {
        clearTimeout(btimer);
        btimer = null;
        if ((typeof res.fields !== 'undefined') && Array.isArray(res.fields) &&
          (res.fields[3].value == typ)) {
          let msg = 'Program area successfuly erased.';
          log.info(msg);
          func(msg + '\n');
          resolve(true);
        } else {
          reject(new Error('Erasing program area failed!'));
        }
      });
    } else {
      reject(new Error('Erasing program area failed!'));
    }
  });
}

async function blockWrite(eng, typ, ins, out) {
  return new Promise((resolve, reject) => {
    btimer = setTimeout(() => {
      btimer = null;
      reject(new Error('Uploading block failed!'));
    }, 1000);
    let ret = eng.send130981(typ, ins, 0xF0, out);
    if (!ret) {
      clearTimeout(btimer);
      btimer = null;
      reject(new Error('Uploading block failed!'));
    }
    pub.once('prog-ack', (res) => {
      clearTimeout(btimer);
      btimer = null;
      if ((typeof res.fields !== 'undefined') && Array.isArray(res.fields) &&
        (res.fields[3].value == typ)) {
        resolve(true);
      } else {
        reject(new Error('Uploading block failed!'));
      }
    });
  });
}

async function bootProgram(eng, typ, ins, dat, func) {
  // Uploading program...
  func('Uploading program...\n');
  let blk = 0;
  let len = dat.length;
  let prc = 0;
  func('[');
  while (len > 0) {
    let cnt = Math.min(len, 128);
    let out = Buffer.alloc(cnt + 2);
    out.writeUInt16LE(blk);
    dat.copy(out, 2, blk * 128, (blk * 128) + cnt);
    await blockWrite(eng, typ, ins, out, func);
    len -= cnt;
    blk++;
    let tmp = (Math.round((blk * 128) / dat.length * 100 / 2));
    if (tmp != prc) {
      prc = tmp;
      func('=');
    }
  }
  func(']100%\n');
  let msg = 'Program successfuly uploaded.';
  log.info(msg);
  func(msg + '\n');
  return true;
}

function bootCRC(eng, typ, ins, dat, func) {
  return new Promise((resolve, reject) => {
    // Request for CRC...
    let ret = eng.send065445(typ, ins, 0xFF, 0xFFC201);
    if (ret) {
      func('Requesting CRC...\n');
      btimer = setTimeout(() => {
        btimer = null;
        reject(new Error('Requesting CRC failed!'));
      }, 5000);
      pub.once('crc-ack', (res) => {
        clearTimeout(btimer);
        btimer = null;
        if ((typeof res.fields !== 'undefined') && Array.isArray(res.fields) &&
          (res.fields[3].value == typ)) {
          let msg = 'CRC successfuly requested.';
          log.info(msg);
          func(msg + '\n');
          let dev = Buffer.alloc(4);
          dev.writeUInt32BE(res.fields[6].value);
          let crc = crc32(dat);
          msg = 'Calculating CRC...';
          log.info(msg);
          func(msg + '\n');
          if (dev.compare(crc) == 0) {
            msg = 'CRC is correct.';
            log.info(msg);
            func(msg + '\n');
            resolve(true);
          } else {
            reject(new Error('CRC isn\'t correct !'));
          }
        } else {
          reject(new Error('Requesting CRC failed!'));
        }
      });
    } else {
      reject(new Error('Requesting CRC failed!'));
    }
  });
}

function bootFlag(eng, typ, ins, func) {
  return new Promise((resolve, reject) => {
    // Erasing boot flag...
    let dat = Buffer.alloc(4, 0xFF);
    let ret = eng.send130981(typ, ins, 0xEC, dat);
    if (ret) {
      func('Erasing boot flag...\n');
      btimer = setTimeout(() => {
        btimer = null;
        reject(new Error('Erasing boot flag failed!'));
      }, 5000);
      pub.once('flag-ack', (res) => {
        clearTimeout(btimer);
        btimer = null;
        if ((typeof res.fields !== 'undefined') && Array.isArray(res.fields) &&
          (res.fields[3].value == typ)) {
          let msg = 'Boot flag successfuly erased.';
          log.info(msg);
          func(msg + '\n');
          resolve(true);
        } else {
          reject(new Error('Erasing boot flag failed!'));
        }
      });
    } else {
      reject(new Error('Erasing boot flag failed!'));
    }
  });
}

function bootToProgram(eng, typ, ins, func) {
  return new Promise((resolve, reject) => {
    // Re-booting to Program...
    let ret = eng.send065445(typ, ins, 0xAA, 0xFFFFFF);
    if (ret) {
      let msg = 'Successfuly re-booted to Program.';
      log.info(msg);
      func(msg + '\n');
      resolve(true);
    } else {
      reject(new Error('Re-boot to bootloader failed!'));
    }
  });
}

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
  const [dev, fluid, inst] = args;
  if ((typeof dev === 'string') && (typeof devices[dev] !== 'undefined')) {
    let eng = devices[dev].engine;
    let res = eng.send065289(fluid, inst, 0x05);
    res |= eng.send130825(fluid, inst, 0x05);
    if ((mainWindow != null) && (typeof mainWindow.webContents !== 'undefined')) {
      mainWindow.webContents.send('volmode-done', res);
    }
  } else {
    progMessage("No device selected!");
  }
});

// Starts volume mode writing
ipcMain.on('volmode-write', (e, args) => {
  const [dev, fluid, instance, mode] = args;
  if ((typeof dev === 'string') && (typeof devices[dev] !== 'undefined')) {
    let eng = devices[dev].engine;
    let res = eng.send065289(fluid, instance, 0x04, mode);
    res |= eng.send130825(fluid, instance, 0x04, mode);
    if ((mainWindow != null) && (typeof mainWindow.webContents !== 'undefined')) {
      mainWindow.webContents.send('volmode-done', res);
    }
  } else {
    progMessage("No device selected!");
  }
});

// Starts volume table reading
ipcMain.on('voltable-read', (e, args) => {
  const [dev, fluid, instance] = args;
  if ((typeof dev === 'string') && (typeof devices[dev] !== 'undefined')) {
    let eng = devices[dev].engine;
    let res = eng.send065289(fluid, instance, 0x02);
    res |= eng.send130825(fluid, instance, 0x02);
    if ((mainWindow != null) && (typeof mainWindow.webContents !== 'undefined')) {
      mainWindow.webContents.send('voltable-done', res);
    }
  } else {
    progMessage("No device selected!");
  }
});

// Starts volume table writing
ipcMain.on('voltable-write', (e, args) => {
  const [dev, fluid, instance, table, capacity] = args;
  if ((typeof dev === 'string') && (typeof devices[dev] !== 'undefined')) {
    let eng = devices[dev].engine;
    let res = eng.send065289(fluid, instance, 0x01, table, capacity);
    res |= eng.send130825(fluid, instance, 0x01, table, capacity);
    if ((mainWindow != null) && (typeof mainWindow.webContents !== 'undefined')) {
      mainWindow.webContents.send('voltable-done', res);
    }
  } else {
    progMessage("No device selected!");
  }
});

function c3420Read(eng, ins, cmd) {
  return new Promise((resolve, reject) => {
    // Reading configuration...
    let ret = eng.send065445(0x08, ins, 0xFF, (((0xFF << 8) + cmd) << 8) + 0x00);
    if (ret) {
      btimer = setTimeout(() => {
        btimer = null;
        reject(new Error('Reading configuration failed!'));
      }, 5000);
      pub.once('conf-ack', (res) => {
        clearTimeout(btimer);
        btimer = null;
        if ((typeof res.fields !== 'undefined') && Array.isArray(res.fields) &&
          (res.fields[3].value == 0x08) && (res.fields[4].value == ins) &&
          (res.fields[5].value == cmd)) {
          let msg = 'Configuration successfuly read.';
          log.info(msg);
          resolve(true);
        } else {
          reject(new Error('Reading configuration failed!'));
        }
      });
    } else {
      reject(new Error('Reading configuration failed!'));
    }
  });
}

// Starts 3420 configuration reading
ipcMain.on('c3420-read', (e, args) => {
  const [dev, inst] = args;
  if ((typeof dev === 'string') && (typeof devices[dev] !== 'undefined')) {
    let eng = devices[dev].engine;
    Promise.resolve()
    .then(() => c3420Read(eng, inst, 0))
    .then(() => c3420Read(eng, inst, 1))
    .then(() => {
      if ((mainWindow != null) && (typeof mainWindow.webContents !== 'undefined')) {
        mainWindow.webContents.send('r3420-done', true);
      }
    })
    .catch((err) => {
      log.error(err);
      if ((mainWindow != null) && (typeof mainWindow.webContents !== 'undefined')) {
        mainWindow.webContents.send('r3420-done', false);
      }
    });
  } else {
    console.log("No device selected!");
  }
});

function c3420Write(eng, ins, cmd, dat) {
  return new Promise((resolve, reject) => {
    // Writing configuration...
    let ret = eng.send065445(0x08, ins, cmd, dat);
    if (ret) {
      btimer = setTimeout(() => {
        btimer = null;
        reject(new Error('Writing configuration failed!'));
      }, 5000);
      pub.once('conf-ack', (res) => {
        clearTimeout(btimer);
        btimer = null;
        if ((typeof res.fields !== 'undefined') && Array.isArray(res.fields) &&
          (res.fields[3].value == 0x08) && (res.fields[4].value == ins) &&
          (res.fields[5].value == cmd) && ((res.fields[6].value & 0xFF) == dat)) {
          let msg = 'Configuration successfuly written.';
          log.info(msg);
          resolve(true);
        } else {
          reject(new Error('Writing configuration failed!'));
        }
      });
    } else {
      reject(new Error('Writing configuration failed!'));
    }
  });
}

// Starts 3420 configuration writing
ipcMain.on('c3420-write', (e, args) => {
  const [dev, inst, ins2, circ] = args;
  if ((typeof dev === 'string') && (typeof devices[dev] !== 'undefined')) {
    let eng = devices[dev].engine;
    Promise.resolve()
    .then(() => c3420Write(eng, inst, 0, circ))
    .then(() => c3420Write(eng, inst, 1, ins2))
    .then(() => {
      if ((mainWindow != null) && (typeof mainWindow.webContents !== 'undefined')) {
        mainWindow.webContents.send('w3420-done', true);
      }
    })
    .catch((err) => {
      log.error(err);
      if ((mainWindow != null) && (typeof mainWindow.webContents !== 'undefined')) {
        mainWindow.webContents.send('w3420-done', false);
      }
    });
  } else {
    console.log("No device selected!");
  }
});

// Starts 3478 data writing
ipcMain.on('c3478-write', (e, args) => {
  const [dev, inst, bank, data] = args;
  if ((typeof dev === 'string') && (typeof devices[dev] !== 'undefined')) {
    let eng = devices[dev].engine;
    let res = eng.send127502(inst, bank, data);
    if ((mainWindow != null) && (typeof mainWindow.webContents !== 'undefined')) {
      mainWindow.webContents.send('c3478-done', res);
    }
  } else {
    console.log("No device selected!");
  }
});

let swcancel = false;

async function switchWrite(eng, ins, idx) {
  if (!swcancel) {
    let out = new Buffer.alloc(28, 3);
    if (idx == 8) {
      out.fill(1, 0, 8);
    } else {
      out.fill(0, 0, 8);
      if (idx != -1) {
        if (idx > 0) {
          out[idx - 1] = 0;
        }
        out[idx] = 1;
      }
    }
    let res =  eng.send127502(ins, out);
    await sleep(1000);
    if (res) {
      await Promise.resolve(true);
    } else {
      await Promise.reject(new Error('Writing switch data failed!'));
    }
  } else {
    await Promise.reject(new Error('Switch test cancelled!'));
  }
}

// Starts 3478 auto tests
ipcMain.on('a3478-write', (e, args) => {
  const [dev, ins] = args;
  swcancel = false;
  if ((typeof dev === 'string') && (typeof devices[dev] !== 'undefined')) {
    let eng = devices[dev].engine;
    Promise.resolve()
    .then(() => switchWrite(eng, ins, -1))
    .then(() => switchWrite(eng, ins, 0))
    .then(() => switchWrite(eng, ins, 1))
    .then(() => switchWrite(eng, ins, 2))
    .then(() => switchWrite(eng, ins, 3))
    .then(() => switchWrite(eng, ins, 4))
    .then(() => switchWrite(eng, ins, 5))
    .then(() => switchWrite(eng, ins, 6))
    .then(() => switchWrite(eng, ins, 7))
    .then(() => switchWrite(eng, ins, -1))
    .then(() => switchWrite(eng, ins, 8))
    .then(() => switchWrite(eng, ins, -1))
    .then(() => {
      if ((mainWindow != null) && (typeof mainWindow.webContents !== 'undefined')) {
        mainWindow.webContents.send('a3478-done', true);
      }
    })
    .catch((err) => {
      log.error(err);
      if ((mainWindow != null) && (typeof mainWindow.webContents !== 'undefined')) {
        mainWindow.webContents.send('a3478-done', false);
      }
    });
  } else {
    console.log("No device selected!");
  }
});

// Cancels 3478 auto tests
ipcMain.on('a3478-cancel', (e, args) => {
  swcancel = true;
});

// Stop device processing
ipcMain.on('dev-stop', (e, ...args) => {
  for (const [key, val] of Object.entries(devices)) {
    val.device.stop();  
  }
});

// Closes the application
ipcMain.on('app-quit', (e, ...args) => {
  if (timer != null) {
    clearInterval(timer);
    timer = null;
  }
  log.info('Stopping devices...');
  for (const [key, val] of Object.entries(devices)) {
    if (val.type == 'serial') {
      log.info('Closing Serial (' + key + ')...');
    } else if (val.type == 'can') {
      log.info('Stopping CAN (' + key + ')...');
    }
    val.device.stop();
  }
  log.info('Destroying devices...');
  for (const [key, val] of Object.entries(devices)) {
    val.engine.destroy();
  }
  log.info('Quit...')
  app.quit();
});
