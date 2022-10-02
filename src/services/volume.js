
// const progURL = 'http://localhost:4000';

const { app, dialog } = require('electron');
const log = require('electron-log');
const fs = require('fs');
const path = require('path');
const dwl = require('download');
const cp = require('child_process');

async function readFile() {
  return new Promise((resolve, reject) => {
    let fp = dialog.showOpenDialogSync({ title: 'Open volume table', defaultPath: path.join(process.env.HOME, 'puma', 'save', 'voltab.json'),
      filters: [{ name: 'JSON file', extensions: ['json'] }]});
    if (typeof fp !== 'undefined') {
      let cnt = fs.readFileSync(fp[0], { encoding: 'UTF8'} );
      try {
        let dat = JSON.parse(cnt);
        if ((typeof dat.fluid !== 'undefined') && (typeof dat.instance !== 'undefined') &&
          (typeof dat.table !== 'undefined') && (typeof dat.mode !== 'undefined')) {
          console.log(dat)
          resolve(dat);
        } else {
          reject(new Error('Invalid data structure'));
        }
      } catch (err) {
        reject(err);
      }
    } else { 
      reject(new Error('Nothing selected'));
    }
  });
};

async function writeFile(data) {
  return new Promise((resolve, reject) => {
    let fp = dialog.showSaveDialogSync({ title: 'Save volume table', defaultPath: path.join(process.env.HOME, 'puma', 'save', 'voltab.json'),
      filters: [{ name: 'JSON file', extensions: ['json'] }]});
    if (typeof fp !== 'undefined') {
      try {
        let dat = JSON.stringify(data);
        fs.writeFileSync(fp, dat, { encoding: 'UTF8'} );
        resolve(true);
      } catch (err) {
        reject(err);
      }
    } else { 
      reject(new Error('Nothing selected'));
    }
  });
};

async function readMode(dev, func) {
  return new Promise((resolve, reject) => {
    resolve(true);
  });
};

async function writeMode(dev, func) {
  return new Promise((resolve, reject) => {
    resolve(true);
  });  
};  

async function readTable(dev, func) {
  return new Promise((resolve, reject) => {
    resolve(true);
  });
};

async function writeTable(dev, func) {
  return new Promise((resolve, reject) => {
    resolve(true);
    // let file = null;
    // switch (dev) {
    //   case '3420':
    //     file = '3420.bin'
    //     break;
    //   default:
    //     break;
    // }
    // if (file == null) {
    //   reject(new Error('Invalid request'));
    //   return;
    // }
    // dwl(progURL + '/prog?file=' + file, path.join(app.getAppPath(), 'downloads')).then((res) => {
    //   log.info('Download successful:', file);
    //   resolve(true);
    // }).catch((err) => {
    //   reject(err);
    // });
  });
};

module.exports = {
  readFile,
  writeFile,
  readMode,
  writeMode,
  readTable,
  writeTable,
};
