const { dialog } = require('electron');
const fs = require('fs');
const path = require('path');

async function readFile(title, name) {
  return new Promise((resolve, reject) => {
    let fp = dialog.showOpenDialogSync({ title: title, defaultPath: path.join(process.env.HOME, 'Downloads', name),
      filters: [{ name: 'JSON file', extensions: ['json'] }]});
    if (typeof fp !== 'undefined') {
      let data = fs.readFileSync(fp[0], { encoding: 'UTF8'} );
      try {
        resolve(JSON.parse(data));
      } catch (err) {
        reject(err);
      }
    } else { 
      reject(new Error('Nothing selected'));
    }
  });
};

async function writeFile(title, name, data) {
  return new Promise((resolve, reject) => {
    let fp = dialog.showSaveDialogSync({ title: title, defaultPath: path.join(process.env.HOME, 'Downloads', name),
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
