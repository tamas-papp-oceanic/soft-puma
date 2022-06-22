const { ipcRenderer } = require('electron')

ipcRenderer.send('request-can-channel');

ipcRenderer.once('provide-can-channel', (evt) => {
  // Once we receive the reply, we can take the port...
  const [ port ] = evt.ports
  // ... register a handler to receive results ...
  port.onmessage = (evt) => {
    console.log('received result:', evt.data)
  }
  // ... and start sending it work!
  port.postMessage(21)
});
