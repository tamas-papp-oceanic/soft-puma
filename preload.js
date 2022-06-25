const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('pumaAPI', {
  recv: (chn, func) => ipcRenderer.on(chn, func),
  send: (chn, ...args) => ipcRenderer.send(chn, ...args),
});
