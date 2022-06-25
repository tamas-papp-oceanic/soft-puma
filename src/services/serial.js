const { SerialPort } = require('serialport')
const { ReadlineParser } = require("@serialport/parser-readline");

const port = new SerialPort({ path: '/dev/ttyACM0', baudRate: 115200, autoOpen: false });

function start(fun) {
  port.open((err) => {
    console.log("Couldn't open serial port:", err.message);
    return;
  });
  const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));
  parser.on('data', line => {
    fun(line);
  })
  port.on('open', () => {
    console.log('Serial port opened');
  });
};

function stop() {
  if (port.isOpen) {
    port.close();
  }
};

module.exports = {
  start,
  stop,
};
