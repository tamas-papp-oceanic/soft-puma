/*
  Bootloader:
    STM32_Programmer_CLI -c port=jtag -log 3420-Bootloader.log -e all
    STM32_Programmer_CLI -c port=jtag -log 3420-Bootloader.log -w ./3420-Bootloader.bin 0x08000000 -v
    STM32_Programmer_CLI -c port=jtag -log 3420-Bootloader.log -g 0x08000000

  Application: 0x0800A000
*/

const { app } = require('electron');
const log = require('electron-log');
const dwl = require('download');
const path = require('path');
const cp = require('child_process');
const http = require('http');

function erase(func) {
  return new Promise((resolve, reject) => {
    const chd = cp.spawn('STM32_Programmer_CLI', ['-c port=jtag', '-e', 'all']);
    chd.stdout.on('data', (data) => {
      let msg = data.toString().replace(/\x1B\[[0-9;]*[JKmsu]/g, '');
      func(msg);
      log.info(msg);
    });
    chd.stderr.on('data', (data) => {
      let msg = data.toString().replace(/\x1B\[[0-9;]*[JKmsu]/g, '');
      func(msg);
      log.error(msg);
    });
    chd.on('close', (code) => {
      resolve(code == 0);
    });
  });
}

function upload(dwn, func) {
  return new Promise((resolve, reject) => {
    const chd = cp.spawn('STM32_Programmer_CLI', ['-c port=jtag', '-w', dwn, '0x08000000', '-v']);
    chd.stdout.on('data', (data) => {
      let msg = data.toString().replace(/\x1B\[[0-9;]*[JKmsu]/g, '');
      func(msg);
      log.info(msg);
    });
    chd.stderr.on('data', (data) => {
      let msg = data.toString().replace(/\x1B\[[0-9;]*[JKmsu]/g, '');
      func(msg);
      log.error(msg);
    });
    chd.on('close', (code) => {
      resolve(code == 0);
    });
  });
}

function reboot(func) {
  return new Promise((resolve, reject) => {
    const chd = cp.spawn('STM32_Programmer_CLI', ['-c port=jtag', '-g', '0x08000000']);
    chd.stdout.on('data', (data) => {
      let msg = data.toString().replace(/\x1B\[[0-9;]*[JKmsu]/g, '');
      func(msg);
      log.info(msg);
    });
    chd.stderr.on('data', (data) => {
      let msg = data.toString().replace(/\x1B\[[0-9;]*[JKmsu]/g, '');
      func(msg);
      log.error(msg);
    });
    chd.on('close', (code) => {
      resolve(code == 0);
    });
  });
}

async function writeBoot(url, file, func) {
  return new Promise((resolve, reject) => {
    let dwn = path.join(app.getAppPath(), 'downloads');
    dwl(url + '/download?file=' + file, dwn).then((res) => {
      log.info('Download successful:', file);
      dwn = path.join(dwn, file);
      erase(func).then((res) => {
        if (res) {
          upload(dwn, func).then((res) => {
            if (res) {
              reboot(func).then((res) => {
                resolve(res);
              })
            } else {
              reject(new Error('Failed to upload data!'))
            }
          }).catch((err) => {
            reject(err);
          });
        } else {
          reject(new Error('Failed to erase!'))
        }
      }).catch((err) => {
        reject(err);
      });
    }).catch((err) => {
      reject(err);
    });
  });
}

async function downUpdates(url, func) {
  return new Promise((resolve, reject) => {
    http.get(url + '/updates', (res) => {
      if ((res.statusCode >= 200) && (res.statusCode <= 299)) {
        let data = [];
        res.on('data', (chunk) => {
          data.push(chunk);
        });
        res.on('end', () => {
          resolve(JSON.parse(Buffer.concat(data).toString()));
        });
      } else {
        reject(new Error('Invalid request'));
      }
    }).on('error', (err) => {
      reject(err)
    });
  });
}

async function downProg(url, file, func) {
  return new Promise((resolve, reject) => {
    dwl(url + '/download?file=' + file, path.join(app.getAppPath(), 'downloads')).then((res) => {
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
  downUpdates,
  downProg,
};
