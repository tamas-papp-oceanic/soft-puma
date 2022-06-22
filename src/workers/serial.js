const { ipcRenderer } = require('electron');
const { SerialPort } = require('serialport')
const {ReadlineParser} = require("@serialport/parser-readline");

const sport = new SerialPort({ path: '/dev/ttyUSB0', baudRate: 9600, autoOpen: false })

ipcRenderer.on('serial-worker', (evt) => {
  const [ port ] = evt.ports
  port.onmessage = (evt) => {
    switch (evt.data) {
      case 'serial-start':
        if (!sport.isOpen) {
          sport.open((err) => {
            if (err) {
              console.log("ERROR", err.message);
              return;
            }
            const parser = sport.pipe(new ReadlineParser());
            parser.on('data', line => {
              port.postMessage(line);
            })
            sport.on('open', () => {
              sport.port.emitData('Serial port opened');
            });
          })
        }
        break;
      case 'serial-stop':
        if (sport.isOpen) {
          sport.close();
        }
        break;
      default:
        if (sport.isOpen) {
          const res = "data";
          sport.port.emitData(res);
        }
        break;
    }
  }
});
