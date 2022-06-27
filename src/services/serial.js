const { SerialPort } = require('serialport')
const { ReadlineParser } = require("@serialport/parser-readline");
const { DelimiterParser } = require("@serialport/parser-delimiter");

const port = new SerialPort({ path: '/dev/ttyACM0', baudRate: 115200, autoOpen: false });

port.on('open', () => {
  console.log('Serial port opened');
});

let cnt = 0;

port.on('data', (dat) => {
  // console.log(++cnt, dat);
});

port.on('error', (err) => {
  console.log('error', err.message);
});

function start(fun) {
  port.open((err) => {
    if (err) {
      console.log("Couldn't open serial port:", err.message);
      return;
    } else {
      const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));
      // parser.on('data', process(data, fun));
      parser.on('data', (dat) => {
        // fun(dat);
console.log(++cnt, dat);
      });
    }
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
