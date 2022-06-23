const { ipcRenderer } = require('electron');
const { SerialPort } = require('serialport')
const {ReadlineParser} = require("@serialport/parser-readline");

const sport = new SerialPort({ path: '/dev/ttyACM0', baudRate: 115200, autoOpen: false });

ipcRenderer.on('serial-worker', (evt) => {

  self.postMessage("SERIAL WORKER");

  const [ port ] = evt.ports
  port.onmessage = (evt) => {
    switch (evt.data) {
      case 'serial-start':
        sport.open((err) => {
          if (err) {
            port.postMessage("ERROR: " + err.message);
            return;
          }
          port.postMessage("OK");
          const parser = sport.pipe(new ReadlineParser({ delimiter: '\r\n' }));
          parser.on('data', line => {
            port.postMessage(line);
          })
          sport.on('open', () => {
            sport.port.emitData('Serial port opened');
          });
        })
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
