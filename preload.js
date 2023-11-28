const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('pumaAPI', {
  recv: (chn, func) => ipcRenderer.on(chn, func),
  once: (chn, func) => ipcRenderer.once(chn, func),
  send: (chn, data) => ipcRenderer.send(chn, data),
  reml: (chn) => ipcRenderer.removeAllListeners(chn),
});

