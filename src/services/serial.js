
'use strict';

const { ipcRenderer } = require('electron')

ipcRenderer.send('message', 'serial');

// function start() {
  
//   console.log(ipcRenderer)

// }

// module.exports = {
//   start,
// };


// const { SerialPort } = require('serialport')
// const { ReadlineParser } = require("@serialport/parser-readline");

// const sport = new SerialPort({ path: '/dev/ttyACM0', baudRate: 115200, autoOpen: false });

// export function serStart() {

// };
// ipcRenderer.on('ser-wrk-port', (evt) => {

//   const [ port ] = evt.ports;

//   port.onmessage = (evt) => {
//     switch (evt.data) {
//       case 'ser-start':
//         sport.open((err) => {
//           if (err) {
//             port.postMessage("ERROR: " + err.message);
//             return;
//           }
//           port.postMessage("OK");
//           const parser = sport.pipe(new ReadlineParser({ delimiter: '\r\n' }));
//           parser.on('data', line => {
//             port.postMessage(line);
//           })
//           sport.on('open', () => {
//             sport.port.emitData('Serial port opened');
//           });
//         })
//         break;
//       case 'ser-stop':
//         if (sport.isOpen) {
//           sport.close();
//         }
//         break;
//       default:
//         if (sport.isOpen) {
//           const res = "data";
//           sport.port.emitData(res);
//         }
//         break;
//     }
//   }
// });
