const { dialog } = require('electron');
const fs = require('fs');
const path = require('path');

async function readSim() {
  return new Promise((resolve, reject) => {
    let fp = dialog.showOpenDialogSync({ title: 'Open simulator file', defaultPath: path.join(process.env.HOME, 'puma', 'save', 'simulator.json'),
      filters: [{ name: 'JSON file', extensions: ['json'] }]});
    if (typeof fp !== 'undefined') {
      let cnt = fs.readFileSync(fp[0], { encoding: 'UTF8'} );
      try {
        let dat = JSON.parse(cnt);
        if ((typeof dat.simulation !== 'undefined') && (typeof dat.table !== 'undefined')) {
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

async function writeSim(data) {
  return new Promise((resolve, reject) => {
    let fp = dialog.showSaveDialogSync({ title: 'Save simulator table', defaultPath: path.join(process.env.HOME, 'puma', 'save', 'simulator.json'),
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
  readSim,
  writeSim,
};
