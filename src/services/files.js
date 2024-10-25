const { dialog } = require("electron");
const fs = require("fs");
const path = require("path");
const os = require("os");

async function readFile(window, title, name) {
  return new Promise((resolve, reject) => {
    let fp = dialog.showOpenDialogSync(window, { title: title, defaultPath: path.join(os.homedir(), "Downloads", name),
        filters: [{ name: "JSON file", extensions: ["json"] }], properties: ["openFile"]});
    if (typeof fp !== "undefined") {
      let data = fs.readFileSync(fp[0], { encoding: "UTF8"} );
      try {
        resolve(JSON.parse(data));
      } catch (err) {
        reject(err);
      }
    } else { 
      reject(new Error("Nothing selected"));
    }
  });
};

async function loadFile(name) {
  return new Promise((resolve, reject) => {
    let data = fs.readFileSync(name, { encoding: "UTF8"} );
    try {
      resolve(JSON.parse(data));
    } catch (err) {
      reject(err);
    }
  });
};

async function writeFile(window, title, name, data) {
  return new Promise((resolve, reject) => {
    let fp = dialog.showSaveDialogSync(window, { title: title, defaultPath: path.join(os.homedir(), "Downloads", name),
        filters: [{ name: "JSON file", extensions: ["json"] }], properties: ["showOverwriteConfirmation"]});
    if (typeof fp !== "undefined") {
      try {
        let dat = JSON.stringify(data);
        fs.writeFileSync(fp, dat, { encoding: "UTF8"} );
        resolve(true);
      } catch (err) {
        reject(err);
      }
    } else { 
      reject(new Error("Nothing selected"));
    }
  });
};

async function saveFile(name, data) {
  return new Promise((resolve, reject) => {
    try {
      let dat = JSON.stringify(data);
      fs.writeFileSync(name, dat, { encoding: "UTF8"} );
      resolve(true);
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = {
  readFile,
  loadFile,
  writeFile,
};
