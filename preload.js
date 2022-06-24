// require('./src/services/can.js');
// require('./src/services/serial.js');

const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('pumaAPI', {
  onCan: (channel, func) => ipcRenderer.on(channel, (e, ...args) => func(e, ...args)),
  sendCan: (channel, data) => ipcRenderer.send(channel, data),
  onSer: (channel, func) => ipcRenderer.on(channel, (e, ...args) => func(e, ...args)),
  sendSer: (channel, data) => ipcRenderer.send(channel, data),
});

// contextBridge.exposeInMainWorld('pumaAPI', {
//   send: (channel, data) => {
//     // whitelist channels
//     let validChannels = [ 'toMain' ];
//     if (validChannels.includes(channel)) {
//         ipcRenderer.send(channel, data);
//     }
//   },
//   recv: (channel, func) => {
//     let validChannels = [ 'fromMain' ];
//     if (validChannels.includes(channel)) {
//         // Deliberately strip event as it includes `sender` 
//         ipcRenderer.on(channel, (event, ...args) => func(...args));
//     }
//   }
// });

// ipcRenderer.on('can-data', (e) => {
//   console.log(e);
// });

// ipcRenderer.on('ser-data', (e) => {
//   console.log(e);
// });
