const { contextBridge, ipcRenderer } = require('electron')
const nodeCrypto = require('crypto');

contextBridge.exposeInMainWorld('pumaAPI', {
  recv: (chn, func) => ipcRenderer.on(chn, func),
  once: (chn, func) => ipcRenderer.once(chn, func),
  send: (chn, data) => ipcRenderer.send(chn, data),
  reml: (chn) => ipcRenderer.removeAllListeners(chn),
});

function createHash256(data) {
  return nodeCrypto.createHash('sha256').update(data).digest('hex');
};

contextBridge.exposeInMainWorld('customCrypto', {createHash256});
