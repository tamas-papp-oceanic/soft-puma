const { ipcRenderer } = require('electron');
const { SerialPort } = require('serialport');

let ports = new Array();

async function listSerialPorts() {
  ports = new Array();
  await SerialPort.list().then((res, err) => {
    if(err) {
      console.log(err.message);
      return;
    }
    ports = res;
    // if (ports.length === 0) {
    //   document.getElementById('error').textContent = 'No ports discovered'
    // }
  })
}

ipcRenderer.on('reply', (evt, arg) => {

  console.log(arg);

});

listSerialPorts().then(() => {
  ipcRenderer.send('message', ports);
});
