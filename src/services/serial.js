const { ipcRenderer } = require('electron');

ipcRenderer.send('serial-ready');

ipcRenderer.once('serial-service', (evt) => {
  // Once we receive the reply, we can take the port...
  const [ port ] = evt.ports
  // ... register a handler to receive results ...
  port.onmessage = (evt) => {
    console.log('received result:', evt.data)
  }
  // ... and start sending it work!
  port.postMessage('serial-start');

console.log("START SENT")

  setTimeout(() => {
    port.postMessage('serial-stop')
  }, 1000);
});
