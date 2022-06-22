const { ipcRenderer } = require('electron')

ipcRenderer.send('can-ready');

ipcRenderer.once('can-service', (evt) => {
  // Once we receive the reply, we can take the port...
  const [ port ] = evt.ports
  // ... register a handler to receive results ...
  port.onmessage = (evt) => {
    console.log(evt.data)
  }
  // ... and start sending it work!
  // port.postMessage('can-start');
  // setTimeout(() => {
  //   port.postMessage('can-stop')
  // }, 1000);
});
