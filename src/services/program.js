/*
  Bootloader:
    STM32_Programmer_CLI -c port=jtag -log 3420-Bootloader.log -w ./3420-Bootloader.bin 0x08000000 -v
    STM32_Programmer_CLI -c port=jtag -g 0x08000000

  Application: 0x0800A000
*/
const progURL = 'http://localhost:4000';

const { app } = require('electron');
const log = require('electron-log');
const dwl = require('download');
const path = require('path');
const cp = require('child_process');

async function writeBoot(dev, func) {
  return new Promise((resolve, reject) => {
    let prog = null;
    let file = null;
    switch (dev) {
      case '3420':
        prog = 'STM32';
        file = '3420-Bootloader.bin'
        break;
      default:
        prog = 'Atmel';
        break;
    }
    if (file == null) {
      reject(new Error('Invalid request'));
      return;
    }
    let dwn = path.join(app.getAppPath(), 'downloads');
    dwl(progURL + '/boot?file=' + file, dwn).then((res) => {
      log.info('Download successful:', file);
      dwn = path.join(dwn, file);
      const chd = cp.spawn('STM32_Programmer_CLI', ['-c port=jtag', '-w', dwn,  '0x08000000', '-v']);
      chd.stdout.on('data', (data) => {
        let msg = data.toString().replace(/\x1B\[[0-9;]*[JKmsu]/g, '');
        func(msg);
        log.info(msg);
        return;
      });
      chd.stderr.on('data', (data) => {
        let msg = data.toString().replace(/\x1B\[[0-9;]*[JKmsu]/g, '');
        func(msg);
        log.error(msg);
        return;
      });
      chd.on('close', (code) => {
        resolve(code == 0);
      });
    }).catch((err) => {
      reject(err);
    });
  });
}

async function downProg(mod, func) {
  return new Promise((resolve, reject) => {
    let file = null;
    switch (mod) {
      case '3420':
        file = '3420.bin'
        break;
      default:
        break;
    }
    if (file == null) {
      reject(new Error('Invalid request'));
      return;
    }
    dwl(progURL + '/prog?file=' + file, path.join(app.getAppPath(), 'downloads')).then((res) => {
      let msg = 'Download successful: ' + file;
      log.info(msg);
      func(msg + '\n');
      resolve(res);
    }).catch((err) => {
      reject(err);
    });
  });
}

module.exports = {
  writeBoot,
  downProg,
};
