const { ipcRenderer } = require('electron')

ipcRenderer.on('device-can-channel', (evt) => {
  const [ port ] = evt.ports


  console.log(port);


  port.onmessage = (evt) => {
    const res = "data";
    port.postMessage(result);
  }
});
