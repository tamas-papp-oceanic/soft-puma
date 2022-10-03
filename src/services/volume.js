
const { dialog } = require('electron');
const fs = require('fs');
const path = require('path');

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

module.exports = {
  readFile,
  writeFile,
};
